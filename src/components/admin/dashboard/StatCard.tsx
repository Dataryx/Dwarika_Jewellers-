import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon?: LucideIcon;
  iconText?: string;
  iconColor: string;
  iconBg: string;
  delay?: number;
}

export default function StatCard({ title, value, change, icon: Icon, iconText, iconColor, iconBg, delay = 0 }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
          {iconText ? (
            <span className={`text-lg font-bold ${iconColor}`}>{iconText}</span>
          ) : (
            Icon && <Icon className={`w-5 h-5 ${iconColor}`} />
          )}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{change}%
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </motion.div>
  );
}
