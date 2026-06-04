import { getMongoDb } from '../_mongo.js';
import { handleApiRequest } from '../_security.js';

export default async function handler(req, res) {
  if (handleApiRequest(req, res, { methods: 'GET, OPTIONS' })) return;

  const configured = Boolean(process.env.MONGODB_URI?.trim());
  if (!configured) {
    return res.status(503).json({
      ok: false,
      mongo: 'not_configured',
      hint: 'Add MONGODB_URI in Vercel → Settings → Environment Variables (Production), then redeploy.',
    });
  }

  try {
    const db = await getMongoDb();
    await db.command({ ping: 1 });
    return res.status(200).json({
      ok: true,
      mongo: 'connected',
      database: process.env.MONGODB_DB_NAME?.trim() || 'lumiere',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'MongoDB connection failed';
    return res.status(503).json({
      ok: false,
      mongo: 'error',
      error: message,
    });
  }
}
