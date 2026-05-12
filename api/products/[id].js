// This file is deprecated - use /api/products?id=X instead
export default async function handler(req, res) {
  res.status(410).json({ error: 'This endpoint is deprecated. Use /api/products?id=X instead.' });
}
