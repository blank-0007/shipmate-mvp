/**
 * Server Authentication & Cryptographic Helpers
 * Zero login walls: lead key generated on room creation, stored as SHA-256 hash.
 */

/**
 * Generates a cryptographically secure 32-byte hex lead key
 */
export function generateLeadKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Computes SHA-256 hex hash of a string
 */
export async function hashLeadKey(leadKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(leadKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verifies Authorization: Bearer <leadKey> against room's stored lead_key_hash
 */
export async function verifyLeadAuthorization(request, room) {
  if (!room || !room.lead_key_hash) return false;

  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+([a-f0-9]{32,128})$/i);
  if (!match) return false;

  const providedKey = match[1];
  const providedHash = await hashLeadKey(providedKey);
  return constantTimeCompare(providedHash, room.lead_key_hash);
}
