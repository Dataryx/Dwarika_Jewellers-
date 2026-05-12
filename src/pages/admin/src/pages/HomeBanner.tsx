import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, Upload, Type, Link2, Eye, Save, RotateCcw } from 'lucide-react';

export default function HomeBanner() {
  const [banner, setBanner] = useState({
    headline: 'Discover Premium Quality Products',
    subheadline: 'Curated collection for the modern lifestyle. Free shipping on orders over $50.',
    ctaText: 'Shop Now',
    ctaLink: '/shop',
    overlayOpacity: 40,
  });

  const [previewMode, setPreviewMode] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h3 className="text-xl font-semibold text-white">Homepage Hero</h3>
          <p className="text-sm text-slate-500 mt-1">Customize your homepage banner image, headlines, and shop button</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              previewMode
                ? 'bg-accent/10 text-accent border-accent/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </button>
        </div>
      </motion.div>

      {/* Banner Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative h-72 rounded-2xl overflow-hidden border border-slate-800"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700" />
        <div
          className="absolute inset-0 bg-slate-950"
          style={{ opacity: banner.overlayOpacity / 100 }}
        />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{banner.headline}</h1>
          <p className="text-slate-300 max-w-lg mb-6">{banner.subheadline}</p>
          <button className="px-6 py-3 bg-accent hover:bg-accent-hover text-slate-950 font-semibold rounded-xl transition-colors">
            {banner.ctaText}
          </button>
        </div>
      </motion.div>

      {/* Editor */}
      {!previewMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6"
        >
          {/* Image Upload */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-3">
              <Image className="w-4 h-4 text-accent" />
              Banner Background
            </label>
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-slate-600 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Drop an image here or click to browse</p>
              <p className="text-xs text-slate-600 mt-1">Recommended: 1920 x 600px, JPG or PNG</p>
            </div>
          </div>

          {/* Text Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                <Type className="w-4 h-4 text-accent" />
                Headline
              </label>
              <input
                type="text"
                value={banner.headline}
                onChange={(e) => setBanner({ ...banner, headline: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                <Type className="w-4 h-4 text-accent" />
                Subheadline
              </label>
              <input
                type="text"
                value={banner.subheadline}
                onChange={(e) => setBanner({ ...banner, subheadline: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                <Link2 className="w-4 h-4 text-accent" />
                CTA Button Text
              </label>
              <input
                type="text"
                value={banner.ctaText}
                onChange={(e) => setBanner({ ...banner, ctaText: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                <Link2 className="w-4 h-4 text-accent" />
                CTA Link
              </label>
              <input
                type="text"
                value={banner.ctaLink}
                onChange={(e) => setBanner({ ...banner, ctaLink: e.target.value })}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
              />
            </div>
          </div>

          {/* Overlay Opacity */}
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Overlay Opacity: {banner.overlayOpacity}%
            </label>
            <input
              type="range"
              min="0"
              max="80"
              value={banner.overlayOpacity}
              onChange={(e) => setBanner({ ...banner, overlayOpacity: Number(e.target.value) })}
              className="w-full accent-accent"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-slate-950 font-semibold rounded-xl transition-colors text-sm">
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors text-sm border border-slate-700">
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
