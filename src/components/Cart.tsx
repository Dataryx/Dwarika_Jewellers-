import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { useEffect, useRef } from 'react';
import { fetchCartFromServer } from '../lib/cartSync';
import { cartHeaders } from '../lib/session';
import { useStoreSettings } from '../lib/useStoreSettings';
import { resolveProductPrice } from '../lib/pricing';
import { apiFetch } from '../lib/apiUrl';

export default function Cart() {
  const { cart, cartOpen, toggleCart, setCart, removeFromCart, updateQuantity } = useStore();
  const settings = useStoreSettings();
  const qtyTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const subtotal = cart.reduce(
    (sum, item) => sum + resolveProductPrice(item.product, settings) * item.quantity,
    0
  );

  const reloadCart = async () => {
    const items = await fetchCartFromServer();
    setCart(items);
  };

  useEffect(() => {
    if (cartOpen) {
      reloadCart();
    }
  }, [cartOpen]);

  useEffect(() => {
    return () => {
      Object.values(qtyTimers.current).forEach(clearTimeout);
    };
  }, []);

  const clearQtyTimer = (id: number) => {
    if (qtyTimers.current[id]) {
      clearTimeout(qtyTimers.current[id]);
      delete qtyTimers.current[id];
    }
  };

  const syncQuantity = (id: number, quantity: number) => {
    clearQtyTimer(id);
    qtyTimers.current[id] = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/cart?id=${id}`, {
          method: 'PUT',
          headers: cartHeaders(),
          body: JSON.stringify({ quantity }),
        });
        if (!res.ok) throw new Error('update failed');
      } catch (err) {
        console.error('Failed to update quantity:', err);
        await reloadCart();
      } finally {
        delete qtyTimers.current[id];
      }
    }, 200);
  };

  const handleRemove = (id: number) => {
    clearQtyTimer(id);
    removeFromCart(id);
    void apiFetch('/api/cart', {
      method: 'DELETE',
      headers: cartHeaders(),
      body: JSON.stringify({ id }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('remove failed');
      })
      .catch(async (err) => {
        console.error('Failed to remove item:', err);
        await reloadCart();
      });
  };

  const handleUpdateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) {
      handleRemove(id);
      return;
    }
    if (quantity > 99) return;
    updateQuantity(id, quantity);
    syncQuantity(id, quantity);
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
              <button onClick={toggleCart} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close cart">
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
                  <AnimatePresence initial={false}>
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -40 }}
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
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">{item.product?.name || 'Product'}</h3>
                              <p className="text-xs text-gray-400 mt-0.5">{item.product?.material || ''}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemove(item.id)}
                              className="flex items-center gap-1 shrink-0 text-xs text-gray-400 hover:text-red-600 transition-colors"
                              aria-label={`Remove ${item.product?.name || 'item'}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mt-2">
                            रु {resolveProductPrice(item.product, settings).toLocaleString('en-IN')}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center border border-gray-200 hover:border-gray-400 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-medium w-5 text-center tabular-nums">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center border border-gray-200 hover:border-gray-400 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
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
