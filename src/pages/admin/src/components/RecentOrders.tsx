import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const orders = [
  { id: '#ORD-7829', customer: 'Sarah Mitchell', email: 'sarah.m@email.com', status: 'completed', total: 'रु 284.00', date: '2 min ago' },
  { id: '#ORD-7828', customer: 'James Cooper', email: 'j.cooper@email.com', status: 'processing', total: 'रु 156.50', date: '15 min ago' },
  { id: '#ORD-7827', customer: 'Emma Wilson', email: 'emma.w@email.com', status: 'pending', total: 'रु 89.99', date: '32 min ago' },
  { id: '#ORD-7826', customer: 'Michael Brown', email: 'm.brown@email.com', status: 'completed', total: 'रु 445.00', date: '1 hr ago' },
  { id: '#ORD-7825', customer: 'Lisa Anderson', email: 'lisa.a@email.com', status: 'cancelled', total: 'रु 67.25', date: '2 hrs ago' },
  { id: '#ORD-7824', customer: 'David Lee', email: 'd.lee@email.com', status: 'completed', total: 'रु 312.80', date: '3 hrs ago' },
];

const statusStyles: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  pending: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function RecentOrders() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
        <h3 className="text-base font-semibold text-white">Recent Orders</h3>
        <button className="flex items-center gap-1 text-sm text-accent hover:text-accent-hover transition-colors">
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Order</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Customer</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Total</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => (
              <motion.tr
                key={order.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium text-white">{order.id}</td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-white">{order.customer}</p>
                    <p className="text-xs text-slate-500">{order.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-white">{order.total}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{order.date}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
