import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, useStore } from '../lib/store';
import { useState } from 'react';
import { showNotification } from './Notification';
import { useWishlist } from '../lib/WishlistContext';
import { cartHeaders } from '../lib/session';
import { useStoreSettings } from '../lib/useStoreSettings';
import { resolveProductPrice } from '../lib/pricing';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [adding, setAdding] = useState(false);
  const { setCart } = useStore();
  const settings = useStoreSettings();
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const liked = isInWishlist(product.id);
  const displayPrice = resolveProductPrice(product, settings);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: cartHeaders(),
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      
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

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (liked) {
      removeItem(product.id);
      showNotification(`${product.name} removed from wishlist`);
    } else {
      addItem({ id: product.id, name: product.name, price: displayPrice, image_url: product.image_url, material: product.material, category: product.category });
      showNotification(`${product.name} added to wishlist`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.6 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group"
    >
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-[#faf9f7]">
          <motion.img src={product.image_url} alt={product.name} className="w-full h-full object-cover" animate={{ scale: isHovered ? 1.05 : 1 }} transition={{ duration: 0.7 }} />
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }} className="absolute bottom-4 left-4 right-4">
            <button onClick={handleAddToCart} disabled={adding} className="w-full py-3 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-medium tracking-[0.1em] uppercase hover:bg-[#c9a962] hover:text-white transition-colors disabled:opacity-50">
              {adding ? 'Adding...' : 'Add to Bag'}
            </button>
          </motion.div>

          <motion.button initial={{ opacity: 0 }} animate={{ opacity: isHovered ? 1 : 0 }} whileTap={{ scale: 0.8 }} onClick={handleWishlist} className="absolute top-4 right-4 w-9 h-9 bg-white/95 backdrop-blur-sm flex items-center justify-center">
            <Heart className={`w-4 h-4 transition-colors ${liked ? 'fill-[#c9a962] text-[#c9a962]' : 'text-gray-600'}`} />
          </motion.button>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-[#c9a962] transition-colors">{product.name}</h3>
          <p className="text-xs text-gray-400 mt-1">{product.material}</p>
          <p className="text-sm font-medium text-gray-900 mt-2">रु {displayPrice.toLocaleString('en-IN')}</p>
        </div>
      </Link>
    </motion.div>
  );
}
