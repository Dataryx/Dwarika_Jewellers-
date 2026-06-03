import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, RotateCcw, Truck, Clock, AlertCircle, CheckCircle, Droplets, Wind, Zap } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface HelpData {
  heroSubtitle: string;
  heroTitle: string;
  heroDescription: string;
  shippingTitle: string;
  shippingDescription: string;
  shippingItems: { title: string; description: string; icon: string }[];
  returnsTitle: string;
  returnsDescription: string;
  returnsItems: { title: string; description: string; icon: string }[];
  careTitle: string;
  careDescription: string;
  careItems: { title: string; description: string; icon: string }[];
  faq: FAQItem[];
}

const defaultData: HelpData = {
  heroSubtitle: 'Need Help?',
  heroTitle: 'Shipping & Returns',
  heroDescription: 'Everything you need to know about our shipping and returns policy',
  shippingTitle: 'Shipping Information',
  shippingDescription: 'We offer fast, reliable shipping to deliver your precious jewelry safely to your doorstep.',
  shippingItems: [
    {
      title: 'Standard Shipping',
      description: 'Delivery within 5-7 business days. Track your order in real-time.',
      icon: 'truck',
    },
    {
      title: 'Express Shipping',
      description: 'Fast delivery within 2-3 business days for orders placed before noon.',
      icon: 'clock',
    },
    {
      title: 'Secure Packaging',
      description: 'All items are carefully packaged with protective materials and shipped with tracking.',
      icon: 'package',
    },
    {
      title: 'Worldwide Delivery',
      description: 'We ship to over 100 countries worldwide with international shipping options.',
      icon: 'truck',
    },
  ],
  returnsTitle: 'Returns & Exchanges',
  returnsDescription: 'We want you to be completely satisfied with your purchase. Easy returns within 30 days.',
  returnsItems: [
    {
      title: '30-Day Return Policy',
      description: 'Return items within 30 days of purchase for a full refund or exchange.',
      icon: 'rotate',
    },
    {
      title: 'Free Returns',
      description: 'We provide free return shipping labels for all eligible items.',
      icon: 'truck',
    },
    {
      title: 'Quick Refunds',
      description: 'Refunds are processed within 7-10 business days after we receive your return.',
      icon: 'check',
    },
    {
      title: 'No Questions Asked',
      description: 'Return items in original condition with packaging for hassle-free processing.',
      icon: 'alert',
    },
  ],
  careTitle: 'Jewelry Care & Maintenance',
  careDescription: 'Proper care ensures your jewelry remains beautiful and lasts for generations. Follow our simple guidelines.',
  careItems: [
    {
      title: 'Regular Cleaning',
      description: 'Gently clean your jewelry with a soft cloth. Use mild soap and warm water for delicate pieces to maintain their shine.',
      icon: 'droplets',
    },
    {
      title: 'Safe Storage',
      description: 'Store jewelry in a cool, dry place. Use individual pouches or boxes to prevent scratches and tangling.',
      icon: 'wind',
    },
    {
      title: 'Avoid Chemicals',
      description: 'Remove jewelry before swimming, showering, or using harsh chemicals. Chlorine and perfumes can damage precious metals.',
      icon: 'zap',
    },
    {
      title: 'Professional Maintenance',
      description: 'Get your jewelry professionally cleaned and inspected annually to ensure clasps and settings remain secure.',
      icon: 'package',
    },
  ],
  faq: [
    {
      question: 'How do I track my order?',
      answer: 'You will receive a tracking number via email once your order ships. Use this number to track your package in real-time on our shipping partner\'s website.',
    },
    {
      question: 'What if my item arrives damaged?',
      answer: 'If your item arrives damaged, contact us immediately with photos. We will send a replacement or provide a full refund at no extra cost.',
    },
    {
      question: 'Can I return jewelry that was worn?',
      answer: 'Items must be in their original condition to qualify for returns. If the jewelry shows signs of wear or damage, it may not be eligible for return.',
    },
    {
      question: 'How do I initiate a return?',
      answer: 'Visit our Returns Center, enter your order number, and follow the steps to print your return label. Pack the item securely and drop it off at any authorized shipping location.',
    },
    {
      question: 'Is there a restocking fee?',
      answer: 'No, we do not charge any restocking fees. All eligible returns receive a full refund minus the original shipping cost.',
    },
    {
      question: 'Can I exchange an item for a different size or style?',
      answer: 'Yes! Exchanges are free within 30 days. Simply initiate a return and place a new order, or contact our customer service for assistance.',
    },
  ],
};

