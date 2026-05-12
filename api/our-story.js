import { getMongoDb } from './_mongo.js';

const STORY_ID = 'our_story';

const DEFAULT_STORY = {
  imageUrl: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800',
  title: 'Crafted with Passion, Worn with Pride',
  paragraph1:
    'Every piece in our collection is meticulously handcrafted by master artisans who have dedicated their lives to the art of jewelry making. We source only the finest materials—from ethically mined gemstones to recycled precious metals.',
  paragraph2:
    'Our commitment to quality means each piece is designed to last a lifetime and become a treasured heirloom passed down through generations.',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getMongoDb();
    const col = db.collection('site_content');

    if (req.method === 'GET') {
      const doc = await col.findOne({ _id: STORY_ID });
      if (!doc) return res.status(200).json({ ...DEFAULT_STORY });
      const { _id, ...rest } = doc;
      return res.status(200).json({ ...DEFAULT_STORY, ...rest });
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      delete body._id;
      await col.updateOne({ _id: STORY_ID }, { $set: body }, { upsert: true });
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Our Story API error:', err);
    res.status(500).json({ error: err.message });
  }
}
