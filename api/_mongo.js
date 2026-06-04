import { MongoClient } from 'mongodb';

const globalCache = globalThis.__dwarikaMongo ?? { client: null, promise: null };
globalThis.__dwarikaMongo = globalCache;

function mongoOptionsFromEnv() {
  const user = process.env.MONGODB_USER?.trim();
  const pass = process.env.MONGODB_PASSWORD;
  if (user && pass != null && String(pass).length > 0) {
    return { auth: { username: user, password: String(pass) } };
  }
  return {};
}

function dbName() {
  return (process.env.MONGODB_DB_NAME || 'lumiere').trim();
}

function wrapMongoError(err) {
  if (!(err instanceof Error)) return err;
  const msg = err.message || '';
  if (/authentication failed|bad auth|SCRAM/i.test(msg)) {
    return new Error(
      'MongoDB authentication failed. Check the username/password in MONGODB_URI (Atlas → Database Access).'
    );
  }
  if (/timed out|Server selection|ECONNREFUSED|ENOTFOUND|network/i.test(msg)) {
    return new Error(
      'Cannot reach MongoDB. In Atlas → Network Access, allow 0.0.0.0/0 (or Vercel IPs), then redeploy.'
    );
  }
  return err;
}

async function connectClient() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error('MONGODB_URI is not set (add it to .env / Vercel env)');
  }

  const client = new MongoClient(uri, {
    ...mongoOptionsFromEnv(),
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();
    await client.db(dbName()).command({ ping: 1 });
    return client;
  } catch (err) {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
    throw wrapMongoError(err);
  }
}

/**
 * @returns {import('mongodb').Db}
 */
export async function getMongoDb() {
  if (!globalCache.promise) {
    globalCache.promise = connectClient()
      .then((client) => {
        globalCache.client = client;
        return client;
      })
      .catch((err) => {
        globalCache.promise = null;
        globalCache.client = null;
        throw err;
      });
  }

  const client = await globalCache.promise;
  return client.db(dbName());
}

/** Monotonic integer ids (stored as document _id) for API compatibility with the React app */
export async function nextSeq(counterName) {
  const database = await getMongoDb();
  const col = database.collection('counters');
  const result = await col.findOneAndUpdate(
    { _id: counterName },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  const doc = result.value ?? result;
  if (!doc || typeof doc.seq !== 'number') {
    throw new Error(`Failed to allocate id for counter "${counterName}"`);
  }
  return doc.seq;
}

export function docToJson(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  const out = { id: _id, ...rest };
  if (out.created_at instanceof Date) {
    out.created_at = out.created_at.toISOString();
  }
  return out;
}
