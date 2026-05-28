import { motion } from 'framer-motion';
import { Heart, Share2, Minus, Plus, ChevronRight } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Product, useStore } from '../lib/store';
import ProductCard from '../components/ProductCard';
import { showNotification } from '../components/Notification';
import { useWishlist } from '../lib/WishlistContext';
import { useStoreSettings } from '../lib/useStoreSettings';
import { formatPrice } from '../lib/currency';
import { cartHeaders } from '../lib/session';
import { resolveProductPrice } from '../lib/pricing';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const storeSettings = useStoreSettings();
  const [adding, setAdding] = useState(false);
  const { setCart } = useStore();
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const liked = product ? isInWishlist(product.id) : false;
  const displayPrice = product ? resolveProductPrice(product, storeSettings) : 0;

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?id=${id}`);
        const data = await res.json();
        setProduct(data);
        const relatedRes = await fetch(`/api/products?category=${data.category}`);
        const relatedData = await relatedRes.json();
        setRelatedProducts(relatedData.filter((p: Product) => p.id !== data.id).slice(0, 4));
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || adding) return;
    setAdding(true);
    try {
      const res = await fetch('/api/cart', { method: 'POST', headers: cartHeaders(), body: JSON.stringify({ product_id: product.id, quantity }) });
      if (res.ok) {
        const cartRes = await fetch('/api/cart', { headers: cartHeaders() });
        const cartData = await cartRes.json();
        setCart(cartData);
        showNotification(`${product.name} added to bag`);
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = () => {
    if (!product) return;
    if (liked) {
      removeItem(product.id);
      showNotification(`${product.name} removed from wishlist`);
    } else {
      addItem({ id: product.id, name: product.name, price: displayPrice, image_url: product.image_url, material: product.material, category: product.category });
      showNotification(`${product.name} added to wishlist`);
    }
  };

  if (loading) return <div className="min-h-screen pt-8"><div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12"><div className="grid lg:grid-cols-2 gap-16"><div className="aspect-[4/5] bg-gray-100 animate-pulse" /><div className="space-y-6"><div className="h-8 bg-gray-100 animate-pulse w-3/4" /><div className="h-4 bg-gray-100 animate-pulse w-1/2" /></div></div></div></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Product not found</p></div>;

  return (
    <div className="min-h-screen pt-8 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/collections" className="hover:text-gray-900">Shop</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/collections/${product.category}`} className="hover:text-gray-900 capitalize">{product.category}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-16">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="sticky top-28 h-fit">
            <div className="aspect-[4/5] bg-[#faf9f7] overflow-hidden">
              <motion.img initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="py-8">
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">{product.category}</span>
            <h1 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-3">{product.name}</h1>
            <p className="text-2xl font-medium text-gray-900 mt-6">रु {displayPrice.toLocaleString('en-IN')}</p>
            <p className="text-gray-500 leading-relaxed mt-8">{product.description}</p>
            <div className="mt-6 flex items-center gap-3">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Material:</span>
              <span className="text-sm text-gray-900">{product.material}</span>
            </div>

            <div className="mt-10 flex items-center gap-6">
              <span className="text-xs font-medium tracking-[0.1em] uppercase text-gray-900">Quantity</span>
              <div className="flex items-center border border-gray-200">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50"><Minus className="w-4 h-4" /></button>
                <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleAddToCart} disabled={adding} className={`flex-1 py-4 text-xs font-medium tracking-[0.15em] uppercase transition-colors disabled:opacity-50 ${adding ? 'bg-gray-400 text-white' : 'bg-gray-900 text-white hover:bg-[#c9a962]'}`}>
                {adding ? 'Adding...' : 'Add to Bag'}
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleWishlist} className={`w-14 border transition-colors ${liked ? 'border-[#c9a962] bg-[#c9a962]/10' : 'border-gray-200 hover:border-gray-400'}`}>
                <Heart className={`w-5 h-5 mx-auto ${liked ? 'fill-[#c9a962] text-[#c9a962]' : 'text-gray-600'}`} />
              </motion.button>
              <button className="w-14 border border-gray-200 hover:border-gray-400 transition-colors">
                <Share2 className="w-5 h-5 mx-auto text-gray-600" />
              </button>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 grid grid-cols-3 gap-8">
              <div className="text-center"><p className="text-xs font-medium tracking-[0.1em] uppercase text-gray-900">Free Shipping</p><p className="text-xs text-gray-400 mt-1">On orders {formatPrice(storeSettings?.freeShippingThreshold ?? 5000)}+</p></div>
              <div className="text-center"><p className="text-xs font-medium tracking-[0.1em] uppercase text-gray-900">2 Year Warranty</p><p className="text-xs text-gray-400 mt-1">Quality assured</p></div>
              <div className="text-center"><p className="text-xs font-medium tracking-[0.1em] uppercase text-gray-900">Easy Returns</p><p className="text-xs text-gray-400 mt-1">30-day policy</p></div>
            </div>
          </motion.div>
        </div>

        {relatedProducts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-24 pt-16 border-t border-gray-100">
            <h2 className="text-2xl font-serif font-medium text-gray-900 mb-10">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {relatedProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
