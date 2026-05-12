import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Filter, X, Save, Package, Eye } from 'lucide-react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { ImageUploadField } from '../../components/admin/ImageUploadField';
import { showNotification } from '../../components/Notification';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  material: string;
  stock: number;
  featured: boolean;
}

const stockStatus = (stock: number) => {
  if (stock === 0) return { label: 'Out of Stock', style: 'bg-red-500/10 text-red-400 border-red-500/20' };
  if (stock < 5) return { label: 'Low Stock', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  return { label: 'In Stock', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
};

export default function AdminProducts() {
  return <Outlet />;
}

export function AdminProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.material?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'active' && p.stock >= 5) ||
      (stockFilter === 'low' && p.stock > 0 && p.stock < 5) ||
      (stockFilter === 'out' && p.stock === 0);
    return matchesSearch && matchesCategory && matchesStock;
  });

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h3 className="text-xl font-semibold text-white">Products</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <button
          onClick={() => navigate('/admin/products/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-xl transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all capitalize"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500 shrink-0" />
          {(['all', 'active', 'low', 'out'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStockFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
                stockFilter === f
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-300'
              }`}
            >
              {f === 'out' ? 'Out of Stock' : f === 'low' ? 'Low Stock' : f === 'active' ? 'In Stock' : 'All'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Product</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Category</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Price</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Stock</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Package className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No products found</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, i) => {
                  const status = stockStatus(product.stock);
                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.04 }}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover bg-gray-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{product.name}</p>
                            <p className="text-xs text-gray-500 truncate">{product.material}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 capitalize">{product.category}</td>
                      <td className="px-6 py-4 text-sm font-medium text-white">रु {product.price.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{product.stock}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${status.style}`}>
                          {product.featured && <span className="text-amber-500 mr-1.5">★</span>}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

export function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiCategories, setApiCategories] = useState<{ slug: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: 'rings',
    material: '',
    stock: '10',
    featured: false,
  });

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setApiCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?id=${id}`);
      const data = await res.json();
      setFormData({
        name: data.name,
        description: data.description,
        price: data.price.toString(),
        image_url: data.image_url,
        category: data.category,
        material: data.material,
        stock: data.stock.toString(),
        featured: data.featured,
      });
    } catch (err) {
      console.error('Failed to fetch product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url.trim()) {
      showNotification('Please add a product image (upload or paste a URL).');
      return;
    }
    setSaving(true);
    try {
      const url = id ? `/api/products?id=${id}` : '/api/products';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
        }),
      });
      if (res.ok) navigate('/admin/products');
    } catch (err) {
      console.error('Failed to save product:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/products')}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-xl font-semibold text-white">{id ? 'Edit Product' : 'New Product'}</h2>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 space-y-6"
      >
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Product Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            required
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Price (रु)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Stock</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              required
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
            >
              {apiCategories.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Material</label>
            <input
              type="text"
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              placeholder="e.g., 18k Gold, Diamond"
              required
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />
          </div>
        </div>

        <ImageUploadField
          label="Product image"
          value={formData.image_url}
          onChange={(v) => setFormData({ ...formData, image_url: v })}
          disabled={saving}
          hint="Upload is resized for the catalog."
        />

        <label className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-xl cursor-pointer hover:bg-gray-800/50 transition-colors">
          <input
            type="checkbox"
            checked={formData.featured}
            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            className="w-4 h-4 accent-amber-500 rounded"
          />
          <div>
            <p className="text-sm text-white">Featured product</p>
            <p className="text-xs text-gray-500">Show this product on the homepage</p>
          </div>
        </label>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-xl transition-colors text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors text-sm border border-gray-700"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  );
}
