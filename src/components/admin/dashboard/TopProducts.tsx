import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { useState } from 'react';

interface TopProduct {
  name: string;
  sales: number;
  revenue: string;
  stock: number;
}

interface TopProductsProps {
  products: TopProduct[];
}

/** Distinct colors so each product is easy to tell apart on the dashboard. */
const PRODUCT_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-700', bar: 'bg-violet-500', soft: 'bg-violet-50' },
  { bg: 'bg-pink-100', text: 'text-pink-700', bar: 'bg-pink-500', soft: 'bg-pink-50' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500', soft: 'bg-emerald-50' },
  { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500', soft: 'bg-blue-50' },
  { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500', soft: 'bg-amber-50' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', bar: 'bg-cyan-500', soft: 'bg-cyan-50' },
  { bg: 'bg-rose-100', text: 'text-rose-700', bar: 'bg-rose-500', soft: 'bg-rose-50' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', bar: 'bg-indigo-500', soft: 'bg-indigo-50' },
];

export default function TopProducts({ products }: TopProductsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));
  const visibleProducts = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const maxSales = Math.max(1, ...products.map((p) => p.sales));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-white border border-slate-200 rounded-2xl p-6 h-full flex flex-col"
    >
      <h3 className="text-base font-semibold text-slate-900 mb-1">Top Products</h3>
      <p className="text-sm text-slate-500 mb-5">Best performing products by sales</p>
      <div className="space-y-4 flex-1 min-h-[360px]">
        {products.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">No sales data yet</p>
        )}
        {visibleProducts.map((product, i) => {
          const globalIndex = (currentPage - 1) * itemsPerPage + i;
          const color = PRODUCT_COLORS[globalIndex % PRODUCT_COLORS.length];
          const widthPct = Math.max(6, Math.round((product.sales / maxSales) * 100));
          return (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.05 }}
              className={`flex items-center gap-4 p-3 rounded-xl ${color.soft} hover:brightness-[0.98] transition-[filter]`}
            >
              <div
                className={`w-10 h-10 rounded-lg ${color.bg} flex items-center justify-center text-sm font-bold ${color.text} shrink-0`}
              >
                {globalIndex + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Package className={`w-3 h-3 ${color.text}`} />
                  <span className="text-xs text-slate-500">{product.sales} sold</span>
                  <span className="text-xs text-slate-400">&middot;</span>
                  <span className={`text-xs ${product.stock <= 5 ? 'text-red-600' : 'text-slate-400'}`}>
                    {product.stock} in stock
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color.bar}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-slate-900">{product.revenue}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      {products.length > 0 && (
        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-300 hover:text-violet-600 transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  page === currentPage
                    ? 'border-violet-600 bg-violet-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-300 hover:text-violet-600 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
