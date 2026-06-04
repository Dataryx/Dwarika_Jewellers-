export function isProduction() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

export function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (xf) return String(Array.isArray(xf) ? xf[0] : xf).split(',')[0].trim();
  const real = req.headers['x-real-ip'];
  return String(Array.isArray(real) ? real[0] : real || 'unknown').trim();
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

export function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
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

  const origin = normalizeOrigin(req.headers.origin);
  const allowed = allowedOrigins();

  if (origin && (allowed.length === 0 || allowed.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!isProduction()) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', allowHeaders);

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
    if (/MONGODB_URI is not set/i.test(err.message)) {
      code = 503;
      message = isProduction()
        ? 'Database is not configured. Add MONGODB_URI in Vercel environment variables.'
        : err.message;
    } else if (
      /MongoDB authentication failed|Cannot reach MongoDB|Server selection|timed out/i.test(
        err.message
      )
    ) {
      code = 503;
      message = err.message;
    } else if (!isProduction()) {
      message = err.message;
    }
  }

  return res.status(code).json({ error: message });
}

/** Reject javascript/data URLs; allow https/http and same-site relative paths. */
export function sanitizeMediaUrl(url, { maxLen = 2048 } = {}) {
  if (url == null || url === '') return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (trimmed.length > maxLen) return null;
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) return null;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return trimmed;
  } catch {
    return null;
  }
}

export const ORDER_STATUSES = new Set([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);
