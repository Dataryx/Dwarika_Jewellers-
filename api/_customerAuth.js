import crypto from 'node:crypto';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function authSecret() {
  return (
    process.env.CUSTOMER_AUTH_SECRET?.trim() ||
    process.env.MONGODB_URI?.trim() ||
    'dwarika-dev-customer-auth-secret'
  );
}

import { normalizeEmail } from '../shared/emailValidation.mjs';

export { normalizeEmail };

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const attempt = crypto.scryptSync(String(password), salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(attempt, 'hex'));
  } catch {
    return false;
  }
}

function signPayload(payload) {
  const json = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', authSecret()).update(json).digest('base64url');
  return `${Buffer.from(json, 'utf8').toString('base64url')}.${sig}`;
}

export function createCustomerToken(email) {
  const payload = {
    sub: normalizeEmail(email),
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  return signPayload(payload);
}

export function verifyCustomerToken(token) {
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
  const expected = crypto.createHmac('sha256', authSecret()).update(json).digest('base64url');
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

export function getBearerToken(req) {
  const raw = req.headers.authorization || req.headers.Authorization;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (header && typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  const alt = req.headers['x-customer-token'] || req.headers['X-Customer-Token'];
  return String(Array.isArray(alt) ? alt[0] : alt || '').trim() || null;
}

export function toPublicCustomer(doc) {
  if (!doc) return null;
  return {
    email: doc.email || doc._id,
    name: doc.name || '',
    phone: doc.phone || '',
    address: doc.address || '',
    city: doc.city || '',
    auth_provider: doc.auth_provider || 'email',
    email_verified: isEmailVerified(doc),
    created_at: doc.created_at instanceof Date ? doc.created_at.toISOString() : doc.created_at,
  };
}

/** Legacy accounts (before verification) without the flag are treated as verified. */
export function isEmailVerified(doc) {
  if (!doc) return false;
  if (doc.email_verified === true) return true;
  if (doc.email_verified === false) return false;
  return Boolean(doc.password_hash);
}

export function createVerifyToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyExpiresAt() {
  return new Date(Date.now() + VERIFY_TTL_MS);
}

export function createResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function resetExpiresAt() {
  return new Date(Date.now() + RESET_TTL_MS);
}
