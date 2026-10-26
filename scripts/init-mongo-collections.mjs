/**
 * Creates all MongoDB collections used by the Jewellery API (idempotent).
 * Run: npm run mongo:init
 * Requires: MONGODB_URI in .env (Node 20+: --env-file=.env)
 */
import { createMongoClient } from './mongo-env.mjs';
import { printMongoAuthHint } from './mongo-auth-hint.mjs';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'lumiere';

const COLLECTIONS = [
  'products',
  'orders',
  'order_items',
  'cart_items',
  'counters',
  'settings',
  'banner_config',
  'admin_users',
  'customers',
  'categories',
  'site_content',
  'team_members',
  'contact_messages',
  'newsletter_subscribers',
  'rate_limits',
  'audit_logs',
  'admin_token_denylist',
];

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

  const rateLimits = db.collection('rate_limits');
  await rateLimits.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });
  console.log('  rate_limits TTL index on expires_at');

  await db.collection('admin_users').createIndex({ email: 1 }, { unique: true });
  console.log('  admin_users unique email index');

  await db.collection('customers').createIndex({ email: 1 }, { unique: true, sparse: true });
  console.log('  customers unique email index');

  await db.collection('orders').createIndex({ customer_email: 1, created_at: -1 });
  await db.collection('orders').createIndex({ order_uid: 1 }, { unique: true, sparse: true });
  console.log('  orders customer_email + order_uid indexes');

  await db.collection('cart_items').createIndex({ session_id: 1 });
  console.log('  cart_items session_id index');

  await db.collection('products').createIndex(
    { product_id: 1 },
    { unique: true, sparse: true, name: 'products_product_id_unique' }
  );
  console.log('  products unique sparse product_id index');

  await db.collection('audit_logs').createIndex({ at: -1 });
  await db.collection('audit_logs').createIndex({ actor: 1, at: -1 });
  // Keep audit logs ~180 days
  await db.collection('audit_logs').createIndex(
    { at: 1 },
    { expireAfterSeconds: 180 * 24 * 60 * 60, name: 'audit_logs_ttl' }
  );
  console.log('  audit_logs indexes + 180-day TTL');

  await db.collection('admin_token_denylist').createIndex(
    { expires_at: 1 },
    { expireAfterSeconds: 0, name: 'admin_token_denylist_ttl' }
  );
  console.log('  admin_token_denylist TTL index on expires_at');

  console.log('\nDone. Optional: npm run seed:mongo  (sample products if products is empty)');
} catch (err) {
  if (printMongoAuthHint(err)) process.exit(1);
  throw err;
} finally {
  await client.close().catch(() => {});
}
