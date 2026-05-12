import { motion } from 'framer-motion';
import { Package } from 'lucide-react';

interface TopProduct {
  name: string;
  sales: number;
  revenue: string;
  stock: number;
}

interface TopProductsProps {
  products: TopProduct[];
}

export default function TopProducts({ products }: TopProductsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6"
    >
      <h3 className="text-base font-semibold text-white mb-1">Top Products</h3>
      <p className="text-sm text-gray-500 mb-5">Best performing products by sales</p>
      <div className="space-y-4">
        {products.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No sales data yet</p>
        )}
        {products.map((product, i) => (
          <motion.div
            key={product.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.05 }}
            className="flex items-center gap-4 p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{product.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Package className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-400">{product.sales} sold</span>
                <span className="text-xs text-gray-600">&middot;</span>
                <span className={`text-xs ${product.stock <= 5 ? 'text-amber-400' : 'text-gray-400'}`}>
                  {product.stock} in stock
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-medium text-white">{product.revenue}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
