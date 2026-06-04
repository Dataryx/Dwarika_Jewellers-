import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Product } from '../lib/store';
import { apiFetch } from '../lib/apiUrl';

export default function Collections() {
  const { category } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'all');
  const [sortBy, setSortBy] = useState('newest');
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([{ id: 'all', label: 'All' }]);

  useEffect(() => {
    apiFetch('/api/categories')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !Array.isArray(data)) return;
        setCategories([
          { id: 'all', label: 'All' },
          ...data.map((c: { slug: string; name: string }) => ({ id: c.slug, label: c.name })),
        ]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const url = selectedCategory && selectedCategory !== 'all' 
          ? `/api/products?category=${selectedCategory}`
          : '/api/products';
        const res = await apiFetch(url);
        const raw = await res.json();
        if (!res.ok || !Array.isArray(raw)) {
          setProducts([]);
          return;
        }
        let data = raw;
        
        if (sortBy === 'price-low') {
          data = data.sort((a: Product, b: Product) => a.price - b.price);
        } else if (sortBy === 'price-high') {
          data = data.sort((a: Product, b: Product) => b.price - a.price);
        }
        
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    if (category) setSelectedCategory(category);
  }, [category]);

  return (
    <div className="min-h-screen pt-8">
      {/* Header */}
      <div className="bg-[#faf9f7] py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl font-serif font-medium text-gray-900">
              {selectedCategory === 'all' ? 'All Jewelry' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
            </h1>
            <p className="mt-4 text-gray-500">{products.length} pieces</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 text-xs font-medium tracking-[0.1em] uppercase transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-transparent text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-transparent border border-gray-200 text-sm focus:outline-none focus:border-gray-900 transition-colors"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <div className="aspect-[4/5] bg-gray-100 animate-pulse" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-gray-100 animate-pulse" />
                  <div className="h-3 bg-gray-100 animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No products found.</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8"
          >
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
