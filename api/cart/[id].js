// This file is deprecated - use /api/cart?id=X instead
export default async function handler(req, res) {
  res.status(410).json({ error: 'This endpoint is deprecated. Use /api/cart?id=X instead.' });
}
