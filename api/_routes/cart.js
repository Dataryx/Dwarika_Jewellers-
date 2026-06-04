import { getMongoDb, nextSeq, docToJson } from '../_mongo.js';

function getSessionId(req) {
  return req.headers['x-session-id'] || '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const sessionId = getSessionId(req);
  if (!sessionId) return res.status(400).json({ error: 'Session ID required (X-Session-Id header)' });

  try {
    const db = await getMongoDb();
    const cartCol = db.collection('cart_items');
    const productsCol = db.collection('products');
    const { id } = req.query;

    if (req.method === 'GET') {
      const cartItems = await cartCol.find({ session_id: sessionId }).sort({ created_at: -1 }).toArray();
      if (cartItems.length === 0) return res.status(200).json([]);

      const productIds = cartItems.map((item) => item.product_id);
      const products = await productsCol.find({ _id: { $in: productIds } }).toArray();
      const productsMap = Object.fromEntries(products.map((p) => [p._id, docToJson(p)]));

      const enrichedCart = cartItems.map((item) => ({
        ...docToJson(item),
        product: productsMap[item.product_id] || null,
      }));
      return res.status(200).json(enrichedCart);
    }

    if (req.method === 'POST') {
      const { product_id, quantity } = req.body || {};
      const pid = Number(product_id);
      if (!Number.isFinite(pid)) return res.status(400).json({ error: 'product_id required' });

      const existing = await cartCol.findOne({ session_id: sessionId, product_id: pid });
      if (existing) {
        const newQty = existing.quantity + (Number(quantity) || 1);
        const r = await cartCol.findOneAndUpdate(
          { _id: existing._id },
          { $set: { quantity: newQty } },
          { returnDocument: 'after' }
        );
        const doc = r.value ?? r;
        return res.status(200).json(docToJson(doc));
      }

      const lineId = await nextSeq('cart_item');
      const doc = {
        _id: lineId,
        session_id: sessionId,
        product_id: pid,
        quantity: Number(quantity) || 1,
        created_at: new Date(),
      };
      await cartCol.insertOne(doc);
      return res.status(201).json(docToJson(doc));
    }

    if (req.method === 'PUT') {
      const { quantity } = req.body || {};
      const itemId = Number(id || req.body?.id);
      if (!Number.isFinite(itemId)) return res.status(400).json({ error: 'Item ID required' });

      const r = await cartCol.findOneAndUpdate(
        { _id: itemId, session_id: sessionId },
        { $set: { quantity: Number(quantity) } },
        { returnDocument: 'after' }
      );
      const doc = r.value ?? r;
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(docToJson(doc));
    }

    if (req.method === 'DELETE') {
      const { clear_all } = req.body || {};
      const itemId = id ? Number(id) : req.body?.id !== undefined ? Number(req.body.id) : NaN;

      if (clear_all) {
        await cartCol.deleteMany({ session_id: sessionId });
        return res.status(200).json({ ok: true });
      }

      if (!Number.isFinite(itemId)) return res.status(400).json({ error: 'Item ID required' });
      await cartCol.deleteOne({ _id: itemId, session_id: sessionId });
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
