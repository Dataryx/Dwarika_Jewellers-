import { getMongoDb } from '../_mongo.js';
import {
  normalizeEmail,
  hashPassword,
  verifyPassword,
  createCustomerToken,
  customerTokenVersion,
  verifyCustomerToken,
  getBearerToken,
  toPublicCustomer,
  isEmailVerified,
  createResetToken,
  resetExpiresAt,
  createVerifyToken,
  verifyExpiresAt,
} from '../_customerAuth.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../_customerAuthEmail.js';
import { validatePasswordStrength } from '../../shared/passwordPolicy.mjs';
import { validateEmailAddress } from '../../shared/emailValidation.mjs';
import { handleApiRequest, apiError } from '../_security.js';
import { rateLimitRequest } from '../_rateLimit.js';

const PENDING_COL = 'pending_signups';
const USER_EMAIL_FAIL =
  'We could not send the email right now. Please try again in a few minutes. If it keeps failing, contact the store for help.';

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
  const token = createCustomerToken(doc.email, customerTokenVersion(doc));
  return { token, user: toPublicCustomer(doc) };
}

function sessionMatches(doc, payload) {
  if (!doc || !payload) return false;
  return Number(payload.tv || 0) === customerTokenVersion(doc);
}

async function sendVerifyMail(db, { email, name, verifyToken }, origin) {
  const storeName = await getStoreName(db);
  const base = origin || '';
  const verifyUrl = base
    ? `${base}/verify-email?token=${encodeURIComponent(verifyToken)}`
    : `/verify-email?token=${encodeURIComponent(verifyToken)}`;

  await sendVerificationEmail({
    to: email,
    name,
    verifyUrl,
    storeName,
  });
}

/** Create/refresh a pending signup and email the verification link. Not a registered customer yet. */
async function upsertPendingSignup(db, { email, name, passwordHash }) {
  const pending = db.collection(PENDING_COL);
  const verifyToken = createVerifyToken();
  const verifyExpires = verifyExpiresAt();
  const now = new Date();

  await pending.updateOne(
    { _id: email },
    {
      $set: {
        email,
        name,
        password_hash: passwordHash,
        verify_token: verifyToken,
        verify_expires: verifyExpires,
        updated_at: now,
      },
      $setOnInsert: { created_at: now },
    },
    { upsert: true }
  );

  return { email, name, verifyToken, verifyExpires };
}

