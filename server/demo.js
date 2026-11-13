/**
 * Demo Room Generator for Hallway Testing
 * is_demo = true, clearly labeled synthetic telemetry.
 * Real rooms NEVER use synthetic data.
 */

import { generateLeadKey, hashLeadKey } from './auth.js';
import { createRoomInDb } from './supabase.js';

export async function createDemoRoom(env) {
  const leadKey = generateLeadKey();
  const leadKeyHash = await hashLeadKey(leadKey);

  const now = Date.now();
  const sprintStart = new Date(now - 8 * 60 * 60 * 1000).toISOString(); // Started 8h ago
  const deadline = new Date(now + 28 * 60 * 60 * 1000).toISOString(); // 28h left

  const roomData = {
    hackathon_name: 'Smart India Hackathon 2026 (Demo Room)',
    sprint_start: sprintStart,
    deadline,
    github_repo_url: 'https://github.com/demo-team/sih-shipmate-demo',
    figma_url: 'https://www.figma.com/design/DEMOKEY123/SIH-Mobile-Design',
    figma_file_key: 'DEMOKEY123',
    inactivity_threshold_hours: 6,
    lead_key_hash: leadKeyHash,
    is_demo: true,
  };

  const membersData = [
    {
      github_handle: 'arjun_lead',
      role_label: 'Team Lead / Fullstack',
      is_designer: false,
      figma_handle: null,
      aliases: ['arjun.dev@college.edu'],
      triage_status: 'none',
      snoozed_until: null,
      triage_note: null,
    },
    {
      github_handle: 'rohit_backend',
      role_label: 'Backend & ML API',
      is_designer: false,
      figma_handle: null,
      aliases: [],
      triage_status: 'none',
      snoozed_until: null,
      triage_note: null,
    },
    {
      github_handle: 'ananya_ui',
      role_label: 'Product Designer',
      is_designer: true,
      figma_handle: 'ananya_figma',
      aliases: [],
      triage_status: 'none',
      snoozed_until: null,
      triage_note: null,
    },
    {
      github_handle: 'vikram_dev',
      role_label: 'Frontend Mobile',
      is_designer: false,
      figma_handle: null,
      aliases: [],
      triage_status: 'none',
      snoozed_until: null,
      triage_note: null,
    },
  ];

  const { room, members } = await createRoomInDb(env, roomData, membersData);

  return {
    room,
    members,
    leadKey,
  };
}

export function getDemoSyntheticTelemetry(room, members, now = Date.now()) {
  const sprintStartMs = new Date(room.sprint_start).getTime();

  // 1. arjun_lead: 4 commits, active 35m ago
  const arjunCommits = [
    {
      oid: 'd3m0a1',
      committedDate: new Date(now - 35 * 60 * 1000).toISOString(),
      message: 'feat: connect client telemetry websocket',
      additions: 120,
      deletions: 15,
      author: { login: 'arjun_lead', name: 'Arjun Verma', email: 'arjun.dev@college.edu' },
    },
    {
      oid: 'd3m0a2',
      committedDate: new Date(now - 120 * 60 * 1000).toISOString(),
      message: 'feat: setup dashboard shell and cards',
      additions: 340,
      deletions: 22,
      author: { login: 'arjun_lead', name: 'Arjun Verma', email: 'arjun.dev@college.edu' },
    },
    {
      oid: 'd3m0a3',
      committedDate: new Date(now - 250 * 60 * 1000).toISOString(),
      message: 'chore: project scaffolding and routing',
      additions: 512,
      deletions: 0,
      author: { login: 'arjun_lead', name: 'Arjun Verma', email: 'arjun.dev@college.edu' },
    },
  ];

  // 2. rohit_backend: 0 commits since sprint start (7h 15m silent)
  // No commits!

  // 3. ananya_ui: Designer, 3 Figma version checkpoints, last 45m ago
  const ananyaFigma = {
    accessible: true,
    frameCount: 18,
    lastModified: new Date(now - 45 * 60 * 1000).toISOString(),
    versions: [
      {
        id: 'v101',
        created_at: new Date(now - 45 * 60 * 1000).toISOString(),
        user: { handle: 'ananya_figma', name: 'Ananya S.' },
      },
      {
        id: 'v100',
        created_at: new Date(now - 180 * 60 * 1000).toISOString(),
        user: { handle: 'ananya_figma', name: 'Ananya S.' },
      },
      {
        id: 'v099',
        created_at: new Date(now - 300 * 60 * 1000).toISOString(),
        user: { handle: 'ananya_figma', name: 'Ananya S.' },
      },
    ],
  };

  // 4. vikram_dev: Has an unattributed commit from git email "vikram.work@gmail.com"
  const unattributed = [
    {
      oid: 'd3m0u1',
      committedDate: new Date(now - 90 * 60 * 1000).toISOString(),
      message: 'fix: mobile screen padding and viewport meta',
      additions: 45,
      deletions: 12,
      author: { name: 'Vikram Singh', email: 'vikram.work@gmail.com' },
    },
  ];

  return {
    rawCommits: [...arjunCommits, ...unattributed],
    rawPullRequests: [
      {
        author: { login: 'arjun_lead' },
        createdAt: new Date(now - 200 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 35 * 60 * 1000).toISOString(),
      },
    ],
    rawReviews: [],
    figmaData: ananyaFigma,
  };
}
