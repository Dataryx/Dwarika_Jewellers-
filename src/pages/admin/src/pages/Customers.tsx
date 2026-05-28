import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Mail, Phone, ShoppingBag, Calendar, MapPin, ArrowUpRight } from 'lucide-react';

const customers = [
  { id: 1, name: 'Sarah Mitchell', email: 'sarah.m@email.com', phone: '+1 (555) 123-4567', location: 'New York, USA', orders: 24, spent: 2840.50, joined: '2023-03-12', status: 'active' },
  { id: 2, name: 'James Cooper', email: 'j.cooper@email.com', phone: '+1 (555) 234-5678', location: 'Los Angeles, USA', orders: 18, spent: 1920.75, joined: '2023-05-20', status: 'active' },
  { id: 3, name: 'Emma Wilson', email: 'emma.w@email.com', phone: '+1 (555) 345-6789', location: 'Chicago, USA', orders: 12, spent: 1345.20, joined: '2023-07-08', status: 'active' },
  { id: 4, name: 'Michael Brown', email: 'm.brown@email.com', phone: '+1 (555) 456-7890', location: 'Houston, USA', orders: 31, spent: 4520.00, joined: '2023-01-15', status: 'vip' },
  { id: 5, name: 'Lisa Anderson', email: 'lisa.a@email.com', phone: '+1 (555) 567-8901', location: 'Phoenix, USA', orders: 8, spent: 675.50, joined: '2023-09-22', status: 'active' },
  { id: 6, name: 'David Lee', email: 'd.lee@email.com', phone: '+1 (555) 678-9012', location: 'Seattle, USA', orders: 15, spent: 2100.80, joined: '2023-04-30', status: 'active' },
  { id: 7, name: 'Rachel Green', email: 'r.green@email.com', phone: '+1 (555) 789-0123', location: 'Boston, USA', orders: 22, spent: 3150.25, joined: '2023-02-18', status: 'vip' },
  { id: 8, name: 'Tom Harris', email: 't.harris@email.com', phone: '+1 (555) 890-1234', location: 'Denver, USA', orders: 5, spent: 420.00, joined: '2023-11-05', status: 'inactive' },
];

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  vip: 'bg-accent/10 text-accent border-accent/30',
  inactive: 'bg-slate-700/50 text-slate-400 border-slate-600/30',
};

export default function Customers() {
  const [search, setSearch] = useState('');

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalCustomers = customers.length;
  const totalSpent = customers.reduce((sum, c) => sum + c.spent, 0);
  const activeCustomers = customers.filter((c) => c.status === 'active' || c.status === 'vip').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Customers</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalCustomers}</p>
          <p className="text-xs text-emerald-400 mt-1">+12% from last month</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Spent</span>
          </div>
          <p className="text-2xl font-bold text-white">रु {totalSpent.toLocaleString()}</p>
          <p className="text-xs text-emerald-400 mt-1">+23% from last month</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active</span>
          </div>
          <p className="text-2xl font-bold text-white">{activeCustomers}</p>
          <p className="text-xs text-emerald-400 mt-1">{Math.round((activeCustomers / totalCustomers) * 100)}% engagement rate</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search customers by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
        />
      </motion.div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((customer, i) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-lg font-bold text-white">
                  {customer.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{customer.name}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${statusStyles[customer.status]}`}>
                    {customer.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-400 truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-400">{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-400">{customer.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-400">Joined {customer.joined}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
              <div>
                <p className="text-xs text-slate-500">Orders</p>
                <p className="text-sm font-semibold text-white">{customer.orders}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Spent</p>
                <p className="text-sm font-semibold text-white">रु {customer.spent.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
