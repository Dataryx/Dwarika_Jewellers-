import { getMongoDb, nextSeq, docToJson } from './_mongo.js';
import { requireAdmin } from './_adminAuth.js';
import { handleApiRequest, apiError, sanitizeMediaUrl } from './_security.js';

export default async function handler(req, res) {
  if (
    handleApiRequest(req, res, {
      methods: 'GET, POST, PUT, DELETE, OPTIONS',
      headers: 'Content-Type, Authorization',
    })
  ) {
    return;
  }

  try {
    const db = await getMongoDb();
    const products = db.collection('products');
    const adminsCol = db.collection('admin_users');
    const { id, category, featured } = req.query;

    const numOrUndefined = (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    };

    if (req.method === 'GET' && id) {
      const pid = Number(id);
      if (!Number.isFinite(pid)) return res.status(400).json({ error: 'Invalid product id' });
      const doc = await products.findOne({ _id: pid });
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(docToJson(doc));
    }

    if (req.method === 'GET') {
      const filter = {};
      if (category) filter.category = String(category).slice(0, 80);
      if (featured === 'true') filter.featured = true;
      const rows = await products.find(filter).sort({ created_at: -1 }).toArray();
      return res.status(200).json(rows.map(docToJson));
    }

    const auth = await requireAdmin(req, adminsCol);
    if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

    if (req.method === 'POST') {
      const body = req.body || {};
      const imageUrl = sanitizeMediaUrl(body.image_url);
      if (body.image_url && imageUrl === null) {
        return res.status(400).json({ error: 'Invalid image URL' });
      }
      const newId = await nextSeq('product');
      const doc = {
        _id: newId,
        name: String(body.name ?? '').slice(0, 200),
        description: String(body.description ?? '').slice(0, 5000),
        price: Number(body.price) || 0,
        product_type: body.product_type ?? 'both',
        gold_weight_14k: Number(body.gold_weight_14k) || 0,
        diamond_weight_carat: Number(body.diamond_weight_carat) || 0,
        labour_charge: Number(body.labour_charge) || 0,
        gold_extra_charge: Number(body.gold_extra_charge) || 0,
        diamond_extra_charge: Number(body.diamond_extra_charge) || 0,
        image_url: imageUrl ?? '',
        category: String(body.category ?? 'rings').slice(0, 80),
        material: String(body.material ?? '').slice(0, 120),
        stock: Math.max(0, Number(body.stock) || 0),
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
        name: raw.name != null ? String(raw.name).slice(0, 200) : undefined,
        description: raw.description != null ? String(raw.description).slice(0, 5000) : undefined,
        price: numOrUndefined(raw.price),
        product_type: raw.product_type,
        gold_weight_14k: numOrUndefined(raw.gold_weight_14k),
        diamond_weight_carat: numOrUndefined(raw.diamond_weight_carat),
        labour_charge: numOrUndefined(raw.labour_charge),
        gold_extra_charge: numOrUndefined(raw.gold_extra_charge),
        diamond_extra_charge: numOrUndefined(raw.diamond_extra_charge),
        category: raw.category != null ? String(raw.category).slice(0, 80) : undefined,
        material: raw.material != null ? String(raw.material).slice(0, 120) : undefined,
        stock: raw.stock != null ? Math.max(0, numOrUndefined(raw.stock) ?? 0) : undefined,
        featured: raw.featured,
      };
      if (raw.image_url !== undefined) {
        const imageUrl = sanitizeMediaUrl(raw.image_url);
        if (raw.image_url && imageUrl === null) {
          return res.status(400).json({ error: 'Invalid image URL' });
        }
        $set.image_url = imageUrl ?? '';
      }
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
    return apiError(res, err);
  }
}
