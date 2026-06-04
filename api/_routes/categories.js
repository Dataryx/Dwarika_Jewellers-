import { getMongoDb, nextSeq, docToJson } from '../_mongo.js';
import { handleApiRequest, apiError, sanitizeMediaUrl } from '../_security.js';

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
    const col = db.collection('categories');
    const adminsCol = db.collection('admin_users');
    const { id } = req.query;

    if (req.method === 'GET') {
      const docs = await col.find({}).sort({ sort_order: 1, created_at: -1 }).toArray();
      return res.status(200).json(docs.map(docToJson));
    }

    const { requireAdmin } = await import('../_adminAuth.js');
    const auth = await requireAdmin(req, adminsCol);
    if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

    if (req.method === 'POST') {
      const { name, image_url, path } = req.body || {};
      if (!name) return res.status(400).json({ error: 'name is required' });
      const imageUrl = sanitizeMediaUrl(image_url);
      if (image_url && imageUrl === null) {
        return res.status(400).json({ error: 'Invalid image URL' });
      }
      const catId = await nextSeq('category');
      const slug = (path || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
      const doc = {
        _id: catId,
        name: String(name).trim().slice(0, 120),
        slug,
        image_url: imageUrl ?? '',
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
      if (name !== undefined) updates.name = String(name).trim().slice(0, 120);
      if (image_url !== undefined) {
        const imageUrl = sanitizeMediaUrl(image_url);
        if (image_url && imageUrl === null) {
          return res.status(400).json({ error: 'Invalid image URL' });
        }
        updates.image_url = imageUrl ?? '';
      }
      if (path !== undefined) {
        updates.slug = String(path).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
      }
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
    return apiError(res, err);
  }
}
