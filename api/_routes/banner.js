import { getMongoDb } from '../_mongo.js';
import { handleApiRequest, apiError, parseJsonBody, sanitizeAdminImageUrl } from '../_security.js';

const BANNER_ID = 'homepage_banner';

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
    const col = db.collection('banner_config');
    const adminsCol = db.collection('admin_users');

    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      const doc = await col.findOne({ _id: BANNER_ID });
      if (!doc) return res.status(200).json(null);
      const { _id, ...rest } = doc;
      return res.status(200).json(rest);
    }

    if (req.method === 'PUT') {
      const { requireAdmin } = await import('../_adminAuth.js');
      const auth = await requireAdmin(req, adminsCol);
      if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

      const body = parseJsonBody(req);
      delete body._id;
      if (body.imageUrl !== undefined) {
        const url = sanitizeAdminImageUrl(body.imageUrl);
        if (body.imageUrl && url === null) {
          return res.status(400).json({
            error: 'Invalid banner image. Use a smaller image or an https:// URL.',
          });
        }
        body.imageUrl = url ?? '';
      }
      const payload = { ...body, updatedAt: new Date().toISOString() };
      await col.updateOne({ _id: BANNER_ID }, { $set: payload }, { upsert: true });
      const saved = await col.findOne({ _id: BANNER_ID });
      if (!saved) return res.status(200).json({ ok: true, updatedAt: payload.updatedAt });
      const { _id, ...rest } = saved;
      return res.status(200).json(rest);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return apiError(res, err);
  }
}
