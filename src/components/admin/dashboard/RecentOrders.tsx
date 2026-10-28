import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { displayOrderId } from '../../../lib/orderId';

interface Order {
  id: number;
  order_uid?: string;
  customer_name: string;
  customer_email: string;
  status: string;
  total: number;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-violet-50 text-violet-600 border-violet-200',
  confirmed: 'bg-blue-50 text-blue-600 border-blue-500/20',
  processing: 'bg-blue-50 text-blue-600 border-blue-500/20',
  shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered: 'bg-emerald-50 text-emerald-600 border-emerald-500/20',
  completed: 'bg-emerald-50 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-red-50 text-red-600 border-red-500/20',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

interface RecentOrdersProps {
  orders: Order[];
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(orders.length / itemsPerPage));
  const visibleOrders = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden h-full flex flex-col"
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
        <h3 className="text-base font-semibold text-slate-900">Recent Orders</h3>
        <Link to="/orders" className="flex items-center gap-1 text-sm text-violet-500 hover:text-violet-600 transition-colors">
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="overflow-x-auto flex-1 min-h-[360px]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Order ID</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Customer</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Total</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No orders yet</td>
              </tr>
            ) : (
              visibleOrders.map((order, i) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="border-b border-slate-200/50 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 font-mono">{displayOrderId(order)}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{order.customer_name}</p>
                      <p className="text-xs text-slate-500">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[order.status] || statusStyles.pending}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">रु {Number(order.total).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{timeAgo(order.created_at)}</td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {orders.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#c9a962] hover:text-[#c9a962] transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${page === currentPage ? 'border-[#c9a962] bg-[#c9a962] text-slate-900' : 'border-slate-200 text-slate-600 hover:border-[#c9a962] hover:text-[#c9a962]'}`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#c9a962] hover:text-[#c9a962] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
