import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, XCircle, Truck, FileDown, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/apiUrl';
import { displayOrderId } from '../lib/orderId';
import {
  matchesOrderPeriod,
  ORDER_PERIOD_LABELS,
  type OrderPeriodFilter,
} from '../lib/orderPeriodFilter';
import OrderFulfillmentProgress from '../components/OrderFulfillmentProgress';
import { downloadOrderReceiptPdf, type ReceiptOrder, getReceiptTotals } from '../lib/orderReceipt';

interface ShippingAddress {
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: {
    name: string;
    image_url: string;
    material: string;
  };
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

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<OrderPeriodFilter>('all');
  const [storeName, setStoreName] = useState('Dwarika');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    apiFetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data?.storeName) setStoreName(data.storeName);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.email) { setLoading(false); return; }
      try {
        const res = await apiFetch(`/api/orders?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const filteredOrders = useMemo(() => {
    return [...orders]
      .filter((o) => matchesOrderPeriod(o.created_at, periodFilter))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, periodFilter]);

  const handleDownloadReceipt = async (order: Order) => {
    setDownloadingId(order.id);
    try {
      await downloadOrderReceiptPdf(order as ReceiptOrder, storeName);
    } catch (err) {
      console.error('Failed to download receipt:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'confirmed':
      case 'processing':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-600" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-[#c9a962]" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700';
      case 'confirmed':
      case 'processing':
        return 'bg-green-50 text-green-700';
      case 'shipped':
        return 'bg-purple-50 text-purple-700';
      case 'delivered':
      case 'completed':
        return 'bg-[#c9a962]/10 text-[#c9a962]';
      case 'cancelled':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen pt-8 bg-[#faf9f7]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-serif font-medium text-gray-900">My Orders</h1>
              {!loading && orders.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'}
                </p>
              )}
            </div>
            {!loading && orders.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(['all', 'month', '3months', 'year'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setPeriodFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      periodFilter === f
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {ORDER_PERIOD_LABELS[f]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-12 rounded-lg text-center">
              <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h2>
              <p className="text-gray-500 mb-6">Start shopping to see your orders here.</p>
              <Link
                to="/collections"
                className="inline-block px-8 py-3 bg-gray-900 text-white text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#c9a962] transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-lg text-center">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No orders in this period.</p>
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                className="mt-4 text-xs text-[#c9a962] hover:underline uppercase tracking-wider"
              >
                Show all orders
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0 w-9 h-9 rounded-full bg-[#faf9f7] border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500">
                          {index + 1}
                        </span>
                        {getStatusIcon(order.status)}
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
                            SN {index + 1} · Order ID
                          </p>
                          <p className="text-sm font-medium text-gray-900 font-mono truncate">
                            {displayOrderId(order)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(order)}
                          disabled={downloadingId === order.id}
                          title="Download receipt"
                          aria-label={`Download receipt for ${displayOrderId(order)}`}
                          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-[#c9a962] hover:border-[#c9a962]/40 transition-colors disabled:opacity-50"
                        >
                          {downloadingId === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileDown className="w-4 h-4" />
                          )}
                        </button>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <OrderFulfillmentProgress status={order.status} variant="storefront" />
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex gap-4 overflow-x-auto pb-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex-shrink-0 flex items-center gap-3">
                            <div className="w-14 h-14 bg-[#faf9f7] rounded-lg overflow-hidden">
                              <img
                                src={item.product?.image_url || '/placeholder.jpg'}
                                alt={item.product?.name || 'Product'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                                {item.product?.name || 'Product'}
                              </p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
                      {(() => {
                        const totals = getReceiptTotals(order);
                        return (
                          <>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Subtotal</span>
                              <span>रु {totals.subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Shipping</span>
                              <span>{totals.shipping === 0 ? 'Free' : `रु ${totals.shipping.toLocaleString('en-IN')}`}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Tax ({totals.taxRate}%)</span>
                              <span>रु {totals.tax.toLocaleString('en-IN')}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-lg font-medium text-gray-900">
                        रु {Number(order.total).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
