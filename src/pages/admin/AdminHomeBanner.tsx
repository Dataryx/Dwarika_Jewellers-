import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Type, Eye } from 'lucide-react';
import {
  fetchHomepageBanner,
  saveHomepageBannerToApi,
  type HomeBannerConfig,
} from '../../lib/homepageBanner';
import { showNotification } from '../../components/Notification';
import { ImageUploadField } from '../../components/admin/ImageUploadField';
import { AdminPage, bannerEditorGridClass, useAdminSidebarOpen } from '../../lib/adminPageLayout';

export default function AdminHomeBanner() {
  const sidebarOpen = useAdminSidebarOpen();
  const [form, setForm] = useState<HomeBannerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchHomepageBanner()
      .then((data) => {
        if (!cancelled) setForm(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof HomeBannerConfig>(key: K, value: HomeBannerConfig[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.imageUrl.trim()) {
      showNotification('Please upload a hero image.');
      return;
    }
    setSaving(true);
    try {
      await saveHomepageBannerToApi(form);
      showNotification('Homepage banner saved.');
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : 'Could not save banner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPage>
      <div>
        <h1 className="text-2xl font-semibold text-white">Homepage Banner</h1>
        <p className="text-gray-400 text-sm mt-1">
          Controls the full-screen hero on the storefront home page.
        </p>
      </div>

      {loading || !form ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center text-gray-500 text-sm">
          Loading banner…
        </div>
      ) : (
      <div className={bannerEditorGridClass(sidebarOpen)}>
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-5 bg-gray-800 rounded-xl border border-gray-700 p-6"
        >
          <ImageUploadField
            label="Hero image"
            value={form.imageUrl}
            onChange={(v) => update('imageUrl', v)}
            disabled={saving}
            variant="banner"
            allowUrl={false}
            hint="Upload a high-resolution image. It will cover the entire screen."
          />

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Type className="w-4 h-4 text-violet-500" />
              Kicker (small line above title)
            </label>
            <input
              type="text"
              value={form.kicker}
              onChange={(e) => update('kicker', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Title line 1</label>
              <input
                type="text"
                value={form.titleLine1}
                onChange={(e) => update('titleLine1', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Title highlight (gold)</label>
              <input
                type="text"
                value={form.titleHighlight}
                onChange={(e) => update('titleHighlight', e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Subtitle</label>
            <textarea
              value={form.subtitle}
              onChange={(e) => update('subtitle', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 resize-y"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 bg-violet-500 text-white font-medium rounded-lg hover:bg-violet-400 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Banner'}
            </button>
          </div>
        </motion.form>

        {/* Preview */}
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-wider uppercase text-gray-500 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </p>
          <div className="rounded-xl border border-gray-700 overflow-hidden shadow-xl">
            <div className="relative aspect-[16/10]">
              {form.imageUrl.trim() ? (
                <img
                  src={form.imageUrl.trim()}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gray-800" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex items-center p-6 sm:p-10">
                <div className="max-w-[220px] sm:max-w-xs">
                  <span className="text-[9px] sm:text-[10px] font-medium tracking-[0.2em] uppercase text-[#e8d5a3] block mb-2 line-clamp-1">
                    {form.kicker}
                  </span>
                  <h2 className="text-xl sm:text-3xl font-serif text-white leading-tight">
                    {form.titleLine1}
                    <br />
                    <span className="text-[#c9a962]">{form.titleHighlight}</span>
                  </h2>
                  <p className="mt-3 text-[10px] sm:text-xs text-white/75 leading-snug line-clamp-4">{form.subtitle}</p>
                  <span className="mt-4 inline-block px-3 py-2 bg-gray-900 text-white text-[9px] font-medium tracking-wider uppercase">
                    Shop Collection →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </AdminPage>
  );
}
