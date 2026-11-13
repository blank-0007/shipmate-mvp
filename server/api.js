/**
 * ShipMate Cloudflare Backend API Router
 * Enforces lead key security, input validation, upstream caching, and Supabase persistence.
 */

import { generateLeadKey, hashLeadKey, verifyLeadAuthorization } from './auth.js';
import {
  createRoomInDb,
  getRoomById,
  getMembersByRoomId,
  getTriageEventsByRoomId,
  recordTriageDecision,
  addMemberAliasInDb,
} from './supabase.js';
import {
  parseRepoUrl,
  validateRepo,
  validateHandle,
  fetchGitHubActivity,
  sanitizeIdentifier,
} from './github.js';
import { parseFigmaFileKey, fetchFigmaActivity } from './figma.js';
import { createDemoRoom, getDemoSyntheticTelemetry } from './demo.js';
import { processRoomTelemetry } from '../shared/status.js';

// In-memory cache for upstream telemetry (60s TTL)
const telemetryCache = new Map();

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...extraHeaders,
    },
  });
}

export async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  try {
    // -------------------------------------------------------------
    // POST /api/demo — Create synthetic demo room
    // -------------------------------------------------------------
    if (method === 'POST' && path === '/api/demo') {
      const demo = await createDemoRoom(env);
      return jsonResponse({ id: demo.room.id, leadKey: demo.leadKey }, 201);
    }

    // -------------------------------------------------------------
    // POST /api/rooms — Create Sprint Room
    // -------------------------------------------------------------
    if (method === 'POST' && path === '/api/rooms') {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return jsonResponse({ error: 'Invalid JSON payload' }, 400);
      }

      const {
        hackathonName,
        sprintStart,
        deadline,
        githubRepoUrl,
        figmaUrl,
        inactivityThresholdHours,
        teammates,
      } = body;

      // 1. Validate Hackathon Name
      if (!hackathonName || typeof hackathonName !== 'string' || hackathonName.trim().length === 0) {
        return jsonResponse({ error: 'Hackathon name is required', field: 'hackathonName' }, 400);
      }
      if (hackathonName.trim().length > 100) {
        return jsonResponse({ error: 'Hackathon name must be under 100 characters', field: 'hackathonName' }, 400);
      }

      // 2. Validate Dates
      const startMs = new Date(sprintStart).getTime();
      const endMs = new Date(deadline).getTime();
      if (isNaN(startMs)) {
        return jsonResponse({ error: 'Valid sprint start time is required', field: 'sprintStart' }, 400);
      }
      if (isNaN(endMs)) {
        return jsonResponse({ error: 'Valid deadline is required', field: 'deadline' }, 400);
      }
      if (endMs <= startMs) {
        return jsonResponse({ error: 'Deadline must be after sprint start', field: 'deadline' }, 400);
      }

      // 3. Validate GitHub Repo URL (Safe identifiers + public repo verification)
      const parsedRepo = parseRepoUrl(githubRepoUrl);
      if (!parsedRepo) {
        return jsonResponse({
          error: 'Invalid GitHub repository URL format. Example: https://github.com/owner/repo',
          field: 'githubRepoUrl',
        }, 400);
      }

      const repoValidation = await validateRepo(env, parsedRepo.owner, parsedRepo.repo);
      if (!repoValidation.valid) {
        return jsonResponse({ error: repoValidation.error, field: 'githubRepoUrl' }, 400);
      }

      // 4. Validate Teammates (Min 1, Max 4)
      if (!Array.isArray(teammates) || teammates.length === 0) {
        return jsonResponse({ error: 'At least 1 teammate is required', field: 'teammates' }, 400);
      }
      if (teammates.length > 4) {
        return jsonResponse({ error: 'A maximum of 4 teammates is allowed for MVP', field: 'teammates' }, 400);
      }

      // Validate handles exist on GitHub
      const validatedMembers = [];
      for (let i = 0; i < teammates.length; i++) {
        const t = teammates[i];
        if (!t.handle || !t.handle.trim()) {
          return jsonResponse({ error: `Teammate #${i + 1} handle cannot be empty`, field: `teammates.${i}.handle` }, 400);
        }

        const handleCheck = await validateHandle(env, t.handle);
        if (!handleCheck.valid) {
          return jsonResponse({ error: handleCheck.error, field: `teammates.${i}.handle` }, 400);
        }

        validatedMembers.push({
          github_handle: handleCheck.handle,
          role_label: t.role ? String(t.role).trim().slice(0, 50) : '',
          is_designer: Boolean(t.isDesigner),
          figma_handle: t.figmaHandle ? String(t.figmaHandle).trim() : null,
          aliases: [],
          triage_status: 'none',
          snoozed_until: null,
          triage_note: null,
        });
      }

      // 5. Parse Figma URL if provided
      let figmaFileKey = null;
      if (figmaUrl && typeof figmaUrl === 'string' && figmaUrl.trim()) {
        figmaFileKey = parseFigmaFileKey(figmaUrl);
      }

      // 6. Generate Lead Key
      const leadKey = generateLeadKey();
      const leadKeyHash = await hashLeadKey(leadKey);

      const roomData = {
        hackathon_name: hackathonName.trim(),
        sprint_start: new Date(startMs).toISOString(),
        deadline: new Date(endMs).toISOString(),
        github_repo_url: `https://github.com/${parsedRepo.owner}/${parsedRepo.repo}`,
        figma_url: figmaUrl ? figmaUrl.trim() : null,
        figma_file_key: figmaFileKey,
        inactivity_threshold_hours: Math.min(24, Math.max(1, Number(inactivityThresholdHours) || 6)),
        lead_key_hash: leadKeyHash,
        is_demo: false,
      };

      const { room } = await createRoomInDb(env, roomData, validatedMembers);
      return jsonResponse({ id: room.id, leadKey }, 201);
    }

    // -------------------------------------------------------------
    // GET /api/rooms/:id/activity — Fetch Real Time Telemetry
    // -------------------------------------------------------------
    const activityMatch = path.match(/^\/api\/rooms\/([a-zA-Z0-9-]+)\/activity$/);
    if (method === 'GET' && activityMatch) {
      const roomId = activityMatch[1];
      const room = await getRoomById(env, roomId);
      if (!room) {
        return jsonResponse({ error: 'Sprint room not found' }, 404);
      }

      // Constant-time Lead Key Authentication
      const isAuthorized = await verifyLeadAuthorization(request, room);
      if (!isAuthorized) {
        return jsonResponse(
          { error: 'Unauthorized: This lead link is invalid or incomplete. Provide Authorization: Bearer <leadKey>' },
          401
        );
      }

      const members = await getMembersByRoomId(env, roomId);
      const triageEvents = await getTriageEventsByRoomId(env, roomId);

      // Handle Demo Room
      if (room.is_demo) {
        const demoData = getDemoSyntheticTelemetry(room, members);
        const telemetry = processRoomTelemetry({
          room,
          members,
          rawCommits: demoData.rawCommits,
          rawPullRequests: demoData.rawPullRequests,
          rawReviews: demoData.rawReviews,
          figmaData: demoData.figmaData,
        });

        return jsonResponse({
          room,
          members: telemetry.members,
          unattributedCommits: telemetry.unattributedCommits,
          totalCommits: telemetry.totalCommits,
          figmaFrameCount: telemetry.figmaFrameCount,
          isFigmaAccessible: telemetry.isFigmaAccessible,
          triageEvents,
          dataFreshness: {
            fetchedAt: new Date().toISOString(),
            stale: false,
            isDemo: true,
          },
        });
      }

      // Real Room: upstream GitHub + Figma queries with 60s cache
      const cacheKey = `telemetry_${roomId}`;
      const cached = telemetryCache.get(cacheKey);
      const nowMs = Date.now();

      let githubData = null;
      let figmaData = null;
      let upstreamError = null;

      if (cached && nowMs - cached.timestamp < 60000) {
        githubData = cached.githubData;
        figmaData = cached.figmaData;
      } else {
        const parsedRepo = parseRepoUrl(room.github_repo_url);
        try {
          if (parsedRepo) {
            githubData = await fetchGitHubActivity(env, parsedRepo.owner, parsedRepo.repo, room.sprint_start);
          }
          if (room.figma_file_key) {
            figmaData = await fetchFigmaActivity(env, room.figma_file_key);
          }
          // Save to cache
          telemetryCache.set(cacheKey, {
            githubData,
            figmaData,
            timestamp: nowMs,
          });
        } catch (err) {
          upstreamError = err.message;
          // Fall back to stale cache if available
          if (cached) {
            githubData = cached.githubData;
            figmaData = cached.figmaData;
          }
        }
      }

      const telemetry = processRoomTelemetry({
        room,
        members,
        rawCommits: githubData?.commits || [],
        rawPullRequests: githubData?.pullRequests || [],
        rawReviews: githubData?.reviews || [],
        figmaData,
      });

      return jsonResponse({
        room,
        members: telemetry.members,
        unattributedCommits: telemetry.unattributedCommits,
        totalCommits: telemetry.totalCommits,
        figmaFrameCount: telemetry.figmaFrameCount,
        isFigmaAccessible: telemetry.isFigmaAccessible,
        triageEvents,
        dataFreshness: {
          fetchedAt: new Date(cached?.timestamp || nowMs).toISOString(),
          stale: Boolean(upstreamError),
          error: upstreamError,
          isDemo: false,
        },
      });
    }

    // -------------------------------------------------------------
    // POST /api/rooms/:id/triage — Record Triage Decision
    // -------------------------------------------------------------
    const triageMatch = path.match(/^\/api\/rooms\/([a-zA-Z0-9-]+)\/triage$/);
    if (method === 'POST' && triageMatch) {
      const roomId = triageMatch[1];
      const room = await getRoomById(env, roomId);
      if (!room) return jsonResponse({ error: 'Room not found' }, 404);

      const isAuthorized = await verifyLeadAuthorization(request, room);
      if (!isAuthorized) {
        return jsonResponse({ error: 'Unauthorized: Invalid lead key' }, 401);
      }

      const body = await request.json();
      const { memberId, action, note, snoozedUntil } = body;

      const validActions = ['fallback_api', 'cut_scope', 'snoozed', 'none'];
      if (!validActions.includes(action)) {
        return jsonResponse({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }, 400);
      }

      const result = await recordTriageDecision(env, {
        roomId,
        memberId,
        action,
        note,
        snoozedUntil,
      });

      return jsonResponse(result);
    }

    // -------------------------------------------------------------
    // POST /api/rooms/:id/aliases — Map Unattributed Commit Author
    // -------------------------------------------------------------
    const aliasMatch = path.match(/^\/api\/rooms\/([a-zA-Z0-9-]+)\/aliases$/);
    if (method === 'POST' && aliasMatch) {
      const roomId = aliasMatch[1];
      const room = await getRoomById(env, roomId);
      if (!room) return jsonResponse({ error: 'Room not found' }, 404);

      const isAuthorized = await verifyLeadAuthorization(request, room);
      if (!isAuthorized) {
        return jsonResponse({ error: 'Unauthorized: Invalid lead key' }, 401);
      }

      const body = await request.json();
      const { memberId, alias } = body;
      if (!memberId || !alias || !alias.trim()) {
        return jsonResponse({ error: 'memberId and alias are required' }, 400);
      }

      const updatedMember = await addMemberAliasInDb(env, {
        roomId,
        memberId,
        alias: alias.trim(),
      });

      return jsonResponse({ member: updatedMember });
    }

    // Unmatched API endpoint
    return jsonResponse({ error: 'Endpoint not found' }, 404);
  } catch (err) {
    return jsonResponse({ error: err.message || 'Internal server error' }, 500);
  }
}
