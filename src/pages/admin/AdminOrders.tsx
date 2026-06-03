import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Eye, Download, CheckCircle, XCircle, Truck, Clock, X,
  ShoppingCart, Package, Mail, User, Calendar, CreditCard, Hash, MapPin, Phone, FileDown, Loader2,
} from 'lucide-react';
import { adminFetch } from '../../lib/adminApi';
import { displayOrderId } from '../../lib/orderId';
import { downloadOrderReceiptPdf, formatPaymentMethod, getReceiptTotals } from '../../lib/orderReceipt';
import OrderFulfillmentProgress, { orderStatusIcons } from '../../components/OrderFulfillmentProgress';
import {
  matchesOrderPeriod,
  ORDER_PERIOD_LABELS,
  type OrderPeriodFilter,
} from '../../lib/orderPeriodFilter';

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: { name: string; image_url: string };
}

interface ShippingAddress {
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface Order {
  id: number;
  order_uid?: string;
  customer_name: string;
  customer_email: string;
  total: number;
  subtotal?: number;
  shipping_amount?: number;
  tax_amount?: number;
  tax_rate?: number;
  status: string;
  payment_method?: string;
  shipping_address?: ShippingAddress;
  created_at: string;
  items: OrderItem[];
}

const statusOptions = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const PAGE_SIZE = 10;
const FINAL_STATUSES = new Set(['delivered', 'cancelled']);

function isStatusLocked(status: string): boolean {
  return FINAL_STATUSES.has(status);
}

function sortOrdersNewestFirst(list: Order[]): Order[] {
  return [...list].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (tb !== ta) return tb - ta;
    return b.id - a.id;
  });
}

