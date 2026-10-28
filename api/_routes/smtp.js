import {
  loadSmtpConfig,
  saveSmtpConfig,
  sanitizeSmtpConfig,
  sendMailMessage,
  formatSmtpError,
} from '../_smtp.js';
import { requireAdmin } from '../_adminAuth.js';
import { handleApiRequest, apiError } from '../_security.js';
import { validateEmailAddress } from '../../shared/emailValidation.mjs';
import { getMongoDb } from '../_mongo.js';

function buildSmtpTestEmailHtml(storeName, target) {
  const name = String(storeName || 'Dwarika').replace(/</g, '&lt;');
  const to = String(target || '').replace(/</g, '&lt;');
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
    <tr>
      <td style="padding:28px 32px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#7c3aed;font-weight:700;">SMTP configuration test</p>
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">Connection successful</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569;">
          This message was sent only to verify your ${name} SMTP settings.
          It is <strong>not</strong> an order confirmation.
        </p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#475569;">
          Test recipient: <strong>${to}</strong>
        </p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
          Real order confirmation emails always go to each customer's checkout email address — never to this test recipient.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (
    handleApiRequest(req, res, {
      methods: 'GET, PUT, POST, OPTIONS',
      headers: 'Content-Type, Authorization',
    })
  ) {
    return;
  }

  try {
    const db = await getMongoDb();
    const adminsCol = db.collection('admin_users');

    const auth = await requireAdmin(req, adminsCol);
    if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

    if (req.method === 'GET') {
      const smtp = await loadSmtpConfig();
      return res.status(200).json(sanitizeSmtpConfig(smtp));
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      const saved = await saveSmtpConfig(body);
      return res.status(200).json(sanitizeSmtpConfig(saved));
    }

    if (req.method === 'POST') {
      const { action, toEmail, config } = req.body || {};
      if (action !== 'test') {
        return res.status(400).json({ error: 'Unsupported action' });
      }

      const targetCheck = validateEmailAddress(toEmail);
      if (!targetCheck.ok) return res.status(400).json({ error: targetCheck.error });
      const target = targetCheck.normalized;

      const stored = await loadSmtpConfig();
      const smtpOverride =
        config && typeof config === 'object'
          ? {
              host: config.host,
              port: config.port,
              security: config.security,
              username: config.username,
              fromEmail: config.fromEmail,
              fromName: config.fromName,
              replyTo: config.replyTo,
              password: config.password || stored.password,
              enabled: true,
            }
          : { enabled: true };

      const smtp = { ...stored, ...smtpOverride };
      const storeName = smtp.fromName || 'Dwarika';

      await sendMailMessage({
        to: target,
        subject: `[SMTP Test] ${storeName} — configuration check only`,
        html: buildSmtpTestEmailHtml(storeName, target),
        text:
          `SMTP configuration test for ${storeName}.\n\n` +
          `This is NOT an order confirmation.\n` +
          `Test recipient: ${target}\n\n` +
          `Real order emails always go to each customer's checkout email.`,
        smtpOverride,
        allowDisabled: true,
      });

      return res.status(200).json({
        ok: true,
        message: 'Test email sent. Order confirmations will still go to each customer’s email.',
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('SMTP API error:', err);
    const { status, error } = formatSmtpError(err);
    res.status(status).json({ error });
  }
}
