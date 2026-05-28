import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Scale, FileText, Truck, CheckCircle } from 'lucide-react';

interface ProcessStep {
  step: number;
  title: string;
  description: string;
  icon: string;
}

const processSteps: ProcessStep[] = [
  {
    step: 1,
    title: 'Get Your Gold Assessed',
    description: 'Bring your old gold or silver jewelry to our store. Our expert jewelers will professionally assess the purity, weight, and condition of your items.',
    icon: 'scale',
  },
  {
    step: 2,
    title: 'Receive Valuation',
    description: 'We provide a transparent valuation based on current market rates. You\'ll receive a detailed report showing the exact weight, purity, and assessed value.',
    icon: 'dollar',
  },
  {
    step: 3,
    title: 'Review & Approve',
    description: 'Review the valuation and decide if you want to proceed. Our team will explain the entire process and answer any questions you may have.',
    icon: 'file',
  },
  {
    step: 4,
    title: 'Exchange or Sell',
    description: 'Choose to exchange your gold for new jewelry designs or sell it outright. Get credit towards your purchase or instant payment.',
    icon: 'truck',
  },
  {
    step: 5,
    title: 'Complete Transaction',
    description: 'Finalize your exchange or sale. Receive your new jewelry or payment, and you\'re all set!',
    icon: 'check',
  },
];

export default function ExchangeGold() {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'scale':
        return <Scale className="w-8 h-8 text-[#c9a962]" />;
      case 'dollar':
        return <DollarSign className="w-8 h-8 text-[#c9a962]" />;
      case 'file':
        return <FileText className="w-8 h-8 text-[#c9a962]" />;
      case 'truck':
        return <Truck className="w-8 h-8 text-[#c9a962]" />;
      case 'check':
        return <CheckCircle className="w-8 h-8 text-[#c9a962]" />;
      default:
        return <DollarSign className="w-8 h-8 text-[#c9a962]" />;
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
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-[#c9a962]">Upgrade Your Collection</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium text-gray-900 mt-4">Exchange Gold & Silver</h1>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              Transform your old precious metals into stunning new jewelry. Our expert appraisers ensure fair value for your items.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Info Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="bg-[#faf9f7] p-8 rounded-lg"
          >
            <h2 className="text-2xl font-serif font-medium text-gray-900 mb-4">What We Accept</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="text-[#c9a962] font-bold mt-1">•</span>
                <span>Gold jewelry in any condition (rings, necklaces, earrings, bracelets, bangles)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#c9a962] font-bold mt-1">•</span>
                <span>Silver jewelry and items</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#c9a962] font-bold mt-1">•</span>
                <span>Broken or damaged gold (we repurpose it)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#c9a962] font-bold mt-1">•</span>
                <span>Gold coins and bars</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#c9a962] font-bold mt-1">•</span>
                <span>Mixed pieces with gemstones</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Process Flow */}
      <section className="py-24 bg-[#faf9f7]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-16"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Simple & Transparent</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-4">Exchange Process</h2>
            <p className="mt-3 text-gray-500 max-w-2xl mx-auto">Follow these simple steps to exchange your precious metals</p>
          </motion.div>

          {/* Process Steps */}
          <div className="space-y-6">
            {processSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: index * 0.1 }}
                className="flex items-center gap-8"
              >
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-20 w-20 rounded-full bg-white border-2 border-[#c9a962]">
                    <div className="text-center">
                      <div className="text-[#c9a962] mb-1">{getIcon(`${step.icon}`)}</div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-white p-6 rounded-lg">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-sm font-semibold text-[#c9a962] bg-[#c9a962]/10 px-3 py-1 rounded">
                      Step {step.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Timeline connector */}
          <div className="mt-12 mx-auto w-1 h-24 bg-gradient-to-b from-[#c9a962] to-transparent opacity-20" />
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
              <h3 className="font-semibold text-gray-900 mb-2">How is the value of my gold determined?</h3>
              <p className="text-gray-600 text-sm">
                The value is based on the current market price of gold/silver, combined with the verified weight and purity of your items. Our certified weighing scale and testing equipment ensure accuracy.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-[#faf9f7] p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Can I exchange broken jewelry?</h3>
              <p className="text-gray-600 text-sm">
                Absolutely! Broken or damaged jewelry is perfect for exchange. We assess the pure metal content regardless of condition and provide fair value for it.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#faf9f7] p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Do you deduct making charges?</h3>
              <p className="text-gray-600 text-sm">
                We offer competitive exchange rates. When exchanging for new jewelry, the assessed value is credited toward your new purchase. Making charges apply only to the new design.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-[#faf9f7] p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">What if I want to sell instead of exchange?</h3>
              <p className="text-gray-600 text-sm">
                We offer both options! You can either exchange your gold for new jewelry or sell it for instant payment. The valuation process is the same for both.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-[#faf9f7] p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">How long does the process take?</h3>
              <p className="text-gray-600 text-sm">
                The entire process typically takes 30-45 minutes. We assess your items, provide valuation, and complete the transaction on the same day.
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
            <h2 className="text-3xl font-serif font-medium text-gray-900">Ready to exchange?</h2>
            <p className="mt-4 text-gray-500">Visit our store today with your precious metals. Our expert team is ready to help!</p>
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
