import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Filter, X, Save, Package, Eye, ExternalLink } from 'lucide-react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { ImageUploadField } from '../../components/admin/ImageUploadField';
import { showNotification } from '../../components/Notification';
import { useStoreSettings } from '../../lib/useStoreSettings';
import { resolveProductPrice } from '../../lib/pricing';
import { adminFetch } from '../../lib/adminApi';
import { storefrontUrl } from '../../lib/storefrontUrl';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  product_type?: string;
  gold_weight_14k?: number;
  diamond_weight_carat?: number;
  labour_charge?: number;
  gold_extra_charge?: number;
  diamond_extra_charge?: number;
  image_url: string;
  category: string;
  material: string;
  stock: number;
  featured: boolean;
}

const stockStatus = (stock: number) => {
  if (stock === 0) return { label: 'Out of Stock', style: 'bg-red-500/10 text-red-400 border-red-500/20' };
  if (stock < 5) return { label: 'Low Stock', style: 'bg-violet-500/10 text-violet-400 border-violet-500/20' };
  return { label: 'In Stock', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
};

const PAGE_SIZE = 10;

export default function AdminProducts() {
  return <Outlet />;
}

export function AdminProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const navigate = useNavigate();
  const settings = useStoreSettings();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, stockFilter]);

  useEffect(() => {
    if (!viewingProduct) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewingProduct(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewingProduct]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/products');
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
      await adminFetch(`/api/products?id=${id}`, { method: 'DELETE' });
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

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = filteredProducts.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filteredProducts.length);

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE) || 1)));
  }, [filteredProducts.length]);

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  const pageNumbers = (() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

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
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? 'Manage your product catalog'
              : `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'} · ${PAGE_SIZE} per page`}
          </p>
        </div>
        <button
          onClick={() => navigate('/products/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl transition-colors text-sm"
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
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all capitalize"
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
                  ? 'bg-violet-500/10 text-violet-500 border-violet-500/30'
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
                paginatedProducts.map((product, i) => {
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
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        रु {resolveProductPrice(product as any, settings).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{product.stock}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${status.style}`}>
                          {product.featured && <span className="text-violet-500 mr-1.5">★</span>}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingProduct(product)}
                            title="View"
                            aria-label={`View ${product.name}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-500/10 text-gray-400 hover:text-violet-400 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/products/edit/${product.id}`)}
                            title="Update"
                            aria-label={`Update ${product.name}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-500/10 text-gray-400 hover:text-amber-400 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            title="Delete"
                            aria-label={`Delete ${product.name}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
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
        {!loading && filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-t border-gray-700">
            <p className="text-sm text-gray-500">
              Showing {rangeStart}–{rangeEnd} of {filteredProducts.length}
              <span className="hidden sm:inline text-gray-600"> · {PAGE_SIZE} per page</span>
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`min-w-[2.25rem] px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    n === safePage
                      ? 'border-violet-500/50 bg-violet-500/10 text-violet-400'
                      : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* View modal */}
      <AnimatePresence>
        {viewingProduct && (() => {
          const status = stockStatus(viewingProduct.stock);
          const productType = viewingProduct.product_type || 'both';
          const showGold = productType === 'gold' || productType === 'both';
          const showDiamond = productType === 'diamond' || productType === 'both';
          const resolvedPrice = resolveProductPrice(viewingProduct as any, settings);

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
              onClick={() => setViewingProduct(null)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="view-product-heading"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-gray-900 border border-violet-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Eye className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 id="view-product-heading" className="text-base font-semibold text-white truncate">
                        Product details
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Read-only catalog information</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingProduct(null)}
                    className="p-2 text-gray-500 hover:text-white shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                  {viewingProduct.image_url && (
                    <div className="rounded-xl overflow-hidden border border-gray-700/80 bg-gray-800/50">
                      <img
                        src={viewingProduct.image_url}
                        alt={viewingProduct.name}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}

                  <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Name</p>
                    <p className="text-sm text-white font-medium">{viewingProduct.name}</p>
                    {viewingProduct.description && (
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">{viewingProduct.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Category</p>
                      <p className="text-sm text-gray-300 capitalize">{viewingProduct.category || '—'}</p>
                    </div>
                    <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Material</p>
                      <p className="text-sm text-gray-300">{viewingProduct.material || '—'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Price</p>
                      <p className="text-sm text-white font-medium">
                        रु {resolvedPrice.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Type</p>
                      <p className="text-sm text-gray-300 capitalize">{productType}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Stock</p>
                      <p className="text-sm text-gray-300">{viewingProduct.stock}</p>
                    </div>
                    <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${status.style}`}>
                        {viewingProduct.featured && <span className="text-violet-500 mr-1.5">★</span>}
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {(showGold || showDiamond) && (
                    <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4 space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500">Pricing breakdown</p>
                      {showGold && viewingProduct.gold_weight_14k != null && (
                        <p className="text-xs text-gray-400">
                          Gold (14K): <span className="text-gray-300">{viewingProduct.gold_weight_14k} g</span>
                        </p>
                      )}
                      {showDiamond && viewingProduct.diamond_weight_carat != null && (
                        <p className="text-xs text-gray-400">
                          Diamond: <span className="text-gray-300">{viewingProduct.diamond_weight_carat} ct</span>
                        </p>
                      )}
                      {viewingProduct.labour_charge != null && Number(viewingProduct.labour_charge) > 0 && (
                        <p className="text-xs text-gray-400">
                          Labour: <span className="text-gray-300">रु {Number(viewingProduct.labour_charge).toLocaleString('en-IN')}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-5 pt-5 border-t border-gray-700/80">
                  <a
                    href={storefrontUrl(`/product/${viewingProduct.id}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on store
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const id = viewingProduct.id;
                      setViewingProduct(null);
                      navigate(`/products/edit/${id}`);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/90 text-gray-900 text-sm font-semibold hover:bg-amber-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit product
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

export function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const settings = useStoreSettings();
  const [loadedProduct, setLoadedProduct] = useState<Partial<Product> | null>(null);
  const [allowTypeChange, setAllowTypeChange] = useState(false);
  const [originalType, setOriginalType] = useState<string>('both');
  const [apiCategories, setApiCategories] = useState<{ slug: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    product_type: 'both',
    gold_weight_14k: '',
    diamond_weight_carat: '',
    labour_charge: '',
    gold_extra_charge: '',
    diamond_extra_charge: '',
    image_url: '',
    category: 'rings',
    material: '',
    stock: '10',
    featured: false,
  });
  const autoPricedTypes = new Set(['gold', 'diamond', 'both']);
  const isAutoPricedType = autoPricedTypes.has(formData.product_type);
  const showGoldFields = formData.product_type === 'gold' || formData.product_type === 'both';
  const showDiamondFields = formData.product_type === 'diamond' || formData.product_type === 'both';

  useEffect(() => {
    adminFetch('/api/categories').then(r => r.json()).then(setApiCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/products?id=${id}`);
      const data = await res.json();
      setLoadedProduct(data);
      setOriginalType(data.product_type ?? 'both');
      setAllowTypeChange(false);
      const textOrEmpty = (v: unknown) => (v === undefined || v === null ? '' : String(v));
      setFormData({
        name: data.name,
        description: data.description,
        price: textOrEmpty(data.price),
        product_type: data.product_type ?? 'both',
        gold_weight_14k: textOrEmpty(data.gold_weight_14k),
        diamond_weight_carat: textOrEmpty(data.diamond_weight_carat),
        labour_charge: textOrEmpty(data.labour_charge),
        gold_extra_charge: textOrEmpty(data.gold_extra_charge),
        diamond_extra_charge: textOrEmpty(data.diamond_extra_charge),
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

  useEffect(() => {
    const gramsPerTola = settings?.gramsPerTola ?? 11.664;
    const goldRatePerGram = settings?.goldRatePerGram ?? 16358;
    const diamondRatePerCarat = settings?.diamondRatePerCarat ?? 28000;
    const makingChargeRate = settings?.goldMakingChargeRate ?? 0.4;

    const goldWeight = Number(formData.gold_weight_14k || 0);
    const diamondWeight = Number(formData.diamond_weight_carat || 0);
    const labourCharge = Number(formData.labour_charge || 0);
    const goldExtraCharge = Number(formData.gold_extra_charge || 0);
    const diamondExtraCharge = Number(formData.diamond_extra_charge || 0);

    const goldRatePerTola = goldRatePerGram * gramsPerTola;
    const goldPerGram14k = (goldRatePerTola * 14) / 24 / gramsPerTola;
    const goldBase = goldWeight * goldPerGram14k;
    const goldMaking = goldBase * makingChargeRate;
    const goldSelling = goldBase + goldMaking + labourCharge + goldExtraCharge;
    const diamondSelling = diamondWeight * diamondRatePerCarat + diamondExtraCharge;
    const computed =
      formData.product_type === 'gold'
        ? Math.round(goldSelling)
        : formData.product_type === 'diamond'
          ? Math.round(diamondSelling + labourCharge)
          : Math.round(goldSelling + diamondSelling);

    if (isAutoPricedType) {
      setFormData((prev) => ({
        ...prev,
        price: String(computed),
      }));
    }
  }, [
    formData.gold_weight_14k,
    formData.diamond_weight_carat,
    settings?.goldRatePerGram,
    settings?.diamondRatePerCarat,
    settings?.goldMakingChargeRate,
    settings?.gramsPerTola,
    formData.product_type,
    isAutoPricedType,
    formData.labour_charge,
    formData.gold_extra_charge,
    formData.diamond_extra_charge,
  ]);

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
      const numOrZero = (value: string) => (value.trim() === '' ? 0 : Number(value));
      const choose = (typed: string, fallback: unknown) =>
        typed.trim() === '' ? (fallback as number | undefined) : Number(typed);

      const payload = {
        ...formData,
        price: Number(formData.price),
        gold_weight_14k: id
          ? choose(formData.gold_weight_14k, loadedProduct?.gold_weight_14k)
          : numOrZero(formData.gold_weight_14k),
        diamond_weight_carat: id
          ? choose(formData.diamond_weight_carat, loadedProduct?.diamond_weight_carat)
          : numOrZero(formData.diamond_weight_carat),
        labour_charge: id
          ? choose(formData.labour_charge, loadedProduct?.labour_charge)
          : numOrZero(formData.labour_charge),
        gold_extra_charge: id
          ? choose(formData.gold_extra_charge, loadedProduct?.gold_extra_charge)
          : numOrZero(formData.gold_extra_charge),
        diamond_extra_charge: id
          ? choose(formData.diamond_extra_charge, loadedProduct?.diamond_extra_charge)
          : numOrZero(formData.diamond_extra_charge),
        stock: Number(formData.stock),
      };

      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save product');

      const saved = await res.json();
      const savedId = saved?.id ?? Number(id);
      if (!savedId) throw new Error('Saved product ID missing');

      // Round-trip verification to ensure DB persistence.
      const verifyRes = await adminFetch(`/api/products?id=${savedId}`);
      const verified = await verifyRes.json();
      const verifiedOk =
        String(verified?.name ?? '') === String(payload.name ?? '') &&
        String(verified?.product_type ?? '') === String(payload.product_type ?? '') &&
        Number(verified?.price ?? 0) === Number(payload.price ?? 0) &&
        Number(verified?.gold_weight_14k ?? 0) === Number(payload.gold_weight_14k ?? 0) &&
        Number(verified?.diamond_weight_carat ?? 0) === Number(payload.diamond_weight_carat ?? 0) &&
        Number(verified?.labour_charge ?? 0) === Number(payload.labour_charge ?? 0) &&
        Number(verified?.gold_extra_charge ?? 0) === Number(payload.gold_extra_charge ?? 0) &&
        Number(verified?.diamond_extra_charge ?? 0) === Number(payload.diamond_extra_charge ?? 0);

      if (!verifiedOk) {
        showNotification('Save verification failed. Please try again.');
        setSaving(false);
        return;
      }

      showNotification('Saved to database successfully.');
      navigate('/products');
    } catch (err) {
      console.error('Failed to save product:', err);
      showNotification('Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/products')}
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
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            required
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Product Type</label>
            {id && (
              <p className="text-xs text-gray-500 mb-2">
                Current type: <span className="text-gray-300 capitalize">{formData.product_type === 'both' ? 'Gold + Diamond' : formData.product_type}</span>
              </p>
            )}
            <select
              value={formData.product_type}
              onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
              disabled={Boolean(id) && !allowTypeChange}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            >
              <option value="gold">Gold</option>
              <option value="diamond">Diamond</option>
              <option value="both">Gold + Diamond</option>
              <option value="silver">Silver</option>
              <option value="platinum">Platinum</option>
              <option value="pearl">Pearl</option>
              <option value="gemstone">Gemstone</option>
              <option value="custom">Other / Custom</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {!id ? 'Gold/Diamond/Both are auto-priced. Other types use manual price.' : ''}
            </p>
            {id && !allowTypeChange && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Changing product type can affect pricing fields. Continue?')) {
                    setAllowTypeChange(true);
                  }
                }}
                className="mt-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-500/10 text-violet-500 border border-violet-500/30 hover:bg-violet-500/20 transition-colors"
              >
                Enable Type Change
              </button>
            )}
            {id && allowTypeChange && formData.product_type !== originalType && (
              <p className="text-xs text-violet-400 mt-2">
                Type changed from <span className="capitalize">{originalType === 'both' ? 'Gold + Diamond' : originalType}</span> to{' '}
                <span className="capitalize">{formData.product_type === 'both' ? 'Gold + Diamond' : formData.product_type}</span>.
                Save to apply.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Price (रु)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => !isAutoPricedType && setFormData({ ...formData, price: e.target.value })}
              readOnly={isAutoPricedType}
              required
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              {isAutoPricedType ? '' : 'Manual price entry for selected product type'}
            </p>
          </div>
        </div>

        {showGoldFields && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">Gold Weight 14K (gm)</label>
              <input
                type="number"
                step="0.001"
                value={formData.gold_weight_14k}
                onChange={(e) => setFormData({ ...formData, gold_weight_14k: e.target.value })}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
            </div>
            {formData.product_type === 'gold' && (
              <div>
                <label className="text-sm font-medium text-white mb-2 block">Labour Charge (रु)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.labour_charge}
                  onChange={(e) => setFormData({ ...formData, labour_charge: e.target.value })}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-white mb-2 block">Gold Extra Charge (रु)</label>
              <input
                type="number"
                step="1"
                value={formData.gold_extra_charge}
                onChange={(e) => setFormData({ ...formData, gold_extra_charge: e.target.value })}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">Any additional gold-side cost (e.g. transport/other)</p>
            </div>
          </div>
        )}

        {showDiamondFields && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">Diamond Weight (carat)</label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.diamond_weight_carat}
                  onChange={(e) => setFormData({ ...formData, diamond_weight_carat: e.target.value })}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white mb-2 block">Diamond Extra Charge (रु)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.diamond_extra_charge}
                  onChange={(e) => setFormData({ ...formData, diamond_extra_charge: e.target.value })}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Any additional diamond-side cost/markup</p>
              </div>
              <div>
                <label className="text-sm font-medium text-white mb-2 block">Labour Charge (रु)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.labour_charge}
                  onChange={(e) => setFormData({ ...formData, labour_charge: e.target.value })}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Added to the calculated diamond selling price</p>
              </div>
            </div>

          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Stock</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              required
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
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
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
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
            className="w-4 h-4 accent-violet-500 rounded"
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
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl transition-colors text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors text-sm border border-gray-700"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  );
}
