import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard, LayoutTemplate, Package, ShoppingCart, Users, Settings, LogOut,
  Menu, X, Search, Bell, ExternalLink, Hexagon,
  Clock, AlertTriangle, Grid3X3, BookOpen, FileText, MessageSquare, Download,
} from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate, Outlet, useOutletContext } from 'react-router-dom';
import { useAdminAuth } from '../../lib/adminAuth';
import Notification from '../../components/Notification';

import StatCard from '../../components/admin/dashboard/StatCard';
import RevenueChart from '../../components/admin/dashboard/RevenueChart';
import CategoryChart from '../../components/admin/dashboard/CategoryChart';
import TrafficChart from '../../components/admin/dashboard/TrafficChart';
import TopProducts from '../../components/admin/dashboard/TopProducts';
import RecentOrders from '../../components/admin/dashboard/RecentOrders';
import ActivityFeed from '../../components/admin/dashboard/ActivityFeed';

export type AdminOutletContext = {
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
  };
  statChanges: {
    products: number;
    orders: number;
    revenue: number;
    pending: number;
  };
  products: any[];
  orders: any[];
};

const menuItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Home Banner', path: '/admin/home-banner', icon: LayoutTemplate },
  { name: 'Categories', path: '/admin/categories', icon: Grid3X3 },
  { name: 'About Page', path: '/admin/about', icon: FileText },
  { name: 'Contact Page', path: '/admin/contact', icon: MessageSquare },
  { name: 'Products', path: '/admin/products', icon: Package },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  { name: 'Customers', path: '/admin/users', icon: Users },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

