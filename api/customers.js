import { getMongoDb, docToJson } from './_mongo.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getMongoDb();
    const col = db.collection('customers');

    if (req.method === 'GET') {
      const docs = await col.find({}).sort({ created_at: -1 }).toArray();

      const ordersCol = db.collection('orders');
      const pipeline = [
        { $group: {
          _id: { $toLower: '$customer_email' },
          total_spent: { $sum: '$total' },
          order_count: { $sum: 1 },
        }},
      ];
      const orderStats = await ordersCol.aggregate(pipeline).toArray();
      const statsMap = Object.fromEntries(
        orderStats.map((s) => [s._id, { total_spent: s.total_spent, order_count: s.order_count }])
      );

      const enriched = docs.map((d) => {
        const json = docToJson(d);
        const stats = statsMap[json.email] || {};
        json.total_spent = stats.total_spent || d.total_spent || 0;
        json.order_count = stats.order_count || d.order_count || 0;
        return json;
      });

      return res.status(200).json(enriched);
    }

    if (req.method === 'POST') {
      const { email, name, phone, auth_provider } = req.body || {};
      if (!email) return res.status(400).json({ error: 'email is required' });

      const normalizedEmail = email.trim().toLowerCase();
      const existing = await col.findOne({ _id: normalizedEmail });

      if (existing) {
        const updates = {};
        if (name && name !== existing.name) updates.name = name;
        if (phone && phone !== existing.phone) updates.phone = phone;
        updates.last_login = new Date();

        await col.updateOne({ _id: normalizedEmail }, { $set: updates });
        const updated = await col.findOne({ _id: normalizedEmail });
        return res.status(200).json(docToJson(updated));
      }

      const doc = {
        _id: normalizedEmail,
        email: normalizedEmail,
        name: name || '',
        phone: phone || '',
        auth_provider: auth_provider || 'email',
        total_spent: 0,
        order_count: 0,
        created_at: new Date(),
        last_login: new Date(),
      };
      await col.insertOne(doc);
      return res.status(201).json(docToJson(doc));
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Customers API error:', err);
    res.status(500).json({ error: err.message });
  }
}
