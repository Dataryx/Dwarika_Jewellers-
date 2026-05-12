import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Save, Trash2, GripVertical, X, Loader2 } from 'lucide-react';
import { ImageUploadField } from '../../components/admin/ImageUploadField';
import { showNotification } from '../../components/Notification';

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  sort_order: number;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', image_url: '' });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openNew = () => {
    setEditId(null);
    setForm({ name: '', image_url: '' });
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditId(cat.id);
    setForm({ name: cat.name, image_url: cat.image_url });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showNotification('Category name is required'); return; }
    setSaving(true);
    try {
      if (editId !== null) {
        await fetch(`/api/categories?id=${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, image_url: form.image_url, path: form.name }),
        });
        showNotification('Category updated');
      } else {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, image_url: form.image_url }),
        });
        showNotification('Category created');
      }
      setShowForm(false);
      await fetchCategories();
    } catch {
      showNotification('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    try {
      await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      showNotification('Category deleted');
      await fetchCategories();
    } catch {
      showNotification('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading categories…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Categories</h1>
          <p className="text-gray-400 text-sm mt-1">Manage product categories shown on the homepage</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-xl text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editId !== null ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Category Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Rings, Necklaces..."
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <ImageUploadField
              label="Category Image"
              value={form.image_url}
              onChange={(v) => setForm({ ...form, image_url: v })}
              disabled={saving}
              allowUrl={false}
              hint="Upload from computer. Will be shown on the homepage category grid."
            />

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : editId !== null ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 bg-gray-700 text-gray-300 rounded-xl text-sm hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/60 border border-gray-700 rounded-2xl">
          <p className="text-gray-500 text-sm">No categories yet. Click "Add Category" to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              layout
              className="bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden hover:border-gray-600 transition-colors group"
            >
              <div className="relative aspect-[4/3] bg-gray-900">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">No image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-serif text-white">{cat.name}</h3>
                  <p className="text-xs text-white/60 mt-0.5">/collections/{cat.slug}</p>
                </div>
              </div>
              <div className="p-3 flex justify-between items-center">
                <button
                  onClick={() => openEdit(cat)}
                  className="text-xs text-amber-500 hover:text-amber-400 font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
