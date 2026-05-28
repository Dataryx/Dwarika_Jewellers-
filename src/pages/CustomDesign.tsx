import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Users, Sparkles, Heart, Zap, Lock } from 'lucide-react';

interface ProcessStep {
  step: number;
  title: string;
  description: string;
  icon: string;
}

const processSteps: ProcessStep[] = [
  {
    step: 1,
    title: 'Consultation',
    description: 'Meet with our master designers to discuss your vision, preferred metal, gemstones, and style preferences. We listen to every detail.',
    icon: 'pencil',
  },
  {
    step: 2,
    title: 'Design & Approval',
    description: 'Our expert designers create detailed sketches and 3D renderings of your custom design. You can make adjustments until you\'re completely satisfied.',
    icon: 'sparkles',
  },
  {
    step: 3,
    title: 'Material Selection',
    description: 'Choose from premium gold, silver, platinum, and gemstones. We help you select the perfect combination for your unique piece.',
    icon: 'heart',
  },
  {
    step: 4,
    title: 'Crafting',
    description: 'Our master craftsmen handcraft your design using traditional techniques combined with modern precision. Every detail is perfected.',
    icon: 'zap',
  },
  {
    step: 5,
    title: 'Quality Check & Delivery',
    description: 'Your custom piece undergoes rigorous quality inspection before being beautifully packaged and delivered to you.',
    icon: 'lock',
  },
];

const services = [
  {
    title: 'Bespoke Jewelry Design',
    description: 'Create a completely unique piece from scratch, tailored to your exact specifications and personal style.',
  },
  {
    title: 'Heritage Transformation',
    description: 'Transform family heirlooms and inherited jewelry into modern designs while preserving sentimental value.',
  },
  {
    title: 'Engagement Ring Design',
    description: 'Design the perfect engagement ring with your choice of stone, setting, and metal combination.',
  },
  {
    title: 'Wedding Collection',
    description: 'Create matching wedding sets that perfectly represent your love story and commitment.',
  },
];

export default function CustomDesign() {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'pencil':
        return <Pencil className="w-8 h-8 text-[#c9a962]" />;
      case 'sparkles':
        return <Sparkles className="w-8 h-8 text-[#c9a962]" />;
      case 'heart':
        return <Heart className="w-8 h-8 text-[#c9a962]" />;
      case 'zap':
        return <Zap className="w-8 h-8 text-[#c9a962]" />;
      case 'lock':
        return <Lock className="w-8 h-8 text-[#c9a962]" />;
      case 'users':
        return <Users className="w-8 h-8 text-[#c9a962]" />;
      default:
        return <Pencil className="w-8 h-8 text-[#c9a962]" />;
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
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-[#c9a962]">Bring Your Vision to Life</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium text-gray-900 mt-4">Custom Design</h1>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              Work with our master designers to create a truly one-of-a-kind piece that tells your unique story.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Why Choose Custom Section */}
      <section className="py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="mb-16"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Express Yourself</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-4">Why Custom Design?</h2>
            <p className="mt-3 text-gray-500 max-w-2xl">Custom design lets you express your individuality and create something truly meaningful.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: index * 0.1 }}
                className="bg-[#faf9f7] p-6 rounded-lg hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Design Process */}
      <section className="py-24 bg-[#faf9f7]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-16"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Collaborative Process</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-4">Design Journey</h2>
            <p className="mt-3 text-gray-500 max-w-2xl mx-auto">From concept to creation, we guide you through every step</p>
          </motion.div>

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
                    {getIcon(step.icon)}
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
              <h3 className="font-semibold text-gray-900 mb-2">How much does custom design cost?</h3>
              <p className="text-gray-600 text-sm">
                Custom design costs vary based on complexity, materials, and gemstones. We provide transparent pricing during consultation.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-[#faf9f7] p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">How long does custom design take?</h3>
              <p className="text-gray-600 text-sm">
                Typically 4-6 weeks from design approval to delivery, depending on complexity and current workload.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#faf9f7] p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Can you work with my gemstones?</h3>
              <p className="text-gray-600 text-sm">
                Yes! We can incorporate existing gemstones or source new ones according to your specifications.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-[#faf9f7] p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Do you create jewelry from sketches or ideas?</h3>
              <p className="text-gray-600 text-sm">
                Absolutely! Bring sketches, images, or just describe your ideas. Our designers will bring your vision to life.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-[#faf9f7] p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Can I make changes during the design process?</h3>
              <p className="text-gray-600 text-sm">
                Yes, we encourage feedback and modifications at every stage until you're completely happy with the design.
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
            <h2 className="text-3xl font-serif font-medium text-gray-900">Ready to create your masterpiece?</h2>
            <p className="mt-4 text-gray-500">Schedule a consultation with our master designers today.</p>
            <a
              href="/contact"
              className="inline-block mt-8 px-8 py-3 bg-gray-900 text-white text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#c9a962] transition-colors"
            >
              Schedule Consultation
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
