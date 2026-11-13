/**
 * Server-side Supabase REST client using the Service Role Key.
 * Direct HTTP requests — no external heavy SDK required.
 */

function getHeaders(env) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

function cleanBaseUrl(url) {
  return url.replace(/\/+$/, '');
}

export async function createRoomInDb(env, roomData, membersData) {
  const base = cleanBaseUrl(env.SUPABASE_URL);
  const headers = getHeaders(env);

  // 1. Insert sprint_rooms
  const roomRes = await fetch(`${base}/rest/v1/sprint_rooms`, {
    method: 'POST',
    headers,
    body: JSON.stringify(roomData),
  });

  if (!roomRes.ok) {
    const errText = await roomRes.text();
    throw new Error(`Failed to create sprint room: ${errText}`);
  }

  const [createdRoom] = await roomRes.json();

  // 2. Insert members
  let createdMembers = [];
  if (membersData.length > 0) {
    const membersWithRoomId = membersData.map((m) => ({
      ...m,
      room_id: createdRoom.id,
    }));

    const memRes = await fetch(`${base}/rest/v1/members`, {
      method: 'POST',
      headers,
      body: JSON.stringify(membersWithRoomId),
    });

    if (!memRes.ok) {
      const errText = await memRes.text();
      throw new Error(`Failed to create members: ${errText}`);
    }

    createdMembers = await memRes.json();
  }

  return { room: createdRoom, members: createdMembers };
}

export async function getRoomById(env, roomId) {
  const base = cleanBaseUrl(env.SUPABASE_URL);
  const headers = getHeaders(env);

  const res = await fetch(`${base}/rest/v1/sprint_rooms?id=eq.${encodeURIComponent(roomId)}&select=*`, {
    headers,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase query failed: ${errText}`);
  }

  const rooms = await res.json();
  return rooms.length > 0 ? rooms[0] : null;
}

export async function getMembersByRoomId(env, roomId) {
  const base = cleanBaseUrl(env.SUPABASE_URL);
  const headers = getHeaders(env);

  const res = await fetch(
    `${base}/rest/v1/members?room_id=eq.${encodeURIComponent(roomId)}&select=*&order=created_at.asc`,
    { headers }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch members: ${errText}`);
  }

  return await res.json();
}

export async function getTriageEventsByRoomId(env, roomId) {
  const base = cleanBaseUrl(env.SUPABASE_URL);
  const headers = getHeaders(env);

  const res = await fetch(
    `${base}/rest/v1/triage_events?room_id=eq.${encodeURIComponent(roomId)}&select=*&order=created_at.desc`,
    { headers }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch triage events: ${errText}`);
  }

  return await res.json();
}

export async function recordTriageDecision(env, { roomId, memberId, action, note, snoozedUntil }) {
  const base = cleanBaseUrl(env.SUPABASE_URL);
  const headers = getHeaders(env);

  // 1. Update member row
  const updatePayload = {
    triage_status: action,
    triage_note: note || null,
    snoozed_until: snoozedUntil || null,
  };

  const memberRes = await fetch(
    `${base}/rest/v1/members?id=eq.${encodeURIComponent(memberId)}&room_id=eq.${encodeURIComponent(roomId)}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updatePayload),
    }
  );

  if (!memberRes.ok) {
    const errText = await memberRes.text();
    throw new Error(`Failed to update member triage status: ${errText}`);
  }

  const [updatedMember] = await memberRes.json();

  // 2. Append to triage_events audit log
  const eventPayload = {
    member_id: memberId,
    room_id: roomId,
    action,
    note: note || null,
  };

  const eventRes = await fetch(`${base}/rest/v1/triage_events`, {
    method: 'POST',
    headers,
    body: JSON.stringify(eventPayload),
  });

  if (!eventRes.ok) {
    const errText = await eventRes.text();
    throw new Error(`Failed to record triage event: ${errText}`);
  }

  const [createdEvent] = await eventRes.json();

  return { member: updatedMember, event: createdEvent };
}

export async function addMemberAliasInDb(env, { roomId, memberId, alias }) {
  const base = cleanBaseUrl(env.SUPABASE_URL);
  const headers = getHeaders(env);

  // First fetch member's current aliases
  const memRes = await fetch(
    `${base}/rest/v1/members?id=eq.${encodeURIComponent(memberId)}&room_id=eq.${encodeURIComponent(roomId)}&select=aliases`,
    { headers }
  );

  if (!memRes.ok) throw new Error('Member not found');
  const [member] = await memRes.json();
  const currentAliases = Array.isArray(member.aliases) ? member.aliases : [];

  const cleanAlias = alias.trim();
  if (!currentAliases.includes(cleanAlias)) {
    currentAliases.push(cleanAlias);
  }

  const patchRes = await fetch(
    `${base}/rest/v1/members?id=eq.${encodeURIComponent(memberId)}&room_id=eq.${encodeURIComponent(roomId)}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ aliases: currentAliases }),
    }
  );

  if (!patchRes.ok) throw new Error('Failed to update member aliases');
  const [updatedMember] = await patchRes.json();
  return updatedMember;
}
