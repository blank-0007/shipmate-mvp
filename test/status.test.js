import { describe, it, expect } from 'vitest';
import {
  matchesMember,
  formatDuration,
  processRoomTelemetry,
  MIN_VERIFIED_ACTIVITY,
} from '../shared/status.js';
import { toLocalDatetimeInputValue } from '../shared/date.js';

describe('ShipMate Status & Attribution Unit Tests', () => {
  const baseRoom = {
    id: 'room-1',
    sprint_start: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    inactivity_threshold_hours: 6,
    figma_url: 'https://www.figma.com/design/sample-key/specs',
  };

  it('1. "dev" handle does NOT claim commit by devansh@gmail.com (no substring match)', () => {
    const member = { id: 'm1', github_handle: 'dev', aliases: [] };
    const nonMatchingAuthor = {
      login: 'devansh_k',
      email: 'devansh@gmail.com',
      name: 'Devansh',
    };
    expect(matchesMember(nonMatchingAuthor, member)).toBe(false);

    // Exact login matches
    expect(matchesMember({ login: 'dev' }, member)).toBe(true);

    // Exact GitHub noreply matches
    expect(matchesMember({ email: 'dev@users.noreply.github.com' }, member)).toBe(true);
    expect(matchesMember({ email: '12345+dev@users.noreply.github.com' }, member)).toBe(true);
    expect(matchesMember({ email: '12345+devansh@users.noreply.github.com' }, member)).toBe(false);
  });

  it('2. Unlinked git email appears in Unattributed list, then counts after alias assignment', () => {
    const memberWithoutAlias = { id: 'm1', github_handle: 'alex', aliases: [] };
    const commit = {
      oid: 'c111',
      committedDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      author: { name: 'Alex Work', email: 'alex.corp@customdomain.org' },
    };

    const result1 = processRoomTelemetry({
      room: baseRoom,
      members: [memberWithoutAlias],
      rawCommits: [commit],
      now: Date.now(),
    });

    expect(result1.unattributedCommits.length).toBe(1);
    expect(result1.members[0].commitsCount).toBe(0);

    // Now assign alias
    const memberWithAlias = {
      ...memberWithoutAlias,
      aliases: ['alex.corp@customdomain.org'],
    };

    const result2 = processRoomTelemetry({
      room: baseRoom,
      members: [memberWithAlias],
      rawCommits: [commit],
      now: Date.now(),
    });

    expect(result2.unattributedCommits.length).toBe(0);
    expect(result2.members[0].commitsCount).toBe(1);
  });

  it('3. 0 qualifying events: silence measured from sprint_start; 7h ago room is inactive; just-started room is not', () => {
    const member = { id: 'm1', github_handle: 'alice', aliases: [] };
    const now = Date.now();

    // 7h ago sprint start with 6h threshold => inactive
    const room7h = {
      id: 'r1',
      sprint_start: new Date(now - 7 * 60 * 60 * 1000).toISOString(),
      inactivity_threshold_hours: 6,
    };
    const res7h = processRoomTelemetry({
      room: room7h,
      members: [member],
      rawCommits: [],
      now,
    });
    expect(res7h.members[0].isInactive).toBe(true);
    expect(res7h.members[0].needsDecision).toBe(true);
    expect(res7h.members[0].silenceFormatted).toBe('7h 0m');

    // Just started room (10m ago) => NOT inactive
    const roomJustStarted = {
      id: 'r2',
      sprint_start: new Date(now - 10 * 60 * 1000).toISOString(),
      inactivity_threshold_hours: 6,
    };
    const resJustStarted = processRoomTelemetry({
      room: roomJustStarted,
      members: [member],
      rawCommits: [],
      now,
    });
    expect(resJustStarted.members[0].isInactive).toBe(false);
    expect(resJustStarted.members[0].needsDecision).toBe(false);
    expect(resJustStarted.members[0].silenceFormatted).toBe('10m');
  });

  it('4. 150 commits from one author over 3 branches: not capped at 100, duplicate oids count once', () => {
    const member = { id: 'm1', github_handle: 'bob', aliases: [] };
    const rawCommits = [];

    // 150 unique commits
    for (let i = 1; i <= 150; i++) {
      rawCommits.push({
        oid: `commit-${i}`,
        committedDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        author: { login: 'bob' },
      });
    }

    // 50 duplicate commits (same oids on another branch)
    for (let i = 1; i <= 50; i++) {
      rawCommits.push({
        oid: `commit-${i}`,
        committedDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        author: { login: 'bob' },
      });
    }

    const res = processRoomTelemetry({
      room: baseRoom,
      members: [member],
      rawCommits,
      now: Date.now(),
    });

    // Total unique commits is exactly 150 (not capped at 100, no duplicates counted)
    expect(res.totalCommits).toBe(150);
    expect(res.members[0].commitsCount).toBe(150);
  });

  it('5. Feature-branch-only commit counts as activity', () => {
    const member = { id: 'm1', github_handle: 'charlie', aliases: [] };
    const featureCommit = {
      oid: 'feat-1',
      branch: 'feature/auth-redesign',
      committedDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30m ago
      author: { login: 'charlie' },
    };

    const res = processRoomTelemetry({
      room: baseRoom,
      members: [member],
      rawCommits: [featureCommit],
      now: Date.now(),
    });

    expect(res.members[0].commitsCount).toBe(1);
    expect(res.members[0].isInactive).toBe(false);
    expect(res.members[0].silenceFormatted).toBe('30m');
  });

  it('6. PR opened and review submitted each reset the silence clock', () => {
    const member = { id: 'm1', github_handle: 'dana', aliases: [] };
    const now = Date.now();

    // Member with no commits but opened a PR 45m ago
    const pr = {
      author: { login: 'dana' },
      updatedAt: new Date(now - 45 * 60 * 1000).toISOString(),
    };

    const resPr = processRoomTelemetry({
      room: baseRoom,
      members: [member],
      rawCommits: [],
      rawPullRequests: [pr],
      now,
    });
    expect(resPr.members[0].silenceFormatted).toBe('45m');
    expect(resPr.members[0].isInactive).toBe(false);

    // Member with review submitted 1h 10m ago
    const review = {
      author: { login: 'dana' },
      submittedAt: new Date(now - 70 * 60 * 1000).toISOString(),
    };

    const resReview = processRoomTelemetry({
      room: baseRoom,
      members: [member],
      rawCommits: [],
      rawReviews: [review],
      now,
    });
    expect(resReview.members[0].silenceFormatted).toBe('1h 10m');
    expect(resReview.members[0].isInactive).toBe(false);
  });

  it('7. Designer with Figma activity 1h ago => Active, not Silent. Designer with Figma inaccessible => "Figma not verifiable", never Silent', () => {
    const designer = {
      id: 'd1',
      github_handle: 'priya_design',
      is_designer: true,
      figma_handle: 'priya_f',
    };
    const now = Date.now();

    // Accessible Figma with a version created 1h ago
    const figmaGood = {
      accessible: true,
      versions: [
        {
          id: 'v1',
          created_at: new Date(now - 60 * 60 * 1000).toISOString(),
          user: { handle: 'priya_f' },
        },
      ],
    };

    const resGood = processRoomTelemetry({
      room: baseRoom,
      members: [designer],
      rawCommits: [],
      figmaData: figmaGood,
      now,
    });

    expect(resGood.members[0].isInactive).toBe(false);
    expect(resGood.members[0].displayStatus).toBe('Active');
    expect(resGood.members[0].figmaVersionsCount).toBe(1);

    // Inaccessible Figma (403/token missing)
    const figmaBad = {
      accessible: false,
      error: 'Figma file not accessible — set it to anyone with the link can view',
    };

    const resBad = processRoomTelemetry({
      room: baseRoom,
      members: [designer],
      rawCommits: [],
      figmaData: figmaBad,
      now,
    });

    expect(resBad.members[0].displayStatus).toBe('Figma not verifiable');
    expect(resBad.members[0].isInactive).toBe(false);
    expect(resBad.members[0].needsDecision).toBe(false);
    expect(resBad.members[0].manifestBadge).toBe('Figma not verifiable');
  });

  it('8. Cut scope keeps the real silence timer, does not remove the evidence badge, and suppresses decision banner', () => {
    const member = {
      id: 'm1',
      github_handle: 'rahul',
      triage_status: 'cut_scope',
      aliases: [],
    };
    const now = Date.now();
    // Sprint started 8h ago, member has 0 commits
    const res = processRoomTelemetry({
      room: baseRoom,
      members: [member],
      rawCommits: [],
      now,
    });

    expect(res.members[0].silenceFormatted).toBe('8h 0m'); // Keeps real silence timer
    expect(res.members[0].displayStatus).toBe('Scope Cut');
    expect(res.members[0].needsDecision).toBe(false); // Banner suppressed
    expect(res.members[0].manifestBadge).toBe('Inactive / Unverified'); // Evidence badge preserved!
  });

  it('9. Snooze expiry returns the member to normal evaluation', () => {
    const now = Date.now();

    // Active snooze in the future (+30m)
    const snoozedMember = {
      id: 'm1',
      github_handle: 'siddharth',
      triage_status: 'snoozed',
      snoozed_until: new Date(now + 30 * 60 * 1000).toISOString(),
      aliases: [],
    };

    const resActive = processRoomTelemetry({
      room: baseRoom,
      members: [snoozedMember],
      rawCommits: [],
      now,
    });
    expect(resActive.members[0].displayStatus).toBe('Snoozed');
    expect(resActive.members[0].needsDecision).toBe(false);

    // Expired snooze in the past (-10m)
    const expiredMember = {
      id: 'm1',
      github_handle: 'siddharth',
      triage_status: 'snoozed',
      snoozed_until: new Date(now - 10 * 60 * 1000).toISOString(),
      aliases: [],
    };

    const resExpired = processRoomTelemetry({
      room: baseRoom,
      members: [expiredMember],
      rawCommits: [],
      now,
    });
    expect(resExpired.members[0].displayStatus).toBe('Silent');
    expect(resExpired.members[0].needsDecision).toBe(true);
  });

  it('10. Minimum verified activity threshold (3) enforces Verified Contributor', () => {
    const member1 = { id: 'm1', github_handle: 'dev1', aliases: [] };
    const member2 = { id: 'm2', github_handle: 'dev2', aliases: [] };

    // Dev1 has 2 commits (below threshold of 3)
    // Dev2 has 3 commits (meets threshold of 3)
    const commits = [
      { oid: 'c1', committedDate: baseRoom.sprint_start, author: { login: 'dev1' } },
      { oid: 'c2', committedDate: baseRoom.sprint_start, author: { login: 'dev1' } },
      { oid: 'c3', committedDate: baseRoom.sprint_start, author: { login: 'dev2' } },
      { oid: 'c4', committedDate: baseRoom.sprint_start, author: { login: 'dev2' } },
      { oid: 'c5', committedDate: baseRoom.sprint_start, author: { login: 'dev2' } },
    ];

    const res = processRoomTelemetry({
      room: baseRoom,
      members: [member1, member2],
      rawCommits: commits,
      now: Date.now(),
    });

    expect(res.members[0].manifestBadge).toBe('Inactive / Unverified');
    expect(res.members[1].manifestBadge).toBe('Verified Contributor');
  });

  it('11. Local datetime input formatting round-trips within 1 minute without UTC timezone skew', () => {
    const target24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const formatted = toLocalDatetimeInputValue(target24h);
    const parsedBack = new Date(formatted);

    // Difference between parsedBack and target24h must be under 60 seconds (due to second/millisecond truncation)
    const diffMs = Math.abs(parsedBack.getTime() - target24h.getTime());
    expect(diffMs).toBeLessThanOrEqual(60000);
  });
});