export default function Help() {
  const [data, setData] = useState<HelpData>(defaultData);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  useEffect(() => {
    // In a real app, you might fetch this from an API
    setData(defaultData);
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'truck':
        return <Truck className="w-6 h-6 text-[#c9a962]" />;
      case 'clock':
        return <Clock className="w-6 h-6 text-[#c9a962]" />;
      case 'package':
        return <Package className="w-6 h-6 text-[#c9a962]" />;
      case 'rotate':
        return <RotateCcw className="w-6 h-6 text-[#c9a962]" />;
      case 'check':
        return <CheckCircle className="w-6 h-6 text-[#c9a962]" />;
      case 'alert':
        return <AlertCircle className="w-6 h-6 text-[#c9a962]" />;
      case 'droplets':
        return <Droplets className="w-6 h-6 text-[#c9a962]" />;
      case 'wind':
        return <Wind className="w-6 h-6 text-[#c9a962]" />;
      case 'zap':
        return <Zap className="w-6 h-6 text-[#c9a962]" />;
      default:
        return <Package className="w-6 h-6 text-[#c9a962]" />;
    }
  };

  return (
    <div className="min-h-screen pt-8 bg-white">
      {/* Hero */}
      <div className="bg-[#faf9f7] py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-[#c9a962]">
              {data.heroSubtitle}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium text-gray-900 mt-4">
              {data.heroTitle}
            </h1>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">{data.heroDescription}</p>
          </motion.div>
        </div>
      </div>

      {/* Shipping Section */}
      <section className="py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="mb-16"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Fast & Safe</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-4">
              {data.shippingTitle}
            </h2>
            <p className="mt-3 text-gray-500 max-w-2xl">{data.shippingDescription}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.shippingItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: index * 0.1 }}
                className="bg-[#faf9f7] p-6 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4">
                  {getIcon(item.icon)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Returns Section */}
      <section className="py-24 bg-[#faf9f7]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="mb-16"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Easy Process</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-4">
              {data.returnsTitle}
            </h2>
            <p className="mt-3 text-gray-500 max-w-2xl">{data.returnsDescription}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.returnsItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-[#faf9f7] rounded-lg flex items-center justify-center mb-4">
                  {getIcon(item.icon)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Care Section */}
      <section className="py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="mb-16"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Protect Your Investment</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-4">
              {data.careTitle}
            </h2>
            <p className="mt-3 text-gray-500 max-w-2xl">{data.careDescription}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.careItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: index * 0.1 }}
                className="bg-[#faf9f7] p-6 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4">
                  {getIcon(item.icon)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="mb-16 text-center"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Common Questions</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-4">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-4">
            {data.faq.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-[#c9a962]/30 transition-colors"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  className="w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-4 bg-white hover:bg-[#faf9f7] transition-colors text-left"
                >
                  <h3 className="text-left font-semibold text-gray-900 pr-2 line-clamp-2">{item.question}</h3>
                  <motion.div
                    animate={{ rotate: expandedFAQ === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg className="w-5 h-5 text-[#c9a962]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </motion.div>
                </button>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: expandedFAQ === index ? 'auto' : 0,
                    opacity: expandedFAQ === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden bg-[#faf9f7]"
                >
                  <div className="px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-500 leading-relaxed">{item.answer}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24 bg-[#faf9f7]">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            <h2 className="text-3xl font-serif font-medium text-gray-900">Can't find what you're looking for?</h2>
            <p className="mt-4 text-gray-500">Our customer service team is here to help. Get in touch with us today.</p>
            <a
              href="/contact"
              className="inline-block mt-8 px-8 py-3 bg-gray-900 text-white text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#c9a962] transition-colors"
            >
              Contact Us
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
