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

export default async function handler(req, res) {
  const segments = Array.isArray(req.query.path)
    ? req.query.path
    : req.query.path
      ? [req.query.path]
      : [];

  const name = segments[0];
  if (!name) {
    return res.status(404).json({ error: 'Not found' });
  }

  if (segments.length > 1) {
    if (name === 'cart' || name === 'products') {
      return res.status(410).json({
        error: `Use /api/${name}?id= instead of /api/${name}/${segments[1]}`,
      });
    }
    return res.status(404).json({ error: 'Not found' });
  }

  const routeHandler = ROUTES[name];
  if (!routeHandler) {
    return res.status(404).json({ error: 'Not found' });
  }

  return routeHandler(req, res);
}
