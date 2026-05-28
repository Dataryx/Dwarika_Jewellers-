import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Gem, CircleDollarSign, Sparkles } from 'lucide-react';

type LivePrices = {
  rates: {
    goldPerGram: number;
    silverPerGram: number;
    diamondPerCarat: number;
  };
  updatedAt: string;
};
const GRAMS_PER_TOLA = 11.664;

export default function LivePriceStrip() {
  const [data, setData] = useState<LivePrices | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch('/api/live-prices')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const itemClass =
    'flex items-center gap-1 px-2.5 py-1 bg-white/55 border border-gray-200/60 rounded-lg text-[10px] text-gray-700 whitespace-nowrap';
  const tickerItems = useMemo(
    () =>
      data
        ? [
            `Gold: रु ${data.rates.goldPerGram.toLocaleString('en-IN')}/gm | रु ${Math.round(data.rates.goldPerGram * GRAMS_PER_TOLA).toLocaleString('en-IN')}/tola`,
            `Silver: रु ${data.rates.silverPerGram.toLocaleString('en-IN')}/gm | रु ${Math.round(data.rates.silverPerGram * GRAMS_PER_TOLA).toLocaleString('en-IN')}/tola`,
            `Diamond: रु ${data.rates.diamondPerCarat.toLocaleString('en-IN')}/ct`,
            `Updated: ${new Date(data.updatedAt).toLocaleString()}`,
          ]
        : [],
    [data]
  );

  if (!data) return null;

  return (
    <div className="bg-transparent border-y border-gray-200/60">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-1.5">
        <div
          className="relative overflow-hidden rounded-lg border border-gray-200/60 bg-white/35 backdrop-blur-[2px] px-1.5 py-1"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white/60 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white/60 to-transparent z-10" />

          <motion.div
            className="flex gap-3 w-max"
            animate={paused ? { x: undefined } : { x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, duration: 26, ease: 'linear' }}
          >
            {[...tickerItems, ...tickerItems].map((label, i) => (
              <div key={`${label}-${i}`} className={itemClass}>
                {label.startsWith('Gold') ? (
                  <Gem className="w-2.5 h-2.5 text-[#c9a962]" />
                ) : label.startsWith('Silver') ? (
                  <CircleDollarSign className="w-2.5 h-2.5 text-gray-500" />
                ) : label.startsWith('Diamond') ? (
                  <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                ) : (
                  <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                )}
                <span className="font-medium text-gray-900">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

