/**
 * Creates all MongoDB collections used by the Jewellery API (idempotent).
 * Run: npm run mongo:init
 * Requires: MONGODB_URI in .env (Node 20+: --env-file=.env)
 */
import { createMongoClient } from './mongo-env.mjs';
import { printMongoAuthHint } from './mongo-auth-hint.mjs';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'lumiere';

const COLLECTIONS = ['products', 'orders', 'order_items', 'cart_items', 'counters', 'settings', 'banner_config', 'admin_users', 'customers', 'categories', 'site_content', 'team_members', 'contact_messages'];

const COUNTER_KEYS = ['product', 'order', 'order_item', 'cart_item', 'category', 'team_member', 'contact_message'];

if (!uri) {
  console.error('Missing MONGODB_URI. Set it in .env then run: npm run mongo:init');
  process.exit(1);
}

async function ensureCollection(db, name) {
  const found = await db.listCollections({ name }, { nameOnly: true }).toArray();
  if (found.length > 0) {
    console.log(`  skip (exists): ${name}`);
    return;
  }
  await db.createCollection(name);
  console.log(`  created: ${name}`);
}

const client = createMongoClient(uri);
try {
  await client.connect();
  const db = client.db(dbName);

  console.log(`Database: ${dbName}`);
  console.log('Collections:');

  for (const name of COLLECTIONS) {
    await ensureCollection(db, name);
  }

  const counters = db.collection('counters');
  console.log('Counter documents (upsert seq: 0 if missing):');
  for (const _id of COUNTER_KEYS) {
    await counters.updateOne({ _id }, { $setOnInsert: { seq: 0 } }, { upsert: true });
    console.log(`  ${_id}`);
  }

  console.log('\nDone. Optional: npm run seed:mongo  (sample products if products is empty)');
} catch (err) {
  if (printMongoAuthHint(err)) process.exit(1);
  throw err;
} finally {
  await client.close().catch(() => {});
}
