import { getMongoDb } from './_mongo.js';

async function ensureDefaultAdmin(col) {
  const existing = await col.findOne({ email: 'admin@dwarika.com' });
  if (!existing) {
    await col.insertOne({
      email: 'admin@dwarika.com',
      password: 'dwarika@123',
      name: 'Admin',
      created_at: new Date(),
    });
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getMongoDb();
    const admins = db.collection('admin_users');
    await ensureDefaultAdmin(admins);

    if (req.method === 'POST') {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      const user = await admins.findOne({ email, password });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      return res.status(200).json({ ok: true, email: user.email, name: user.name });
    }

    if (req.method === 'GET') {
      const { email } = req.query;
      if (!email) return res.status(400).json({ error: 'Email query param required' });
      const user = await admins.findOne({ email });
      return res.status(200).json({ valid: !!user });
    }

    if (req.method === 'PUT') {
      const { email, currentPassword, newPassword } = req.body || {};
      if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'email, currentPassword, and newPassword required' });
      }
      const user = await admins.findOne({ email, password: currentPassword });
      if (!user) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      await admins.updateOne({ email }, { $set: { password: newPassword } });
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin auth API error:', err);
    res.status(500).json({ error: err.message });
  }
}
