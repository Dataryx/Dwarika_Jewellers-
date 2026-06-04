import adminAuth from './_routes/admin-auth.js';
import about from './_routes/about.js';
import banner from './_routes/banner.js';
import cart from './_routes/cart.js';
import categories from './_routes/categories.js';
import contactInfo from './_routes/contact-info.js';
import contact from './_routes/contact.js';
import customerAuth from './_routes/customer-auth.js';
import customers from './_routes/customers.js';
import livePrices from './_routes/live-prices.js';
import newsletter from './_routes/newsletter.js';
import orders from './_routes/orders.js';
import products from './_routes/products.js';
import settings from './_routes/settings.js';
import smtp from './_routes/smtp.js';

const ROUTES = {
  'admin-auth': adminAuth,
  about,
  banner,
  cart,
  categories,
  'contact-info': contactInfo,
  contact,
  'customer-auth': customerAuth,
  customers,
  'live-prices': livePrices,
  newsletter,
  orders,
  products,
  settings,
  smtp,
};

/** Resolve API segment from Vercel rewrite, catch-all query, or request URL. */
function resolveRouteName(req) {
  if (req.query?.route) {
    const segment = String(req.query.route).split('/').filter(Boolean)[0];
    if (segment) return decodeURIComponent(segment);
  }

  const pathParam = req.query?.path;
  if (Array.isArray(pathParam) && pathParam[0]) return pathParam[0];
  if (typeof pathParam === 'string' && pathParam) {
    return pathParam.split('/').filter(Boolean)[0];
  }

  const raw = req.url || '';
  const pathname = raw.includes('://') ? new URL(raw).pathname : raw.split('?')[0];
  const parts = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'handler') return parts[1] || null;
  return parts[0] || null;
}

export default async function handler(req, res) {
  const name = resolveRouteName(req);
  if (!name) {
    return res.status(404).json({ error: 'Not found' });
  }

  const routeHandler = ROUTES[name];
  if (!routeHandler) {
    return res.status(404).json({ error: 'Not found' });
  }

  return routeHandler(req, res);
}
