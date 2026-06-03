import { getMongoDb } from './_mongo.js';
import {
  normalizeEmail,
  hashPassword,
  verifyPassword,
  createCustomerToken,
  verifyCustomerToken,
  getBearerToken,
  toPublicCustomer,
  isEmailVerified,
  createResetToken,
  resetExpiresAt,
  createVerifyToken,
  verifyExpiresAt,
} from './_customerAuth.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './_customerAuthEmail.js';
import { validatePasswordStrength } from '../shared/passwordPolicy.mjs';
import { validateEmailAddress } from '../shared/emailValidation.mjs';

function parseBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body.trim());
    } catch {
      body = {};
    }
  }
  return body && typeof body === 'object' ? body : {};
}

function resolveOrigin(body) {
  return String(body.origin || process.env.VITE_STOREFRONT_URL || '').replace(/\/$/, '');
}

async function getStoreName(db) {
  const settingsDoc = await db.collection('settings').findOne({ _id: 'store_settings' });
  return settingsDoc?.storeName || 'Dwarika';
}

async function findCustomer(col, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return col.findOne({ _id: normalized });
}

async function issueSession(col, doc) {
  if (!isEmailVerified(doc)) {
    const err = new Error('Please confirm your email before signing in.');
    err.code = 'EMAIL_NOT_VERIFIED';
    throw err;
  }
  await col.updateOne({ _id: doc._id }, { $set: { last_login: new Date() } });
  const token = createCustomerToken(doc.email);
  return { token, user: toPublicCustomer(doc) };
}

