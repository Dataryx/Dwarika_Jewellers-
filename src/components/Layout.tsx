import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, X, Search, User, LogOut, Heart, Package } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { useAuth } from '../contexts/AuthContext';
import { subscribeNewsletter } from '../lib/newsletter';
import { fetchCartFromServer } from '../lib/cartSync';
import SearchModal from './SearchModal';
import Cart from './Cart';
import BrandWordmark from './BrandWordmark';

const navLinks = [
  { name: 'Shop', path: '/collections' },
  { name: 'About', path: '/about' },
  { name: 'Help', path: '/help' },
  { name: 'Contact', path: '/contact' },
];

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { toggleCart, cartCount, setCart } = useStore();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartFromServer().then(setCart).catch(() => {});
  }, [setCart]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    scrollToTop();
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    navigate('/');
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterSubmitting(true);
    setNewsletterMessage('');

    try {
      const result = await subscribeNewsletter(newsletterEmail);
      setNewsletterEmail('');
      setNewsletterMessage(result.alreadySubscribed ? 'You are already subscribed.' : 'Successfully subscribed!');
    } catch (err) {
      setNewsletterMessage(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link to="/" onClick={scrollToTop} className="flex items-center gap-2 sm:gap-3 group min-w-0">
              <img
                src="/favicon.svg?v=5"
                alt="Dwarika"
                className="w-10 h-10 sm:w-11 sm:h-11 shrink-0"
              />
              <BrandWordmark size="nav" />
            </Link>

            <nav className="hidden lg:flex items-center gap-12">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={scrollToTop} className="relative group">
                  <span className={`text-xs font-medium tracking-[0.15em] uppercase transition-colors ${
                    location.pathname === link.path ? 'text-[#c9a962]' : 'text-gray-600 hover:text-gray-900'
                  }`}>{link.name}</span>
                  <span className={`absolute -bottom-1 left-0 h-px bg-[#c9a962] transition-all ${
                    location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-5 shrink-0">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => setSearchOpen(true)} className="p-2 text-gray-600 hover:text-gray-900">
                <Search className="w-5 h-5" />
              </motion.button>

              <div className="relative" ref={userMenuRef}>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => setUserMenuOpen(!userMenuOpen)} className={`p-2 ${user ? 'text-[#c9a962]' : 'text-gray-600 hover:text-gray-900'}`}>
                  <User className="w-5 h-5" />
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 shadow-lg py-2 z-50">
                      {user ? (
                        <>
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                          <Link to="/account" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><User className="w-4 h-4" />My Account</Link>
                          <Link to="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><Package className="w-4 h-4" />Orders</Link>
                          <Link to="/wishlist" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><Heart className="w-4 h-4" />Wishlist</Link>
                          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4" />Sign Out</button>
                        </>
                      ) : (
                        <Link to="/login" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Sign In</Link>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={toggleCart} className="relative p-2 text-gray-600 hover:text-gray-900">
                <ShoppingBag className="w-5 h-5" />
                {cartCount() > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#c9a962] text-white text-[10px] font-medium rounded-full flex items-center justify-center">{cartCount()}</motion.span>
                )}
              </motion.button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-gray-600">
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="lg:hidden bg-white border-t border-gray-100">
              <nav className="px-6 py-8 space-y-4">
                {navLinks.map((link) => (
                  <Link key={link.path} to={link.path} onClick={() => { scrollToTop(); setMobileMenuOpen(false); }} className="block text-sm font-medium tracking-[0.1em] uppercase text-gray-600">{link.name}</Link>
                ))}
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  {user ? (
                    <>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-600">My Account</Link>
                      <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-600">Orders</Link>
                      <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-600">Wishlist</Link>
                      <button onClick={handleSignOut} className="text-sm text-red-600">Sign Out</button>
                    </>
                  ) : (
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium tracking-[0.1em] uppercase text-[#c9a962]">Sign In</Link>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main className="pt-16 sm:pt-20">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-[#faf9f7] mt-12 sm:mt-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 sm:gap-12 lg:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <img src="/favicon.svg?v=5" alt="Dwarika" className="w-10 h-10 shrink-0" />
                <BrandWordmark size="footer" />
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">Crafting timeless pieces since 1985. Each design tells a story of artistry and elegance.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-900 mb-6">Shop</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><Link to="/collections/rings" className="hover:text-[#c9a962]">Rings</Link></li>
                <li><Link to="/collections/necklaces" className="hover:text-[#c9a962]">Necklaces</Link></li>
                <li><Link to="/collections/earrings" className="hover:text-[#c9a962]">Earrings</Link></li>
                <li><Link to="/collections/bracelets" className="hover:text-[#c9a962]">Bracelets</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-900 mb-6">Help</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><Link to="/help" className="hover:text-[#c9a962]">Shipping & Returns</Link></li>
                <li><a href="#" className="hover:text-[#c9a962]">Size Guide</a></li>
                <li><Link to="/help" className="hover:text-[#c9a962]">Care</Link></li>
                <li><Link to="/contact" className="hover:text-[#c9a962]">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-900 mb-6">Services</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><Link to="/exchange-gold" className="hover:text-[#c9a962]">Exchange Gold & Silver</Link></li>
                <li><Link to="/custom-design" className="hover:text-[#c9a962]">Custom Design</Link></li>
                <li><Link to="/repair-maintenance" className="hover:text-[#c9a962]">Repair & Maintenance</Link></li>
                <li><Link to="/certification" className="hover:text-[#c9a962]">Certification</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-gray-900 mb-6">Newsletter</h4>
              <p className="text-sm text-gray-500 mb-4">Subscribe for exclusive access.</p>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-sm focus:outline-none focus:border-[#c9a962]"
                />
                <button disabled={newsletterSubmitting} className="px-5 py-2.5 bg-gray-900 text-white text-xs font-medium tracking-wider hover:bg-[#c9a962] disabled:opacity-60 disabled:cursor-not-allowed">{newsletterSubmitting ? 'JOINING...' : 'JOIN'}</button>
              </form>
              {newsletterMessage && <p className="mt-3 text-xs text-gray-500">{newsletterMessage}</p>}
            </div>
          </div>
          <div className="border-t border-gray-200 mt-16 pt-8 text-center text-xs text-gray-400 tracking-wider">© 2026 DWARIKA. ALL RIGHTS RESERVED.</div>
        </div>
      </footer>

      <Cart />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
