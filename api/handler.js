import { apiError, assertProductionConfig, isProduction } from './_security.js';

/** Lazy-load routes so cold start only loads the handler for the current request. */
const ROUTE_LOADERS = {
  'admin-auth': () => import('./_routes/admin-auth.js'),
  about: () => import('./_routes/about.js'),
  banner: () => import('./_routes/banner.js'),
  cart: () => import('./_routes/cart.js'),
  categories: () => import('./_routes/categories.js'),
  'contact-info': () => import('./_routes/contact-info.js'),
  contact: () => import('./_routes/contact.js'),
  health: () => import('./_routes/health.js'),
  'customer-auth': () => import('./_routes/customer-auth.js'),
  customers: () => import('./_routes/customers.js'),
  'live-prices': () => import('./_routes/live-prices.js'),
  newsletter: () => import('./_routes/newsletter.js'),
  orders: () => import('./_routes/orders.js'),
  products: () => import('./_routes/products.js'),
  settings: () => import('./_routes/settings.js'),
  smtp: () => import('./_routes/smtp.js'),
};

let productionConfigError = null;
if (isProduction()) {
  try {
    assertProductionConfig();
  } catch (err) {
    productionConfigError = err;
    console.error('[security]', err instanceof Error ? err.message : err);
  }
}

/** Resolve API segment from request URL (e.g. /api/products → products). */
function resolveRouteName(req) {
  const raw = req.url || '';
  const pathname = raw.includes('://') ? new URL(raw).pathname : raw.split('?')[0];
  const parts = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  return parts[0] || null;
}

function buildForwardedReq(req) {
  return {
    ...req,
    query: { ...(req.query || {}) },
    headers: req.headers || {},
    method: req.method || 'GET',
    body: req.body,
    url: req.url,
  };
}

/** Lightweight diagnostic — no Mongo, no shared imports. */
function handlePing(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  return res.status(200).json({
    ok: !productionConfigError,
    mongoUriConfigured: Boolean(process.env.MONGODB_URI?.trim()),
    authSecretsConfigured: Boolean(
      process.env.CUSTOMER_AUTH_SECRET?.trim() && process.env.ADMIN_AUTH_SECRET?.trim()
    ),
    allowedOriginsConfigured: Boolean(process.env.ALLOWED_ORIGINS?.trim()),
    database: process.env.MONGODB_DB_NAME?.trim() || 'lumiere',
    nodeEnv: process.env.NODE_ENV || null,
    configError: productionConfigError instanceof Error ? productionConfigError.message : null,
  });
}

export default async function handler(req, res) {
  try {
    const name = resolveRouteName(req);
    if (!name) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (name === 'ping') {
      return handlePing(req, res);
    }

    if (productionConfigError && name !== 'health') {
      return apiError(res, productionConfigError, 503);
    }

    const loadRoute = ROUTE_LOADERS[name];
    if (!loadRoute) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mod = await loadRoute();
    const routeHandler = mod.default;
    if (typeof routeHandler !== 'function') {
      return res.status(500).json({ error: 'Invalid route handler' });
    }

    return await routeHandler(buildForwardedReq(req), res);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/Cannot find module|ERR_MODULE_NOT_FOUND/i.test(message)) {
      console.error('Route module load failed:', err);
      return res.status(500).json({
        error: 'Server module load failed. Redeploy after pulling latest master.',
        detail: message,
      });
    }
    return apiError(res, err);
  }
}
