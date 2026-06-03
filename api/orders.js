import { getMongoDb, nextSeq, docToJson } from './_mongo.js';
import crypto from 'node:crypto';
import { validateEmailAddress } from '../shared/emailValidation.mjs';

function generateOrderUid() {
  const d = new Date();
  const date = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('');
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `DWR-${date}-${suffix}`;
}

async function allocateOrderUid(ordersCol) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const order_uid = generateOrderUid();
    const exists = await ordersCol.findOne({ order_uid }, { projection: { _id: 1 } });
    if (!exists) return order_uid;
  }
  throw new Error('Could not allocate a unique order id');
}

async function ensureOrderUid(ordersCol, order) {
  if (order.order_uid) return order.order_uid;
  const order_uid = await allocateOrderUid(ordersCol);
  await ordersCol.updateOne({ _id: order._id }, { $set: { order_uid } });
  return order_uid;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Email, X-Session-Id');
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
      for (const order of orderRows) {
        if (!order.order_uid) {
          order.order_uid = await ensureOrderUid(ordersCol, order);
        }
      }
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
      const { customer_name, customer_email, items, total, payment_method, shipping_address, subtotal, shipping_amount, tax_amount, tax_rate } = req.body || {};
      const headerEmail = String(req.headers['x-user-email'] || '').trim();
      const normalizedBodyEmail = String(customer_email || '').trim();
      let orderEmail = headerEmail || normalizedBodyEmail;

      if (orderEmail) {
        const emailCheck = validateEmailAddress(orderEmail);
        if (!emailCheck.ok) {
          return res.status(400).json({ error: emailCheck.error });
        }
        orderEmail = emailCheck.normalized;
      }

      const ship = shipping_address && typeof shipping_address === 'object' ? shipping_address : {};
      const normalizedShipping = {
        phone: String(ship.phone || req.body?.phone || '').trim(),
        address: String(ship.address || req.body?.address || '').trim(),
        city: String(ship.city || req.body?.city || '').trim(),
        state: String(ship.state || req.body?.state || '').trim(),
        zip: String(ship.zip || req.body?.zip || '').trim(),
      };

      const orderId = await nextSeq('order');
      const order_uid = await allocateOrderUid(ordersCol);
      const lineSubtotal = (items || []).reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
      );
      const orderDoc = {
        _id: orderId,
        order_uid,
        customer_name,
        customer_email: orderEmail,
        subtotal: Number(subtotal) || lineSubtotal,
        shipping_amount: Number(shipping_amount) || 0,
        tax_amount: Number(tax_amount) || 0,
        tax_rate: Number(tax_rate) || null,
        total: Number(total) || 0,
        payment_method: payment_method || 'Cash on Delivery',
        shipping_address: normalizedShipping,
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

      const sessionId = String(req.headers['x-session-id'] || '').trim();
      if (sessionId) {
        await cartCol.deleteMany({ session_id: sessionId });
      }

      if (orderEmail) {
        const custCol = db.collection('customers');
        const customerSet = { name: customer_name || '' };
        if (normalizedShipping.phone) customerSet.phone = normalizedShipping.phone;

        await custCol.updateOne(
          { _id: orderEmail },
          {
            $inc: { total_spent: orderDoc.total, order_count: 1 },
            $set: customerSet,
            $setOnInsert: {
              email: orderEmail,
              auth_provider: 'checkout',
              created_at: new Date(),
              last_login: new Date(),
            },
          },
          { upsert: true }
        );
      }

      const settingsDoc = await db.collection('settings').findOne({ _id: 'store_settings' });
      const storeName = settingsDoc?.storeName || 'Dwarika';
      const productIds = (items || []).map((i) => Number(i.product_id)).filter(Number.isFinite);
      const prodDocs =
        productIds.length > 0
          ? await productsCol.find({ _id: { $in: productIds } }).toArray()
          : [];
      const prodMap = Object.fromEntries(prodDocs.map((p) => [p._id, p]));
      const enrichedItems = (items || []).map((item, idx) => {
        const pid = Number(item.product_id);
        const prod = prodMap[pid];
        return {
          id: idx + 1,
          product_id: pid,
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
          product: prod ? { name: prod.name, image_url: prod.image_url } : null,
        };
      });

      try {
        const { sendOrderReceiptEmail } = await import('./_orderReceiptEmail.js');
        await sendOrderReceiptEmail(
          {
            ...docToJson(orderDoc),
            items: enrichedItems,
          },
          { storeName }
        );
      } catch (emailErr) {
        console.error('Order receipt email failed:', emailErr);
      }

      return res.status(201).json(docToJson(orderDoc));
    }

    if (req.method === 'PUT') {
      const orderId = Number(id || req.body?.id);
      const { status } = req.body || {};
      if (!Number.isFinite(orderId)) return res.status(400).json({ error: 'Order ID required' });

      const existing = await ordersCol.findOne({ _id: orderId });
      if (!existing) return res.status(404).json({ error: 'Not found' });

      const locked = new Set(['delivered', 'cancelled']);
      if (locked.has(existing.status)) {
        return res.status(400).json({ error: 'Order status is final and cannot be changed' });
      }

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
