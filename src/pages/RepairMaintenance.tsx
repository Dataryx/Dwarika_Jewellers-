import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Sparkles, Shield, AlertCircle, DollarSign, Clock } from 'lucide-react';

interface ServiceItem {
  title: string;
  description: string;
  icon: string;
}

const services: ServiceItem[] = [
  {
    title: 'Ring Resizing & Adjustments',
    description: 'Perfect fit guaranteed. We resize rings to your exact specifications while maintaining structural integrity.',
    icon: 'wrench',
  },
  {
    title: 'Cleaning & Polishing',
    description: 'Restore your jewelry to its original brilliance with our professional cleaning and polishing services.',
    icon: 'sparkles',
  },
  {
    title: 'Stone Setting & Replacement',
    description: 'Secure loose gemstones or replace damaged ones. Our experts handle precious and semi-precious stones.',
    icon: 'shield',
  },
  {
    title: 'Broken Joint & Clasp Repair',
    description: 'Fix broken chains, clasps, and joints. We repair with precision to ensure longevity.',
    icon: 'wrench',
  },
  {
    title: 'Metal Work & Soldering',
    description: 'Professional soldering, welding, and metal work for all types of jewelry repairs.',
    icon: 'zap',
  },
  {
    title: 'Custom Modifications',
    description: 'Modify existing pieces to fit your style or needs. From shortening to complete redesigns.',
    icon: 'sparkles',
  },
];

const maintenanceTips = [
  {
    title: 'Remove Before Activities',
    description: 'Take off jewelry before swimming, exercising, or doing household chores to prevent damage.',
  },
  {
    title: 'Store Properly',
    description: 'Keep jewelry in individual pouches or boxes to prevent scratches and tangles.',
  },
  {
    title: 'Regular Cleaning',
    description: 'Clean gently with a soft cloth and mild soap. Avoid harsh chemicals and ultrasonic cleaners.',
  },
  {
    title: 'Professional Check-ups',
    description: 'Visit us annually for professional inspection and maintenance to catch issues early.',
  },
];

export default function RepairMaintenance() {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'wrench':
        return <Wrench className="w-8 h-8 text-[#c9a962]" />;
      case 'sparkles':
        return <Sparkles className="w-8 h-8 text-[#c9a962]" />;
      case 'shield':
        return <Shield className="w-8 h-8 text-[#c9a962]" />;
      case 'zap':
        return <AlertCircle className="w-8 h-8 text-[#c9a962]" />;
      default:
        return <Wrench className="w-8 h-8 text-[#c9a962]" />;
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
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-[#c9a962]">Keep Your Jewelry Perfect</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium text-gray-900 mt-4">Repair & Maintenance</h1>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              Extend the life of your precious jewelry with our expert repair and maintenance services.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Services Grid */}
      <section className="py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="mb-16"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Expert Services</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-4">What We Repair & Maintain</h2>
            <p className="mt-3 text-gray-500 max-w-2xl">Our skilled craftsmen handle all types of jewelry repairs with precision and care.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: index * 0.1 }}
                className="bg-[#faf9f7] p-6 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4">
                  {getIcon(service.icon)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Maintenance Tips */}
      <section className="py-24 bg-[#faf9f7]">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-16"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Prevention</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-4">Maintenance Tips</h2>
            <p className="mt-3 text-gray-500">Follow these tips to keep your jewelry in perfect condition for years to come.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {maintenanceTips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg border border-gray-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{tip.title}</h3>
                <p className="text-gray-600 leading-relaxed">{tip.description}</p>
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
            className="text-center mb-16"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Questions?</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-4">FAQs</h2>
          </motion.div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[#faf9f7] p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">How much does jewelry repair cost?</h3>
              <p className="text-gray-600 text-sm">
                Repair costs vary based on the type and extent of damage. We provide free assessments and transparent pricing estimates.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-[#faf9f7] p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">How long do repairs take?</h3>
              <p className="text-gray-600 text-sm">
                Most repairs take 3-7 business days. Complex repairs may take longer. We'll provide a timeline during assessment.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#faf9f7] p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Do you offer warranties on repairs?</h3>
              <p className="text-gray-600 text-sm">
                Yes! We provide a 6-month warranty on all repairs. If the repair fails, we'll fix it free of charge.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-[#faf9f7] p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Can you repair jewelry from other stores?</h3>
              <p className="text-gray-600 text-sm">
                Absolutely! We repair jewelry from any jeweler. Bring your piece in for a free assessment.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-[#faf9f7] p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">How often should I get my jewelry cleaned professionally?</h3>
              <p className="text-gray-600 text-sm">
                We recommend professional cleaning and inspection once or twice a year, depending on how often you wear the jewelry.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#faf9f7]">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            <h2 className="text-3xl font-serif font-medium text-gray-900">Bring your jewelry in for care</h2>
            <p className="mt-4 text-gray-500">Visit our store for a free assessment and expert repairs.</p>
            <a
              href="/contact"
              className="inline-block mt-8 px-8 py-3 bg-gray-900 text-white text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#c9a962] transition-colors"
            >
              Visit Our Store
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
