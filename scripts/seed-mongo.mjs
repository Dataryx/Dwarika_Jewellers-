/**
 * Inserts sample products if the `products` collection is empty.
 * Run: npm run seed:mongo   (requires MONGODB_URI in .env; Node 20+ loads it via --env-file)
 */
import { createMongoClient } from './mongo-env.mjs';
import { printMongoAuthHint } from './mongo-auth-hint.mjs';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'lumiere';

if (!uri) {
  console.error('Missing MONGODB_URI. Set it in .env then run: npm run seed:mongo');
  process.exit(1);
}

const SEED = [
  {
    name: 'Aurora Ring',
    description: 'Hand-set pavé diamonds in 18k gold.',
    price: 2480,
    image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800',
    category: 'rings',
    material: '18k gold, diamond',
    stock: 12,
    featured: true,
  },
  {
    name: 'Celeste Necklace',
    description: 'Minimal chain with a single brilliant stone.',
    price: 1890,
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
    category: 'necklaces',
    material: 'White gold, sapphire',
    stock: 8,
    featured: true,
  },
  {
    name: 'Luna Earrings',
    description: 'Drop earrings with freshwater pearls.',
    price: 920,
    image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800',
    category: 'earrings',
    material: 'Sterling silver, pearl',
    stock: 20,
    featured: true,
  },
  {
    name: 'Solstice Bracelet',
    description: 'Slim cuff with engraved detail.',
    price: 1340,
    image_url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
    category: 'bracelets',
    material: 'Rose gold',
    stock: 15,
    featured: true,
  },
];

const client = createMongoClient(uri);
try {
  await client.connect();
  const db = client.db(dbName);
  const products = db.collection('products');
  const counters = db.collection('counters');

  const n = await products.countDocuments();
  if (n > 0) {
    console.log(`Products collection already has ${n} document(s); skipping seed.`);
  } else {
    let seq = 0;
    for (const p of SEED) {
      seq += 1;
      await products.insertOne({
        _id: seq,
        ...p,
        created_at: new Date(),
      });
    }

    await counters.updateOne(
      { _id: 'product' },
      { $set: { seq } },
      { upsert: true }
    );

    console.log(`Seeded ${SEED.length} products (ids 1–${seq}).`);
  }
} catch (err) {
  if (printMongoAuthHint(err)) process.exit(1);
  throw err;
} finally {
  await client.close().catch(() => {});
}
