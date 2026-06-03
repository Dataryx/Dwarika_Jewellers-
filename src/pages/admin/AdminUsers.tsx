import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Mail, ShoppingBag, Calendar, ArrowUpRight, Clock } from 'lucide-react';
import { adminFetch } from '../../lib/adminApi';

interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
  auth_provider: string;
  total_spent: number;
  order_count: number;
  created_at: string;
  last_login: string;
}

type Status = 'active' | 'not_logged_in' | 'inactive';

const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;
const ACTIVE_WINDOW_MS = 10 * 60 * 1000;
const PAGE_SIZE = 10;

function deriveStatus(lastLogin: string): Status {
  if (!lastLogin) return 'inactive';
  const diff = Date.now() - new Date(lastLogin).getTime();
  if (diff < ACTIVE_WINDOW_MS) return 'active';
  if (diff < THREE_MONTHS_MS) return 'not_logged_in';
  return 'inactive';
}

const statusConfig: Record<Status, { label: string; dot: string; text: string; bg: string }> = {
  active: { label: 'Active', dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  not_logged_in: { label: 'Not Logged In', dot: 'bg-violet-400', text: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  inactive: { label: 'Inactive', dot: 'bg-gray-500', text: 'text-gray-400', bg: 'bg-gray-700/50 border-gray-600/30' },
};

export default function AdminUsers() {
  const [customers, setCustomers] = useState<(Customer & { status: Status })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/customers');
      const data: Customer[] = await res.json();
      const list = data.map((c) => ({
        ...c,
        total_spent: c.total_spent || 0,
        order_count: c.order_count || 0,
        status: deriveStatus(c.last_login),
      }));
      setCustomers(list);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  const totalCustomers = customers.length;
  const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const activeCt = customers.filter((c) => c.status === 'active').length;
  const inactiveCt = customers.filter((c) => c.status === 'inactive').length;

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const timeAgo = (d: string) => {
    if (!d) return 'Never';
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalCustomers}</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Active Now</span>
          </div>
          <p className="text-2xl font-bold text-white">{activeCt}</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gray-600/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Inactive</span>
          </div>
          <p className="text-2xl font-bold text-white">{inactiveCt}</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-violet-500" />
            </div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-white">रु {totalSpent.toLocaleString('en-IN')}</p>
        </div>
      </motion.div>

      {/* Search + Filter */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'not_logged_in', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors border ${
                statusFilter === f
                  ? 'bg-violet-500/10 text-violet-500 border-violet-500/30'
                  : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:text-gray-300'
              }`}
            >
              {f === 'all' ? 'All' : f === 'not_logged_in' ? 'Not Logged In' : f === 'active' ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Customers Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No customers found</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {paginated.map((customer) => {
                  const sc = statusConfig[customer.status];
                  return (
                    <tr key={customer.email} className="hover:bg-gray-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                            {customer.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{customer.name || '—'}</p>
                            <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${sc.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          <span className={sc.text}>{sc.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{timeAgo(customer.last_login)}</td>
                      <td className="px-6 py-4 text-sm text-white text-right font-medium">{customer.order_count}</td>
                      <td className="px-6 py-4 text-sm text-violet-500 text-right font-medium">रु {customer.total_spent.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{formatDate(customer.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
              <p className="text-sm text-gray-500">
                Showing {rangeStart}–{rangeEnd} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500 px-2">
                  Page {safePage} of {totalPages}
                </span>
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
      )}
    </div>
  );
}
