import { getMongoDb, nextSeq, docToJson } from '../_mongo.js';
import crypto from 'node:crypto';
import { validateEmailAddress } from '../../shared/emailValidation.mjs';
import { resolveProductPrice, computeCheckoutTotals } from '../../shared/pricing.mjs';
import { getBearerToken, verifyCustomerToken, normalizeEmail } from '../_customerAuth.js';
import { requireAdmin } from '../_adminAuth.js';
import { handleApiRequest, apiError, ORDER_STATUSES } from '../_security.js';

const SETTINGS_ID = 'store_settings';

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

async function loadStoreSettings(db) {
  const doc = await db.collection('settings').findOne({ _id: SETTINGS_ID });
  return doc || {};
}

async function buildOrdersResponse(db, orderRows) {
  const ordersCol = db.collection('orders');
  const orderItemsCol = db.collection('order_items');
  const productsCol = db.collection('products');

  for (const order of orderRows) {
    if (!order.order_uid) {
      order.order_uid = await ensureOrderUid(ordersCol, order);
    }
  }

  const orderIds = orderRows.map((o) => o._id);
  const orderItems =
    orderIds.length > 0
      ? await orderItemsCol.find({ order_id: { $in: orderIds } }).toArray()
      : [];
  const productIds = [...new Set(orderItems.map((i) => i.product_id))].filter((x) => Number.isFinite(x));
  const prodDocs =
    productIds.length > 0 ? await productsCol.find({ _id: { $in: productIds } }).toArray() : [];
  const productsMap = Object.fromEntries(prodDocs.map((p) => [p._id, docToJson(p)]));

  return orderRows.map((order) => ({
    ...docToJson(order),
    items: orderItems
      .filter((i) => i.order_id === order._id)
      .map((i) => ({
        ...docToJson(i),
        product: productsMap[i.product_id] || null,
      })),
  }));
}

