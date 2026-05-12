import { getMongoDb, nextSeq, docToJson } from './_mongo.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getMongoDb();
    const ordersCol = db.collection('orders');
    const orderItemsCol = db.collection('order_items');
    const productsCol = db.collection('products');
    const cartCol = db.collection('cart_items');
    const { id, email } = req.query;

    if (req.method === 'GET') {
      const filter = email ? { customer_email: email.trim().toLowerCase() } : {};
      const orderRows = await ordersCol.find(filter).sort({ created_at: -1 }).toArray();
      const orderItems = await orderItemsCol.find({}).toArray();
      const productIds = [...new Set(orderItems.map((i) => i.product_id))].filter((x) => Number.isFinite(x));
      const prodDocs =
        productIds.length > 0
          ? await productsCol.find({ _id: { $in: productIds } }).toArray()
          : [];
      const productsMap = Object.fromEntries(prodDocs.map((p) => [p._id, docToJson(p)]));

      const ordersWithItems = orderRows.map((order) => ({
        ...docToJson(order),
        items: orderItems
          .filter((i) => i.order_id === order._id)
          .map((i) => ({
            ...docToJson(i),
            product: productsMap[i.product_id] || null,
          })),
      }));

      return res.status(200).json(ordersWithItems);
    }

    if (req.method === 'POST') {
      const { customer_name, customer_email, items, total, payment_method } = req.body || {};

      const orderId = await nextSeq('order');
      const orderDoc = {
        _id: orderId,
        customer_name,
        customer_email,
        total: Number(total) || 0,
        payment_method: payment_method || 'cod',
        status: 'pending',
        created_at: new Date(),
      };
      await ordersCol.insertOne(orderDoc);

      for (const item of items || []) {
        const lineId = await nextSeq('order_item');
        await orderItemsCol.insertOne({
          _id: lineId,
          order_id: orderId,
          product_id: Number(item.product_id),
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
        });
      }

      await cartCol.deleteMany({});

      if (customer_email) {
        const custCol = db.collection('customers');
        await custCol.updateOne(
          { _id: customer_email.trim().toLowerCase() },
          {
            $inc: { total_spent: orderDoc.total, order_count: 1 },
            $set: { name: customer_name || '' },
            $setOnInsert: {
              email: customer_email.trim().toLowerCase(),
              phone: '',
              auth_provider: 'checkout',
              created_at: new Date(),
              last_login: new Date(),
            },
          },
          { upsert: true }
        );
      }

      return res.status(201).json(docToJson(orderDoc));
    }

    if (req.method === 'PUT') {
      const orderId = Number(id || req.body?.id);
      const { status } = req.body || {};
      if (!Number.isFinite(orderId)) return res.status(400).json({ error: 'Order ID required' });

      const r = await ordersCol.findOneAndUpdate(
        { _id: orderId },
        { $set: { status } },
        { returnDocument: 'after' }
      );
      const doc = r.value ?? r;
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(docToJson(doc));
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
