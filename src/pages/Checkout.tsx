import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, CreditCard, Banknote, Clock, Wallet, LogIn, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { useStoreSettings } from '../lib/useStoreSettings';
import { formatPrice } from '../lib/currency';
import { cartHeaders } from '../lib/session';
import { useAuth } from '../contexts/AuthContext';
import { resolveProductPrice } from '../lib/pricing';

const METHOD_ICONS: Record<string, React.ReactNode> = {
  'Cash on Delivery': <Banknote className="w-5 h-5 text-gray-600" />,
  eSewa: <Wallet className="w-5 h-5 text-green-600" />,
  Khalti: <Wallet className="w-5 h-5 text-purple-600" />,
  'Bank Transfer': <CreditCard className="w-5 h-5 text-blue-600" />,
  'Credit / Debit Card': <CreditCard className="w-5 h-5 text-gray-400" />,
};

const FUNCTIONAL_METHODS = new Set(['Cash on Delivery']);

export default function Checkout() {
  const { cart, clearCart } = useStore();
  const navigate = useNavigate();
  const settings = useStoreSettings();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email || '' }));
    }
  }, [user?.email]);

  const taxRate = (settings?.taxRate ?? 13) / 100;
  const freeThreshold = settings?.freeShippingThreshold ?? 5000;
  const shippingRate = settings?.standardShippingRate ?? 150;
  const subtotal = cart.reduce(
    (sum, item) => sum + resolveProductPrice(item.product, settings) * item.quantity,
    0
  );
  const shipping = subtotal >= freeThreshold ? 0 : shippingRate;
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + shipping + tax;

  const enabledMethods = settings
    ? Object.entries(settings.paymentMethods)
        .filter(([, on]) => on)
        .map(([name]) => name)
    : ['Cash on Delivery'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!FUNCTIONAL_METHODS.has(paymentMethod)) return;
    setLoading(true);

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.email ? { 'X-User-Email': user.email } : {}),
        },
        body: JSON.stringify({
          customer_name: `${formData.firstName} ${formData.lastName}`,
          customer_email: user?.email || formData.email,
          items: cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: resolveProductPrice(item.product, settings),
          })),
          total,
          payment_method: paymentMethod,
        }),
      });

      await fetch('/api/cart', { method: 'DELETE', headers: cartHeaders(), body: JSON.stringify({ clear_all: true }) });
      clearCart();
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      console.error('Checkout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md px-6"
        >
          <div className="w-16 h-16 bg-[#c9a962]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-7 h-7 text-[#c9a962]" />
          </div>
          <h2 className="text-2xl font-serif font-medium text-gray-900">Sign in to continue</h2>
          <p className="text-gray-500 mt-3 text-sm leading-relaxed">
            Please log in to complete your purchase. Your bag items will be waiting for you.
          </p>
          <div className="mt-8 justify-center">
            <Link to="/login">
              <button className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gray-900 text-white text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#c9a962] transition-colors">
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            </Link>
          </div>
          <Link to="/collections" className="inline-block mt-6 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0 && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <div className="text-center">
          <h2 className="text-2xl font-serif font-medium text-gray-900">Your bag is empty</h2>
          <Link to="/collections">
            <button className="mt-6 px-8 py-3 bg-gray-900 text-white text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#c9a962] transition-colors">
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 bg-[#c9a962] rounded-full flex items-center justify-center mx-auto"
          >
            <CheckCircle className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-serif font-medium text-gray-900 mt-8">Order Confirmed</h2>
          <p className="text-gray-500 mt-3">Thank you for your purchase.</p>
          <p className="text-sm text-gray-400 mt-2">You will pay upon delivery.</p>
          <Link to="/">
            <button className="mt-8 px-8 py-3 bg-gray-900 text-white text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#c9a962] transition-colors">
              Continue Shopping
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const isFunctional = FUNCTIONAL_METHODS.has(paymentMethod);

  return (
    <div className="min-h-screen pt-8 pb-20 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
        <Link to="/collections" className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.1em] uppercase text-gray-500 hover:text-gray-900 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-serif font-medium text-gray-900 mb-10">Checkout</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact */}
              <div>
                <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-900 mb-5">Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required className="px-4 py-3 bg-[#faf9f7] border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a962]" />
                  <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required className="px-4 py-3 bg-[#faf9f7] border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a962]" />
                </div>
                <input type="email" name="email" placeholder="Email" value={formData.email} readOnly required className="w-full mt-4 px-4 py-3 bg-gray-100 border-0 text-sm text-gray-500 focus:outline-none" />
                <input type="tel" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} required className="w-full mt-4 px-4 py-3 bg-[#faf9f7] border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a962]" />
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-900 mb-5">Shipping Address</h3>
                <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} required className="w-full px-4 py-3 bg-[#faf9f7] border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a962]" />
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} required className="px-4 py-3 bg-[#faf9f7] border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a962]" />
                  <input type="text" name="state" placeholder="State" value={formData.state} onChange={handleChange} required className="px-4 py-3 bg-[#faf9f7] border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a962]" />
                  <input type="text" name="zip" placeholder="ZIP" value={formData.zip} onChange={handleChange} required className="px-4 py-3 bg-[#faf9f7] border-0 text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a962]" />
                </div>
              </div>

              {/* Payment Method — dynamically from settings */}
              <div>
                <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-900 mb-5">Payment Method</h3>
                <div className="space-y-3">
                  {enabledMethods.map((method) => {
                    const functional = FUNCTIONAL_METHODS.has(method);
                    const selected = paymentMethod === method;
                    return (
                      <label
                        key={method}
                        className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${
                          selected
                            ? functional
                              ? 'bg-[#c9a962]/10 border-2 border-[#c9a962]'
                              : 'bg-[#faf9f7] border-2 border-gray-200'
                            : 'bg-[#faf9f7] border-2 border-transparent hover:border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={selected}
                          onChange={() => setPaymentMethod(method)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selected ? (functional ? 'border-[#c9a962]' : 'border-gray-400') : 'border-gray-300'
                        }`}>
                          {selected && (
                            <div className={`w-2.5 h-2.5 rounded-full ${functional ? 'bg-[#c9a962]' : 'bg-gray-400'}`} />
                          )}
                        </div>
                        {METHOD_ICONS[method] || <CreditCard className="w-5 h-5 text-gray-400" />}
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${functional ? 'text-gray-900' : 'text-gray-400'}`}>{method}</p>
                        </div>
                        {selected && functional && <CheckCircle className="w-5 h-5 text-[#c9a962]" />}
                        {!functional && (
                          <span className="px-3 py-1 bg-gray-200 text-gray-500 text-[10px] font-medium tracking-wider uppercase rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {!isFunctional && paymentMethod && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <p className="text-xs">{paymentMethod} will be available soon</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Submit */}
              <motion.button
                whileHover={isFunctional ? { scale: 1.01 } : {}}
                whileTap={isFunctional ? { scale: 0.99 } : {}}
                type="submit"
                disabled={loading || !isFunctional}
                className={`w-full py-4 text-xs font-medium tracking-[0.15em] uppercase transition-colors ${
                  !isFunctional
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-[#c9a962] disabled:opacity-50'
                }`}
              >
                {loading ? 'Processing...' : isFunctional ? 'Place Order' : 'Select a working payment method'}
              </motion.button>

              {isFunctional && (
                <p className="text-xs text-gray-400 text-center">
                  You will pay {formatPrice(total)} when your order arrives
                </p>
              )}
            </form>
          </motion.div>

          {/* Order Summary */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:sticky lg:top-28 h-fit">
            <div className="bg-[#faf9f7] p-8">
              <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-900 mb-6">Order Summary</h3>

              <div className="space-y-5">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-white flex-shrink-0">
                      <img src={item.product?.image_url || '/placeholder.jpg'} alt={item.product?.name || 'Product'} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{item.product?.name || 'Product'}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(resolveProductPrice(item.product, settings) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 mt-8 pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    <span className="text-gray-900">{formatPrice(shipping)}</span>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({settings?.taxRate ?? 13}%)</span>
                  <span className="text-gray-900">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-base font-medium pt-3 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatPrice(total)}</span>
                </div>
                {paymentMethod && (
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#c9a962] font-medium">Payment</span>
                      <span className="text-[#c9a962] font-medium">{paymentMethod}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
