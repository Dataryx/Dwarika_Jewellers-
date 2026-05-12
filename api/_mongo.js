import { MongoClient } from 'mongodb';

let client;
let db;

function mongoOptionsFromEnv() {
  const user = process.env.MONGODB_USER?.trim();
  const pass = process.env.MONGODB_PASSWORD;
  if (user && pass != null && String(pass).length > 0) {
    return { auth: { username: user, password: String(pass) } };
  }
  return {};
}

/**
 * @returns {import('mongodb').Db}
 */
export async function getMongoDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set (add it to .env / Vercel env)');
  }
  if (!client) {
    client = new MongoClient(uri, mongoOptionsFromEnv());
    await client.connect();
  }
  const name = process.env.MONGODB_DB_NAME || 'lumiere';
  return client.db(name);
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
