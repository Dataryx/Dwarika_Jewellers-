import { getMongoDb } from './_mongo.js';
import { clearLivePricesCache } from './live-prices.js';
import { requireAdmin } from './_adminAuth.js';
import { handleApiRequest, apiError } from './_security.js';

const SETTINGS_ID = 'store_settings';

const DEFAULT_SETTINGS = {
  storeName: 'Dwarika',
  storeEmail: 'contact@dwarika.com',
  storeDescription: 'Handcrafted luxury jewellery for timeless elegance.',
  taxRate: 13,
  baseGoldRatePerGram: 16358,
  goldRatePerGram: 16358,
  silverRatePerGram: 434,
  diamondRatePerCarat: 28000,
  goldMakingChargeRate: 0.4,
  gramsPerTola: 11.664,
  freeShippingThreshold: 5000,
  standardShippingRate: 150,
  expressShippingRate: 350,
  processingDays: 2,
  paymentMethods: {
    'Cash on Delivery': true,
    eSewa: true,
    Khalti: true,
    'Bank Transfer': false,
    'Credit / Debit Card': false,
  },
  notifications: {
    newOrders: true,
    lowStock: true,
    newReviews: false,
    customerSignups: true,
    dailyReport: true,
    marketingEmails: false,
  },
};

const ALLOWED_KEYS = new Set([
  'storeName',
  'storeEmail',
  'storeDescription',
  'taxRate',
  'baseGoldRatePerGram',
  'goldRatePerGram',
  'silverRatePerGram',
  'diamondRatePerCarat',
  'goldMakingChargeRate',
  'gramsPerTola',
  'freeShippingThreshold',
  'standardShippingRate',
  'expressShippingRate',
  'processingDays',
  'paymentMethods',
  'notifications',
  'pricingUpdatedAt',
]);

function pickSettings(body) {
  const out = {};
  for (const key of ALLOWED_KEYS) {
    if (key in body) out[key] = body[key];
  }
  return out;
}

export default async function handler(req, res) {
  if (
    handleApiRequest(req, res, {
      methods: 'GET, PUT, OPTIONS',
      headers: 'Content-Type, Authorization',
    })
  ) {
    return;
  }

  try {
    const db = await getMongoDb();
    const col = db.collection('settings');
    const adminsCol = db.collection('admin_users');

    if (req.method === 'GET') {
      const doc = await col.findOne({ _id: SETTINGS_ID });
      if (!doc) return res.status(200).json({ ...DEFAULT_SETTINGS });
      const { _id, ...rest } = doc;
      const merged = { ...DEFAULT_SETTINGS, ...rest };
      merged.paymentMethods = { ...DEFAULT_SETTINGS.paymentMethods, ...(rest.paymentMethods || {}) };
      merged.notifications = { ...DEFAULT_SETTINGS.notifications, ...(rest.notifications || {}) };
      return res.status(200).json(merged);
    }

    if (req.method === 'PUT') {
      const auth = await requireAdmin(req, adminsCol);
      if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

      const body = pickSettings(req.body || {});
      const pricingFields = [
        'goldRatePerGram',
        'silverRatePerGram',
        'diamondRatePerCarat',
        'gramsPerTola',
        'goldMakingChargeRate',
        'baseGoldRatePerGram',
      ];
      if (pricingFields.some((k) => k in body)) {
        body.pricingUpdatedAt = new Date().toISOString();
      }
      if (Object.keys(body).length === 0) {
        return res.status(400).json({ error: 'No valid settings to update' });
      }
      await col.updateOne({ _id: SETTINGS_ID }, { $set: body }, { upsert: true });
      if (pricingFields.some((k) => k in body)) {
        clearLivePricesCache();
      }
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return apiError(res, err);
  }
}
