import { getMongoDb } from '../_mongo.js';
import { validatePasswordStrength } from '../../shared/passwordPolicy.mjs';
import { normalizeEmail, validateEmailAddress } from '../../shared/emailValidation.mjs';
import { createResetToken, resetExpiresAt } from '../_customerAuth.js';
import { sendPasswordResetEmail } from '../_customerAuthEmail.js';
import { handleApiRequest, apiError, isProduction } from '../_security.js';
import { rateLimitRequest } from '../_rateLimit.js';
import {
  MASTER_EMAIL,
  createAdminToken,
  findAdminByEmail,
  isMasterUser,
  migrateAdminPasswordIfNeeded,
  passwordHashUpdate,
  requireAdmin,
  toPublicAdmin,
  verifyAdminPassword,
} from '../_adminAuth.js';

function profileFieldsFromBody(body) {
  return {
    phone: String(body.phone || '').trim(),
    address: String(body.address || '').trim(),
    city: String(body.city || '').trim(),
    job_title: String(body.job_title || '').trim(),
  };
}

function applyProfileUpdates(updates, body) {
  const profile = profileFieldsFromBody(body);
  if (body.phone !== undefined) updates.phone = profile.phone;
  if (body.address !== undefined) updates.address = profile.address;
  if (body.city !== undefined) updates.city = profile.city;
  if (body.job_title !== undefined) updates.job_title = profile.job_title;
  return updates;
}

async function ensureDefaultAdmin(col) {
  const existing = await findAdminByEmail(col, MASTER_EMAIL);
  if (existing) {
    if (!isMasterUser(existing)) {
      await col.updateOne(
        { _id: existing._id },
        { $set: { role: 'master', name: existing.name || 'Master Admin', email: MASTER_EMAIL } }
      );
    }
    await col.updateMany(
      { email: { $ne: MASTER_EMAIL }, role: { $exists: false } },
      { $set: { role: 'admin' } }
    );
    return;
  }

  const bootstrap = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
  if (!bootstrap) {
    if (isProduction()) {
      console.warn('No admin users found. Set ADMIN_BOOTSTRAP_PASSWORD to create the master admin.');
    }
    return;
  }

  const strength = validatePasswordStrength(bootstrap);
  if (!strength.ok) {
    console.warn('ADMIN_BOOTSTRAP_PASSWORD does not meet password policy:', strength.error);
    return;
  }

  await col.insertOne({
    email: MASTER_EMAIL,
    password_hash: passwordHashUpdate(bootstrap).password_hash,
    name: 'Master Admin',
    role: 'master',
    phone: '',
    address: '',
    city: '',
    job_title: '',
    created_at: new Date(),
    updated_at: new Date(),
  });
}

function parseRequestBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        body = JSON.parse(trimmed);
      } catch {
        body = {};
      }
    } else {
      body = {};
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  return body;
}

function isCreateAdminRequest(body) {
  const action = String(body.action || '').trim().toLowerCase();
  if (action === 'create') return true;
  return Boolean(
    body.name?.trim() &&
      body.email &&
      body.password &&
      !body.currentPassword &&
      action !== 'update'
  );
}

async function getStoreName(db) {
  const settingsDoc = await db.collection('settings').findOne({ _id: 'store_settings' });
  return settingsDoc?.storeName || 'Dwarika';
}

function resolveAdminOrigin(body) {
  return String(body.origin || process.env.VITE_ADMIN_URL || '').replace(/\/$/, '');
}

