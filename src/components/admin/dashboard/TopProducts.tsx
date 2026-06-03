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

export default function TopProducts({ products }: TopProductsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));
  const visibleProducts = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 h-full flex flex-col"
    >
      <h3 className="text-base font-semibold text-white mb-1">Top Products</h3>
      <p className="text-sm text-gray-500 mb-5">Best performing products by sales</p>
      <div className="space-y-4 flex-1 min-h-[360px]">
        {products.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No sales data yet</p>
        )}
        {visibleProducts.map((product, i) => (
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
                <span className={`text-xs ${product.stock <= 5 ? 'text-violet-400' : 'text-gray-400'}`}>
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
      {products.length > 0 && (
        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#c9a962] hover:text-[#c9a962] transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${page === currentPage ? 'border-[#c9a962] bg-[#c9a962] text-white' : 'border-gray-700 text-gray-300 hover:border-[#c9a962] hover:text-[#c9a962]'}`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#c9a962] hover:text-[#c9a962] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
