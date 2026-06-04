import { getMongoDb } from '../_mongo.js';
import { requireAdmin } from '../_adminAuth.js';
import { handleApiRequest, apiError } from '../_security.js';
import { toPublicCustomer } from '../_customerAuth.js';

function toAdminCustomer(doc, stats = {}) {
  const pub = toPublicCustomer(doc) || {};
  return {
    ...pub,
    email: doc.email || doc._id,
    total_spent: stats.total_spent || doc.total_spent || 0,
    order_count: stats.order_count || doc.order_count || 0,
    last_login: doc.last_login instanceof Date ? doc.last_login.toISOString() : doc.last_login,
  };
}

export default async function handler(req, res) {
  if (
    handleApiRequest(req, res, {
      methods: 'GET, POST, PUT, OPTIONS',
      headers: 'Content-Type, Authorization',
    })
  ) {
    return;
  }

  try {
    const db = await getMongoDb();
    const col = db.collection('customers');
    const adminsCol = db.collection('admin_users');

    if (req.method === 'GET') {
      const auth = await requireAdmin(req, adminsCol);
      if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

      const docs = await col.find({}).sort({ created_at: -1 }).toArray();

      const ordersCol = db.collection('orders');
      const pipeline = [
        {
          $group: {
            _id: { $toLower: '$customer_email' },
            total_spent: { $sum: '$total' },
            order_count: { $sum: 1 },
          },
        },
      ];
      const orderStats = await ordersCol.aggregate(pipeline).toArray();
      const statsMap = Object.fromEntries(
        orderStats.map((s) => [s._id, { total_spent: s.total_spent, order_count: s.order_count }])
      );

      const enriched = docs.map((d) => {
        const email = (d.email || d._id || '').toLowerCase();
        return toAdminCustomer(d, statsMap[email] || {});
      });

      return res.status(200).json(enriched);
    }

    const auth = await requireAdmin(req, adminsCol);
    if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

    if (req.method === 'PUT') {
      const { email, name, phone } = req.body || {};
      const targetEmail = String(email || '').trim().toLowerCase();
      if (!targetEmail) return res.status(400).json({ error: 'email is required' });

      const existing = await col.findOne({ _id: targetEmail });
      if (!existing) return res.status(404).json({ error: 'Customer not found' });

      const updates = {};
      if (name !== undefined) updates.name = String(name).trim().slice(0, 200);
      if (phone !== undefined) updates.phone = String(phone).trim().slice(0, 32);

      await col.updateOne({ _id: targetEmail }, { $set: updates });
      const updated = await col.findOne({ _id: targetEmail });
      return res.status(200).json(toAdminCustomer(updated));
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return apiError(res, err);
  }
}
