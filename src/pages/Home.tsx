import { motion } from 'framer-motion';
import { ArrowRight, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import LivePriceStrip from '../components/LivePriceStrip';
import { Product } from '../lib/store';
import { subscribeNewsletter } from '../lib/newsletter';
import {
  fetchHomepageBanner,
  DEFAULT_HOME_BANNER,
  subscribeHomepageBanner,
  type HomeBannerConfig,
} from '../lib/homepageBanner';
import { apiFetch } from '../lib/apiUrl';
import { useVisibleCarouselCount } from '../lib/useMediaQuery';

interface Category { id: number; name: string; slug: string; image_url: string; }
interface StoryContent { imageUrl: string; title: string; paragraph1: string; paragraph2: string; }

const DEFAULT_CATEGORIES = [
  { id: 0, name: 'Rings', slug: 'rings', image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800' },
  { id: 0, name: 'Necklaces', slug: 'necklaces', image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800' },
  { id: 0, name: 'Earrings', slug: 'earrings', image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800' },
  { id: 0, name: 'Bracelets', slug: 'bracelets', image_url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800' },
];

const DEFAULT_STORY: StoryContent = {
  imageUrl: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800',
  title: 'Crafted with Passion, Worn with Pride',
  paragraph1: 'Every piece in our collection is meticulously handcrafted by master artisans who have dedicated their lives to the art of jewelry making. We source only the finest materials—from ethically mined gemstones to recycled precious metals.',
  paragraph2: 'Our commitment to quality means each piece is designed to last a lifetime and become a treasured heirloom passed down through generations.',
};

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<HomeBannerConfig>(() => ({ ...DEFAULT_HOME_BANNER }));
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [story, setStory] = useState<StoryContent>(DEFAULT_STORY);
  const [categorySlide, setCategorySlide] = useState(0);
  const [featuredSlide, setFeaturedSlide] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const visibleCount = useVisibleCarouselCount();
  const maxCategorySlide = Math.max(0, categories.length - visibleCount);
  const maxFeaturedSlide = Math.max(0, featuredProducts.length - visibleCount);
  const slideStep = visibleCount === 4 ? 'calc(25% + 0.375rem)' : 'calc(50% + 0.5rem)';

  useEffect(() => {
    setCategorySlide((s) => Math.min(s, maxCategorySlide));
  }, [maxCategorySlide]);

  useEffect(() => {
    setFeaturedSlide((s) => Math.min(s, maxFeaturedSlide));
  }, [maxFeaturedSlide]);

  useEffect(() => {
    fetchHomepageBanner().then(setBanner);
    return subscribeHomepageBanner(() => {
      fetchHomepageBanner().then(setBanner);
    });
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterSubmitting(true);
    setNewsletterMessage('');

    try {
      const result = await subscribeNewsletter(newsletterEmail);
      setNewsletterEmail('');
      setNewsletterMessage(result.alreadySubscribed ? 'You are already subscribed.' : 'Thanks for subscribing!');
    } catch (err) {
      setNewsletterMessage(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  useEffect(() => {
    apiFetch('/api/products?featured=true')
      .then((r) => r.json())
      .then(setFeaturedProducts)
      .catch(() => {})
      .finally(() => setLoading(false));

    apiFetch('/api/categories')
      .then((r) => r.json())
      .then((data) => { if (data.length > 0) setCategories(data); })
      .catch(() => {});

    apiFetch('/api/about')
      .then((r) => r.json())
      .then((data) => {
        if (data.storyImage || data.storyTitle) {
          setStory({
            imageUrl: data.storyImage || DEFAULT_STORY.imageUrl,
            title: data.storyTitle || DEFAULT_STORY.title,
            paragraph1: data.storyParagraphs?.[0] || DEFAULT_STORY.paragraph1,
            paragraph2: data.storyParagraphs?.[1] || DEFAULT_STORY.paragraph2,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="overflow-hidden">
      <LivePriceStrip />
      {/* Hero — full-screen banner */}
      <section className="relative min-h-[85vh] sm:min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            initial={{ scale: 1.06, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute inset-0 overflow-hidden"
          >
            <img
              src={banner.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </motion.div>
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 sm:via-black/20 to-transparent"
            aria-hidden
          />
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-32 pt-28 sm:pt-32 lg:pt-36">
          <div className="max-w-xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-block text-xs font-medium tracking-[0.3em] uppercase text-[#e8d5a3] mb-6 drop-shadow-sm"
            >
              {banner.kicker}
            </motion.span>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-medium leading-[1.05] tracking-tight text-white drop-shadow-md"
            >
              {banner.titleLine1}
              <br />
              <span className="text-[#c9a962]">{banner.titleHighlight}</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-8 text-base text-white/85 leading-relaxed max-w-md drop-shadow-sm"
            >
              {banner.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-10"
            >
              <Link to="/collections">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 bg-gray-900 text-white text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#c9a962] transition-colors duration-300 flex items-center gap-3"
                >
                  Shop Collection
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] tracking-[0.2em] uppercase text-white/55">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowDown className="w-4 h-4 text-white/55" />
          </motion.div>
        </motion.div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Explore</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-3">Shop by Category</h2>
            </div>
            <Link to="/collections" className="hidden sm:flex items-center gap-2 text-xs font-medium tracking-[0.1em] uppercase text-gray-600 hover:text-[#c9a962] transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={() => setCategorySlide(Math.max(0, categorySlide - 1))}
              disabled={categorySlide === 0}
              className="absolute left-2 sm:left-0 top-1/2 -translate-y-1/2 sm:-translate-x-4 lg:-translate-x-12 z-10 p-2 rounded-full bg-[#c9a962] text-white hover:bg-[#b39452] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
              aria-label="Previous categories"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCategorySlide(Math.min(maxCategorySlide, categorySlide + 1))}
              disabled={categorySlide >= maxCategorySlide}
              className="absolute right-2 sm:right-0 top-1/2 -translate-y-1/2 sm:translate-x-4 lg:translate-x-12 z-10 p-2 rounded-full bg-[#c9a962] text-white hover:bg-[#b39452] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
              aria-label="Next categories"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Categories Carousel */}
            <div className="overflow-hidden">
              <motion.div
                className="flex gap-4 lg:gap-6 w-full"
                animate={{ x: `calc(-1 * ${categorySlide} * (${slideStep}))` }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              >
                {categories.map((category, i) => (
                  <motion.div
                    key={category.name}
                    className="flex-none w-[calc((100%-1rem)/2)] lg:w-[calc((100%-4.5rem)/4)]"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <Link to={`/collections/${category.slug}`}>
                      <div className="group relative aspect-[3/4] overflow-hidden bg-[#faf9f7]">
                        <motion.img
                          src={category.image_url}
                          alt={category.name}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h3 className="text-lg font-serif text-white">{category.name}</h3>
                          <span className="inline-flex items-center gap-1 text-xs text-white/80 mt-2 group-hover:gap-2 transition-all">
                            Shop Now <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 sm:py-24 bg-[#faf9f7]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Curated Selection</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-3">Featured Pieces</h2>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-[4/5] bg-gray-200 animate-pulse" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-200 animate-pulse" />
                    <div className="h-3 bg-gray-200 animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setFeaturedSlide(Math.max(0, featuredSlide - 1))}
                disabled={featuredSlide === 0}
                className="absolute left-2 sm:left-0 top-1/2 -translate-y-1/2 sm:-translate-x-4 lg:-translate-x-12 z-10 p-2 rounded-full bg-[#c9a962] text-white hover:bg-[#b39452] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
                aria-label="Previous featured products"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => setFeaturedSlide(Math.min(maxFeaturedSlide, featuredSlide + 1))}
                disabled={featuredSlide >= maxFeaturedSlide}
                className="absolute right-2 sm:right-0 top-1/2 -translate-y-1/2 sm:translate-x-4 lg:translate-x-12 z-10 p-2 rounded-full bg-[#c9a962] text-white hover:bg-[#b39452] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
                aria-label="Next featured products"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="overflow-hidden">
                <motion.div
                  className="flex gap-6 lg:gap-8 w-full"
                  animate={{ x: `calc(-1 * ${featuredSlide} * (${visibleCount === 4 ? 'calc(25% + 1.125rem)' : 'calc(50% + 0.75rem)'}))` }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                >
                  {featuredProducts.map((product, i) => (
                    <div
                      key={product.id}
                      className="flex-none w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-6rem)/4)]"
                    >
                      <ProductCard product={product} index={i} />
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/collections">
              <button className="px-8 py-4 border border-gray-900 text-gray-900 text-xs font-medium tracking-[0.15em] uppercase hover:bg-gray-900 hover:text-white transition-colors duration-300">
                View All Collection
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Editorial Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="relative"
            >
              <div className="aspect-[4/5] bg-[#faf9f7] overflow-hidden">
                <img
                  src={story.imageUrl}
                  alt="Craftsmanship"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 sm:-bottom-8 sm:-right-8 w-32 h-32 sm:w-48 sm:h-48 bg-[#c9a962]/10 -z-10" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Our Story</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-4 leading-tight">
                {story.title}
              </h2>
              <p className="mt-6 text-gray-500 leading-relaxed">
                {story.paragraph1}
              </p>
              <p className="mt-4 text-gray-500 leading-relaxed">
                {story.paragraph2}
              </p>
              <Link to="/about">
                <motion.button
                  whileHover={{ x: 5 }}
                  className="mt-8 inline-flex items-center gap-2 text-xs font-medium tracking-[0.1em] uppercase text-gray-900 hover:text-[#c9a962] transition-colors"
                >
                  Discover Our Story <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Stay Connected</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-medium text-white mt-4">Join Our World</h2>
              <p className="mt-4 text-gray-400">
                Be the first to discover new arrivals, exclusive offers, and styling inspiration.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  className="flex-1 max-w-sm px-5 py-4 bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#c9a962] transition-colors"
                />
                <button disabled={newsletterSubmitting} className="px-8 py-4 bg-[#c9a962] text-gray-900 text-xs font-medium tracking-[0.15em] uppercase hover:bg-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {newsletterSubmitting ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
              {newsletterMessage && (
                <p className="mt-4 text-sm text-gray-300">{newsletterMessage}</p>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
