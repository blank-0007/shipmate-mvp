import { describe, it, expect, vi } from 'vitest';
import { handleApiRequest } from '../server/api.js';
import { generateLeadKey, hashLeadKey } from '../server/auth.js';

describe('ShipMate Backend API Unit & Security Tests', () => {
  const mockEnv = {
    GITHUB_TOKEN: 'mock_gh_token',
    FIGMA_TOKEN: 'mock_figma_token',
    SUPABASE_URL: 'https://mock.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'mock_service_key',
  };

  it('1. Malicious or invalid owner/repo strings rejected with 400', async () => {
    const maliciousPayloads = [
      'https://github.com/../malicious',
      'https://github.com/owner/repo/../../etc/passwd',
      'owner@name/repo',
      'owner/repo;rm -rf /',
    ];

    for (const url of maliciousPayloads) {
      const req = new Request('https://shipmate.test/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonName: 'Test Hackathon',
          sprintStart: new Date().toISOString(),
          deadline: new Date(Date.now() + 86400000).toISOString(),
          githubRepoUrl: url,
          teammates: [{ handle: 'validuser' }],
        }),
      });

      const res = await handleApiRequest(req, mockEnv);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    }
  });

  it('2. Missing or invalid lead key returns 401 on /api/rooms/:id/activity', async () => {
    // Generate valid lead key
    const realKey = generateLeadKey();
    const realHash = await hashLeadKey(realKey);

    // Mock global fetch for Supabase getRoomById
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url) => {
      if (url.includes('/rest/v1/sprint_rooms?id=')) {
        return new Response(
          JSON.stringify([
            {
              id: 'test-room-1',
              hackathon_name: 'Hackathon 1',
              lead_key_hash: realHash,
              is_demo: false,
              github_repo_url: 'https://github.com/owner/repo',
            },
          ]),
          { status: 200 }
        );
      }
      return new Response('{}', { status: 200 });
    });

    try {
      // No header
      const reqNoKey = new Request('https://shipmate.test/api/rooms/test-room-1/activity');
      const resNoKey = await handleApiRequest(reqNoKey, mockEnv);
      expect(resNoKey.status).toBe(401);

      // Wrong key
      const reqWrongKey = new Request('https://shipmate.test/api/rooms/test-room-1/activity', {
        headers: { Authorization: `Bearer ${generateLeadKey()}` },
      });
      const resWrongKey = await handleApiRequest(reqWrongKey, mockEnv);
      expect(resWrongKey.status).toBe(401);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('3. Lead authorization constant-time comparison passes with correct lead key', async () => {
    const realKey = generateLeadKey();
    const realHash = await hashLeadKey(realKey);

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url) => {
      if (url.includes('/rest/v1/sprint_rooms?id=')) {
        return new Response(
          JSON.stringify([
            {
              id: 'test-room-demo',
              hackathon_name: 'Demo Room',
              lead_key_hash: realHash,
              is_demo: true,
              sprint_start: new Date(Date.now() - 3600000).toISOString(),
            },
          ]),
          { status: 200 }
        );
      }
      if (url.includes('/rest/v1/members?room_id=')) {
        return new Response(
          JSON.stringify([
            { id: 'm1', github_handle: 'arjun_lead', role_label: 'Lead', is_designer: false, aliases: [] },
          ]),
          { status: 200 }
        );
      }
      if (url.includes('/rest/v1/triage_events?room_id=')) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      return new Response('{}', { status: 200 });
    });

    try {
      const reqValidKey = new Request('https://shipmate.test/api/rooms/test-room-demo/activity', {
        headers: { Authorization: `Bearer ${realKey}` },
      });
      const resValidKey = await handleApiRequest(reqValidKey, mockEnv);
      expect(resValidKey.status).toBe(200);
      const data = await resValidKey.json();
      expect(data.room.id).toBe('test-room-demo');
      expect(data.dataFreshness.isDemo).toBe(true);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('4. POST /api/rooms/:id/triage validates actions and persists', async () => {
    const realKey = generateLeadKey();
    const realHash = await hashLeadKey(realKey);

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url, opts) => {
      if (url.includes('/rest/v1/sprint_rooms?id=')) {
        return new Response(
          JSON.stringify([{ id: 'test-room-1', lead_key_hash: realHash }]),
          { status: 200 }
        );
      }
      if (opts?.method === 'PATCH' && url.includes('/rest/v1/members?id=')) {
        return new Response(
          JSON.stringify([{ id: 'm1', triage_status: 'fallback_api', triage_note: 'Testing note' }]),
          { status: 200 }
        );
      }
      if (opts?.method === 'POST' && url.includes('/rest/v1/triage_events')) {
        return new Response(
          JSON.stringify([{ id: 'ev1', action: 'fallback_api', note: 'Testing note' }]),
          { status: 200 }
        );
      }
      return new Response('{}', { status: 200 });
    });

    try {
      const triageReq = new Request('https://shipmate.test/api/rooms/test-room-1/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${realKey}`,
        },
        body: JSON.stringify({
          memberId: 'm1',
          action: 'fallback_api',
          note: 'Testing note',
        }),
      });

      const res = await handleApiRequest(triageReq, mockEnv);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.member.triage_status).toBe('fallback_api');
      expect(data.event.action).toBe('fallback_api');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('5. Built client bundle dist/ contains NO secrets or token keywords', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const distPath = path.resolve(__dirname, '../dist');

    if (!fs.existsSync(distPath)) {
      console.warn('dist folder does not exist yet, skipping bundle scan');
      return;
    }

    const checkDir = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          checkDir(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.html')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          expect(content).not.toMatch(/ghp_/i);
          expect(content).not.toMatch(/github_pat_/i);
          expect(content).not.toMatch(/service_role/i);
          expect(content).not.toMatch(/SUPABASE_SERVICE/i);
        }
      }
    };

    checkDir(distPath);
  });
});