export default async function handler(req, res) {
  if (
    handleApiRequest(req, res, {
      methods: 'GET, POST, PUT, OPTIONS',
      headers: 'Content-Type, Authorization, X-Customer-Token, X-User-Email',
    })
  ) {
    return;
  }

  try {
    const db = await getMongoDb();
    const col = db.collection('customers');
    const pending = db.collection(PENDING_COL);

    if (req.method === 'GET') {
      const token = getBearerToken(req);
      const payload = verifyCustomerToken(token);
      if (!payload) return res.status(401).json({ error: 'Not authenticated' });
      const doc = await findCustomer(col, payload.sub);
      if (!doc || !sessionMatches(doc, payload)) {
        return res.status(401).json({ error: 'Account not found' });
      }
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

        const rl = await rateLimitRequest(db, req, 'customer-register', email, {
          max: 5,
          windowMs: 60 * 60 * 1000,
        });
        if (!rl.ok) {
          return res.status(429).json({ error: 'Too many registration attempts. Try again later.' });
        }

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

        // Legacy: unverified row already in customers — move to pending and remove incomplete customer
        if (existing?.password_hash && !isEmailVerified(existing)) {
          await col.deleteOne({ _id: email, email_verified: false });
        }

        const pendingDoc = await upsertPendingSignup(db, {
          email,
          name,
          passwordHash: hashPassword(password),
        });

        try {
          await sendVerifyMail(db, pendingDoc, origin);
        } catch (emailErr) {
          console.error('Verification email failed:', emailErr);
          await pending.deleteOne({ _id: email });
          return res.status(503).json({ error: USER_EMAIL_FAIL });
        }

        return res.status(201).json({
          ok: true,
          requiresVerification: true,
          message: `We sent a confirmation link to ${email}. Click it to complete registration and activate your account.`,
        });
      }

      if (action === 'login') {
        const emailCheck = validateEmailAddress(body.email);
        if (!emailCheck.ok) return res.status(400).json({ error: emailCheck.error });
        const email = emailCheck.normalized;

        const rl = await rateLimitRequest(db, req, 'customer-login', email, {
          max: 8,
          windowMs: 15 * 60 * 1000,
        });
        if (!rl.ok) {
          return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
        }

        const password = String(body.password || '');
        if (!password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }

        const doc = await findCustomer(col, email);
        if (doc?.password_hash && verifyPassword(password, doc.password_hash)) {
          if (!isEmailVerified(doc)) {
            return res.status(403).json({
              error:
                'Please confirm your email before signing in. Check your inbox for the confirmation link.',
              code: 'EMAIL_NOT_VERIFIED',
              email,
            });
          }
          const session = await issueSession(col, doc);
          return res.status(200).json(session);
        }

        // Pending signup (not registered yet) — allow resend flow
        const pend = await pending.findOne({ _id: email });
        if (pend?.password_hash && verifyPassword(password, pend.password_hash)) {
          return res.status(403).json({
            error:
              'Your account is not active yet. Please click the confirmation link we emailed you to complete registration.',
            code: 'EMAIL_NOT_VERIFIED',
            email,
          });
        }

        return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
      }

      if (action === 'verify-email') {
        const token = String(body.token || '').trim();
        if (!token) return res.status(400).json({ error: 'Verification token is required' });

        const pend = await pending.findOne({
          verify_token: token,
          verify_expires: { $gt: new Date() },
        });

        if (pend) {
          const now = new Date();
          const customerDoc = {
            _id: pend.email,
            email: pend.email,
            name: pend.name || '',
            phone: '',
            address: '',
            city: '',
            password_hash: pend.password_hash,
            auth_provider: 'email',
            email_verified: true,
            total_spent: 0,
            order_count: 0,
            created_at: pend.created_at || now,
            last_login: now,
            updated_at: now,
          };

          await col.updateOne(
            { _id: pend.email },
            { $set: customerDoc },
            { upsert: true }
          );
          await pending.deleteOne({ _id: pend._id });

          const updated = await findCustomer(col, pend.email);
          const sessionToken = createCustomerToken(updated.email, customerTokenVersion(updated));
          return res.status(200).json({
            ok: true,
            token: sessionToken,
            user: toPublicCustomer(updated),
            message: 'Email confirmed! Your account is now registered and you are signed in.',
          });
        }

        // Legacy: verify token still on customers collection
        const legacy = await col.findOne({
          verify_token: token,
          verify_expires: { $gt: new Date() },
        });
        if (!legacy) {
          return res.status(400).json({
            error: 'Invalid or expired confirmation link. Request a new confirmation email from the login page.',
          });
        }

        await col.updateOne(
          { _id: legacy._id },
          {
            $set: { email_verified: true, last_login: new Date() },
            $unset: { verify_token: '', verify_expires: '' },
          }
        );

        const updated = await findCustomer(col, legacy._id);
        const sessionToken = createCustomerToken(updated.email, customerTokenVersion(updated));
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

        const pend = await pending.findOne({ _id: email });
        if (pend?.password_hash) {
          const verifyToken = createVerifyToken();
          await pending.updateOne(
            { _id: email },
            {
              $set: {
                verify_token: verifyToken,
                verify_expires: verifyExpiresAt(),
                updated_at: new Date(),
              },
            }
          );
          try {
            await sendVerifyMail(db, { email, name: pend.name, verifyToken }, origin);
          } catch (emailErr) {
            console.error('Resend verification email failed:', emailErr);
            return res.status(503).json({ error: USER_EMAIL_FAIL });
          }
        } else {
          const doc = await findCustomer(col, email);
          if (doc?.password_hash && !isEmailVerified(doc)) {
            const verifyToken = createVerifyToken();
            await col.updateOne(
              { _id: doc._id },
              {
                $set: {
                  verify_token: verifyToken,
                  verify_expires: verifyExpiresAt(),
                  email_verified: false,
                },
              }
            );
            try {
              await sendVerifyMail(db, { email: doc.email, name: doc.name, verifyToken }, origin);
            } catch (emailErr) {
              console.error('Resend verification email failed:', emailErr);
              return res.status(503).json({ error: USER_EMAIL_FAIL });
            }
          }
        }

        return res.status(200).json({
          ok: true,
          message:
            'If a signup is waiting for confirmation for that email, a new link has been sent.',
        });
      }

      if (action === 'forgot-password') {
        const emailCheck = validateEmailAddress(body.email);
        if (!emailCheck.ok) return res.status(400).json({ error: emailCheck.error });
        const email = emailCheck.normalized;

        const rl = await rateLimitRequest(db, req, 'customer-forgot', email, {
          max: 5,
          windowMs: 15 * 60 * 1000,
        });
        if (!rl.ok) {
          return res.status(429).json({ error: 'Too many requests. Try again later.' });
        }

        const doc = await findCustomer(col, email);
        if (doc?.password_hash && isEmailVerified(doc)) {
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
            return res.status(503).json({ error: USER_EMAIL_FAIL });
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
            $inc: { token_version: 1 },
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
      if (!doc || !sessionMatches(doc, payload)) {
        return res.status(401).json({ error: 'Account not found' });
      }
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
    return apiError(res, err);
  }
}
