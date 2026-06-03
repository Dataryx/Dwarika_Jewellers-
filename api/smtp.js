import {
  loadSmtpConfig,
  saveSmtpConfig,
  adminSmtpConfig,
  sendMailMessage,
  formatSmtpError,
} from './_smtp.js';
import { buildOrderReceiptEmailHtml } from './_orderReceiptEmail.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Email');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const smtp = await loadSmtpConfig();
      return res.status(200).json(adminSmtpConfig(smtp));
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      const saved = await saveSmtpConfig(body);
      return res.status(200).json(saved);
    }

    if (req.method === 'POST') {
      const { action, toEmail, config } = req.body || {};
      if (action !== 'test') {
        return res.status(400).json({ error: 'Unsupported action' });
      }

      const target = String(toEmail || '').trim();
      if (!target) return res.status(400).json({ error: 'Recipient email required' });

      const stored = await loadSmtpConfig();
      const smtpOverride =
        config && typeof config === 'object'
          ? {
              ...config,
              password: config.password || stored.password,
              enabled: true,
            }
          : { enabled: true };

      const smtp = { ...stored, ...smtpOverride };
      const storeName = smtp.fromName || 'Dwarika';
      const sampleOrder = {
        id: 1001,
        order_uid: 'DWR-SAMPLE-000001',
        customer_name: 'Sample Customer',
        customer_email: target,
        total: 125000,
        status: 'pending',
        payment_method: 'Cash on Delivery',
        created_at: new Date().toISOString(),
        shipping_address: {
          phone: '+977 9800000000',
          address: '123 Sample Street',
          city: 'Kathmandu',
          state: 'Bagmati',
          zip: '44600',
        },
        items: [
          {
            quantity: 1,
            price: 125000,
            product: { name: 'Gold Ring - Sample Item' },
          },
        ],
      };

      await sendMailMessage({
        to: target,
        subject: `[Test] ${storeName} SMTP configuration`,
        html: buildOrderReceiptEmailHtml(sampleOrder, storeName),
        text: 'This is a test receipt email from your Dwarika admin SMTP settings.',
        smtpOverride,
        allowDisabled: true,
      });

      return res.status(200).json({ ok: true, message: 'Test successful! Save your SMTP settings to apply them.' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('SMTP API error:', err);
    const { status, error } = formatSmtpError(err);
    res.status(status).json({ error });
  }
}
