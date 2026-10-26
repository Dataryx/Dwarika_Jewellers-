import crypto from 'node:crypto';
import { normalizeEmail } from '../shared/emailValidation.mjs';
import {
  getBearerToken,
  hashPassword,
  verifyPassword,
} from './_customerAuth.js';
import { getMongoDb } from './_mongo.js';
import { isIpAllowedForAdmin, isProduction } from './_security.js';

const TOKEN_TTL_MS = Number(process.env.ADMIN_TOKEN_TTL_MS) || 8 * 60 * 60 * 1000; // 8 hours
const MAX_FAILED_LOGINS = Number(process.env.ADMIN_MAX_FAILED_LOGINS) || 8;
const LOCKOUT_MS = Number(process.env.ADMIN_LOCKOUT_MS) || 30 * 60 * 1000; // 30 minutes

export const MASTER_EMAIL = 'admin@dwarika.com';

function adminSecret() {
  const secret = process.env.ADMIN_AUTH_SECRET?.trim();
  if (secret) return secret;
  if (isProduction()) {
    throw new Error('ADMIN_AUTH_SECRET is required in production');
  }
  return process.env.CUSTOMER_AUTH_SECRET?.trim() || 'dwarika-dev-admin-auth-secret';
}

function signPayload(payload) {
  const json = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', adminSecret()).update(json).digest('base64url');
  return `${Buffer.from(json, 'utf8').toString('base64url')}.${sig}`;
}

export function createAdminToken(email, tokenVersion = 0) {
  const payload = {
    sub: normalizeEmail(email),
    role: 'admin',
    tv: Number(tokenVersion) || 0,
    jti: crypto.randomBytes(16).toString('hex'),
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  return signPayload(payload);
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  let json;
  try {
    json = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const expected = crypto.createHmac('sha256', adminSecret()).update(json).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  let payload;
  try {
    payload = JSON.parse(json);
  } catch {
    return null;
  }
  if (!payload?.sub || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
  return payload;
}

export function isMasterUser(user) {
  if (!user) return false;
  return user.role === 'master' || normalizeEmail(user.email) === MASTER_EMAIL;
}

export function adminTokenVersion(user) {
  return Number(user?.token_version) || 0;
}

export function isAdminLocked(user) {
  if (!user?.locked_until) return false;
  const until =
    user.locked_until instanceof Date
      ? user.locked_until.getTime()
      : Date.parse(user.locked_until);
  return Number.isFinite(until) && until > Date.now();
}

export async function recordAdminLoginFailure(admins, user) {
  if (!user?._id) return;
  const count = (Number(user.failed_login_count) || 0) + 1;
  const updates = {
    failed_login_count: count,
    last_failed_login_at: new Date(),
  };
  if (count >= MAX_FAILED_LOGINS) {
    updates.locked_until = new Date(Date.now() + LOCKOUT_MS);
  }
  await admins.updateOne({ _id: user._id }, { $set: updates });
}

export async function clearAdminLoginFailures(admins, user) {
  if (!user?._id) return;
  await admins.updateOne(
    { _id: user._id },
    {
      $set: { failed_login_count: 0 },
      $unset: { locked_until: '', last_failed_login_at: '' },
    }
  );
}

/** Invalidate all existing admin Bearer tokens for this user. */
export async function bumpAdminTokenVersion(admins, userId) {
  const result = await admins.findOneAndUpdate(
    { _id: userId },
    { $inc: { token_version: 1 }, $set: { updated_at: new Date() } },
    { returnDocument: 'after' }
  );
  return result?.value ?? result;
}

export async function revokeAdminToken(db, payload) {
  if (!db || !payload?.jti || typeof payload.exp !== 'number') return;
  try {
    await db.collection('admin_token_denylist').updateOne(
      { _id: payload.jti },
      {
        $set: {
          expires_at: new Date(payload.exp),
          revoked_at: new Date(),
          sub: String(payload.sub || '').slice(0, 200),
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error('[adminAuth] revoke failed:', err instanceof Error ? err.message : err);
  }
}

export async function isAdminTokenRevoked(db, jti) {
  if (!db || !jti) return false;
  const doc = await db.collection('admin_token_denylist').findOne({ _id: jti });
  return Boolean(doc);
}

export async function findAdminByEmail(col, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  let doc = await col.findOne({ email: normalized });
  if (doc) return doc;

  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  doc = await col.findOne({ email: { $regex: `^${escaped}$`, $options: 'i' } });
  if (doc && normalizeEmail(doc.email) !== doc.email) {
    await col.updateOne({ _id: doc._id }, { $set: { email: normalized } });
    doc.email = normalized;
  }
  return doc;
}

export function verifyAdminPassword(password, user) {
  if (!user || !password) return false;
  if (user.password_hash) return verifyPassword(password, user.password_hash);
  if (typeof user.password === 'string' && user.password) {
    return user.password === String(password);
  }
  return false;
}

export function passwordHashUpdate(password) {
  return {
    password_hash: hashPassword(String(password)),
    updated_at: new Date(),
  };
}

export async function migrateAdminPasswordIfNeeded(admins, user, password) {
  if (user.password_hash || !user.password) return;
  await admins.updateOne(
    { _id: user._id },
    {
      $set: passwordHashUpdate(password),
      $unset: { password: '' },
    }
  );
}

export function getAdminBearerToken(req) {
  return getBearerToken(req);
}

/** Validates signed admin token and loads admin user from MongoDB. */
export async function requireAdmin(req, adminsCol) {
  if (!isIpAllowedForAdmin(req)) {
    return { error: { status: 403, message: 'Admin access denied from this network' } };
  }
  const token = getAdminBearerToken(req);
  if (!token) {
    return { error: { status: 401, message: 'Admin session required' } };
  }
  const payload = verifyAdminToken(token);
  if (!payload) {
    return { error: { status: 401, message: 'Invalid or expired admin session' } };
  }

  try {
    const db = await getMongoDb();
    if (payload.jti && (await isAdminTokenRevoked(db, payload.jti))) {
      return { error: { status: 401, message: 'Admin session revoked. Sign in again.' } };
    }
  } catch {
    /* denylist check is best-effort if Mongo briefly unavailable after token verify */
  }

  const caller = await findAdminByEmail(adminsCol, payload.sub);
  if (!caller) {
    return { error: { status: 401, message: 'Invalid admin session' } };
  }
  if (caller.disabled === true) {
    return { error: { status: 403, message: 'Admin account disabled' } };
  }
  if (isAdminLocked(caller)) {
    return { error: { status: 423, message: 'Admin account temporarily locked. Try again later.' } };
  }
  if (Number(payload.tv || 0) !== adminTokenVersion(caller)) {
    return { error: { status: 401, message: 'Admin session revoked. Sign in again.' } };
  }
  return { caller, tokenPayload: payload };
}

export function toPublicAdmin(doc) {
  return {
    email: doc.email,
    name: doc.name || 'Admin',
    role: isMasterUser(doc) ? 'master' : 'admin',
    phone: doc.phone || '',
    address: doc.address || '',
    city: doc.city || '',
    job_title: doc.job_title || '',
    created_at: doc.created_at,
  };
}
