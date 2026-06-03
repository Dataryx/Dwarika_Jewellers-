import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, MoreHorizontal, Package, Edit, Trash2, Eye } from 'lucide-react';

const products = [
  { id: 1, name: 'Wireless Headphones Pro', category: 'Electronics', price: 149.99, stock: 45, status: 'active', sales: 284, image: 'bg-blue-500/20' },
  { id: 2, name: 'Smart Watch Series 5', category: 'Electronics', price: 199.99, stock: 32, status: 'active', sales: 196, image: 'bg-purple-500/20' },
  { id: 3, name: 'Leather Messenger Bag', category: 'Fashion', price: 149.99, stock: 3, status: 'low', sales: 152, image: 'bg-violet-500/20' },
  { id: 4, name: 'Ceramic Coffee Set', category: 'Home', price: 99.99, stock: 28, status: 'active', sales: 128, image: 'bg-emerald-500/20' },
  { id: 5, name: 'Running Shoes Elite', category: 'Sports', price: 149.99, stock: 0, status: 'out', sales: 98, image: 'bg-pink-500/20' },
  { id: 6, name: 'Minimalist Desk Lamp', category: 'Home', price: 79.99, stock: 56, status: 'active', sales: 87, image: 'bg-teal-500/20' },
  { id: 7, name: 'Bluetooth Speaker Mini', category: 'Electronics', price: 59.99, stock: 120, status: 'active', sales: 234, image: 'bg-blue-500/20' },
  { id: 8, name: 'Yoga Mat Premium', category: 'Sports', price: 45.99, stock: 67, status: 'active', sales: 156, image: 'bg-emerald-500/20' },
];

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  low: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  out: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function Products() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h3 className="text-xl font-semibold text-white">Products</h3>
          <p className="text-sm text-slate-500 mt-1">Manage your product catalog</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-slate-950 font-semibold rounded-xl transition-colors text-sm">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          {['all', 'active', 'low', 'out'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-accent/10 text-accent border border-accent/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-300'
              }`}
            >
              {f === 'out' ? 'Out of Stock' : f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Product</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Category</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Price</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Stock</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Sales</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${product.image} flex items-center justify-center`}>
                        <Package className="w-5 h-5 text-slate-400" />
                      </div>
                      <span className="text-sm font-medium text-white">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{product.category}</td>
                  <td className="px-6 py-4 text-sm font-medium text-white">रु {product.price}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{product.stock}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[product.status]}`}>
                      {product.status === 'out' ? 'Out of Stock' : product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{product.sales}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No products found</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
