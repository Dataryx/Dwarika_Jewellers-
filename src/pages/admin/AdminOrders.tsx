import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, Eye, Download, CheckCircle, XCircle, Truck, Clock, X,
  ShoppingCart, Package,
} from 'lucide-react';

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: { name: string; image_url: string };
}

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5 mr-1" />,
  confirmed: <CheckCircle className="w-3.5 h-3.5 mr-1" />,
  processing: <ShoppingCart className="w-3.5 h-3.5 mr-1" />,
  shipped: <Truck className="w-3.5 h-3.5 mr-1" />,
  delivered: <Package className="w-3.5 h-3.5 mr-1" />,
  completed: <CheckCircle className="w-3.5 h-3.5 mr-1" />,
  cancelled: <XCircle className="w-3.5 h-3.5 mr-1" />,
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      await fetch(`/api/orders?id=${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      search === '' ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search);
    const matchesFilter = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = filteredOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

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
          <p className="text-sm text-gray-500 mt-1">Manage and track customer orders</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-2.5 h-[42px] min-w-[250px] flex items-center justify-between gap-3">
            <p className="text-sm text-gray-400">Filtered Revenue</p>
            <p className="text-sm font-semibold text-white">रु {totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <button
            onClick={() => {
              const rows = filteredOrders.map(o => ({
                OrderID: o.id,
                Customer: o.customer_name,
                Email: o.customer_email,
                Status: o.status,
                Items: o.items?.length || 0,
                Total: o.total,
                Date: new Date(o.created_at).toLocaleDateString(),
              }));
              const headers = Object.keys(rows[0] || {});
              const csv = [
                headers.join(','),
                ...rows.map(r => headers.map(h => `"${String((r as Record<string, unknown>)[h] ?? '').replace(/"/g, '""')}"`).join(',')),
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors text-sm border border-gray-700"
          >
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
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by customer, email, or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500 shrink-0" />
          {['all', ...statusOptions].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
                statusFilter === f
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-300'
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
        className="bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Order</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Items</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Total</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <ShoppingCart className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No orders found</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.04 }}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-white">#{order.id}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">{order.customer_name}</p>
                        <p className="text-xs text-gray-500">{order.customer_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[order.status] || statusStyles.pending} bg-transparent cursor-pointer`}
                      >
                        {statusOptions.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{order.items?.length || 0}</td>
                    <td className="px-6 py-4 text-sm font-medium text-white text-right">रु {Number(order.total).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ml-auto"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </motion.div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4" onClick={() => setSelectedOrder(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl p-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-white">Order #{selectedOrder.id} Details</h4>
                <p className="text-xs text-gray-400 mt-1">Customer order details</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Customer</p>
                <p className="text-sm text-white mt-1">{selectedOrder.customer_name}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Email</p>
                <p className="text-sm text-white mt-1 truncate">{selectedOrder.customer_email}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Date</p>
                <p className="text-sm text-white mt-1">{new Date(selectedOrder.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Total</p>
                <p className="text-sm text-white mt-1">रु {Number(selectedOrder.total).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {(selectedOrder.items || []).map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                  <img
                    src={item.product?.image_url || '/placeholder.jpg'}
                    alt={item.product?.name}
                    className="w-11 h-11 rounded-lg object-cover bg-gray-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.product?.name}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-white">रु {Number(item.price).toLocaleString('en-IN')}</p>
                </div>
              ))}
              {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                <p className="text-sm text-gray-500">No item details available</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