export default async function handler(req, res) {
  if (
    handleApiRequest(req, res, {
      methods: 'GET, POST, PUT, DELETE, OPTIONS',
      headers: 'Content-Type, Authorization',
    })
  ) {
    return;
  }

  try {
    const db = await getMongoDb();
    const admins = db.collection('admin_users');
    await ensureDefaultAdmin(admins);

    if (req.method === 'POST') {
      const body = parseRequestBody(req);

      if (body.action === 'forgot-password') {
        const emailCheck = validateEmailAddress(body.email);
        if (!emailCheck.ok) {
          return res.status(400).json({ error: emailCheck.error });
        }

        const rl = await rateLimitRequest(db, req, 'admin-forgot', emailCheck.normalized, {
          max: 5,
          windowMs: 15 * 60 * 1000,
        });
        if (!rl.ok) {
          return res.status(429).json({ error: 'Too many requests. Try again later.' });
        }

        const admin = await findAdminByEmail(admins, emailCheck.normalized);
        if (admin) {
          const resetToken = createResetToken();
          await admins.updateOne(
            { _id: admin._id },
            { $set: { reset_token: resetToken, reset_expires: resetExpiresAt() } }
          );

          const origin = resolveAdminOrigin(body);
          const resetUrl = origin
            ? `${origin}/reset-password?token=${encodeURIComponent(resetToken)}`
            : `/reset-password?token=${encodeURIComponent(resetToken)}`;
          const storeName = await getStoreName(db);

          try {
            await sendPasswordResetEmail({
              to: admin.email,
              name: admin.name,
              resetUrl,
              storeName: `${storeName} Admin`,
            });
          } catch (emailErr) {
            console.error('Admin password reset email failed:', emailErr);
          }
        }

        return res.status(200).json({
          ok: true,
          message: 'If an admin account exists for that email, a reset link has been sent.',
        });
      }

      if (body.action === 'reset-password') {
        const token = String(body.token || '').trim();
        const password = String(body.password || '');
        if (!token) return res.status(400).json({ error: 'Reset token is required' });

        const resetPasswordCheck = validatePasswordStrength(password);
        if (!resetPasswordCheck.ok) {
          return res.status(400).json({ error: resetPasswordCheck.error });
        }

        const admin = await admins.findOne({
          reset_token: token,
          reset_expires: { $gt: new Date() },
        });
        if (!admin) {
          return res.status(400).json({
            error: 'Invalid or expired reset link. Request a new one from the admin login page.',
          });
        }

        await admins.updateOne(
          { _id: admin._id },
          {
            $set: passwordHashUpdate(password),
            $unset: { reset_token: '', reset_expires: '', password: '' },
          }
        );

        return res.status(200).json({
          ok: true,
          message: 'Password updated. You can sign in to the admin panel now.',
        });
      }

      if (isCreateAdminRequest(body)) {
        const auth = await requireAdmin(req, admins);
        if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

        const { name, email, password, phone } = body;
        const emailCheck = validateEmailAddress(email);
        if (!emailCheck.ok) {
          return res.status(400).json({ error: emailCheck.error });
        }
        const newEmail = emailCheck.normalized;
        if (!name?.trim() || !password) {
          return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        if (!String(phone || '').trim()) {
          return res.status(400).json({ error: 'Phone number is required' });
        }
        const createPasswordCheck = validatePasswordStrength(password);
        if (!createPasswordCheck.ok) {
          return res.status(400).json({ error: createPasswordCheck.error });
        }
        if (newEmail === MASTER_EMAIL) {
          return res.status(400).json({ error: 'This email is reserved for the master admin' });
        }
        const exists = await findAdminByEmail(admins, newEmail);
        if (exists) return res.status(409).json({ error: 'An admin with this email already exists' });

        const doc = {
          email: newEmail,
          password_hash: passwordHashUpdate(password).password_hash,
          name: name.trim(),
          ...profileFieldsFromBody(body),
          role: 'admin',
          created_at: new Date(),
          created_by: auth.caller.email,
        };
        await admins.insertOne(doc);
        return res.status(201).json({ ok: true, user: toPublicAdmin(doc) });
      }

      const { email, password } = body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      const loginEmailCheck = validateEmailAddress(email);
      if (!loginEmailCheck.ok) {
        return res.status(400).json({ error: loginEmailCheck.error });
      }

      const rl = await rateLimitRequest(db, req, 'admin-login', loginEmailCheck.normalized, {
        max: 10,
        windowMs: 15 * 60 * 1000,
      });
      if (!rl.ok) {
        return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
      }

      const normalizedLogin = loginEmailCheck.normalized;
      const user = await findAdminByEmail(admins, normalizedLogin);
      if (!user || !verifyAdminPassword(password, user)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      await migrateAdminPasswordIfNeeded(admins, user, password);

      const token = createAdminToken(user.email);
      return res.status(200).json({
        ok: true,
        token,
        email: normalizeEmail(user.email),
        name: user.name,
        role: isMasterUser(user) ? 'master' : 'admin',
      });
    }

    if (req.method === 'GET') {
      const { list, me } = req.query;

      if (me === 'true' || me === '1') {
        const auth = await requireAdmin(req, admins);
        if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
        return res.status(200).json(toPublicAdmin(auth.caller));
      }

      if (list === 'true' || list === '1') {
        const auth = await requireAdmin(req, admins);
        if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

        const rows = await admins.find({}).sort({ created_at: -1 }).toArray();
        return res.status(200).json(rows.map(toPublicAdmin));
      }

      return res.status(400).json({ error: 'Unsupported query' });
    }

    if (req.method === 'PUT') {
      const body = parseRequestBody(req);

      if (body.action === 'profile') {
        const auth = await requireAdmin(req, admins);
        if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
        if (!body.name?.trim()) {
          return res.status(400).json({ error: 'Name is required' });
        }
        const selfUpdates = {
          name: body.name.trim(),
          ...profileFieldsFromBody(body),
          updated_at: new Date(),
        };
        await admins.updateOne({ _id: auth.caller._id }, { $set: selfUpdates });
        const updated = await findAdminByEmail(admins, auth.caller.email);
        return res.status(200).json({ ok: true, user: toPublicAdmin(updated) });
      }

      if (body.action === 'update') {
        const auth = await requireAdmin(req, admins);
        if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
        if (!isMasterUser(auth.caller)) {
          return res.status(403).json({ error: 'Only the master admin can edit admin users' });
        }

        const targetEmail = normalizeEmail(body.targetEmail);
        const target = await findAdminByEmail(admins, targetEmail);
        if (!target) return res.status(404).json({ error: 'Admin user not found' });
        if (isMasterUser(target)) {
          return res.status(403).json({ error: 'The master admin account cannot be edited here' });
        }

        const updates = {};
        if (body.name?.trim()) updates.name = body.name.trim();
        if (body.password) {
          const updatePasswordCheck = validatePasswordStrength(body.password);
          if (!updatePasswordCheck.ok) {
            return res.status(400).json({ error: updatePasswordCheck.error });
          }
          Object.assign(updates, passwordHashUpdate(body.password));
        }
        applyProfileUpdates(updates, body);
        if (Object.keys(updates).length === 0) {
          return res.status(400).json({ error: 'Nothing to update' });
        }
        updates.updated_at = new Date();
        await admins.updateOne(
          { _id: target._id },
          { $set: updates, $unset: body.password ? { password: '' } : {} }
        );
        const updated = await findAdminByEmail(admins, targetEmail);
        return res.status(200).json({ ok: true, user: toPublicAdmin(updated) });
      }

      const auth = await requireAdmin(req, admins);
      if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'currentPassword and newPassword required' });
      }
      const changePasswordCheck = validatePasswordStrength(newPassword);
      if (!changePasswordCheck.ok) {
        return res.status(400).json({ error: changePasswordCheck.error });
      }
      if (!verifyAdminPassword(currentPassword, auth.caller)) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      await admins.updateOne(
        { _id: auth.caller._id },
        {
          $set: passwordHashUpdate(newPassword),
          $unset: { password: '' },
        }
      );
      return res.status(200).json({ ok: true, token: createAdminToken(auth.caller.email) });
    }

    if (req.method === 'DELETE') {
      const auth = await requireAdmin(req, admins);
      if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
      if (!isMasterUser(auth.caller)) {
        return res.status(403).json({ error: 'Only the master admin can delete admin users' });
      }

      const targetEmail = normalizeEmail(req.query?.targetEmail || req.body?.targetEmail);
      if (!targetEmail) return res.status(400).json({ error: 'targetEmail is required' });

      const target = await findAdminByEmail(admins, targetEmail);
      if (!target) return res.status(404).json({ error: 'Admin user not found' });
      if (isMasterUser(target)) {
        return res.status(403).json({ error: 'The master admin cannot be deleted' });
      }
      if (targetEmail === normalizeEmail(auth.caller.email)) {
        return res.status(403).json({ error: 'You cannot delete your own account while logged in' });
      }

      await admins.deleteOne({ _id: target._id });
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return apiError(res, err);
  }
}
