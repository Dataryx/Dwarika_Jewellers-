import { getMongoDb, nextSeq, docToJson } from './_mongo.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getMongoDb();
    const products = db.collection('products');
    const { id, category, featured } = req.query;

    if (req.method === 'GET' && id) {
      const pid = Number(id);
      if (!Number.isFinite(pid)) return res.status(400).json({ error: 'Invalid product id' });
      const doc = await products.findOne({ _id: pid });
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(docToJson(doc));
    }

    if (req.method === 'GET') {
      const filter = {};
      if (category) filter.category = category;
      if (featured === 'true') filter.featured = true;
      const rows = await products.find(filter).sort({ created_at: -1 }).toArray();
      return res.status(200).json(rows.map(docToJson));
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const newId = await nextSeq('product');
      const doc = {
        _id: newId,
        name: body.name ?? '',
        description: body.description ?? '',
        price: Number(body.price) || 0,
        image_url: body.image_url ?? '',
        category: body.category ?? 'rings',
        material: body.material ?? '',
        stock: Number(body.stock) || 0,
        featured: Boolean(body.featured),
        created_at: new Date(),
      };
      await products.insertOne(doc);
      return res.status(201).json(docToJson(doc));
    }

    if (req.method === 'PUT') {
      const updates = req.body || {};
      const productId = Number(id || updates.id);
      if (!Number.isFinite(productId)) return res.status(400).json({ error: 'Product ID required' });

      const { id: _i, _id: _m, ...raw } = updates;
      const $set = {
        name: raw.name,
        description: raw.description,
        price: raw.price !== undefined ? Number(raw.price) : undefined,
        image_url: raw.image_url,
        category: raw.category,
        material: raw.material,
        stock: raw.stock !== undefined ? Number(raw.stock) : undefined,
        featured: raw.featured,
      };
      Object.keys($set).forEach((k) => $set[k] === undefined && delete $set[k]);
      if (Object.keys($set).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const r = await products.findOneAndUpdate(
        { _id: productId },
        { $set },
        { returnDocument: 'after' }
      );
      const doc = r.value ?? r;
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(docToJson(doc));
    }

    if (req.method === 'DELETE') {
      const productId = Number(id || req.body?.id);
      if (!Number.isFinite(productId)) return res.status(400).json({ error: 'Product ID required' });
      await products.deleteOne({ _id: productId });
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
