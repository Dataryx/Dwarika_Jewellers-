import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ShoppingCart, Eye, Download, CheckCircle, XCircle, Truck } from 'lucide-react';

const orders = [
  { id: '#ORD-7829', customer: 'Sarah Mitchell', email: 'sarah.m@email.com', date: '2024-01-15', status: 'completed', total: 284.00, items: 3, payment: 'Credit Card' },
  { id: '#ORD-7828', customer: 'James Cooper', email: 'j.cooper@email.com', date: '2024-01-15', status: 'processing', total: 156.50, items: 2, payment: 'PayPal' },
  { id: '#ORD-7827', customer: 'Emma Wilson', email: 'emma.w@email.com', date: '2024-01-14', status: 'pending', total: 89.99, items: 1, payment: 'Credit Card' },
  { id: '#ORD-7826', customer: 'Michael Brown', email: 'm.brown@email.com', date: '2024-01-14', status: 'completed', total: 445.00, items: 5, payment: 'Apple Pay' },
  { id: '#ORD-7825', customer: 'Lisa Anderson', email: 'lisa.a@email.com', date: '2024-01-13', status: 'cancelled', total: 67.25, items: 1, payment: 'Credit Card' },
  { id: '#ORD-7824', customer: 'David Lee', email: 'd.lee@email.com', date: '2024-01-13', status: 'completed', total: 312.80, items: 4, payment: 'PayPal' },
  { id: '#ORD-7823', customer: 'Rachel Green', email: 'r.green@email.com', date: '2024-01-12', status: 'shipped', total: 178.50, items: 2, payment: 'Credit Card' },
  { id: '#ORD-7822', customer: 'Tom Harris', email: 't.harris@email.com', date: '2024-01-12', status: 'processing', total: 523.00, items: 6, payment: 'Apple Pay' },
];

const statusStyles: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  pending: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-3.5 h-3.5 mr-1" />,
  processing: <ShoppingCart className="w-3.5 h-3.5 mr-1" />,
  pending: <ShoppingCart className="w-3.5 h-3.5 mr-1" />,
  shipped: <Truck className="w-3.5 h-3.5 mr-1" />,
  cancelled: <XCircle className="w-3.5 h-3.5 mr-1" />,
};

export default function Orders() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = orders.filter((o) => {
    const matchesSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || o.status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = filtered.reduce((sum, o) => o.status !== 'cancelled' ? sum + o.total : sum, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h3 className="text-xl font-semibold text-white">Orders</h3>
          <p className="text-sm text-slate-500 mt-1">Manage and track customer orders</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5">
            <p className="text-xs text-slate-500">Total Revenue</p>
            <p className="text-lg font-bold text-white">रु {totalRevenue.toLocaleString()}</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors text-sm border border-slate-700">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
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
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-500" />
          {['all', 'pending', 'processing', 'shipped', 'completed', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-accent/10 text-accent border border-accent/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Orders Table */}
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
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Order</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Date</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Items</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Payment</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Total</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-white">{order.id}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-white">{order.customer}</p>
                      <p className="text-xs text-slate-500">{order.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{order.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[order.status]}`}>
                      {statusIcons[order.status]}
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{order.items}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{order.payment}</td>
                  <td className="px-6 py-4 text-sm font-medium text-white text-right">रु {order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-auto">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
