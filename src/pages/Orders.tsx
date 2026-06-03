import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/apiUrl';
import { displayOrderId } from '../lib/orderId';

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
  status: string;
  created_at: string;
  items: OrderItem[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.email) { setLoading(false); return; }
      try {
        const res = await apiFetch(`/api/orders?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'delivered':
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
        return 'bg-green-50 text-green-700';
      case 'delivered':
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
          <h1 className="text-3xl font-serif font-medium text-gray-900 mb-8">My Orders</h1>

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
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
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
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
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

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
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
