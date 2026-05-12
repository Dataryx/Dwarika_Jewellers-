import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const products = [
  { name: 'Wireless Headphones Pro', sales: 284, revenue: '$42,600', rating: 4.8, trend: '+12%' },
  { name: 'Smart Watch Series 5', sales: 196, revenue: '$39,200', rating: 4.6, trend: '+8%' },
  { name: 'Leather Messenger Bag', sales: 152, revenue: '$22,800', rating: 4.9, trend: '+23%' },
  { name: 'Ceramic Coffee Set', sales: 128, revenue: '$12,800', rating: 4.5, trend: '+5%' },
  { name: 'Running Shoes Elite', sales: 98, revenue: '$14,700', rating: 4.7, trend: '+15%' },
];

export default function TopProducts() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
    >
      <h3 className="text-base font-semibold text-white mb-1">Top Products</h3>
      <p className="text-sm text-slate-500 mb-5">Best performing products this month</p>
      <div className="space-y-4">
        {products.map((product, i) => (
          <motion.div
            key={product.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.05 }}
            className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400 shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{product.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-accent fill-accent" />
                  <span className="text-xs text-slate-400">{product.rating}</span>
                </div>
                <span className="text-xs text-slate-600">•</span>
                <span className="text-xs text-slate-400">{product.sales} sales</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-medium text-white">{product.revenue}</p>
              <p className="text-xs text-emerald-400">{product.trend}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
