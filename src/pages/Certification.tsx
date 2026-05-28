import { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle, Shield, Zap, FileText, Gem } from 'lucide-react';

interface CertificationBenefit {
  title: string;
  description: string;
  icon: string;
}

const benefits: CertificationBenefit[] = [
  {
    title: 'Authenticity Guarantee',
    description: 'Expert verification of metal purity and authenticity from certified gemologists.',
    icon: 'award',
  },
  {
    title: 'Detailed Documentation',
    description: 'Comprehensive certification reports with specifications, quality details, and value assessment.',
    icon: 'file',
  },
  {
    title: 'Resale Value',
    description: 'Certified jewelry commands higher resale value and buyer confidence in the marketplace.',
    icon: 'dollar',
  },
  {
    title: 'Insurance Support',
    description: 'Certification provides documentation needed for insurance claims and coverage purposes.',
    icon: 'shield',
  },
  {
    title: 'Gemstone Grading',
    description: 'Professional grading of diamonds and precious gems using international standards.',
    icon: 'gem',
  },
  {
    title: 'Expert Assessment',
    description: 'Detailed assessment by certified professionals with years of industry experience.',
    icon: 'check',
  },
];

const certificationTypes = [
  {
    title: 'Diamond Certification',
    description: 'Professional grading and certification of diamonds including the 4 Cs: Carat, Color, Clarity, and Cut.',
    features: ['Detailed grading report', 'Laser inscription', 'International standards', 'Lifetime validity'],
  },
  {
    title: 'Precious Gem Certification',
    description: 'Certification for rubies, sapphires, emeralds, and other precious gemstones.',
    features: ['Origin verification', 'Treatment disclosure', 'Quality assessment', 'Value documentation'],
  },
  {
    title: 'Metal Purity Certification',
    description: 'Verification and certification of gold, silver, platinum, and other precious metals.',
    features: ['Purity testing', 'Weight verification', 'Hallmarking', 'Quality report'],
  },
  {
    title: 'Complete Jewelry Certification',
    description: 'Comprehensive certification for complete jewelry pieces with gemstones and metals.',
    features: ['Overall assessment', 'Detailed specifications', 'Workmanship evaluation', 'Complete documentation'],
  },
];

export default function Certification() {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'award':
        return <Award className="w-8 h-8 text-[#c9a962]" />;
      case 'check':
        return <CheckCircle className="w-8 h-8 text-[#c9a962]" />;
      case 'shield':
        return <Shield className="w-8 h-8 text-[#c9a962]" />;
      case 'zap':
        return <Zap className="w-8 h-8 text-[#c9a962]" />;
      case 'file':
        return <FileText className="w-8 h-8 text-[#c9a962]" />;
      case 'gem':
        return <Gem className="w-8 h-8 text-[#c9a962]" />;
      case 'dollar':
        return <Award className="w-8 h-8 text-[#c9a962]" />;
      default:
        return <Award className="w-8 h-8 text-[#c9a962]" />;
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
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-[#c9a962]">Expert Verification</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium text-gray-900 mt-4">Certification Services</h1>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              Get professional certification for your precious jewelry. Authenticate, evaluate, and document your treasures.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Benefits Grid */}
      <section className="py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="mb-16"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Why Certify?</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-4">Benefits of Certification</h2>
            <p className="mt-3 text-gray-500 max-w-2xl">Certification provides assurance, documentation, and value for your precious jewelry.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: index * 0.1 }}
                className="bg-[#faf9f7] p-6 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4">
                  {getIcon(benefit.icon)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certification Types */}
      <section className="py-24 bg-[#faf9f7]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-16"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Comprehensive Coverage</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-4">Types of Certification</h2>
            <p className="mt-3 text-gray-500 max-w-2xl mx-auto">We provide specialized certification for all types of jewelry and precious materials.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {certificationTypes.map((cert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: index * 0.1 }}
                className="bg-white p-8 rounded-lg border border-gray-200"
              >
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">{cert.title}</h3>
                <p className="text-gray-600 mb-6">{cert.description}</p>
                <div className="space-y-3">
                  {cert.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#c9a962] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-16"
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Simple Process</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-4">Certification Process</h2>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-[#faf9f7] p-6 rounded-lg border-l-4 border-[#c9a962]"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Bring Your Jewelry</h3>
              <p className="text-gray-600">Visit our store with the jewelry you wish to certify. Our experts will assess its condition.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="bg-[#faf9f7] p-6 rounded-lg border-l-4 border-[#c9a962]"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Expert Evaluation</h3>
              <p className="text-gray-600">Our certified gemologists conduct detailed testing, grading, and authentication of your items.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-[#faf9f7] p-6 rounded-lg border-l-4 border-[#c9a962]"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Documentation</h3>
              <p className="text-gray-600">Receive comprehensive certification documents with detailed specifications, grades, and assessments.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-[#faf9f7] p-6 rounded-lg border-l-4 border-[#c9a962]"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Peace of Mind</h3>
              <p className="text-gray-600">Keep your certification for insurance, resale value, and peace of mind. Valid worldwide.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-[#faf9f7]">
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
              className="bg-white p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">How long does certification take?</h3>
              <p className="text-gray-600 text-sm">
                Most certifications take 3-5 business days. We can expedite for urgent requests at an additional cost.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">How much does certification cost?</h3>
              <p className="text-gray-600 text-sm">
                Certification costs vary based on the type and complexity. We provide transparent pricing during evaluation.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Are the certificates internationally recognized?</h3>
              <p className="text-gray-600 text-sm">
                Yes! Our certifications follow international standards and are recognized worldwide for resale and insurance purposes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">Can I certify antique or vintage jewelry?</h3>
              <p className="text-gray-600 text-sm">
                Absolutely! We specialize in certifying antique and vintage pieces. Our experts assess historical significance and condition.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white p-6 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-2">How long is the certificate valid?</h3>
              <p className="text-gray-600 text-sm">
                Our certifications are valid for a lifetime. However, if jewelry is damaged or modified, recertification is recommended.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            <h2 className="text-3xl font-serif font-medium text-gray-900">Get your jewelry certified today</h2>
            <p className="mt-4 text-gray-500">Bring your precious items to our store for professional certification and peace of mind.</p>
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
