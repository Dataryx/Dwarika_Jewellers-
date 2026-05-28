import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { useEffect } from 'react';
import { cartHeaders } from '../lib/session';
import { useStoreSettings } from '../lib/useStoreSettings';
import { resolveProductPrice } from '../lib/pricing';

export default function Cart() {
  const { cart, cartOpen, toggleCart, setCart } = useStore();
  const settings = useStoreSettings();
  const subtotal = cart.reduce(
    (sum, item) => sum + resolveProductPrice(item.product, settings) * item.quantity,
    0
  );

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart', { headers: cartHeaders() });
      const data = await res.json();
      setCart(data);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  };

  useEffect(() => {
    if (cartOpen) {
      fetchCart();
    }
  }, [cartOpen, setCart]);

  const handleRemove = async (id: number) => {
    try {
      await fetch('/api/cart', {
        method: 'DELETE',
        headers: cartHeaders(),
        body: JSON.stringify({ id }),
      });
      await fetchCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const handleUpdateQuantity = async (id: number, quantity: number) => {
    if (quantity < 1) return;
    try {
      await fetch(`/api/cart?id=${id}`, {
        method: 'PUT',
        headers: cartHeaders(),
        body: JSON.stringify({ quantity }),
      });
      await fetchCart();
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100">
              <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-900">
                Shopping Bag {cart.length > 0 && `(${cart.length})`}
              </h2>
              <button onClick={toggleCart} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6">
                <ShoppingBag className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-sm text-gray-400 mb-6">Your bag is empty</p>
                <button
                  onClick={toggleCart}
                  className="px-8 py-3 bg-gray-900 text-white text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#c9a962] transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-4"
                    >
                      <div className="w-20 h-20 bg-[#faf9f7] rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.product?.image_url || '/placeholder.jpg'}
                          alt={item.product?.name || 'Product'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{item.product?.name || 'Product'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{item.product?.material || ''}</p>
                        <p className="text-sm font-medium text-gray-900 mt-2">
                          रु {resolveProductPrice(item.product, settings).toLocaleString('en-IN')}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center border border-gray-200 hover:border-gray-400 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center border border-gray-200 hover:border-gray-400 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-gray-300 hover:text-gray-600 transition-colors self-start"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>

                <div className="px-6 py-6 border-t border-gray-100 bg-[#faf9f7]">
                  <div className="flex justify-between mb-6">
                    <span className="text-sm text-gray-500">Subtotal</span>
                    <span className="text-base font-medium text-gray-900">रु {subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <Link
                    to="/checkout"
                    onClick={toggleCart}
                    className="block w-full py-4 bg-gray-900 text-white text-center text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#c9a962] transition-colors"
                  >
                    Checkout
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
