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
    const col = db.collection('contact_messages');
    const adminsCol = db.collection('admin_users');

    if (req.method === 'GET') {
      const auth = await requireAdmin(req, adminsCol);
      if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

      const docs = await col.find({}).sort({ created_at: -1 }).toArray();
      return res.status(200).json(docs.map(({ _id, ...rest }) => ({ id: _id, ...rest })));
    }

    if (req.method === 'POST') {
      const rl = await rateLimitRequest(db, req, 'contact', 'submit', { max: 8, windowMs: 15 * 60 * 1000 });
      if (!rl.ok) {
        return res.status(429).json({ error: 'Too many messages. Please try again later.' });
      }

      const { name, email, phone, subject, message } = req.body || {};
      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email and message are required' });
      }
      const emailCheck = validateEmailAddress(email);
      if (!emailCheck.ok) {
        return res.status(400).json({ error: emailCheck.error });
      }
      const id = await nextSeq('contact_message');
      const doc = {
        _id: id,
        name: String(name).trim().slice(0, 120),
        email: emailCheck.normalized,
        phone: String(phone || '').trim().slice(0, 32),
        subject: String(subject || '').trim().slice(0, 200),
        message: String(message).trim().slice(0, 5000),
        read: false,
        created_at: new Date(),
      };
      await col.insertOne(doc);
      return res.status(201).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const auth = await requireAdmin(req, adminsCol);
      if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

      const msgId = Number(req.body?.id);
      if (!Number.isFinite(msgId)) return res.status(400).json({ error: 'Message ID required' });
      await col.deleteOne({ _id: msgId });
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return apiError(res, err);
  }
}
