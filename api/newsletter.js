import { getMongoDb, nextSeq } from './_mongo.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getMongoDb();
    const col = db.collection('newsletter_subscribers');

    if (req.method === 'GET') {
      const docs = await col.find({}).sort({ created_at: -1 }).toArray();
      return res.status(200).json(docs.map(({ _id, ...rest }) => ({ id: _id, ...rest })));
    }

    if (req.method === 'POST') {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!email) return res.status(400).json({ error: 'Email is required' });

      const existing = await col.findOne({ _id: email });
      if (existing) {
        return res.status(200).json({ ok: true, alreadySubscribed: true });
      }

      const id = await nextSeq('newsletter_subscriber');
      await col.insertOne({
        _id: email,
        seq_id: id,
        email,
        created_at: new Date(),
      });

      return res.status(201).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!email) return res.status(400).json({ error: 'Email is required' });
      await col.deleteOne({ _id: email });
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Newsletter API error:', err);
    res.status(500).json({ error: err.message });
  }
}