const statusStyles: Record<string, string> = {
  pending: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusIcons: Record<string, React.ReactNode> = orderStatusIcons;

function formatOrderDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

function formatShippingLines(shipping?: ShippingAddress): string[] {
  if (!shipping) return [];
  const lines: string[] = [];
  if (shipping.address) lines.push(shipping.address);
  const locality = [shipping.city, shipping.state, shipping.zip].filter(Boolean).join(', ');
  if (locality) lines.push(locality);
  return lines;
}

function hasShippingInfo(shipping?: ShippingAddress): boolean {
  if (!shipping) return false;
  return Boolean(shipping.phone || shipping.address || shipping.city || shipping.state || shipping.zip);
}

function formatShippingForExport(shipping?: ShippingAddress): string {
  if (!hasShippingInfo(shipping)) return '';
  const parts = [
    shipping?.address,
    [shipping?.city, shipping?.state, shipping?.zip].filter(Boolean).join(', '),
    shipping?.phone ? `Phone: ${shipping.phone}` : '',
  ].filter(Boolean);
  return parts.join(' | ');
}

function orderItemsSubtotal(items: OrderItem[]) {
  return items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
}

function StatusBadge({ status, large }: { status: string; large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 capitalize border ${statusStyles[status] || statusStyles.pending} ${
        large ? 'px-3 py-1.5 rounded-full text-sm font-medium' : 'px-2.5 py-1 rounded-full text-xs font-medium'
      }`}
    >
      {statusIcons[status]}
      {status}
    </span>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<OrderPeriodFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [storeName, setStoreName] = useState('Dwarika');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
    adminFetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data?.storeName) setStoreName(data.storeName);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, periodFilter]);

  useEffect(() => {
    if (!selectedOrder) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedOrder(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedOrder]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/orders');
      const data = await res.json();
      setOrders(sortOrdersNewestFirst(data));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || isStatusLocked(order.status)) return;

    try {
      const res = await adminFetch(`/api/orders?id=${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update status');
      }
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredOrders = sortOrdersNewestFirst(
    orders.filter(o => {
      const matchesSearch =
        search === '' ||
        o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
        String(o.id).includes(search) ||
        displayOrderId(o).toLowerCase().includes(search.toLowerCase());
      const matchesFilter = statusFilter === 'all' || o.status === statusFilter;
      const matchesPeriod = matchesOrderPeriod(o.created_at, periodFilter);
      return matchesSearch && matchesFilter && matchesPeriod;
    })
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedOrders = filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = filteredOrders.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filteredOrders.length);

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE) || 1)));
  }, [filteredOrders.length]);

  const pageNumbers = (() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  const totalRevenue = filteredOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const handleDownloadReceipt = async (order: Order) => {
    setDownloadingId(order.id);
    try {
      await downloadOrderReceiptPdf(order, storeName);
    } catch (err) {
      console.error('Failed to download receipt:', err);
    } finally {
      setDownloadingId(null);
    }
  };

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
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? 'Manage and track customer orders'
              : `${filteredOrders.length} order${filteredOrders.length === 1 ? '' : 's'} ? ${PAGE_SIZE} per page`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-2.5 min-h-[42px] w-full sm:min-w-[200px] sm:w-auto flex items-center justify-between gap-3">
            <p className="text-sm text-gray-400">Filtered Revenue</p>
            <p className="text-sm font-semibold text-white">?? {totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <button
            onClick={() => {
              const rows = filteredOrders.map((o, index) => ({
                SN: index + 1,
                OrderID: displayOrderId(o),
                Customer: o.customer_name,
                Email: o.customer_email,
                Phone: o.shipping_address?.phone || '',
                ShippingAddress: formatShippingForExport(o.shipping_address),
                PaymentMethod: formatPaymentMethod(o.payment_method),
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
            placeholder="Search by order ID, customer, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500 shrink-0" />
          {(['all', 'month', '3months', 'year'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setPeriodFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                periodFilter === f
                  ? 'bg-violet-500/10 text-violet-500 border-violet-500/30'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-300'
              }`}
            >
              {ORDER_PERIOD_LABELS[f]}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="flex items-center gap-2 flex-wrap"
      >
        <span className="text-xs text-gray-500 uppercase tracking-wider mr-1">Status</span>
        <div className="flex items-center gap-2 flex-wrap">
          {['all', ...statusOptions].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
                statusFilter === f
                  ? 'bg-violet-500/10 text-violet-500 border-violet-500/30'
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
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 sm:px-6 py-3 w-14">SN</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 sm:px-6 py-3">Order ID</th>
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
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <ShoppingCart className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No orders found</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, i) => {
                  const sn = (safePage - 1) * PAGE_SIZE + i + 1;
                  return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.04 }}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-400">{sn}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-white font-mono">{displayOrderId(order)}</td>
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
                      {isStatusLocked(order.status) ? (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${statusStyles[order.status] || statusStyles.pending}`}
                          title="Status is final and cannot be changed"
                        >
                          {statusIcons[order.status]}
                          {order.status}
                        </span>
                      ) : (
                        <select
                          value={order.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${statusStyles[order.status] || statusStyles.pending} bg-transparent cursor-pointer`}
                        >
                          {statusOptions.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{order.items?.length || 0}</td>
                    <td className="px-6 py-4 text-sm font-medium text-white text-right">?? {Number(order.total).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => void handleDownloadReceipt(order)}
                          disabled={downloadingId === order.id}
                          title="Download receipt"
                          aria-label={`Download receipt for ${displayOrderId(order)}`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400 transition-colors disabled:opacity-50"
                        >
                          {downloadingId === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileDown className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          title="View order"
                          aria-label={`View order ${displayOrderId(order)}`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-500/10 text-gray-400 hover:text-violet-400 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && filteredOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-t border-gray-700">
            <p className="text-sm text-gray-500">
              Showing {rangeStart}?{rangeEnd} of {filteredOrders.length}
              <span className="hidden sm:inline text-gray-600"> ? {PAGE_SIZE} per page</span>
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`min-w-[2.25rem] px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    n === safePage
                      ? 'border-violet-500/50 bg-violet-500/10 text-violet-400'
                      : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </motion.div>

      {/* View order modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
            onClick={() => setSelectedOrder(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-order-heading"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-gray-900 border border-violet-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-gray-700/80 shrink-0">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 id="view-order-heading" className="text-base font-semibold text-white">
                      Order details
                    </h3>
                    <p className="text-sm font-mono text-violet-300 mt-0.5 truncate">{displayOrderId(selectedOrder)}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {formatOrderDateTime(selectedOrder.created_at).date}
                      <span className="text-gray-600">?</span>
                      {formatOrderDateTime(selectedOrder.created_at).time}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-gray-500 hover:text-white shrink-0 rounded-lg hover:bg-gray-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4">
                {/* Status row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <StatusBadge status={selectedOrder.status} large />
                  {!isStatusLocked(selectedOrder.status) ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 shrink-0">Update status</span>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                        className={`capitalize px-3 py-1.5 rounded-lg text-xs font-medium border bg-gray-800 cursor-pointer ${statusStyles[selectedOrder.status] || statusStyles.pending}`}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 italic">Status is final</span>
                  )}
                </div>

                <OrderFulfillmentProgress status={selectedOrder.status} variant="admin" />

                {/* Customer, shipping & payment */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Customer</p>
                    <p className="text-sm text-white font-medium flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      {selectedOrder.customer_name}
                    </p>
                    <p className="text-sm text-gray-400 flex items-center gap-2 mt-2 break-all">
                      <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      {selectedOrder.customer_email}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Payment method</p>
                    <p className="text-sm text-white font-medium flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      {formatPaymentMethod(selectedOrder.payment_method)}
                    </p>
                    <p className="text-sm text-gray-400 flex items-center gap-2 mt-2">
                      <Hash className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      {selectedOrder.items?.length || 0} item{(selectedOrder.items?.length || 0) === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Shipping address</p>
                  {hasShippingInfo(selectedOrder.shipping_address) ? (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-300 space-y-1">
                        {formatShippingLines(selectedOrder.shipping_address).map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                        {selectedOrder.shipping_address?.phone && (
                          <p className="text-gray-400 flex items-center gap-1.5 pt-1">
                            <Phone className="w-3 h-3" />
                            {selectedOrder.shipping_address.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Not provided for this order</p>
                  )}
                </div>

                {/* Line items */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">Order items</p>
                  <div className="space-y-2">
                    {(selectedOrder.items || []).map((item) => {
                      const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-700/60 bg-gray-800/40 hover:bg-gray-800/70 transition-colors"
                        >
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-700 shrink-0 border border-gray-700/80">
                            <img
                              src={item.product?.image_url || '/placeholder.jpg'}
                              alt={item.product?.name || 'Product'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{item.product?.name || 'Product'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              ?? {Number(item.price).toLocaleString('en-IN')} ?- {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-white shrink-0">
                            ?? {lineTotal.toLocaleString('en-IN')}
                          </p>
                        </div>
                      );
                    })}
                    {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                      <div className="rounded-xl border border-dashed border-gray-700 py-8 text-center">
                        <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No item details available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {(() => {
                  const totals = getReceiptTotals(selectedOrder);
                  return (
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Subtotal ({selectedOrder.items?.length || 0} items)</span>
                    <span>?? {totals.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Shipping</span>
                    <span>{totals.shipping === 0 ? 'Free' : `?? ${totals.shipping.toLocaleString('en-IN')}`}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Tax ({totals.taxRate}%)</span>
                    <span>?? {totals.tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-violet-500/20">
                    <span className="text-sm font-medium text-white">Order total</span>
                    <span className="text-lg font-semibold text-violet-300">
                      ?? {totals.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 p-5 sm:p-6 border-t border-gray-700/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => void downloadOrderReceiptPdf(selectedOrder, storeName)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Download receipt (PDF)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
