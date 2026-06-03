function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildVerifyEmailHtml({ name, verifyUrl, storeName }) {
  const brand = escapeHtml(storeName || 'Dwarika');
  const greeting = escapeHtml(name || 'there');
  const link = escapeHtml(verifyUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your email</title>
</head>
<body style="margin:0;padding:0;background:#faf9f7;font-family:Georgia,'Times New Roman',serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#111827;padding:28px 32px;text-align:center;">
              <p style="margin:0;color:#c9a962;font-size:12px;letter-spacing:0.25em;text-transform:uppercase;">${brand}</p>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:24px;font-weight:500;">Confirm your email</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hello ${greeting},</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">
                Thanks for creating your ${brand} account. Please confirm your email address to sign in, checkout, and view your orders.
              </p>
              <p style="margin:0 0 28px;text-align:center;">
                <a href="${link}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;border-radius:6px;">Confirm email address</a>
              </p>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280;">This link expires in 24 hours.</p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;word-break:break-all;">If the button does not work, copy this link:<br />${link}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail({ to, name, verifyUrl, storeName }) {
  const { sendMailMessage } = await import('./_smtp.js');
  const subject = `Confirm your ${storeName || 'Dwarika'} account`;
  const html = buildVerifyEmailHtml({ name, verifyUrl, storeName });
  const text = `Confirm your email for ${storeName || 'Dwarika'}: ${verifyUrl}\n\nThis link expires in 24 hours.`;

  await sendMailMessage({ to, subject, html, text });
}

export function buildResetPasswordEmailHtml({ name, resetUrl, storeName }) {
  const brand = escapeHtml(storeName || 'Dwarika');
  const greeting = escapeHtml(name || 'there');
  const link = escapeHtml(resetUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#faf9f7;font-family:Georgia,'Times New Roman',serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#111827;padding:28px 32px;text-align:center;">
              <p style="margin:0;color:#c9a962;font-size:12px;letter-spacing:0.25em;text-transform:uppercase;">${brand}</p>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:24px;font-weight:500;">Reset your password</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hello ${greeting},</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">
                We received a request to reset the password for your ${brand} account. Click the button below to choose a new password.
              </p>
              <p style="margin:0 0 28px;text-align:center;">
                <a href="${link}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 28px;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;border-radius:6px;">Reset password</a>
              </p>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280;">This link expires in 1 hour.</p>
              <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#6b7280;">If you did not request a password reset, you can safely ignore this email.</p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;word-break:break-all;">If the button does not work, copy this link:<br />${link}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordResetEmail({ to, name, resetUrl, storeName }) {
  const { sendMailMessage } = await import('./_smtp.js');
  const subject = `Reset your ${storeName || 'Dwarika'} password`;
  const html = buildResetPasswordEmailHtml({ name, resetUrl, storeName });
  const text = `Reset your ${storeName || 'Dwarika'} password: ${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`;

  await sendMailMessage({ to, subject, html, text });
}
