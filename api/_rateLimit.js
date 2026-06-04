import { getClientIp } from './_security.js';

/**
 * MongoDB-backed sliding window rate limiter (works across Vercel instances).
 * @returns {Promise<{ ok: boolean, retryAfterSec?: number }>}
 */
export async function checkRateLimit(db, scope, identifier, { windowMs = 15 * 60 * 1000, max = 20 } = {}) {
  const col = db.collection('rate_limits');
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const docId = `${scope}:${identifier}:${bucket}`;
  const expiresAt = new Date((bucket + 2) * windowMs);

  const result = await col.findOneAndUpdate(
    { _id: docId },
    {
      $inc: { count: 1 },
      $setOnInsert: { scope, identifier, bucket, expires_at: expiresAt },
    },
    { upsert: true, returnDocument: 'after' }
  );

  const doc = result.value ?? result;
  const count = doc?.count ?? 1;
  if (count > max) {
    const retryAfterSec = Math.ceil((windowMs - (now % windowMs)) / 1000);
    return { ok: false, retryAfterSec };
  }
  return { ok: true };
}

export async function rateLimitRequest(db, req, scope, keyPart, opts) {
  const ip = getClientIp(req);
  const id = `${keyPart}:${ip}`;
  return checkRateLimit(db, scope, id, opts);
}
