import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Users, ShoppingBag, ArrowUpRight, Clock, Eye, Pencil, X, Mail, Phone, Calendar, Loader2,
} from 'lucide-react';
import { adminFetch } from '../../lib/adminApi';
import { showNotification } from '../../components/Notification';
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

type CustomerRow = Customer & { status: Status };

const editInputClass =
  'w-full bg-gray-950/80 border border-amber-500/20 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/40';

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
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [page, setPage] = useState(1);
  const [viewCustomer, setViewCustomer] = useState<CustomerRow | null>(null);
  const [editCustomer, setEditCustomer] = useState<CustomerRow | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (!viewCustomer && !editCustomer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editCustomer) closeEdit();
        else if (viewCustomer) setViewCustomer(null);
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [viewCustomer, editCustomer]);

  const openView = (customer: CustomerRow) => {
    closeEdit();
    setViewCustomer(customer);
  };

  const openEdit = (customer: CustomerRow) => {
    setViewCustomer(null);
    setEditCustomer(customer);
    setEditForm({ name: customer.name || '', phone: customer.phone || '' });
  };

  const closeEdit = () => setEditCustomer(null);

  const handleEditSave = async () => {
    if (!editCustomer) return;
    if (!editForm.name.trim()) {
      showNotification('Name is required');
      return;
    }
    setEditSaving(true);
    try {
      const res = await adminFetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editCustomer.email,
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update customer');
      showNotification('Customer updated');
      closeEdit();
      await fetchCustomers();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setEditSaving(false);
    }
  };

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

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(1, Math.ceil(filtered.length / PAGE_SIZE) || 1)));
  }, [filtered.length]);

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

  const totalCustomers = customers.length;
  const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const activeCt = customers.filter((c) => c.status === 'active').length;
  const inactiveCt = customers.filter((c) => c.status === 'inactive').length;

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2.5 flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate">Total</p>
            <p className="text-lg font-bold text-white leading-tight">{totalCustomers}</p>
          </div>
        </div>
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2.5 flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate">Active Now</p>
            <p className="text-lg font-bold text-white leading-tight">{activeCt}</p>
          </div>
        </div>
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2.5 flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gray-600/30 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate">Inactive</p>
            <p className="text-lg font-bold text-white leading-tight">{inactiveCt}</p>
          </div>
        </div>
        <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2.5 flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 text-violet-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider truncate">Revenue</p>
            <p className="text-base font-bold text-white leading-tight truncate">रु {totalSpent.toLocaleString('en-IN')}</p>
          </div>
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
          <div className="px-6 py-3 border-b border-gray-700/80">
            <p className="text-sm text-gray-500">
              {filtered.length} customer{filtered.length === 1 ? '' : 's'} · {PAGE_SIZE} per page
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-14">SN</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-4 sm:px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {paginated.map((customer, i) => {
                  const sn = (safePage - 1) * PAGE_SIZE + i + 1;
                  const sc = statusConfig[customer.status];
                  return (
                    <tr key={customer.email} className="hover:bg-gray-700/20 transition-colors">
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-400">{sn}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                            {customer.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{customer.name || '-'}</p>
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
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openView(customer)}
                            title="View"
                            aria-label={`View ${customer.name || customer.email}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-500/10 text-gray-400 hover:text-violet-400 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(customer)}
                            title="Edit"
                            aria-label={`Edit ${customer.name || customer.email}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-500/10 text-gray-400 hover:text-amber-400 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-t border-gray-700">
            <p className="text-sm text-gray-500">
              Showing {rangeStart}–{rangeEnd} of {filtered.length}
              <span className="hidden sm:inline text-gray-600"> · {PAGE_SIZE} per page</span>
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
        </motion.div>
      )}

      {/* View modal */}
      <AnimatePresence>
        {viewCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
            onClick={() => setViewCustomer(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-customer-heading"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 border border-violet-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 id="view-customer-heading" className="text-base font-semibold text-white truncate">
                      {viewCustomer.name || 'Customer'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Customer details</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewCustomer(null)}
                  className="p-2 text-gray-500 hover:text-white shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Email</p>
                  <p className="text-sm text-gray-300 flex items-center gap-2 break-all">
                    <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    {viewCustomer.email}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Phone</p>
                  <p className="text-sm text-gray-300 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    {viewCustomer.phone || '-'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${statusConfig[viewCustomer.status].bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[viewCustomer.status].dot}`} />
                      <span className={statusConfig[viewCustomer.status].text}>{statusConfig[viewCustomer.status].label}</span>
                    </span>
                  </div>
                  <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Auth</p>
                    <p className="text-sm text-gray-300 capitalize">{viewCustomer.auth_provider || 'email'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Orders</p>
                    <p className="text-sm text-white font-medium">{viewCustomer.order_count}</p>
                  </div>
                  <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Total Spent</p>
                    <p className="text-sm text-violet-400 font-medium">रु {viewCustomer.total_spent.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Last Login</p>
                    <p className="text-sm text-gray-300">{timeAgo(viewCustomer.last_login)}</p>
                  </div>
                  <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Joined</p>
                    <p className="text-sm text-gray-300 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      {formatDate(viewCustomer.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-6 pt-4 border-t border-gray-700/60">
                <button
                  type="button"
                  onClick={() => {
                    const c = viewCustomer;
                    setViewCustomer(null);
                    openEdit(c);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-colors sm:mr-auto"
                >
                  <Pencil className="w-4 h-4" />
                  Edit customer
                </button>
                <button
                  type="button"
                  onClick={() => setViewCustomer(null)}
                  className="px-4 py-2.5 text-sm text-gray-400 hover:text-white rounded-xl"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
            onClick={closeEdit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-customer-heading"
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onSubmit={(e) => {
                e.preventDefault();
                handleEditSave();
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 border border-amber-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Pencil className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 id="edit-customer-heading" className="text-base font-semibold text-white">
                      Edit customer
                    </h3>
                    <p className="text-sm text-gray-400 truncate mt-0.5">{editCustomer.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="p-2 text-gray-500 hover:text-white shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className={editInputClass}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  className={editInputClass}
                  placeholder="Phone number"
                />
              </div>
              <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-300 mt-1 break-all">{editCustomer.email}</p>
                <p className="text-[11px] text-gray-600 mt-1">Email cannot be changed</p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-1">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2.5 text-sm text-gray-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/90 text-gray-900 text-sm font-semibold hover:bg-amber-400 disabled:opacity-50"
                >
                  {editSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save changes
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
