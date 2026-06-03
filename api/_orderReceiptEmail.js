import { sendMailMessage, loadSmtpConfig } from './_smtp.js';

function displayOrderId(order) {
  if (order.order_uid) return order.order_uid;
  return `DWR-${String(order.id ?? order._id ?? '').padStart(6, '0')}`;
}

function formatPaymentMethod(method) {
  if (!method) return 'Cash on Delivery';
  const map = {
    cod: 'Cash on Delivery',
    'Cash on Delivery': 'Cash on Delivery',
    eSewa: 'eSewa',
    Khalti: 'Khalti',
    'Bank Transfer': 'Bank Transfer',
    'Credit / Debit Card': 'Credit / Debit Card',
  };
  return map[method] || method;
}

function formatMoney(amount) {
  return `NPR ${Number(amount || 0).toLocaleString('en-IN')}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shippingHtml(shipping) {
  if (!shipping) return '<p style="margin:0;color:#6b7280;font-size:14px;">Not provided</p>';
  const lines = [];
  if (shipping.address) lines.push(escapeHtml(shipping.address));
  const cityLine = [shipping.city, shipping.state, shipping.zip].filter(Boolean).join(', ');
  if (cityLine) lines.push(escapeHtml(cityLine));
  if (shipping.phone) lines.push(`Phone: ${escapeHtml(shipping.phone)}`);
  if (!lines.length) return '<p style="margin:0;color:#6b7280;font-size:14px;">Not provided</p>';
  return lines.map((l) => `<p style="margin:0 0 4px;color:#374151;font-size:14px;line-height:1.5;">${l}</p>`).join('');
}

function buildItemsRows(items) {
  if (!items?.length) {
    return `<tr><td colspan="4" style="padding:16px;text-align:center;color:#6b7280;font-size:14px;">No items</td></tr>`;
  }
  return items
    .map((item) => {
      const name = escapeHtml(item.product?.name || 'Product');
      const qty = Number(item.quantity) || 0;
      const unit = Number(item.price) || 0;
      const line = unit * qty;
      return `
        <tr>
          <td style="padding:14px 12px;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px;">${name}</td>
          <td style="padding:14px 12px;border-bottom:1px solid #f3f4f6;text-align:center;color:#4b5563;font-size:14px;">${qty}</td>
          <td style="padding:14px 12px;border-bottom:1px solid #f3f4f6;text-align:right;color:#4b5563;font-size:14px;white-space:nowrap;">${formatMoney(unit)}</td>
          <td style="padding:14px 12px;border-bottom:1px solid #f3f4f6;text-align:right;color:#111827;font-size:14px;font-weight:600;white-space:nowrap;">${formatMoney(line)}</td>
        </tr>`;
    })
    .join('');
}

export function buildOrderReceiptEmailHtml(order, storeName = 'Dwarika') {
  const orderId = displayOrderId(order);
  const subtotal = (order.items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  const total = Number(order.total || 0);
  const statusLabel = escapeHtml(String(order.status || 'pending').replace(/^\w/, (c) => c.toUpperCase()));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Receipt ${escapeHtml(orderId)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f3ef;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e8e2d9;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(17,24,39,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1f2937 0%,#111827 100%);padding:28px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#c9a962;">${escapeHtml(storeName)}</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:400;letter-spacing:0.04em;">Order Confirmation</h1>
              <p style="margin:10px 0 0;color:#d1d5db;font-size:14px;">Thank you for your purchase</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.12em;">Order ID</p>
              <p style="margin:0;font-family:Consolas,Monaco,monospace;font-size:18px;color:#111827;font-weight:700;">${escapeHtml(orderId)}</p>
              <p style="margin:10px 0 0;font-size:14px;color:#6b7280;">${escapeHtml(formatDate(order.created_at))}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="padding-right:8px;vertical-align:top;">
                    <div style="background:#faf9f7;border:1px solid #ece7de;border-radius:10px;padding:16px;">
                      <p style="margin:0 0 8px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Status</p>
                      <p style="margin:0;font-size:14px;color:#111827;font-weight:600;">${statusLabel}</p>
                    </div>
                  </td>
                  <td width="50%" style="padding-left:8px;vertical-align:top;">
                    <div style="background:#faf9f7;border:1px solid #ece7de;border-radius:10px;padding:16px;">
                      <p style="margin:0 0 8px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Payment</p>
                      <p style="margin:0;font-size:14px;color:#111827;font-weight:600;">${escapeHtml(formatPaymentMethod(order.payment_method))}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="padding-right:8px;vertical-align:top;">
                    <p style="margin:0 0 10px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Bill To</p>
                    <p style="margin:0 0 4px;font-size:15px;color:#111827;font-weight:600;">${escapeHtml(order.customer_name)}</p>
                    <p style="margin:0;font-size:14px;color:#6b7280;word-break:break-all;">${escapeHtml(order.customer_email)}</p>
                  </td>
                  <td width="50%" style="padding-left:8px;vertical-align:top;">
                    <p style="margin:0 0 10px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Ship To</p>
                    ${shippingHtml(order.shipping_address)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0 0 12px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Order Items</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #ece7de;border-radius:10px;overflow:hidden;">
                <thead>
                  <tr style="background:#faf9f7;">
                    <th align="left" style="padding:12px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Item</th>
                    <th align="center" style="padding:12px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Qty</th>
                    <th align="right" style="padding:12px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Unit</th>
                    <th align="right" style="padding:12px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${buildItemsRows(order.items)}
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f7;border:1px solid #ece7de;border-radius:10px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size:14px;color:#6b7280;padding-bottom:8px;">Subtotal</td>
                        <td align="right" style="font-size:14px;color:#374151;padding-bottom:8px;">${formatMoney(subtotal)}</td>
                      </tr>
                      <tr>
                        <td style="font-size:16px;color:#111827;font-weight:700;padding-top:8px;border-top:1px solid #e5e7eb;">Order Total</td>
                        <td align="right" style="font-size:18px;color:#9a7b2f;font-weight:700;padding-top:8px;border-top:1px solid #e5e7eb;">${formatMoney(total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:14px;color:#374151;">We appreciate your trust in ${escapeHtml(storeName)}.</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">This email serves as your official order receipt. Please keep it for your records.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#111827;padding:18px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} ${escapeHtml(storeName)} · Handcrafted Jewellery</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildPlainText(order, storeName) {
  const orderId = displayOrderId(order);
  const lines = [
    `${storeName} — Order Confirmation`,
    `Order ID: ${orderId}`,
    `Date: ${formatDate(order.created_at)}`,
    `Status: ${order.status}`,
    `Payment: ${formatPaymentMethod(order.payment_method)}`,
    '',
    `Total: ${formatMoney(order.total)}`,
    '',
    'Thank you for your purchase.',
  ];
  return lines.join('\n');
}

export async function sendOrderReceiptEmail(order, options = {}) {
  const smtp = await loadSmtpConfig();
  if (!smtp.enabled) return { sent: false, reason: 'smtp_disabled' };

  const to = String(order.customer_email || '').trim().toLowerCase();
  if (!to) return { sent: false, reason: 'no_customer_email' };

  const storeName = options.storeName || smtp.fromName || 'Dwarika';
  const orderId = displayOrderId(order);
  const html = buildOrderReceiptEmailHtml(order, storeName);
  const text = buildPlainText(order, storeName);

  await sendMailMessage({
    to,
    subject: `Your ${storeName} receipt — ${orderId}`,
    html,
    text,
  });

  return { sent: true, to };
}
