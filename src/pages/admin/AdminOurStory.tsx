import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Eye, Loader2, Check } from 'lucide-react';
import { ImageUploadField } from '../../components/admin/ImageUploadField';
import { showNotification } from '../../components/Notification';
import { adminFetch } from '../../lib/adminApi';

interface StoryContent {
  imageUrl: string;
  title: string;
  paragraph1: string;
  paragraph2: string;
}

const DEFAULTS: StoryContent = {
  imageUrl: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800',
  title: 'Crafted with Passion, Worn with Pride',
  paragraph1:
    'Every piece in our collection is meticulously handcrafted by master artisans who have dedicated their lives to the art of jewelry making. We source only the finest materials—from ethically mined gemstones to recycled precious metals.',
  paragraph2:
    'Our commitment to quality means each piece is designed to last a lifetime and become a treasured heirloom passed down through generations.',
};

export default function AdminOurStory() {
  const [form, setForm] = useState<StoryContent>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetch('/api/our-story')
      .then((r) => r.json())
      .then((data) => setForm({ ...DEFAULTS, ...data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof StoryContent>(key: K, value: StoryContent[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminFetch('/api/our-story', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      showNotification('Our Story updated successfully');
    } catch {
      showNotification('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  const inputClass =
    'w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all';

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Our Story</h1>
        <p className="text-gray-400 text-sm mt-1">
          Edit the "Our Story" section shown on the homepage and About page.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 bg-gray-800 rounded-xl border border-gray-700 p-6"
        >
          <ImageUploadField
            label="Story Image"
            value={form.imageUrl}
            onChange={(v) => update('imageUrl', v)}
            disabled={saving}
            allowUrl={false}
            hint="Upload from computer. Shown next to the story text."
          />

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Paragraph 1</label>
            <textarea
              value={form.paragraph1}
              onChange={(e) => update('paragraph1', e.target.value)}
              rows={4}
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Paragraph 2</label>
            <textarea
              value={form.paragraph2}
              onChange={(e) => update('paragraph2', e.target.value)}
              rows={4}
              className={`${inputClass} resize-y`}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-3 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </motion.div>

        {/* Preview */}
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-wider uppercase text-gray-500 flex items-center gap-2">
            <Eye className="w-4 h-4" /> Preview
          </p>
          <div className="rounded-xl border border-gray-700 overflow-hidden bg-white p-6 space-y-4">
            <div className="aspect-[4/5] bg-[#faf9f7] overflow-hidden rounded-lg">
              <img
                src={form.imageUrl || DEFAULTS.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#c9a962]">Our Story</span>
              <h3 className="text-lg font-serif font-medium text-gray-900 mt-1 leading-tight">{form.title}</h3>
              <p className="mt-3 text-xs text-gray-500 leading-relaxed">{form.paragraph1}</p>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">{form.paragraph2}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
