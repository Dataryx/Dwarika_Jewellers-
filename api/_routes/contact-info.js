import { getMongoDb } from '../_mongo.js';
import { requireAdmin } from '../_adminAuth.js';
import { handleApiRequest, apiError, sanitizeMediaUrl } from '../_security.js';

const INFO_ID = 'contact_info';

const DEFAULT_INFO = {
  heroSubtitle: 'Get in Touch',
  heroTitle: 'Contact Us',
  heroDescription: "We'd love to hear from you. Whether you have a question about our collections, custom orders, or anything else - our team is ready to help.",
  storeHeading: 'Visit Our Store',
  storeDescription: 'Come experience our collections in person. Our team will be happy to guide you through our finest pieces.',
  address: 'Dwarika Jewellers\nKathmandu, Nepal',
  phone: '+977 01-XXXXXXX',
  email: 'info@dwarikajewellers.com',
  facebook: 'https://facebook.com/dwarikajewellers',
  instagram: 'https://instagram.com/dwarikajewellers',
  tiktok: 'https://tiktok.com/@dwarikajewellers',
  openingHours: 'Sun – Fri: 10:00 AM – 7:00 PM\nSaturday: Closed',
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d56516.31397712412!2d85.29111067431641!3d27.70895594!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb198a307baabf%3A0xb5137c1bf18db1ea!2sKathmandu%2044600!5e0!3m2!1sen!2snp!4v1700000000000!5m2!1sen!2snp',
};

const ALLOWED_KEYS = new Set(Object.keys(DEFAULT_INFO));

function pickContactInfo(body) {
  const out = {};
  for (const key of ALLOWED_KEYS) {
    if (key in body) out[key] = body[key];
  }
  for (const urlKey of ['facebook', 'instagram', 'tiktok', 'mapEmbedUrl']) {
    if (out[urlKey] !== undefined) {
      const url = sanitizeMediaUrl(out[urlKey]);
      if (out[urlKey] && url === null) return { error: `Invalid ${urlKey}` };
      out[urlKey] = url ?? '';
    }
  }
  return { data: out };
}

export default async function handler(req, res) {
  if (
    handleApiRequest(req, res, {
      methods: 'GET, PUT, OPTIONS',
      headers: 'Content-Type, Authorization',
    })
  ) {
    return;
  }

  try {
    const db = await getMongoDb();
    const col = db.collection('site_content');
    const adminsCol = db.collection('admin_users');

    if (req.method === 'GET') {
      const doc = await col.findOne({ _id: INFO_ID });
      if (!doc) return res.status(200).json({ ...DEFAULT_INFO });
      const { _id, ...rest } = doc;
      return res.status(200).json({ ...DEFAULT_INFO, ...rest });
    }

    if (req.method === 'PUT') {
      const auth = await requireAdmin(req, adminsCol);
      if (auth.error) return res.status(auth.error.status).json({ error: auth.error.message });

      const picked = pickContactInfo(req.body || {});
      if (picked.error) return res.status(400).json({ error: picked.error });
      if (Object.keys(picked.data).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }
      await col.updateOne({ _id: INFO_ID }, { $set: picked.data }, { upsert: true });
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return apiError(res, err);
  }
}
