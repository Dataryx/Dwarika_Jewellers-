import { getMongoDb, nextSeq } from './_mongo.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getMongoDb();
    const col = db.collection('contact_messages');

    if (req.method === 'GET') {
      const docs = await col.find({}).sort({ created_at: -1 }).toArray();
      return res.status(200).json(docs.map(({ _id, ...rest }) => ({ id: _id, ...rest })));
    }

    if (req.method === 'POST') {
      const { name, email, phone, subject, message } = req.body || {};
      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email and message are required' });
      }
      const id = await nextSeq('contact_message');
      const doc = {
        _id: id,
        name: name.trim(),
        email: email.trim(),
        phone: (phone || '').trim(),
        subject: (subject || '').trim(),
        message: message.trim(),
        read: false,
        created_at: new Date(),
      };
      await col.insertOne(doc);
      return res.status(201).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const msgId = Number(req.body?.id);
      if (!Number.isFinite(msgId)) return res.status(400).json({ error: 'Message ID required' });
      await col.deleteOne({ _id: msgId });
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Contact API error:', err);
    res.status(500).json({ error: err.message });
  }
}
