export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Client IP. When TRUST_PROXY=1 (behind Nginx), use X-Forwarded-For / X-Real-IP.
 * Otherwise prefer the direct socket address to avoid spoofed headers.
 */
export function getClientIp(req) {
  const headers = req.headers || {};
  const trustProxy =
    process.env.TRUST_PROXY === '1' ||
    process.env.TRUST_PROXY === 'true';

  if (trustProxy) {
    const xf = headers['x-forwarded-for'];
    if (xf) return String(Array.isArray(xf) ? xf[0] : xf).split(',')[0].trim();
    const real = headers['x-real-ip'];
    if (real) return String(Array.isArray(real) ? real[0] : real).trim();
  }

  const remote = req.socket?.remoteAddress || req.connection?.remoteAddress;
  if (remote) return String(remote).replace(/^::ffff:/, '');
  return 'unknown';
}

/** Optional allowlist for admin API (comma-separated IPs). Empty = allow all authenticated admins. */
export function adminAllowedIps() {
  return String(process.env.ADMIN_ALLOWED_IPS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isIpAllowedForAdmin(req) {
  const allow = adminAllowedIps();
  if (allow.length === 0) return true;
  const ip = getClientIp(req);
  return allow.includes(ip);
}

/** Strip prototype-pollution keys from plain objects (shallow + one nested level). */
export function sanitizePlainObject(value, depth = 0) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  if (depth > 4) return {};
  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    out[key] =
      val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)
        ? sanitizePlainObject(val, depth + 1)
        : Array.isArray(val)
          ? val.map((item) =>
              item && typeof item === 'object' && !Array.isArray(item)
                ? sanitizePlainObject(item, depth + 1)
                : item
            )
          : val;
  }
  return out;
}

function normalizeOrigin(value) {
  return String(value || '')
    .trim()
    .replace(/\/$/, '');
}

export function allowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || '';
  const fromList = raw
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
  const fromEnv = [
    process.env.VITE_STOREFRONT_URL,
    process.env.VITE_ADMIN_URL,
    process.env.STOREFRONT_URL,
    process.env.ADMIN_URL,
  ]
    .map(normalizeOrigin)
    .filter(Boolean);
  return [...new Set([...fromList, ...fromEnv])];
}

/** Fail fast in production when required secrets / CORS are missing. */
export function assertProductionConfig() {
  if (!isProduction()) return;
  const missing = [];
  if (!process.env.MONGODB_URI?.trim()) missing.push('MONGODB_URI');
  if (!process.env.CUSTOMER_AUTH_SECRET?.trim()) missing.push('CUSTOMER_AUTH_SECRET');
  if (!process.env.ADMIN_AUTH_SECRET?.trim()) missing.push('ADMIN_AUTH_SECRET');
  if (allowedOrigins().length === 0) missing.push('ALLOWED_ORIGINS');
  if (missing.length) {
    throw new Error(
      `Production misconfigured. Set required env: ${missing.join(', ')}`
    );
  }
  if (process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim()) {
    console.warn(
      '[security] ADMIN_BOOTSTRAP_PASSWORD is set. Remove it from env after the first admin login.'
    );
  }
}

export function contentSecurityPolicy({ isAdmin = false } = {}) {
  const connect = new Set(["'self'"]);
  for (const origin of allowedOrigins()) connect.add(origin);
  if (process.env.VITE_API_URL) connect.add(normalizeOrigin(process.env.VITE_API_URL));

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Contact page Google Maps embed
    "frame-src 'self' https://www.google.com https://maps.google.com https://maps.googleapis.com",
    "object-src 'none'",
    "script-src 'self'",
    // Tailwind / Vite inject some inline styles; fonts from Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    `connect-src ${[...connect].join(' ')}`,
    "upgrade-insecure-requests",
  ];
  if (isAdmin) {
    directives.push("worker-src 'self' blob:");
  }
  return directives.join('; ');
}

export function applySecurityHeaders(res, { isAdmin = false, csp = false } = {}) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  if (csp) {
    res.setHeader('Content-Security-Policy', contentSecurityPolicy({ isAdmin }));
  }
  if (isProduction()) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
}

/**
 * CORS + security headers. Returns true if OPTIONS was handled.
 * @param {{ methods?: string, headers?: string }} opts
 */
export function handleApiRequest(req, res, opts = {}) {
  applySecurityHeaders(res);

  const methods = opts.methods || 'GET, POST, PUT, DELETE, OPTIONS';
  const allowHeaders =
    opts.headers ||
    'Content-Type, Authorization, X-Admin-Email, X-User-Email, X-Session-Id, X-Customer-Token';

  const origin = normalizeOrigin(req.headers?.origin);
  const allowed = allowedOrigins();

  // Production: only allowlisted origins. Never reflect arbitrary Origin when list is empty.
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!isProduction()) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', allowHeaders);
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export function apiError(res, err, status = 500) {
  console.error(err);
  let code = status;
  let message = 'Internal server error';

  if (err instanceof Error) {
    if (/MONGODB_URI is not set|Production misconfigured/i.test(err.message)) {
      code = 503;
      message = isProduction()
        ? 'Server is not fully configured. Check production environment variables.'
        : err.message;
    } else if (
      /MongoDB authentication failed|Cannot reach MongoDB|Server selection|timed out/i.test(
        err.message
      )
    ) {
      code = 503;
      message = err.message;
    } else if (/ADMIN_AUTH_SECRET|CUSTOMER_AUTH_SECRET is required/i.test(err.message)) {
      code = 503;
      message = err.message;
    } else if (/Request body too large/i.test(err.message)) {
      code = 413;
      message = 'Request body too large';
    } else if (!isProduction()) {
      message = err.message;
    } else if (err.message && err.message.length < 200) {
      message = err.message;
    }
  }

  return res.status(code).json({ error: message });
}

/** Reject javascript URLs; allow https/http, relative paths, and optional admin data:image uploads. */
export function sanitizeMediaUrl(url, { maxLen = 2048, allowDataImages = false } = {}) {
  if (url == null || url === '') return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (/^javascript:/i.test(trimmed)) return null;
  if (/^data:/i.test(trimmed)) {
    if (!allowDataImages) return null;
    if (!/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(trimmed)) return null;
    if (trimmed.length > maxLen) return null;
    return trimmed;
  }
  if (trimmed.length > maxLen) return null;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return trimmed;
  } catch {
    return null;
  }
}

/** Admin uploads from ImageUploadField (compressed data URLs or https links). Max ~480KB banner / 600KB product. */
export function sanitizeAdminImageUrl(url) {
  return sanitizeMediaUrl(url, { maxLen: 600_000, allowDataImages: true });
}

export function parseJsonBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        body = JSON.parse(trimmed);
      } catch {
        body = {};
      }
    } else {
      body = {};
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  return sanitizePlainObject(body);
}

export const ORDER_STATUSES = new Set([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

/** Max JSON body size for API requests (bytes). */
export const MAX_API_BODY_BYTES = Number(process.env.MAX_API_BODY_BYTES) || 1_200_000;
