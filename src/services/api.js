/**
 * ShipMate Client API Service
 * Interacts with Cloudflare backend endpoints with Lead Key bearer authorization.
 */

export function getStoredLeadKey(roomId) {
  // 1. Check URL hash #k=...
  if (typeof window !== 'undefined' && window.location.hash) {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const hashKey = params.get('k');
    if (hashKey && hashKey.length >= 32) {
      localStorage.setItem(`shipmate_lead_key_${roomId}`, hashKey);
      return hashKey;
    }
  }

  // 2. Check localStorage
  if (typeof localStorage !== 'undefined' && roomId) {
    return localStorage.getItem(`shipmate_lead_key_${roomId}`) || '';
  }
  return '';
}

export function saveStoredLeadKey(roomId, key) {
  if (typeof localStorage !== 'undefined' && roomId && key) {
    localStorage.setItem(`shipmate_lead_key_${roomId}`, key.trim());
  }
}

export function getLeadUrl(roomId, leadKey) {
  if (typeof window === 'undefined') return `/room/${roomId}#k=${leadKey}`;
  const origin = window.location.origin;
  return `${origin}/room/${roomId}#k=${leadKey}`;
}

async function request(url, options = {}, leadKey = '') {
  const headers = {
    'Content-Type': 'application/json',
    ...(leadKey ? { 'Authorization': `Bearer ${leadKey}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
    err.status = res.status;
    err.field = data.field;
    throw err;
  }

  return data;
}

export async function createRoom(payload) {
  return await request('/api/rooms', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createDemoRoom() {
  return await request('/api/demo', {
    method: 'POST',
  });
}

export async function getRoomActivity(roomId, leadKey) {
  return await request(`/api/rooms/${roomId}/activity`, {}, leadKey);
}

export async function saveTriageDecision(roomId, payload, leadKey) {
  return await request(`/api/rooms/${roomId}/triage`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, leadKey);
}

export async function assignMemberAlias(roomId, payload, leadKey) {
  return await request(`/api/rooms/${roomId}/aliases`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, leadKey);
}
