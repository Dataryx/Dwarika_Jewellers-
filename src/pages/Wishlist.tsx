import { motion } from 'framer-motion';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../lib/WishlistContext';
import { showNotification } from '../components/Notification';
import { useStore } from '../lib/store';
import { cartHeaders } from '../lib/session';
import { apiFetch } from '../lib/apiUrl';

export default function Wishlist() {
  const { items, removeItem, clearWishlist } = useWishlist();
  const { setCart } = useStore();

  const handleAddToCart = async (productId: number, productName: string) => {
    try {
      const res = await apiFetch('/api/cart', {
        method: 'POST',
        headers: cartHeaders(),
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });
      
      if (res.ok) {
        const cartRes = await apiFetch('/api/cart', { headers: cartHeaders() });
        const cartData = await cartRes.json();
        setCart(cartData);
        showNotification(`${productName} added to bag`);
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  return (
    <div className="min-h-screen pt-8 bg-[#faf9f7]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif font-medium text-gray-900">Wishlist</h1>
              <p className="text-sm text-gray-500 mt-1">
                {items.length} item{items.length !== 1 ? 's' : ''} saved
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearWishlist}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="bg-white p-12 rounded-lg text-center">
              <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">Your wishlist is empty</h2>
              <p className="text-gray-500 mb-6">Save items you love by clicking the heart icon.</p>
              <Link
                to="/collections"
                className="inline-block px-8 py-3 bg-gray-900 text-white text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#c9a962] transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg overflow-hidden shadow-sm group"
                >
                  <Link to={`/product/${item.id}`}>
                    <div className="aspect-[4/5] bg-[#faf9f7] overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link to={`/product/${item.id}`}>
                      <h3 className="text-sm font-medium text-gray-900 hover:text-[#c9a962] transition-colors">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-400 mt-1">{item.material}</p>
                    <p className="text-sm font-medium text-gray-900 mt-2">
                      रु {item.price.toLocaleString('en-IN')}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleAddToCart(item.id, item.name)}
                        className="flex-1 py-2 bg-gray-900 text-white text-xs font-medium tracking-wider uppercase hover:bg-[#c9a962] transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Add to Bag
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 border border-gray-200 hover:border-red-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