function computeMonthOverMonth(orders: any[], products: any[]) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  let thisMonthOrders = 0, lastMonthOrders = 0;
  let thisMonthRevenue = 0, lastMonthRevenue = 0;
  let thisMonthPending = 0, lastMonthPending = 0;

  orders.forEach((o: any) => {
    const d = new Date(o.created_at);
    const m = d.getMonth();
    const y = d.getFullYear();
    if (m === thisMonth && y === thisYear) {
      thisMonthOrders++;
      thisMonthRevenue += Number(o.total || 0);
      if (o.status === 'pending') thisMonthPending++;
    } else if (m === lastMonth && y === lastYear) {
      lastMonthOrders++;
      lastMonthRevenue += Number(o.total || 0);
      if (o.status === 'pending') lastMonthPending++;
    }
  });

  const pct = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

  const thisMonthProducts = products.filter((p: any) => {
    const d = new Date(p.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;
  const lastMonthProducts = products.filter((p: any) => {
    const d = new Date(p.created_at);
    return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
  }).length;

  return {
    products: pct(thisMonthProducts, lastMonthProducts),
    orders: pct(thisMonthOrders, lastMonthOrders),
    revenue: pct(thisMonthRevenue, lastMonthRevenue),
    pending: pct(thisMonthPending, lastMonthPending),
  };
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [topSearch, setTopSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [adminToastMessage, setAdminToastMessage] = useState('');
  const [showAdminToast, setShowAdminToast] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const hasOrderSnapshotRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, email } = useAdminAuth();

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [statChanges, setStatChanges] = useState({ products: 0, orders: 0, revenue: 0, pending: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [storeName, setStoreName] = useState('Dwarika');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [productsRes, ordersRes, settingsRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/orders'),
          fetch('/api/settings'),
        ]);
        const prods = await productsRes.json();
        const ords = await ordersRes.json();
        const settings = await settingsRes.json();

        const nextOrderIds = new Set<string>(ords.map((o: any) => String(o.id)));
        if (hasOrderSnapshotRef.current) {
          const freshOrders = ords.filter((o: any) => !knownOrderIdsRef.current.has(String(o.id)));
          if (freshOrders.length > 0) {
            const latest = freshOrders
              .slice()
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            setAdminToastMessage(
              freshOrders.length === 1
                ? `New order #${latest.id} placed by ${latest.customer_name}`
                : `${freshOrders.length} new orders have been placed`
            );
            setShowAdminToast(true);
          }
        }
        knownOrderIdsRef.current = nextOrderIds;
        hasOrderSnapshotRef.current = true;

        setProducts(prods);
        setOrders(ords);
        if (settings?.storeName) setStoreName(settings.storeName);
        setStats({
          totalProducts: prods.length,
          totalOrders: ords.length,
          totalRevenue: ords.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0),
          pendingOrders: ords.filter((o: any) => o.status === 'pending').length,
        });
        setStatChanges(computeMonthOverMonth(ords, prods));
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchAll();

    const pollId = window.setInterval(fetchAll, 5000);
    return () => window.clearInterval(pollId);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  const currentPageName =
    menuItems.find((item) => isActive(item.path))?.name || 'Dashboard';

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || mobileMenuOpen) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed lg:relative z-50 w-64 h-screen bg-gray-900 border-r border-gray-800 flex flex-col shrink-0"
          >
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-gray-800">
              <Link to="/admin" className="flex items-center gap-3 group">
                <img src="/favicon.svg?v=2" alt="Dwarika logo" className="w-9 h-9 shrink-0" />
                <div>
                  <h1 className="text-lg font-bold text-white leading-tight">{storeName}</h1>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/admin'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="relative flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 group"
                  >
                    {active && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-gray-800/80 rounded-xl"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className={`relative z-10 flex items-center w-full ${active ? 'text-amber-500' : 'text-gray-400 group-hover:text-gray-200'}`}>
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                      {active && (
                        <motion.span
                          layoutId="activeChevron"
                          className="ml-auto text-amber-500 text-xs"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        >
                          ›
                        </motion.span>
                      )}
                    </span>
                  </NavLink>
                );
              })}
            </nav>

            {/* User */}
            <div className="px-3 py-4 border-t border-gray-800">
              <div className="flex items-center px-3 py-3 rounded-xl bg-gray-800/50">
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center">
                  <Users className="w-4 h-4 text-gray-400" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">Admin</p>
                  <p className="text-xs text-gray-500 truncate">{email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center w-full px-3 py-2.5 mt-2 text-sm text-gray-500 hover:text-red-400 transition-colors rounded-xl hover:bg-gray-800/50"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileMenuOpen(!mobileMenuOpen);
                } else {
                  setSidebarOpen(!sidebarOpen);
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
            >
              {mobileMenuOpen || (!sidebarOpen && window.innerWidth >= 1024) ? (
                <Menu className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
            <h2 className="text-lg font-semibold text-white hidden sm:block">{currentPageName}</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden md:block" ref={searchRef}>
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search products, orders…"
                value={topSearch}
                onChange={(e) => { setTopSearch(e.target.value); setShowSearchResults(true); }}
                onFocus={() => setShowSearchResults(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && topSearch.trim()) {
                    const q = topSearch.trim().toLowerCase();
                    if (/^\d+$/.test(q)) navigate('/admin/orders');
                    else if (['order','orders'].includes(q)) navigate('/admin/orders');
                    else if (['user','users','customer','customers'].includes(q)) navigate('/admin/users');
                    else if (['setting','settings'].includes(q)) navigate('/admin/settings');
                    else if (['banner','hero','home'].includes(q)) navigate('/admin/home-banner');
                    else navigate('/admin/products');
                    setShowSearchResults(false);
                    setTopSearch('');
                  }
                }}
                className="w-64 bg-gray-800/50 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
              {showSearchResults && topSearch.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                  {products
                    .filter((p: any) => p.name?.toLowerCase().includes(topSearch.toLowerCase()))
                    .slice(0, 5)
                    .map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => { navigate(`/admin/products/${p.id}`); setShowSearchResults(false); setTopSearch(''); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2"
                      >
                        <Package className="w-3.5 h-3.5 text-gray-500" />
                        {p.name}
                      </button>
                    ))}
                  {orders
                    .filter((o: any) => String(o.id).includes(topSearch) || o.customer_name?.toLowerCase().includes(topSearch.toLowerCase()))
                    .slice(0, 3)
                    .map((o: any) => (
                      <button
                        key={o.id}
                        onClick={() => { navigate('/admin/orders'); setShowSearchResults(false); setTopSearch(''); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-gray-500" />
                        Order #{o.id} — {o.customer_name}
                      </button>
                    ))}
                  {products.filter((p: any) => p.name?.toLowerCase().includes(topSearch.toLowerCase())).length === 0 &&
                   orders.filter((o: any) => String(o.id).includes(topSearch) || o.customer_name?.toLowerCase().includes(topSearch.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">No results found</div>
                  )}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {(orders.filter((o: any) => o.status === 'pending').length > 0 ||
                  products.filter((p: any) => Number(p.stock) <= 5).length > 0) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">Notifications</p>
                  </div>
                  {orders.filter((o: any) => o.status === 'pending').length === 0 &&
                   products.filter((p: any) => Number(p.stock) <= 5).length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">All caught up!</div>
                  ) : (
                    <div className="py-1">
                      {products
                        .filter((p: any) => Number(p.stock) <= 5)
                        .slice(0, 5)
                        .map((p: any) => (
                          <div key={`stock-${p.id}`} className="px-4 py-3 hover:bg-gray-700/30 flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm text-white">{Number(p.stock) === 0 ? 'Out of stock' : 'Low stock'}</p>
                              <p className="text-xs text-gray-500">{p.name} — {p.stock} left</p>
                            </div>
                          </div>
                        ))}
                      {orders
                        .filter((o: any) => o.status === 'pending')
                        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 5)
                        .map((o: any) => (
                          <div key={`order-${o.id}`} className="px-4 py-3 hover:bg-gray-700/30 flex items-start gap-3">
                            <ShoppingCart className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm text-white">New order #{o.id}</p>
                              <p className="text-xs text-gray-500">{o.customer_name} — रु {Number(o.total).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">View Store</span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet context={{ stats, statChanges, products, orders } as AdminOutletContext} />
        </main>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Notification
        key={adminToastMessage}
        message={adminToastMessage}
        show={showAdminToast}
        onClose={() => setShowAdminToast(false)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard — the /admin index route
// ---------------------------------------------------------------------------

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CATEGORY_COLORS: Record<string, string> = {
  rings: '#f59e0b',
  necklaces: '#8b5cf6',
  earrings: '#10b981',
  bracelets: '#3b82f6',
  other: '#ec4899',
};

function buildOrderStatusData(orders: any[]) {
  const counts: Record<string, number> = {};
  orders.forEach((o: any) => {
    const s = (o.status || 'unknown').charAt(0).toUpperCase() + (o.status || 'unknown').slice(1);
    counts[s] = (counts[s] || 0) + 1;
  });
  return Object.entries(counts).map(([name, count]) => ({ name, orders: count }));
}

function buildRevenueData(orders: any[]) {
  const buckets: Record<string, { revenue: number; orders: number }> = {};
  DAYS.forEach((d) => (buckets[d] = { revenue: 0, orders: 0 }));

  orders.forEach((o: any) => {
    const d = new Date(o.created_at);
    const day = DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];
    if (buckets[day]) {
      buckets[day].revenue += Number(o.total || 0);
      buckets[day].orders += 1;
    }
  });

  return DAYS.map((name) => ({
    name,
    revenue: Math.round(buckets[name].revenue),
    orders: buckets[name].orders,
  }));
}

function buildCategoryData(products: any[]) {
  const counts: Record<string, number> = {};
  products.forEach((p: any) => {
    const cat = (p.category || 'other').toLowerCase();
    counts[cat] = (counts[cat] || 0) + 1;
  });
  const total = products.length || 1;
  return Object.entries(counts).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: Math.round((count / total) * 100),
    color: CATEGORY_COLORS[name] || CATEGORY_COLORS.other,
  }));
}

function buildTopProducts(products: any[], orders: any[]) {
  const salesMap: Record<number, { qty: number; rev: number }> = {};
  orders.forEach((o: any) => {
    (o.items || []).forEach((it: any) => {
      const pid = it.product_id;
      if (!salesMap[pid]) salesMap[pid] = { qty: 0, rev: 0 };
      salesMap[pid].qty += Number(it.quantity || 1);
      salesMap[pid].rev += Number(it.price || 0);
    });
  });

  return products
    .map((p: any) => {
      const s = salesMap[p.id];
      return {
        name: p.name,
        sales: s?.qty || 0,
        revenue: `रु ${(s?.rev || 0).toLocaleString('en-IN')}`,
        stock: Number(p.stock || 0),
      };
    })
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);
}

function buildActivityFeed(orders: any[]) {
  const activities: { action: string; detail: string; time: string; type: string }[] = [];

  const sorted = [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  sorted.slice(0, 6).forEach((o: any) => {
    const mins = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
    let time: string;
    if (mins < 1) time = 'just now';
    else if (mins < 60) time = `${mins} min ago`;
    else if (mins < 1440) time = `${Math.floor(mins / 60)} hr${Math.floor(mins / 60) > 1 ? 's' : ''} ago`;
    else time = `${Math.floor(mins / 1440)} day${Math.floor(mins / 1440) > 1 ? 's' : ''} ago`;

    if (o.status === 'pending') {
      activities.push({ action: 'New order received', detail: `#${o.id} from ${o.customer_name}`, time, type: 'order' });
    } else if (o.status === 'shipped') {
      activities.push({ action: 'Order shipped', detail: `#${o.id} dispatched`, time, type: 'order' });
    } else if (o.status === 'delivered') {
      activities.push({ action: 'Order delivered', detail: `#${o.id} to ${o.customer_name}`, time, type: 'order' });
    } else {
      activities.push({ action: `Order ${o.status}`, detail: `#${o.id} — रु ${Number(o.total || 0).toLocaleString('en-IN')}`, time, type: 'order' });
    }
  });

  if (activities.length === 0) {
    activities.push(
      { action: 'Store launched', detail: 'Welcome to the admin panel', time: 'now', type: 'product' },
    );
  }

  return activities;
}

function formatExportTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function exportDashboardWorkbook(payload: {
  stats: AdminOutletContext['stats'];
  statChanges: AdminOutletContext['statChanges'];
  revenueData: ReturnType<typeof buildRevenueData>;
  categoryData: ReturnType<typeof buildCategoryData>;
  topProducts: ReturnType<typeof buildTopProducts>;
  orderStatusData: ReturnType<typeof buildOrderStatusData>;
  recentOrders: any[];
  activityFeed: ReturnType<typeof buildActivityFeed>;
  products: any[];
  orders: any[];
}) {
  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet([
    { metric: 'Total Products', value: payload.stats.totalProducts, month_over_month_change: payload.statChanges.products },
    { metric: 'Total Orders', value: payload.stats.totalOrders, month_over_month_change: payload.statChanges.orders },
    { metric: 'Revenue', value: payload.stats.totalRevenue, month_over_month_change: payload.statChanges.revenue },
    { metric: 'Pending Orders', value: payload.stats.pendingOrders, month_over_month_change: payload.statChanges.pending },
  ]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(payload.revenueData), 'Revenue Overview');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(payload.categoryData), 'Category Breakdown');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(payload.orderStatusData), 'Order Status');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(payload.topProducts), 'Top Products');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(payload.recentOrders.map((order) => ({
    id: order.id,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    status: order.status,
    total: Number(order.total || 0),
    created_at: order.created_at,
  }))), 'Recent Orders');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(payload.activityFeed), 'Activity Feed');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(payload.orders.map((order) => ({
    id: order.id,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    status: order.status,
    total: Number(order.total || 0),
    created_at: order.created_at,
  }))), 'All Orders');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(payload.products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    material: product.material,
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    created_at: product.created_at,
  }))), 'All Products');

  XLSX.writeFile(workbook, `dwarika-dashboard-${formatExportTimestamp()}.xlsx`);
}

