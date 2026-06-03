import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Gem, CircleDollarSign, Sparkles } from 'lucide-react';
import type { NepalGoldRateRow } from '../lib/goldRates';
import { apiFetch } from '../lib/apiUrl';

type LivePrices = {
  gramsPerTola?: number;
  goldTypes?: NepalGoldRateRow[];
  rates: {
    goldPerGram: number;
    goldPerTola?: number;
    silverPerGram: number;
    silverPerTola?: number;
    silverPer10Gram?: number;
    diamondPerCarat: number;
  };
  updatedAt: string;
  stale?: boolean;
};

function formatGoldLine(row: NepalGoldRateRow) {
  return `${row.label}: रु ${row.perTola.toLocaleString('en-IN')}/tola | रु ${row.per10Gram.toLocaleString('en-IN')}/10g`;
}

export default function LivePriceStrip() {
  const [data, setData] = useState<LivePrices | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    apiFetch('/api/live-prices')
      .then((r) => r.json())
      .then((json) => {
        if (json?.error || !json?.rates) return;
        setData(json);
      })
      .catch(() => {});
  }, []);

  const itemClass =
    'flex items-center gap-1.5 px-2.5 py-1.5 bg-white/55 border border-gray-200/60 rounded-lg text-[11px] sm:text-xs text-gray-700 shrink-0';

  const tickerItems = useMemo(() => {
    if (!data?.rates) return [];
    const { rates } = data;
    const gramsPerTola = data.gramsPerTola ?? 11.664;
    const goldLines =
      data.goldTypes && data.goldTypes.length > 0
        ? data.goldTypes.map(formatGoldLine)
        : [
            `Fine Gold / Hallmark (24K): रु ${(rates.goldPerTola ?? Math.round(rates.goldPerGram * gramsPerTola)).toLocaleString('en-IN')}/tola`,
          ];

    const silverTola = rates.silverPerTola ?? Math.round(rates.silverPerGram * gramsPerTola);
    const silver10 =
      rates.silverPer10Gram ?? Math.round((silverTola * 10) / gramsPerTola);

    return [
      ...goldLines,
      `Silver: रु ${silverTola.toLocaleString('en-IN')}/tola | रु ${silver10.toLocaleString('en-IN')}/10g`,
      `Diamond: रु ${rates.diamondPerCarat.toLocaleString('en-IN')}/ct`,
      `Updated: ${new Date(data.updatedAt).toLocaleString()}${data.stale ? ' (cached)' : ''}`,
    ];
  }, [data]);

  if (!data) return null;

  const iconFor = (label: string) => {
    if (label.startsWith('Silver')) return <CircleDollarSign className="w-3 h-3 text-gray-500 shrink-0" />;
    if (label.startsWith('Diamond')) return <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />;
    if (label.startsWith('Updated')) return <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />;
    return <Gem className="w-3 h-3 text-[#c9a962] shrink-0" />;
  };

  return (
    <div className="bg-transparent border-y border-gray-200/60">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-2">
        {/* Mobile: scrollable chips */}
        <div className="md:hidden overflow-x-auto -mx-4 px-4 pb-1">
          <div className="flex gap-2 w-max max-w-none">
            {tickerItems.map((label) => (
              <div key={label} className={itemClass}>
                {iconFor(label)}
                <span className="font-medium text-gray-900">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tablet+ : animated ticker */}
        <div
          className="hidden md:block relative overflow-hidden rounded-lg border border-gray-200/60 bg-white/35 backdrop-blur-[2px] px-1.5 py-1"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white/60 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white/60 to-transparent z-10" />

          <motion.div
            className="flex gap-3 w-max"
            animate={paused ? { x: undefined } : { x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, duration: 36, ease: 'linear' }}
          >
            {[...tickerItems, ...tickerItems].map((label, i) => (
              <div key={`${label}-${i}`} className={itemClass}>
                {iconFor(label)}
                <span className="font-medium text-gray-900 whitespace-nowrap">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
