/**
 * ShipMate Status and Telemetry Computation Module
 * Pure functions for attribution, silence calculation, and manifest verification.
 */

export const MIN_VERIFIED_ACTIVITY = 3;

/**
 * Formats elapsed milliseconds into "Xh Ym" format (e.g. "6h 40m", "0m", "45m")
 */
export function formatDuration(ms) {
  if (ms <= 0 || isNaN(ms)) return '0m';
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/**
 * Checks if an email is an exact GitHub noreply email for the given handle
 * Pattern: ^(\d+\+)?<handle>@users\.noreply\.github\.com$
 */
export function matchesNoreplyEmail(email, handle) {
  if (!email || !handle) return false;
  const escaped = handle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^(\\d+\\+)?${escaped}@users\\.noreply\\.github\\.com$`, 'i');
  return regex.test(email.trim());
}

/**
 * Matches a commit author against a member
 * Attribution order:
 * 1. Exact GitHub login match (case-insensitive)
 * 2. Exact noreply email: ^(\d+\+)?<handle>@users\.noreply\.github\.com$
 * 3. Member aliases (exact email or exact name, case-insensitive)
 * NEVER substring matching!
 */
export function matchesMember(author, member) {
  if (!author || !member) return false;
  const targetHandle = member.github_handle?.toLowerCase().trim();
  if (!targetHandle) return false;

  // 1. Exact login match
  const login = (author.login || author.user?.login || author.authorLogin)?.toLowerCase().trim();
  if (login && login === targetHandle) {
    return true;
  }

  const authorEmail = (author.email || author.authorEmail)?.toLowerCase().trim();
  const authorName = (author.name || author.authorName)?.toLowerCase().trim();

  // 2. Exact noreply email
  if (authorEmail && matchesNoreplyEmail(authorEmail, targetHandle)) {
    return true;
  }

  // 3. Member aliases (exact email or exact name match)
  const aliases = Array.isArray(member.aliases) ? member.aliases : [];
  for (const alias of aliases) {
    const cleanAlias = String(alias).toLowerCase().trim();
    if (authorEmail && authorEmail === cleanAlias) return true;
    if (authorName && authorName === cleanAlias) return true;
  }

  return false;
}

/**
 * Attributes GitHub events (commits, PRs, reviews) and Figma activity to members.
 * Deduplicates commits by OID across branches.
 */
export function processRoomTelemetry({
  room,
  members = [],
  rawCommits = [],
  rawPullRequests = [],
  rawReviews = [],
  figmaData = null, // { versions: [], lastModified: null, accessible: bool, error: string }
  now = Date.now(),
}) {
  const sprintStartMs = new Date(room.sprint_start || room.created_at).getTime();
  const thresholdHours = Number(room.inactivity_threshold_hours) || 6;
  const thresholdMs = thresholdHours * 60 * 60 * 1000;
  const nowMs = typeof now === 'number' ? now : new Date(now).getTime();

  // 1. Deduplicate commits across branches by OID
  const seenOids = new Set();
  const dedupedCommits = [];
  for (const c of rawCommits) {
    const oid = c.oid || c.sha;
    if (oid && !seenOids.has(oid)) {
      seenOids.add(oid);
      dedupedCommits.push(c);
    }
  }

  // 2. Filter commits committed >= sprintStartMs
  const sprintCommits = dedupedCommits.filter((c) => {
    const d = new Date(c.committedDate || c.date || c.commit?.author?.date).getTime();
    return !isNaN(d) && d >= sprintStartMs;
  });

  // Track unattributed commits
  const unattributedCommits = [];

  // Categorize commits per member
  const memberCommitMap = new Map();
  for (const m of members) {
    memberCommitMap.set(m.id, []);
  }

  for (const commit of sprintCommits) {
    const author = {
      login: commit.author?.user?.login || commit.author?.login,
      name: commit.author?.name || commit.commit?.author?.name,
      email: commit.author?.email || commit.commit?.author?.email,
    };

    let matchedMemberId = null;
    for (const m of members) {
      if (matchesMember(author, m)) {
        matchedMemberId = m.id;
        break;
      }
    }

    if (matchedMemberId) {
      memberCommitMap.get(matchedMemberId).push(commit);
    } else {
      unattributedCommits.push({
        oid: (commit.oid || commit.sha || '').substring(0, 7),
        fullOid: commit.oid || commit.sha,
        message: (commit.message || commit.commit?.message || '').split('\n')[0],
        date: commit.committedDate || commit.date || commit.commit?.author?.date,
        authorName: author.name || 'Unknown',
        authorEmail: author.email || '',
      });
    }
  }

  // PR and Review attribution
  const memberPrMap = new Map();
  const memberReviewMap = new Map();
  for (const m of members) {
    memberPrMap.set(m.id, []);
    memberReviewMap.set(m.id, []);
  }

  for (const pr of rawPullRequests) {
    const authorLogin = pr.author?.login || pr.user?.login;
    for (const m of members) {
      if (authorLogin && authorLogin.toLowerCase() === m.github_handle.toLowerCase()) {
        const prDate = new Date(pr.updatedAt || pr.createdAt).getTime();
        if (prDate >= sprintStartMs) {
          memberPrMap.get(m.id).push(pr);
        }
      }
    }
  }

  for (const review of rawReviews) {
    const authorLogin = review.author?.login || review.user?.login;
    for (const m of members) {
      if (authorLogin && authorLogin.toLowerCase() === m.github_handle.toLowerCase()) {
        const rDate = new Date(review.submittedAt || review.createdAt).getTime();
        if (rDate >= sprintStartMs) {
          memberReviewMap.get(m.id).push(review);
        }
      }
    }
  }

  // Figma attribution for designers
  const designers = members.filter((m) => m.is_designer);
  const memberFigmaMap = new Map();
  for (const m of members) {
    memberFigmaMap.set(m.id, []);
  }

  const isFigmaAccessible = figmaData?.accessible !== false && !figmaData?.error;
  const figmaVersions = figmaData?.versions || [];

  if (isFigmaAccessible && figmaVersions.length > 0) {
    for (const v of figmaVersions) {
      const vDate = new Date(v.created_at).getTime();
      if (vDate < sprintStartMs) continue;

      const vUser = (v.user?.handle || v.user?.name || '').toLowerCase().trim();
      let matched = false;

      // Match by figma_handle first
      for (const d of designers) {
        const fHandle = d.figma_handle?.toLowerCase().trim();
        if (fHandle && vUser && (vUser === fHandle || vUser.includes(fHandle))) {
          memberFigmaMap.get(d.id).push(v);
          matched = true;
          break;
        }
      }

      // If no handle matched and exactly one designer exists, attribute to them
      if (!matched && designers.length === 1) {
        memberFigmaMap.get(designers[0].id).push(v);
      }
    }
  }

  // Process each member's qualifying activities, silence, and statuses
  const processedMembers = members.map((member) => {
    const commits = memberCommitMap.get(member.id) || [];
    const prs = memberPrMap.get(member.id) || [];
    const reviews = memberReviewMap.get(member.id) || [];
    const figmaActs = memberFigmaMap.get(member.id) || [];

    // Collect timestamps of all qualifying events
    const eventTimestamps = [];

    // Commits
    let linesAdded = 0;
    let linesDeleted = 0;
    let latestCommit = null;

    for (const c of commits) {
      const d = new Date(c.committedDate || c.date || c.commit?.author?.date).getTime();
      if (!isNaN(d)) eventTimestamps.push(d);
      linesAdded += (c.additions || 0);
      linesDeleted += (c.deletions || 0);
    }

    if (commits.length > 0) {
      const sortedCommits = [...commits].sort((a, b) => {
        const da = new Date(a.committedDate || a.date || a.commit?.author?.date).getTime();
        const db = new Date(b.committedDate || b.date || b.commit?.author?.date).getTime();
        return db - da;
      });
      const top = sortedCommits[0];
      latestCommit = {
        sha: (top.oid || top.sha || '').substring(0, 7),
        message: (top.message || top.commit?.message || '').split('\n')[0],
        date: top.committedDate || top.date || top.commit?.author?.date,
        url: top.url || top.html_url,
      };
    }

    // PRs
    for (const pr of prs) {
      const d = new Date(pr.updatedAt || pr.createdAt).getTime();
      if (!isNaN(d)) eventTimestamps.push(d);
    }

    // Reviews
    for (const r of reviews) {
      const d = new Date(r.submittedAt || r.createdAt).getTime();
      if (!isNaN(d)) eventTimestamps.push(d);
    }

    // Figma (designers)
    for (const f of figmaActs) {
      const d = new Date(f.created_at).getTime();
      if (!isNaN(d)) eventTimestamps.push(d);
    }

    // Designer file-level fallback activity: if single designer and file was updated during sprint
    if (member.is_designer && designers.length === 1 && figmaData?.lastModified) {
      const fileModMs = new Date(figmaData.lastModified).getTime();
      if (fileModMs >= sprintStartMs) {
        eventTimestamps.push(fileModMs);
      }
    }

    // Qualifying activity count
    // For designers: figma activities count as qualifying
    const qualifyingCount = commits.length + prs.length + reviews.length + (member.is_designer ? figmaActs.length : 0);

    // Latest activity timestamp
    const maxActivityMs = eventTimestamps.length > 0 ? Math.max(...eventTimestamps) : null;
    const effectiveReferenceMs = maxActivityMs !== null ? Math.max(maxActivityMs, sprintStartMs) : sprintStartMs;
    const silenceDurationMs = Math.max(0, nowMs - effectiveReferenceMs);

    // Inactivity threshold exceeded?
    const hasExceededThreshold = silenceDurationMs >= thresholdMs;

    // Snooze evaluation: active only if snoozed_until > now
    const isSnoozed = member.snoozed_until ? new Date(member.snoozed_until).getTime() > nowMs : false;

    // Triage statuses
    const isCut = member.triage_status === 'cut_scope';
    const isFallback = member.triage_status === 'fallback_api';
    const hasDecision = isCut || isFallback;

    // Figma status for designers
    let figmaNotVerifiable = false;
    if (member.is_designer) {
      if (room.figma_url && (!figmaData || !isFigmaAccessible || figmaData.error)) {
        figmaNotVerifiable = true;
      }
    }

    // Status label logic:
    // Designers with inaccessible Figma are "Figma not verifiable", NEVER Silent or Inactive!
    let displayStatus = 'Active';
    let isInactive = false;

    if (figmaNotVerifiable && qualifyingCount === 0) {
      displayStatus = 'Figma not verifiable';
      isInactive = false;
    } else if (hasExceededThreshold && !isSnoozed && !hasDecision) {
      displayStatus = 'Silent';
      isInactive = true;
    } else if (isSnoozed) {
      displayStatus = 'Snoozed';
    } else if (isCut) {
      displayStatus = 'Scope Cut';
    } else if (isFallback) {
      displayStatus = 'Fallback API Active';
    }

    // Needs lead decision banner: inactive AND not snoozed AND no recorded decision
    const needsDecision = hasExceededThreshold && !isSnoozed && !hasDecision && !figmaNotVerifiable;

    // Manifest Evidence Badge:
    // Verified Contributor requires >= MIN_VERIFIED_ACTIVITY (3)
    let manifestBadge = 'Inactive / Unverified';
    if (figmaNotVerifiable && qualifyingCount < MIN_VERIFIED_ACTIVITY) {
      manifestBadge = 'Figma not verifiable';
    } else if (qualifyingCount >= MIN_VERIFIED_ACTIVITY) {
      manifestBadge = 'Verified Contributor';
    }

    return {
      ...member,
      commitsCount: commits.length,
      linesAdded,
      linesDeleted,
      prsCount: prs.length,
      reviewsCount: reviews.length,
      figmaVersionsCount: figmaActs.length,
      qualifyingCount,
      latestCommit,
      lastActivityAt: maxActivityMs ? new Date(maxActivityMs).toISOString() : null,
      silenceDurationMs,
      silenceFormatted: formatDuration(silenceDurationMs),
      isInactive,
      needsDecision,
      isSnoozed,
      isCut,
      isFallback,
      hasDecision,
      figmaNotVerifiable,
      displayStatus,
      manifestBadge,
    };
  });

  return {
    members: processedMembers,
    unattributedCommits,
    totalCommits: sprintCommits.length,
    figmaFrameCount: figmaData?.frameCount || null,
    isFigmaAccessible,
  };
}