export default async function handler(req, res) {
  if (
    handleApiRequest(req, res, {
      methods: 'GET, POST, PUT, DELETE, OPTIONS',
      headers: 'Content-Type, Authorization, X-User-Email, X-Session-Id',
    })
  ) {
    return;
  }

  try {
    const db = await getMongoDb();
    const ordersCol = db.collection('orders');
    const orderItemsCol = db.collection('order_items');
    const productsCol = db.collection('products');
    const cartCol = db.collection('cart_items');
    const adminsCol = db.collection('admin_users');
    const { id, email } = req.query;

    if (req.method === 'GET') {
      if (email) {
        const payload = verifyCustomerToken(getBearerToken(req));
        const requested = normalizeEmail(String(email).trim());
        if (!payload || payload.sub !== requested) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        const orderRows = await ordersCol
          .find({ customer_email: requested })
          .sort({ created_at: -1 })
          .toArray();
        return res.status(200).json(await buildOrdersResponse(db, orderRows));
      }

      const auth = await requireAdmin(req, adminsCol);
      if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

      const orderRows = await ordersCol.find({}).sort({ created_at: -1 }).toArray();
      return res.status(200).json(await buildOrdersResponse(db, orderRows));
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const { customer_name, items, payment_method, shipping_address } = body;
      const headerEmail = String(req.headers['x-user-email'] || '').trim();
      const normalizedBodyEmail = String(body.customer_email || '').trim();
      let orderEmail = headerEmail || normalizedBodyEmail;

      if (orderEmail) {
        const emailCheck = validateEmailAddress(orderEmail);
        if (!emailCheck.ok) {
          return res.status(400).json({ error: emailCheck.error });
        }
        orderEmail = emailCheck.normalized;
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order must include at least one item' });
      }

      const settings = await loadStoreSettings(db);
      const paymentMethods = settings.paymentMethods || {};
      const method = String(payment_method || 'Cash on Delivery');
      if (paymentMethods[method] === false) {
        return res.status(400).json({ error: 'Selected payment method is not available' });
      }

      const productIds = [...new Set(items.map((i) => Number(i.product_id)).filter(Number.isFinite))];
      const prodDocs = await productsCol.find({ _id: { $in: productIds } }).toArray();
      const prodMap = Object.fromEntries(prodDocs.map((p) => [p._id, p]));

      const validatedLines = [];
      for (const item of items) {
        const pid = Number(item.product_id);
        const qty = Math.max(1, Math.min(99, Number(item.quantity) || 1));
        const prod = prodMap[pid];
        if (!prod) {
          return res.status(400).json({ error: `Invalid product ${pid}` });
        }
        const stock = Number(prod.stock) || 0;
        if (stock > 0 && qty > stock) {
          return res.status(400).json({ error: `Insufficient stock for ${prod.name}` });
        }
        const unitPrice = resolveProductPrice(prod, settings);
        validatedLines.push({ product_id: pid, quantity: qty, unitPrice, product: prod });
      }

      const totals = computeCheckoutTotals(
        validatedLines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
        settings
      );

      const ship = shipping_address && typeof shipping_address === 'object' ? shipping_address : {};
      const normalizedShipping = {
        phone: String(ship.phone || body.phone || '').trim().slice(0, 32),
        address: String(ship.address || body.address || '').trim().slice(0, 500),
        city: String(ship.city || body.city || '').trim().slice(0, 120),
        state: String(ship.state || body.state || '').trim().slice(0, 120),
        zip: String(ship.zip || body.zip || '').trim().slice(0, 20),
      };

      const orderId = await nextSeq('order');
      const order_uid = await allocateOrderUid(ordersCol);
      const orderDoc = {
        _id: orderId,
        order_uid,
        customer_name: String(customer_name || '').trim().slice(0, 200),
        customer_email: orderEmail,
        subtotal: totals.subtotal,
        shipping_amount: totals.shipping_amount,
        tax_amount: totals.tax_amount,
        tax_rate: totals.tax_rate,
        total: totals.total,
        payment_method: method,
        shipping_address: normalizedShipping,
        status: 'pending',
        created_at: new Date(),
      };
      await ordersCol.insertOne(orderDoc);

      for (const line of validatedLines) {
        const lineId = await nextSeq('order_item');
        await orderItemsCol.insertOne({
          _id: lineId,
          order_id: orderId,
          product_id: line.product_id,
          quantity: line.quantity,
          price: line.unitPrice,
        });
        if (Number(line.product.stock) > 0) {
          await productsCol.updateOne(
            { _id: line.product_id, stock: { $gte: line.quantity } },
            { $inc: { stock: -line.quantity } }
          );
        }
      }

      const sessionId = String(req.headers['x-session-id'] || '').trim().slice(0, 128);
      if (sessionId) {
        await cartCol.deleteMany({ session_id: sessionId });
      }

      if (orderEmail) {
        const custCol = db.collection('customers');
        const customerSet = { name: orderDoc.customer_name || '' };
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

      const storeName = settings.storeName || 'Dwarika';
      const enrichedItems = validatedLines.map((line, idx) => ({
        id: idx + 1,
        product_id: line.product_id,
        quantity: line.quantity,
        price: line.unitPrice,
        product: { name: line.product.name, image_url: line.product.image_url },
      }));

      try {
        const { sendOrderReceiptEmail } = await import('../_orderReceiptEmail.js');
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
      const auth = await requireAdmin(req, adminsCol);
      if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

      const orderId = Number(id || req.body?.id);
      const { status } = req.body || {};
      if (!Number.isFinite(orderId)) return res.status(400).json({ error: 'Order ID required' });
      if (!status || !ORDER_STATUSES.has(String(status))) {
        return res.status(400).json({ error: 'Invalid order status' });
      }

      const existing = await ordersCol.findOne({ _id: orderId });
      if (!existing) return res.status(404).json({ error: 'Not found' });

      const locked = new Set(['delivered', 'cancelled']);
      if (locked.has(existing.status)) {
        return res.status(400).json({ error: 'Order status is final and cannot be changed' });
      }

      const r = await ordersCol.findOneAndUpdate(
        { _id: orderId },
        { $set: { status: String(status) } },
        { returnDocument: 'after' }
      );
      const doc = r.value ?? r;
      if (!doc) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(docToJson(doc));
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return apiError(res, err);
  }
}
