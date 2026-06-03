import { getMongoDb } from './_mongo.js';

const MASTER_EMAIL = 'admin@dwarika.com';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isMasterUser(user) {
  if (!user) return false;
  return user.role === 'master' || normalizeEmail(user.email) === MASTER_EMAIL;
}

function toPublicAdmin(doc) {
  return {
    email: doc.email,
    name: doc.name || 'Admin',
    role: isMasterUser(doc) ? 'master' : 'admin',
    phone: doc.phone || '',
    address: doc.address || '',
    city: doc.city || '',
    job_title: doc.job_title || '',
    created_at: doc.created_at,
  };
}

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

async function findAdminByEmail(col, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  let doc = await col.findOne({ email: normalized });
  if (doc) return doc;

  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  doc = await col.findOne({ email: { $regex: `^${escaped}$`, $options: 'i' } });
  if (doc && normalizeEmail(doc.email) !== doc.email) {
    await col.updateOne({ _id: doc._id }, { $set: { email: normalized } });
    doc.email = normalized;
  }
  return doc;
}

async function ensureDefaultAdmin(col) {
  const email = MASTER_EMAIL;
  const existing = await findAdminByEmail(col, email);
  if (!existing) {
    await col.insertOne({
      email,
      password: 'dwarika@123',
      name: 'Master Admin',
      role: 'master',
      phone: '',
      address: '',
      city: '',
      job_title: '',
      created_at: new Date(),
      updated_at: new Date(),
    });
  } else if (!isMasterUser(existing)) {
    await col.updateOne({ _id: existing._id }, { $set: { role: 'master', name: existing.name || 'Master Admin', email } });
  }
  await col.updateMany(
    { email: { $ne: email }, role: { $exists: false } },
    { $set: { role: 'admin' } }
  );
}

function getCallerEmail(req) {
  const raw = req.headers['x-admin-email'] || req.headers['X-Admin-Email'];
  return normalizeEmail(Array.isArray(raw) ? raw[0] : raw);
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

/** POST create sends name + email + password; login sends only email + password. */
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

async function requireCaller(admins, req) {
  const callerEmail = getCallerEmail(req);
  if (!callerEmail) return { error: { status: 401, message: 'Admin session required' } };
  const caller = await findAdminByEmail(admins, callerEmail);
  if (!caller) return { error: { status: 401, message: 'Invalid admin session' } };
  return { caller };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Email');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getMongoDb();
    const admins = db.collection('admin_users');
    await ensureDefaultAdmin(admins);

    if (req.method === 'POST') {
      const body = parseRequestBody(req);

      if (isCreateAdminRequest(body)) {
        const auth = await requireCaller(admins, req);
        if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

        const { name, email, password, phone } = body;
        const newEmail = normalizeEmail(email);
        if (!name?.trim() || !newEmail || !password) {
          return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        if (!String(phone || '').trim()) {
          return res.status(400).json({ error: 'Phone number is required' });
        }
        if (password.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        if (newEmail === MASTER_EMAIL) {
          return res.status(400).json({ error: 'This email is reserved for the master admin' });
        }
        const exists = await findAdminByEmail(admins, newEmail);
        if (exists) return res.status(409).json({ error: 'An admin with this email already exists' });

        const doc = {
          email: newEmail,
          password,
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
      const normalizedLogin = normalizeEmail(email);
      const user = await findAdminByEmail(admins, normalizedLogin);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      return res.status(200).json({
        ok: true,
        email: normalizeEmail(user.email),
        name: user.name,
        role: isMasterUser(user) ? 'master' : 'admin',
      });
    }

    if (req.method === 'GET') {
      const { email, list, me } = req.query;

      if (me === 'true' || me === '1') {
        const auth = await requireCaller(admins, req);
        if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });
        return res.status(200).json(toPublicAdmin(auth.caller));
      }

      if (list === 'true' || list === '1') {
        const auth = await requireCaller(admins, req);
        if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

        const rows = await admins.find({}).sort({ created_at: -1 }).toArray();
        return res.status(200).json(rows.map(toPublicAdmin));
      }

      if (!email) return res.status(400).json({ error: 'Email query param required' });
      const user = await findAdminByEmail(admins, email);
      return res.status(200).json({ valid: !!user });
    }

    if (req.method === 'PUT') {
      const body = parseRequestBody(req);

      if (body.action === 'profile') {
        const auth = await requireCaller(admins, req);
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
        const auth = await requireCaller(admins, req);
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
        if (body.password) updates.password = body.password;
        applyProfileUpdates(updates, body);
        if (Object.keys(updates).length === 0) {
          return res.status(400).json({ error: 'Nothing to update' });
        }
        updates.updated_at = new Date();
        await admins.updateOne({ _id: target._id }, { $set: updates });
        const updated = await findAdminByEmail(admins, targetEmail);
        return res.status(200).json({ ok: true, user: toPublicAdmin(updated) });
      }

      const { email, currentPassword, newPassword } = body;
      if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'email, currentPassword, and newPassword required' });
      }
      const normalized = normalizeEmail(email);
      const user = await findAdminByEmail(admins, normalized);
      if (!user || user.password !== currentPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      await admins.updateOne({ _id: user._id }, { $set: { password: newPassword } });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const auth = await requireCaller(admins, req);
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
    console.error('Admin auth API error:', err);
    res.status(500).json({ error: err.message });
  }
}
