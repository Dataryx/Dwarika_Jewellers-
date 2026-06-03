import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/apiUrl';

interface TeamMember { id: number; name: string; role: string; image: string; }
interface ValueItem { title: string; desc: string; }
interface AboutData {
  heroImage: string;
  heroSubtitle: string;
  heroTitle: string;
  storySubtitle: string;
  storyTitle: string;
  storyParagraphs: string[];
  storyImage: string;
  values: ValueItem[];
  team: TeamMember[];
}

export default function About() {
  const [data, setData] = useState<AboutData | null>(null);

  useEffect(() => {
    apiFetch('/api/about').then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 bg-white">
      {/* Hero */}
      <div className="relative h-[70vh] overflow-hidden">
        <img
          src={data.heroImage}
          alt="About"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className="text-xs font-medium tracking-[0.3em] uppercase text-[#c9a962]">{data.heroSubtitle}</span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-medium text-white mt-4">{data.heroTitle}</h1>
          </motion.div>
        </div>
      </div>

      {/* Story */}
      <section className="py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">{data.storySubtitle}</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-4 leading-tight">
                {data.storyTitle}
              </h2>
              <div className="mt-8 space-y-4 text-gray-500 leading-relaxed">
                {data.storyParagraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="relative"
            >
              <div className="aspect-[4/5] bg-[#faf9f7] overflow-hidden">
                <img
                  src={data.storyImage}
                  alt="Jewelry making"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 sm:-bottom-8 sm:-left-8 w-32 h-32 sm:w-48 sm:h-48 bg-[#c9a962]/10 -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      {data.values.length > 0 && (
        <section className="py-24 bg-[#faf9f7]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">Philosophy</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-3">Our Values</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {data.values.map((value, i) => (
                <motion.div
                  key={value.title + i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="bg-white p-8 text-center"
                >
                  <h3 className="text-sm font-semibold tracking-[0.1em] uppercase text-gray-900">{value.title}</h3>
                  <p className="text-sm text-gray-500 mt-3">{value.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team */}
      {data.team.length > 0 && (
        <section className="py-24">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#c9a962]">The Team</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-medium text-gray-900 mt-3">Meet Our Artisans</h2>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {data.team.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="group max-w-[280px]"
                >
                  <div className="aspect-[4/5] bg-[#faf9f7] overflow-hidden mb-4">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm">No photo</div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">{member.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-serif font-medium text-white">Begin Your Journey</h2>
            <p className="mt-4 text-gray-400">Discover the perfect piece that speaks to your soul</p>
            <Link to="/collections">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-10 px-10 py-4 bg-[#c9a962] text-gray-900 text-xs font-medium tracking-[0.15em] uppercase hover:bg-white transition-colors inline-flex items-center gap-3"
              >
                Explore Collection <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
