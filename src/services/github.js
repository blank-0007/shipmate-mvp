/**
 * Parses GitHub repo URL or shorthand into { owner, repo }
 */
export function parseGitHubRepo(input) {
  if (!input) return null;
  const clean = input.trim().replace(/\/+$/, '');
  
  // Format: https://github.com/owner/repo or git@github.com:owner/repo
  const match = clean.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i) 
    || clean.match(/^([^/]+)\/([^/]+)$/);

  if (match) {
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ''),
    };
  }
  return null;
}

/**
 * Gets personal GitHub token from environment or localStorage
 */
export function getGitHubToken() {
  return localStorage.getItem('shipmate_gh_token') || import.meta.env.VITE_GITHUB_TOKEN || '';
}

/**
 * Saves personal GitHub token to localStorage
 */
export function setGitHubToken(token) {
  if (token) {
    localStorage.setItem('shipmate_gh_token', token.trim());
  } else {
    localStorage.removeItem('shipmate_gh_token');
  }
}

/**
 * Fetches latest commits from GitHub REST API
 */
export async function fetchRepoCommits(owner, repo) {
  const token = getGitHubToken();
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`;

  const response = await fetch(url, { headers });

  const remaining = response.headers.get('x-ratelimit-remaining');
  const limit = response.headers.get('x-ratelimit-limit');
  const reset = response.headers.get('x-ratelimit-reset');

  const rateLimitInfo = {
    remaining: remaining !== null ? parseInt(remaining, 10) : null,
    limit: limit !== null ? parseInt(limit, 10) : null,
    resetTime: reset !== null ? new Date(parseInt(reset, 10) * 1000) : null,
  };

  if (!response.ok) {
    if (response.status === 403 && remaining === '0') {
      const resetMin = rateLimitInfo.resetTime 
        ? Math.ceil((rateLimitInfo.resetTime.getTime() - Date.now()) / 60000) 
        : 60;
      throw new Error(`GitHub API rate limit reached (60/hr). Resets in ~${resetMin}m. Add a Personal Access Token in settings to raise limit to 5,000/hr.`);
    }
    if (response.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" not found or is private. Make sure it's public!`);
    }
    throw new Error(`GitHub API error (${response.status}): ${response.statusText}`);
  }

  const commits = await response.json();
  return {
    commits,
    rateLimitInfo,
  };
}

/**
 * Maps raw commits to members and computes telemetry stats
 */
export function mapCommitsToMembers(members, commits, roomCreatedAt, thresholdHours = 6) {
  const now = Date.now();
  const roomCreatedMs = new Date(roomCreatedAt).getTime();

  return members.map((member) => {
    const handle = member.github_handle.toLowerCase().trim();

    // Find all commits matching this member's handle
    const memberCommits = commits.filter((c) => {
      const authorLogin = c.author?.login?.toLowerCase();
      const committerLogin = c.committer?.login?.toLowerCase();
      const authorName = c.commit?.author?.name?.toLowerCase();
      const authorEmail = c.commit?.author?.email?.toLowerCase();

      return (
        authorLogin === handle ||
        committerLogin === handle ||
        authorName === handle ||
        authorEmail?.startsWith(`${handle}@`) ||
        authorEmail?.includes(handle)
      );
    });

    const commitCount = memberCommits.length;
    let latestCommit = null;
    let hoursSinceLastCommit = 0;

    if (commitCount > 0) {
      const sorted = [...memberCommits].sort(
        (a, b) => new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()
      );
      const latest = sorted[0];
      const latestDate = new Date(latest.commit.author.date);
      latestCommit = {
        sha: latest.sha.substring(0, 7),
        fullSha: latest.sha,
        message: latest.commit.message.split('\n')[0],
        date: latestDate.toISOString(),
        url: latest.html_url,
      };
      hoursSinceLastCommit = Math.max(0, (now - latestDate.getTime()) / (1000 * 60 * 60));
    } else {
      // If 0 commits, measure elapsed time since sprint room was created
      hoursSinceLastCommit = Math.max(0, (now - roomCreatedMs) / (1000 * 60 * 60));
    }

    // Determine inactivity status
    const isSnoozed = member.snoozed_until && new Date(member.snoozed_until).getTime() > now;
    const isCut = member.triage_status === 'cut_scope';
    const isFallback = member.triage_status === 'fallback_api';
    
    // Inactive if exceeded threshold, not scope-cut, and not currently snoozed
    const isInactive = !isCut && !isSnoozed && hoursSinceLastCommit >= thresholdHours;

    return {
      ...member,
      commitCount,
      latestCommit,
      hoursSinceLastCommit: Number(hoursSinceLastCommit.toFixed(1)),
      isInactive,
      isSnoozed,
      isCut,
      isFallback,
    };
  });
}
