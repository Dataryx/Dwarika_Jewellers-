import { getMongoDb } from './_mongo.js';

const BANNER_ID = 'homepage_banner';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getMongoDb();
    const col = db.collection('banner_config');

    if (req.method === 'GET') {
      const doc = await col.findOne({ _id: BANNER_ID });
      if (!doc) return res.status(200).json(null);
      const { _id, ...rest } = doc;
      return res.status(200).json(rest);
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      delete body._id;
      await col.updateOne({ _id: BANNER_ID }, { $set: body }, { upsert: true });
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Banner API error:', err);
    res.status(500).json({ error: err.message });
  }
}
