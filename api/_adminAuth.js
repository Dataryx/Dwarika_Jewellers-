import crypto from 'node:crypto';
import { normalizeEmail } from '../shared/emailValidation.mjs';
import {
  getBearerToken,
  hashPassword,
  verifyPassword,
} from './_customerAuth.js';
import { isProduction } from './_security.js';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

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

export function createAdminToken(email) {
  const payload = {
    sub: normalizeEmail(email),
    role: 'admin',
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
  const token = getAdminBearerToken(req);
  if (!token) {
    return { error: { status: 401, message: 'Admin session required' } };
  }
  const payload = verifyAdminToken(token);
  if (!payload) {
    return { error: { status: 401, message: 'Invalid or expired admin session' } };
  }
  const caller = await findAdminByEmail(adminsCol, payload.sub);
  if (!caller) {
    return { error: { status: 401, message: 'Invalid admin session' } };
  }
  return { caller };
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