async function sendCustomerVerificationEmail(db, doc, origin) {
  const verifyToken = createVerifyToken();
  await db.collection('customers').updateOne(
    { _id: doc._id },
    {
      $set: {
        verify_token: verifyToken,
        verify_expires: verifyExpiresAt(),
        email_verified: false,
      },
    }
  );

  const storeName = await getStoreName(db);
  const base = origin || '';
  const verifyUrl = base
    ? `${base}/verify-email?token=${encodeURIComponent(verifyToken)}`
    : `/verify-email?token=${encodeURIComponent(verifyToken)}`;

  await sendVerificationEmail({
    to: doc.email,
    name: doc.name,
    verifyUrl,
    storeName,
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Customer-Token, X-User-Email'
  );
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getMongoDb();
    const col = db.collection('customers');

    if (req.method === 'GET') {
      const token = getBearerToken(req);
      const payload = verifyCustomerToken(token);
      if (!payload) return res.status(401).json({ error: 'Not authenticated' });
      const doc = await findCustomer(col, payload.sub);
      if (!doc) return res.status(401).json({ error: 'Account not found' });
      if (!isEmailVerified(doc)) {
        return res.status(403).json({
          error: 'Please confirm your email before continuing.',
          code: 'EMAIL_NOT_VERIFIED',
          email: doc.email,
        });
      }
      return res.status(200).json({ user: toPublicCustomer(doc) });
    }

    if (req.method === 'POST') {
      const body = parseBody(req);
      const action = body.action;
      const origin = resolveOrigin(body);

      if (action === 'register') {
        const emailCheck = validateEmailAddress(body.email);
        if (!emailCheck.ok) return res.status(400).json({ error: emailCheck.error });
        const email = emailCheck.normalized;
        const password = String(body.password || '');
        const name = String(body.name || body.fullName || '').trim();

        const passwordCheck = validatePasswordStrength(password);
        if (!passwordCheck.ok) {
          return res.status(400).json({ error: passwordCheck.error });
        }
        if (!name) return res.status(400).json({ error: 'Full name is required' });

        const existing = await findCustomer(col, email);
        if (existing?.password_hash && isEmailVerified(existing)) {
          return res.status(409).json({ error: 'This email is already registered. Please log in.' });
        }

        const doc = {
          _id: email,
          email,
          name,
          phone: existing?.phone || '',
          address: existing?.address || '',
          city: existing?.city || '',
          password_hash: hashPassword(password),
          auth_provider: 'email',
          email_verified: false,
          total_spent: existing?.total_spent || 0,
          order_count: existing?.order_count || 0,
          created_at: existing?.created_at || new Date(),
        };

        await col.updateOne({ _id: email }, { $set: doc }, { upsert: true });
        const saved = await findCustomer(col, email);

        try {
          await sendCustomerVerificationEmail(db, saved, origin);
        } catch (emailErr) {
          console.error('Verification email failed:', emailErr);
          return res.status(503).json({
            error:
              'Account created, but the confirmation email could not be sent. Configure SMTP in the admin panel, then use “Resend confirmation email” on the login page.',
          });
        }

        return res.status(201).json({
          ok: true,
          requiresVerification: true,
          message: `Account created! We sent a confirmation link to ${email}. Please verify your email before signing in.`,
        });
      }

      if (action === 'login') {
        const emailCheck = validateEmailAddress(body.email);
        if (!emailCheck.ok) return res.status(400).json({ error: emailCheck.error });
        const email = emailCheck.normalized;
        const password = String(body.password || '');
        if (!password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }

        const doc = await findCustomer(col, email);
        if (!doc?.password_hash || !verifyPassword(password, doc.password_hash)) {
          return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
        }

        if (!isEmailVerified(doc)) {
          return res.status(403).json({
            error: 'Please confirm your email before signing in. Check your inbox for the confirmation link.',
            code: 'EMAIL_NOT_VERIFIED',
            email,
          });
        }

        const session = await issueSession(col, doc);
        return res.status(200).json(session);
      }

      if (action === 'verify-email') {
        const token = String(body.token || '').trim();
        if (!token) return res.status(400).json({ error: 'Verification token is required' });

        const doc = await col.findOne({
          verify_token: token,
          verify_expires: { $gt: new Date() },
        });
        if (!doc) {
          return res.status(400).json({
            error: 'Invalid or expired confirmation link. Sign in and request a new confirmation email.',
          });
        }

        await col.updateOne(
          { _id: doc._id },
          {
            $set: { email_verified: true, last_login: new Date() },
            $unset: { verify_token: '', verify_expires: '' },
          }
        );

        const updated = await findCustomer(col, doc._id);
        const sessionToken = createCustomerToken(updated.email);
        return res.status(200).json({
          ok: true,
          token: sessionToken,
          user: toPublicCustomer(updated),
          message: 'Email confirmed! You are now signed in.',
        });
      }

      if (action === 'resend-verification') {
        const emailCheck = validateEmailAddress(body.email);
        if (!emailCheck.ok) return res.status(400).json({ error: emailCheck.error });
        const email = emailCheck.normalized;

        const doc = await findCustomer(col, email);
        if (doc?.password_hash && !isEmailVerified(doc)) {
          try {
            await sendCustomerVerificationEmail(db, doc, origin);
          } catch (emailErr) {
            console.error('Resend verification email failed:', emailErr);
            return res.status(503).json({
              error:
                'Could not send confirmation email. Configure SMTP in the admin panel, then try again.',
            });
          }
        }

        return res.status(200).json({
          ok: true,
          message: 'If an unverified account exists for that email, a new confirmation link has been sent.',
        });
      }

      if (action === 'forgot-password') {
        const emailCheck = validateEmailAddress(body.email);
        if (!emailCheck.ok) return res.status(400).json({ error: emailCheck.error });
        const email = emailCheck.normalized;

        const doc = await findCustomer(col, email);
        if (doc?.password_hash) {
          const resetToken = createResetToken();
          await col.updateOne(
            { _id: email },
            { $set: { reset_token: resetToken, reset_expires: resetExpiresAt() } }
          );

          const resetUrl = origin
            ? `${origin}/reset-password?token=${encodeURIComponent(resetToken)}`
            : `/reset-password?token=${encodeURIComponent(resetToken)}`;

          const storeName = await getStoreName(db);

          try {
            await sendPasswordResetEmail({
              to: email,
              name: doc.name,
              resetUrl,
              storeName,
            });
          } catch (emailErr) {
            console.error('Password reset email failed:', emailErr);
            return res.status(503).json({
              error:
                'Could not send reset email. Configure SMTP in the admin panel, then try again.',
            });
          }
        }

        return res.status(200).json({
          ok: true,
          message: 'If an account exists for that email, a reset link has been sent.',
        });
      }

      if (action === 'reset-password') {
        const token = String(body.token || '').trim();
        const password = String(body.password || '');
        if (!token) return res.status(400).json({ error: 'Reset token is required' });
        const resetPasswordCheck = validatePasswordStrength(password);
        if (!resetPasswordCheck.ok) {
          return res.status(400).json({ error: resetPasswordCheck.error });
        }

        const doc = await col.findOne({
          reset_token: token,
          reset_expires: { $gt: new Date() },
        });
        if (!doc) {
          return res.status(400).json({ error: 'Invalid or expired reset link. Request a new one.' });
        }

        await col.updateOne(
          { _id: doc._id },
          {
            $set: { password_hash: hashPassword(password), email_verified: true },
            $unset: { reset_token: '', reset_expires: '', verify_token: '', verify_expires: '' },
          }
        );

        return res.status(200).json({ ok: true, message: 'Password updated. You can sign in now.' });
      }

      return res.status(400).json({ error: 'Unsupported action' });
    }

    if (req.method === 'PUT') {
      const token = getBearerToken(req);
      const payload = verifyCustomerToken(token);
      if (!payload) return res.status(401).json({ error: 'Not authenticated' });

      const doc = await findCustomer(col, payload.sub);
      if (!doc) return res.status(401).json({ error: 'Account not found' });
      if (!isEmailVerified(doc)) {
        return res.status(403).json({
          error: 'Please confirm your email before updating your profile.',
          code: 'EMAIL_NOT_VERIFIED',
        });
      }

      const body = parseBody(req);
      const updates = {};
      if (body.name !== undefined) updates.name = String(body.name || '').trim();
      if (body.phone !== undefined) updates.phone = String(body.phone || '').trim();
      if (body.address !== undefined) updates.address = String(body.address || '').trim();
      if (body.city !== undefined) updates.city = String(body.city || '').trim();

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Nothing to update' });
      }

      await col.updateOne({ _id: doc._id }, { $set: updates });
      const updated = await findCustomer(col, doc._id);
      return res.status(200).json({ user: toPublicCustomer(updated) });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Customer auth API error:', err);
    if (err.code === 'EMAIL_NOT_VERIFIED') {
      return res.status(403).json({ error: err.message, code: err.code });
    }
    res.status(500).json({ error: err.message || 'Auth error' });
  }
}
