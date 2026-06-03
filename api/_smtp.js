import nodemailer from 'nodemailer';
import { getMongoDb } from './_mongo.js';

const SETTINGS_ID = 'store_settings';

export const DEFAULT_SMTP = {
  enabled: false,
  host: 'smtp.gmail.com',
  port: 587,
  security: 'auto',
  username: '',
  password: '',
  fromEmail: '',
  fromName: 'Dwarika',
  replyTo: '',
};

/** Gmail app passwords are 16 chars; UI often shows them in groups of four. */
function normalizeSmtpCredentials(smtp) {
  if (!smtp || typeof smtp !== 'object') return smtp;
  const username = String(smtp.username || '').trim().toLowerCase();
  const fromEmail = String(smtp.fromEmail || username).trim().toLowerCase();
  const password = String(smtp.password || '').replace(/\s/g, '');
  return {
    ...smtp,
    username,
    fromEmail,
    password,
    replyTo: String(smtp.replyTo || fromEmail).trim().toLowerCase(),
    host: String(smtp.host || DEFAULT_SMTP.host).trim(),
  };
}

export function formatSmtpError(err) {
  const code = err?.code || '';
  const message = String(err?.message || 'SMTP error');

  if (code === 'EAUTH' || /535|BadCredentials|Username and Password not accepted/i.test(message)) {
    return {
      status: 401,
      error:
        'Gmail rejected the username or app password. Use a 16-character App Password (not your regular Gmail password). ' +
        'Create one at https://myaccount.google.com/apppasswords (2-Step Verification must be on), then Save and Test again.',
    };
  }

  if (/SMTP is disabled/i.test(message)) {
    return { status: 400, error: message };
  }

  if (/not fully configured/i.test(message)) {
    return { status: 400, error: message };
  }

  return { status: 500, error: message };
}

export function sanitizeSmtpConfig(smtp) {
  if (!smtp || typeof smtp !== 'object') {
    return { ...DEFAULT_SMTP, passwordSet: false };
  }
  const { password, ...rest } = smtp;
  return {
    ...DEFAULT_SMTP,
    ...rest,
    password: '',
    passwordSet: Boolean(String(password || '').length),
  };
}

/** Full config for admin UI (includes password so it stays visible/editable). */
export function adminSmtpConfig(smtp) {
  if (!smtp || typeof smtp !== 'object') {
    return { ...DEFAULT_SMTP, passwordSet: false };
  }
  const normalized = normalizeSmtpCredentials(smtp);
  return {
    ...DEFAULT_SMTP,
    ...normalized,
    passwordSet: Boolean(String(normalized.password || '').length),
  };
}

export async function loadSmtpConfig() {
  const db = await getMongoDb();
  const doc = await db.collection('settings').findOne({ _id: SETTINGS_ID });
  const stored = doc?.smtp && typeof doc.smtp === 'object' ? doc.smtp : {};

  const merged = {
    ...DEFAULT_SMTP,
    ...stored,
    host: stored.host || process.env.SMTP_HOST || DEFAULT_SMTP.host,
    port: Number(stored.port || process.env.SMTP_PORT || DEFAULT_SMTP.port),
    username: stored.username || process.env.SMTP_USER || '',
    password: stored.password || process.env.SMTP_PASS || '',
    fromEmail: stored.fromEmail || process.env.SMTP_FROM || stored.username || process.env.SMTP_USER || '',
    fromName: stored.fromName || process.env.SMTP_FROM_NAME || 'Dwarika',
    replyTo: stored.replyTo || stored.fromEmail || process.env.SMTP_FROM || '',
  };

  if (process.env.SMTP_ENABLED === 'true') merged.enabled = true;

  return normalizeSmtpCredentials(merged);
}

function resolveTransportOptions(smtp) {
  const port = Number(smtp.port) || 587;
  let secure = false;
  let requireTLS = false;

  if (smtp.security === 'ssl') {
    secure = true;
  } else if (smtp.security === 'tls') {
    secure = false;
    requireTLS = true;
  } else if (smtp.security === 'none') {
    secure = false;
  } else {
    secure = port === 465;
    requireTLS = port === 587;
  }

  return {
    host: smtp.host,
    port,
    secure,
    requireTLS,
    auth: {
      user: smtp.username,
      pass: smtp.password,
    },
  };
}

export async function createMailTransporter(smtpOverride) {
  const base = await loadSmtpConfig();
  const smtp = normalizeSmtpCredentials(
    smtpOverride ? { ...base, ...smtpOverride } : base
  );

  if (!smtpOverride && !smtp.enabled) return { smtp, transporter: null };
  if (!smtp.host || !smtp.username || !smtp.password) {
    throw new Error('SMTP is not fully configured');
  }
  const transporter = nodemailer.createTransport(resolveTransportOptions(smtp));
  return { smtp, transporter };
}

export async function sendMailMessage({ to, subject, html, text, smtpOverride, allowDisabled = false }) {
  const { smtp, transporter } = await createMailTransporter(smtpOverride);
  if ((!smtp.enabled && !allowDisabled) || !transporter) {
    throw new Error('SMTP is disabled');
  }

  const from = smtp.fromName
    ? `"${smtp.fromName.replace(/"/g, '')}" <${smtp.fromEmail || smtp.username}>`
    : smtp.fromEmail || smtp.username;

  return transporter.sendMail({
    from,
    to,
    replyTo: smtp.replyTo || smtp.fromEmail || smtp.username,
    subject,
    html,
    text,
  });
}

export async function saveSmtpConfig(partial) {
  const db = await getMongoDb();
  const col = db.collection('settings');
  const existing = await col.findOne({ _id: SETTINGS_ID });
  const current = existing?.smtp && typeof existing.smtp === 'object' ? existing.smtp : {};

  const next = normalizeSmtpCredentials({ ...DEFAULT_SMTP, ...current, ...partial });
  if (!partial.password && current.password) {
    next.password = normalizeSmtpCredentials({ password: current.password }).password;
  }

  await col.updateOne(
    { _id: SETTINGS_ID },
    { $set: { smtp: next } },
    { upsert: true }
  );

  return adminSmtpConfig(next);
}
