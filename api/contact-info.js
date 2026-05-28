import { getMongoDb } from './_mongo.js';

const INFO_ID = 'contact_info';

const DEFAULT_INFO = {
  heroSubtitle: 'Get in Touch',
  heroTitle: 'Contact Us',
  heroDescription: "We'd love to hear from you. Whether you have a question about our collections, custom orders, or anything else — our team is ready to help.",
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getMongoDb();
    const col = db.collection('site_content');

    if (req.method === 'GET') {
      const doc = await col.findOne({ _id: INFO_ID });
      if (!doc) return res.status(200).json({ ...DEFAULT_INFO });
      const { _id, ...rest } = doc;
      return res.status(200).json({ ...DEFAULT_INFO, ...rest });
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      delete body._id;
      await col.updateOne({ _id: INFO_ID }, { $set: body }, { upsert: true });
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Contact Info API error:', err);
    res.status(500).json({ error: err.message });
  }
}
