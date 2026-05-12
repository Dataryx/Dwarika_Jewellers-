import { getMongoDb, nextSeq, docToJson } from './_mongo.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getMongoDb();
    const col = db.collection('categories');
    const { id } = req.query;

    if (req.method === 'GET') {
      const docs = await col.find({}).sort({ sort_order: 1, created_at: -1 }).toArray();
      return res.status(200).json(docs.map(docToJson));
    }

    if (req.method === 'POST') {
      const { name, image_url, path } = req.body || {};
      if (!name) return res.status(400).json({ error: 'name is required' });
      const catId = await nextSeq('category');
      const slug = (path || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const doc = {
        _id: catId,
        name: name.trim(),
        slug,
        image_url: image_url || '',
        sort_order: catId,
        created_at: new Date(),
      };
      await col.insertOne(doc);
      return res.status(201).json(docToJson(doc));
    }

    if (req.method === 'PUT') {
      const catId = Number(id || req.body?.id);
      if (!Number.isFinite(catId)) return res.status(400).json({ error: 'Category ID required' });
      const { name, image_url, path } = req.body || {};
      const updates = {};
      if (name !== undefined) updates.name = name.trim();
      if (image_url !== undefined) updates.image_url = image_url;
      if (path !== undefined) updates.slug = path.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await col.updateOne({ _id: catId }, { $set: updates });
      const updated = await col.findOne({ _id: catId });
      return res.status(200).json(docToJson(updated));
    }

    if (req.method === 'DELETE') {
      const catId = Number(id || req.body?.id);
      if (!Number.isFinite(catId)) return res.status(400).json({ error: 'Category ID required' });
      await col.deleteOne({ _id: catId });
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Categories API error:', err);
    res.status(500).json({ error: err.message });
  }
}
