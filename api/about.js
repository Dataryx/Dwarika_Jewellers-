import { getMongoDb, nextSeq, docToJson } from './_mongo.js';

const ABOUT_ID = 'about_page';

const DEFAULT_ABOUT = {
  heroImage: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1600',
  heroSubtitle: 'Since 1985',
  heroTitle: 'Our Story',
  storySubtitle: 'The Beginning',
  storyTitle: 'Crafting Dreams Since 1985',
  storyParagraphs: [
    'Dwarika Jewellers was born from a deep respect for family legacy, craftsmanship, and trust passed down from one generation to the next.',
    'With a strong foundation in fine jewellery and diamonds, the journey of Dwarika Jewellers has been shaped by passion, hard work, and an unwavering commitment to excellence.',
    'Today, the business is led by Laxmi Shrestha, a dedicated diamond expert with a sharp eye for quality, authenticity, and timeless design.',
  ],
  storyImage: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800',
  values: [
    { title: 'Excellence', desc: 'Uncompromising quality in every detail' },
    { title: 'Sustainability', desc: 'Ethically sourced materials' },
    { title: 'Craftsmanship', desc: 'Master artisan techniques' },
    { title: 'Heritage', desc: 'Timeless design philosophy' },
  ],
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getMongoDb();
    const content = db.collection('site_content');
    const teamCol = db.collection('team_members');

    if (req.method === 'GET') {
      const doc = await content.findOne({ _id: ABOUT_ID });
      const aboutData = doc ? { ...DEFAULT_ABOUT, ...doc, _id: undefined } : { ...DEFAULT_ABOUT };
      delete aboutData._id;

      const team = await teamCol.find({}).sort({ sort_order: 1, created_at: 1 }).toArray();

      return res.status(200).json({
        ...aboutData,
        team: team.map(docToJson),
      });
    }

    if (req.method === 'PUT') {
      const { section } = req.query;

      if (section === 'team-add') {
        const { name, role, image } = req.body || {};
        if (!name) return res.status(400).json({ error: 'Name is required' });
        const id = await nextSeq('team_member');
        const doc = { _id: id, name, role: role || '', image: image || '', sort_order: id, created_at: new Date() };
        await teamCol.insertOne(doc);
        return res.status(201).json(docToJson(doc));
      }

      if (section === 'team-update') {
        const memberId = Number(req.body?.id);
        if (!Number.isFinite(memberId)) return res.status(400).json({ error: 'Invalid member ID' });
        const { name, role, image } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (role !== undefined) updates.role = role;
        if (image !== undefined) updates.image = image;
        await teamCol.updateOne({ _id: memberId }, { $set: updates });
        const updated = await teamCol.findOne({ _id: memberId });
        return res.status(200).json(docToJson(updated));
      }

      if (section === 'team-delete') {
        const memberId = Number(req.body?.id);
        if (!Number.isFinite(memberId)) return res.status(400).json({ error: 'Invalid member ID' });
        await teamCol.deleteOne({ _id: memberId });
        return res.status(200).json({ ok: true });
      }

      // Default: save page content (hero, story, values)
      const body = req.body || {};
      delete body._id;
      delete body.team;
      await content.updateOne({ _id: ABOUT_ID }, { $set: body }, { upsert: true });
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('About API error:', err);
    res.status(500).json({ error: err.message });
  }
}
