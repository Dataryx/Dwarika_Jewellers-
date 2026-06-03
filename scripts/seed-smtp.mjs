/**
 * Saves SMTP settings to MongoDB (Admin → SMTP).
 * Run: node --env-file=.env ./scripts/seed-smtp.mjs
 */
import { createMongoClient } from './mongo-env.mjs';
import { printMongoAuthHint } from './mongo-auth-hint.mjs';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'lumiere';

if (!uri) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

const smtp = {
  enabled: process.env.SMTP_ENABLED !== 'false',
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  security: process.env.SMTP_SECURITY || 'auto',
  username: String(process.env.SMTP_USER || '').trim().toLowerCase(),
  password: String(process.env.SMTP_PASS || '').replace(/\s/g, ''),
  fromEmail: String(process.env.SMTP_FROM || process.env.SMTP_USER || '').trim().toLowerCase(),
  fromName: process.env.SMTP_FROM_NAME || 'Dwarika',
  replyTo: String(
    process.env.SMTP_REPLY_TO || process.env.SMTP_FROM || process.env.SMTP_USER || ''
  )
    .trim()
    .toLowerCase(),
};

async function main() {
  const client = createMongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    await db.collection('settings').updateOne(
      { _id: 'store_settings' },
      { $set: { smtp } },
      { upsert: true }
    );
    console.log('SMTP settings saved to MongoDB.');
    console.log(`  Host: ${smtp.host}:${smtp.port}`);
    console.log(`  User: ${smtp.username}`);
    console.log(`  From: ${smtp.fromEmail}`);
    console.log(`  Enabled: ${smtp.enabled}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  if (printMongoAuthHint(err)) process.exit(1);
  console.error(err);
  process.exit(1);
});
