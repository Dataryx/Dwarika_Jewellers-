import { getMongoDb, nextSeq } from './_mongo.js';
import { validateEmailAddress } from '../shared/emailValidation.mjs';
import { requireAdmin } from './_adminAuth.js';
import { handleApiRequest, apiError } from './_security.js';
import { rateLimitRequest } from './_rateLimit.js';

export default async function handler(req, res) {
  if (
    handleApiRequest(req, res, {
      methods: 'GET, POST, DELETE, OPTIONS',
      headers: 'Content-Type, Authorization',
    })
  ) {
    return;
  }

  try {
    const db = await getMongoDb();
    const col = db.collection('newsletter_subscribers');
    const adminsCol = db.collection('admin_users');

    if (req.method === 'GET') {
      const auth = await requireAdmin(req, adminsCol);
      if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

      const docs = await col.find({}).sort({ created_at: -1 }).toArray();
      return res.status(200).json(docs.map(({ _id, ...rest }) => ({ id: _id, ...rest })));
    }

    if (req.method === 'POST') {
      const emailRaw = String(req.body?.email || '').trim();
      const emailCheck = validateEmailAddress(emailRaw);
      if (!emailCheck.ok) {
        return res.status(400).json({ error: emailCheck.error });
      }

      const rl = await rateLimitRequest(db, req, 'newsletter', emailCheck.normalized, {
        max: 5,
        windowMs: 60 * 60 * 1000,
      });
      if (!rl.ok) {
        return res.status(429).json({ error: 'Too many requests. Try again later.' });
      }

      const existing = await col.findOne({ _id: emailCheck.normalized });
      if (existing) {
        return res.status(200).json({ ok: true, alreadySubscribed: true });
      }

      const id = await nextSeq('newsletter_subscriber');
      await col.insertOne({
        _id: emailCheck.normalized,
        seq_id: id,
        email: emailCheck.normalized,
        created_at: new Date(),
      });

      return res.status(201).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const auth = await requireAdmin(req, adminsCol);
      if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

      const emailCheck = validateEmailAddress(req.body?.email);
      if (!emailCheck.ok) return res.status(400).json({ error: emailCheck.error });
      await col.deleteOne({ _id: emailCheck.normalized });
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return apiError(res, err);
  }
}
