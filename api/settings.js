import { getMongoDb } from './_mongo.js';
import { clearLivePricesCache } from './live-prices.js';

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getMongoDb();
    const col = db.collection('settings');

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
      const body = req.body || {};
      delete body._id;
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
      await col.updateOne({ _id: SETTINGS_ID }, { $set: body }, { upsert: true });
      if (pricingFields.some((k) => k in body)) {
        clearLivePricesCache();
      }
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Settings API error:', err);
    res.status(500).json({ error: err.message });
  }
}
