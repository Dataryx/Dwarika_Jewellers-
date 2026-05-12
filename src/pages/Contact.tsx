import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, Check, Loader2 } from 'lucide-react';

interface ContactInfo {
  heroSubtitle: string;
  heroTitle: string;
  heroDescription: string;
  storeHeading: string;
  storeDescription: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  mapEmbedUrl: string;
}

export default function Contact() {
  const [info, setInfo] = useState<ContactInfo | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch('/api/contact-info').then((r) => r.json()).then(setInfo).catch(() => {});
  }, []);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSent(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setSent(false), 5000);
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  const inputClass =
    'w-full px-4 py-3 bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962]/20 transition-all';

  const nl2br = (text: string) => text.split('\n').map((line, i) => <span key={i}>{line}{i < text.split('\n').length - 1 && <br />}</span>);

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
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-[#c9a962]">{info.heroSubtitle}</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium text-gray-900 mt-4">{info.heroTitle}</h1>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">{info.heroDescription}</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <section className="py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-5 gap-16">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="lg:col-span-2 space-y-10"
            >
              <div>
                <h2 className="text-2xl font-serif font-medium text-gray-900">{info.storeHeading}</h2>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">{info.storeDescription}</p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#faf9f7] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#c9a962]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Address</h3>
                    <p className="text-sm text-gray-500 mt-1">{nl2br(info.address)}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#faf9f7] flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-[#c9a962]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Phone</h3>
                    <p className="text-sm text-gray-500 mt-1">{info.phone}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#faf9f7] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-[#c9a962]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Email</h3>
                    <p className="text-sm text-gray-500 mt-1">{info.email}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#faf9f7] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-[#c9a962]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Opening Hours</h3>
                    <p className="text-sm text-gray-500 mt-1">{nl2br(info.openingHours)}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="lg:col-span-3"
            >
              <div className="bg-[#faf9f7] p-8 sm:p-10">
                <h2 className="text-2xl font-serif font-medium text-gray-900 mb-2">Send a Message</h2>
                <p className="text-sm text-gray-500 mb-8">Fill out the form below and we'll get back to you as soon as possible.</p>

                {sent ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-serif font-medium text-gray-900">Message Sent!</h3>
                    <p className="text-sm text-gray-500 mt-2">Thank you for reaching out. We'll respond shortly.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs font-medium tracking-wider uppercase text-gray-600 mb-2 block">Full Name</label>
                        <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required placeholder="Your name" className={inputClass} />
                      </div>
                      <div>
                        <label className="text-xs font-medium tracking-wider uppercase text-gray-600 mb-2 block">Email</label>
                        <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required placeholder="your@email.com" className={inputClass} />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs font-medium tracking-wider uppercase text-gray-600 mb-2 block">Phone</label>
                        <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+977 98XXXXXXXX" className={inputClass} />
                      </div>
                      <div>
                        <label className="text-xs font-medium tracking-wider uppercase text-gray-600 mb-2 block">Subject</label>
                        <input type="text" value={form.subject} onChange={(e) => update('subject', e.target.value)} required placeholder="How can we help?" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium tracking-wider uppercase text-gray-600 mb-2 block">Message</label>
                      <textarea value={form.message} onChange={(e) => update('message', e.target.value)} required rows={5} placeholder="Tell us more about your inquiry..." className={`${inputClass} resize-y`} />
                    </div>
                    <motion.button
                      type="submit"
                      disabled={sending}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full sm:w-auto px-10 py-4 bg-gray-900 text-white text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#c9a962] transition-colors inline-flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {sending ? 'Sending...' : 'Send Message'}
                    </motion.button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map */}
      {info.mapEmbedUrl && (
        <section className="bg-[#faf9f7]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
            <div className="aspect-[16/5] bg-gray-200 flex items-center justify-center rounded-lg overflow-hidden">
              <iframe
                src={info.mapEmbedUrl}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Store Location"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
