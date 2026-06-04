import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../lib/store';
import { useStoreSettings } from '../lib/useStoreSettings';
import { resolveProductPrice } from '../lib/pricing';
import { apiFetch } from '../lib/apiUrl';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const settings = useStoreSettings();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const searchProducts = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await apiFetch('/api/products');
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          setResults([]);
          return;
        }
        const filtered = data.filter((p: Product) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase()) ||
          p.material.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered.slice(0, 8));
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleClose = () => {
    setQuery('');
    setResults([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 bg-white shadow-2xl z-[70] max-h-[80vh] overflow-hidden"
          >
            <div className="max-w-3xl mx-auto px-6 py-6">
              <div className="flex items-center gap-4">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search jewelry..."
                  className="flex-1 text-lg bg-transparent border-0 focus:outline-none text-gray-900 placeholder:text-gray-400"
                />
                {loading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {query.trim() && (
              <div className="border-t border-gray-100 max-h-[60vh] overflow-y-auto">
                {results.length === 0 && !loading ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-500">No results found for "{query}"</p>
                  </div>
                ) : (
                  <div className="px-6 py-4 space-y-2">
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        onClick={handleClose}
                        className="flex items-center gap-4 p-3 hover:bg-[#faf9f7] rounded-lg transition-colors"
                      >
                        <div className="w-16 h-16 bg-[#faf9f7] rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{product.category} • {product.material}</p>
                          <p className="text-sm font-medium text-[#c9a962] mt-1">
                            रु {resolveProductPrice(product, settings).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