export function AdminDashboard() {
  const { stats, statChanges, products, orders } = useOutletContext<AdminOutletContext>();

  const revenueData = buildRevenueData(orders);
  const categoryData = buildCategoryData(products);
  const topProducts = buildTopProducts(products, orders);
  const orderStatusData = buildOrderStatusData(orders);
  const recentOrders = orders
    .slice()
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);
  const activityFeed = buildActivityFeed(orders);

  const handleExport = () => {
    exportDashboardWorkbook({
      stats,
      statChanges,
      revenueData,
      categoryData,
      topProducts,
      orderStatusData,
      recentOrders,
      activityFeed,
      products,
      orders,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your store activity and performance</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-gray-950 text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Excel
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          change={statChanges.products}
          icon={Package}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
          delay={0}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          change={statChanges.orders}
          icon={ShoppingCart}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          delay={0.1}
        />
        <StatCard
          title="Revenue"
          value={`रु ${stats.totalRevenue.toLocaleString('en-IN')}`}
          change={statChanges.revenue}
          iconText="रु"
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
          delay={0.2}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders.toLocaleString()}
          change={statChanges.pending}
          icon={Clock}
          iconColor="text-red-400"
          iconBg="bg-red-500/10"
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} />
        </div>
        <CategoryChart data={categoryData} />
      </div>

      {/* Orders + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrders orders={recentOrders} />
        </div>
        <TopProducts products={topProducts} />
      </div>

      {/* Traffic + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficChart data={orderStatusData} />
        <ActivityFeed activities={activityFeed} />
      </div>
    </div>
  );
}
