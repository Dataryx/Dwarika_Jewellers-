import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard, LayoutTemplate, Package, ShoppingCart, Users, Settings, LogOut,
  Menu, X, Search, Bell, ExternalLink, Hexagon, User,
  Clock, AlertTriangle, Grid3X3, FileText, MessageSquare, Download, Shield, Mail,
} from 'lucide-react';
import { adminFetch } from '../../lib/adminApi';
import { displayOrderId } from '../../lib/orderId';
import { Link, NavLink, useLocation, useNavigate, Outlet, useOutletContext } from 'react-router-dom';
import { useAdminAuth } from '../../lib/adminAuth';
import { storefrontUrl } from '../../lib/storefrontUrl';
import Notification from '../../components/Notification';
import BrandWordmark from '../../components/BrandWordmark';

import StatCard from '../../components/admin/dashboard/StatCard';
import RevenueChart from '../../components/admin/dashboard/RevenueChart';
import CategoryChart from '../../components/admin/dashboard/CategoryChart';
import TrafficChart from '../../components/admin/dashboard/TrafficChart';
import TopProducts from '../../components/admin/dashboard/TopProducts';
import RecentOrders from '../../components/admin/dashboard/RecentOrders';
import ActivityFeed from '../../components/admin/dashboard/ActivityFeed';

export type AdminOutletContext = {
  sidebarOpen: boolean;
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
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Home Banner', path: '/home-banner', icon: LayoutTemplate },
  { name: 'Categories', path: '/categories', icon: Grid3X3 },
  { name: 'About Page', path: '/about', icon: FileText },
  { name: 'Contact Page', path: '/contact', icon: MessageSquare },
  { name: 'Products', path: '/products', icon: Package },
  { name: 'Orders', path: '/orders', icon: ShoppingCart },
  { name: 'Customers', path: '/users', icon: Users },
  { name: 'Admin Users', path: '/admin-users', icon: Shield },
  { name: 'SMTP', path: '/smtp', icon: Mail },
  { name: 'Settings', path: '/settings', icon: Settings },
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

const ADMIN_READ_NOTIFICATIONS_KEY = 'adminReadNotificationIds';

function loadReadNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ADMIN_READ_NOTIFICATIONS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function saveReadNotificationIds(ids: Set<string>) {
  localStorage.setItem(ADMIN_READ_NOTIFICATIONS_KEY, JSON.stringify([...ids]));
}

type AdminNotificationItem = {
  id: string;
  title: string;
  detail: string;
  icon: 'stock' | 'order';
};

function buildAdminNotifications(
  orders: any[],
  products: any[],
  prefs: { newOrders: boolean; lowStock: boolean }
): AdminNotificationItem[] {
  const items: AdminNotificationItem[] = [];

  if (prefs.lowStock) {
    products
      .filter((p) => Number(p.stock) <= 5)
      .slice(0, 5)
      .forEach((p) => {
        items.push({
          id: `stock-${p.id}`,
          title: Number(p.stock) === 0 ? 'Out of stock' : 'Low stock',
          detail: `${p.name} - ${p.stock} left`,
          icon: 'stock',
        });
      });
  }

  if (prefs.newOrders) {
    orders
      .filter((o) => o.status === 'pending')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .forEach((o) => {
        items.push({
          id: `order-${o.id}`,
          title: `New order ${displayOrderId(o)}`,
          detail: `${o.customer_name} - रु ${Number(o.total).toLocaleString('en-IN')}`,
          icon: 'order',
        });
      });
  }

  return items;
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [topSearch, setTopSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [adminToastMessage, setAdminToastMessage] = useState('');
  const [showAdminToast, setShowAdminToast] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const hasOrderSnapshotRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, email, name, role, isMaster, refreshAdminProfile } = useAdminAuth();

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [statChanges, setStatChanges] = useState({ products: 0, orders: 0, revenue: 0, pending: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState({
    newOrders: true,
    lowStock: true,
  });
  const [readNotificationIds, setReadNotificationIds] = useState(loadReadNotificationIds);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
      if (e.matches) setMobileMenuOpen(false);
    };
    setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [productsRes, ordersRes, settingsRes] = await Promise.all([
          adminFetch('/api/products'),
          adminFetch('/api/orders'),
          adminFetch('/api/settings'),
        ]);
        const prods = await productsRes.json();
        const ords = await ordersRes.json();
        const settings = await settingsRes.json();

        const nextOrderIds = new Set<string>(ords.map((o: any) => String(o.id)));
        const prefs = {
          newOrders: settings?.notifications?.newOrders !== false,
          lowStock: settings?.notifications?.lowStock !== false,
        };
        setNotificationPrefs(prefs);

        if (prefs.newOrders && hasOrderSnapshotRef.current) {
          const freshOrders = ords.filter((o: any) => !knownOrderIdsRef.current.has(String(o.id)));
          if (freshOrders.length > 0) {
            const latest = freshOrders
              .slice()
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            setAdminToastMessage(
              freshOrders.length === 1
                ? `New order ${displayOrderId(latest)} placed by ${latest.customer_name}`
                : `${freshOrders.length} new orders have been placed`
            );
            setShowAdminToast(true);
          }
        }
        knownOrderIdsRef.current = nextOrderIds;
        hasOrderSnapshotRef.current = true;

        setProducts(prods);
        setOrders(ords);
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
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setProfileMenuOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  const currentPageName = menuItems.find((item) => isActive(item.path))?.name || 'Dashboard';

  const showSidebar = isDesktop ? sidebarOpen : mobileMenuOpen;
  const layoutSidebarOpen = isDesktop && sidebarOpen;

  const notificationItems = buildAdminNotifications(orders, products, notificationPrefs);
  const unreadNotifications = notificationItems.filter((item) => !readNotificationIds.has(item.id));

  const markAllNotificationsRead = () => {
    const next = new Set(readNotificationIds);
    notificationItems.forEach((item) => next.add(item.id));
    setReadNotificationIds(next);
    saveReadNotificationIds(next);
  };

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed lg:relative z-50 w-64 h-screen bg-gray-900 border-r border-gray-800 flex flex-col shrink-0"
          >
            {/* Logo */}
            <div className="h-20 flex items-center justify-between px-5 border-b border-gray-800">
              <Link to="/" className="flex items-center gap-2.5 group min-w-0" onClick={() => setMobileMenuOpen(false)}>
                <img src="/favicon.svg?v=5" alt="Dwarika" className="w-10 h-10 shrink-0" />
                <BrandWordmark size="nav" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 transition-colors shrink-0"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
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
                    end={item.path === '/'}
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
                    <span className={`relative z-10 flex items-center w-full ${active ? 'text-violet-500' : 'text-gray-400 group-hover:text-gray-200'}`}>
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                      {active && (
                        <motion.span
                          layoutId="activeChevron"
                          className="ml-auto text-violet-500 text-xs"
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
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (isDesktop) {
                  setSidebarOpen((open) => !open);
                } else {
                  setMobileMenuOpen((open) => !open);
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
              aria-label={showSidebar ? 'Close menu' : 'Open menu'}
            >
              {showSidebar ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <h2 className="text-base sm:text-lg font-semibold text-white truncate max-w-[7rem] sm:max-w-none">{currentPageName}</h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search - desktop */}
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
                    if (/^\d+$/.test(q)) navigate('/orders');
                    else if (['order','orders'].includes(q)) navigate('/orders');
                    else if (['user','users','customer','customers'].includes(q)) navigate('/users');
                    else if (['setting','settings'].includes(q)) navigate('/settings');
                    else if (['admin','admins','admin-users'].includes(q)) navigate('/admin-users');
                    else if (['banner','hero','home'].includes(q)) navigate('/home-banner');
                    else navigate('/products');
                    setShowSearchResults(false);
                    setTopSearch('');
                  }
                }}
                className="w-64 bg-gray-800/50 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
              {showSearchResults && topSearch.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                  {products
                    .filter((p: any) => p.name?.toLowerCase().includes(topSearch.toLowerCase()))
                    .slice(0, 5)
                    .map((p: any) => (
                      <button
                        key={p.id}
                        onClick={() => { navigate(`/products/edit/${p.id}`); setShowSearchResults(false); setTopSearch(''); }}
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
                        onClick={() => { navigate('/orders'); setShowSearchResults(false); setTopSearch(''); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-gray-500" />
                        Order {displayOrderId(o)} - {o.customer_name}
                      </button>
                    ))}
                  {products.filter((p: any) => p.name?.toLowerCase().includes(topSearch.toLowerCase())).length === 0 &&
                   orders.filter((o: any) => String(o.id).includes(topSearch) || o.customer_name?.toLowerCase().includes(topSearch.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">No results found</div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/products')}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
              aria-label="Search products"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 ? (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                ) : null}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-1 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">Notifications</p>
                    {unreadNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-xs font-medium text-violet-400 hover:text-violet-300 whitespace-nowrap"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  {unreadNotifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">All caught up!</div>
                  ) : (
                    <div className="py-1">
                      {unreadNotifications.map((item) => (
                        <div key={item.id} className="px-4 py-3 hover:bg-gray-700/30 flex items-start gap-3">
                          {item.icon === 'stock' ? (
                            <AlertTriangle className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                          ) : (
                            <ShoppingCart className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="text-sm text-white">{item.title}</p>
                            <p className="text-xs text-gray-500">{item.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile menu - same pattern as storefront user panel */}
            <div className="relative" ref={profileMenuRef}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setProfileMenuOpen((open) => {
                    if (!open) void refreshAdminProfile();
                    return !open;
                  });
                }}
                className={`w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors ${
                  profileMenuOpen ? 'text-violet-400' : 'text-gray-400 hover:text-violet-400'
                }`}
                aria-label="Admin profile menu"
                aria-expanded={profileMenuOpen}
              >
                <User className="w-4 h-4" />
              </motion.button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 py-2 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{email}</p>
                      <span
                        className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border ${
                          role === 'master'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-gray-700/50 text-gray-400 border-gray-600/30'
                        }`}
                      >
                        {role === 'master' && <Shield className="w-3 h-3" />}
                        {role === 'master' ? 'Master' : 'Admin'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      Settings
                    </button>
                    {isMaster && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          navigate('/admin-users');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-gray-500" />
                        Admin Users
                      </button>
                    )}
                    <a
                      href={storefrontUrl('/')}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                      View Store
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 w-full min-w-0">
          <Outlet context={{ sidebarOpen: layoutSidebarOpen, stats, statChanges, products, orders } as AdminOutletContext} />
        </main>
      </div>

      {/* Mobile overlay - tap outside to close */}
      {!isDesktop && mobileMenuOpen && (
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
// Dashboard - the /admin index route
// ---------------------------------------------------------------------------

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CATEGORY_COLORS: Record<string, string> = {
  rings: '#8b5cf6',
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

function buildActivityFeed(orders: any[], products: any[] = []) {
  const activities: { action: string; detail: string; time: string; type: string }[] = [];

  const sorted = [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  sorted.forEach((o: any) => {
    const mins = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
    let time: string;
    if (mins < 1) time = 'just now';
    else if (mins < 60) time = `${mins} min ago`;
    else if (mins < 1440) time = `${Math.floor(mins / 60)} hr${Math.floor(mins / 60) > 1 ? 's' : ''} ago`;
    else time = `${Math.floor(mins / 1440)} day${Math.floor(mins / 1440) > 1 ? 's' : ''} ago`;

    if (o.status === 'pending') {
      activities.push({ action: 'New order received', detail: `${displayOrderId(o)} from ${o.customer_name}`, time, type: 'order' });
    } else if (o.status === 'shipped') {
      activities.push({ action: 'Order shipped', detail: `${displayOrderId(o)} dispatched`, time, type: 'order' });
    } else if (o.status === 'delivered') {
      activities.push({ action: 'Order delivered', detail: `${displayOrderId(o)} to ${o.customer_name}`, time, type: 'order' });
    } else {
      activities.push({ action: `Order ${o.status}`, detail: `${displayOrderId(o)} - रु ${Number(o.total || 0).toLocaleString('en-IN')}`, time, type: 'order' });
    }
  });

  products
    .filter((p) => Number(p.stock ?? 0) <= 5)
    .slice(0, 3)
    .forEach((p) => {
      activities.push({
        action: 'Low stock alert',
        detail: `${p.name} - ${Number(p.stock ?? 0)} left`,
        time: 'recent',
        type: 'alert',
      });
    });

  const summaryEntries = [
    { action: 'Catalog overview', detail: `${products.length} products in your store`, time: 'today', type: 'product' },
    { action: 'Orders overview', detail: `${orders.length} total orders recorded`, time: 'today', type: 'order' },
    { action: 'Revenue snapshot', detail: `रु ${orders.reduce((sum, o) => sum + Number(o.total || 0), 0).toLocaleString('en-IN')} lifetime revenue`, time: 'today', type: 'order' },
    { action: 'Store dashboard', detail: 'Review performance and recent activity here', time: 'today', type: 'product' },
  ];

  for (const entry of summaryEntries) {
    if (activities.length >= 6) break;
    if (!activities.some((a) => a.action === entry.action)) {
      activities.push(entry);
    }
  }

  if (activities.length === 0) {
    activities.push({ action: 'Store launched', detail: 'Welcome to the admin panel', time: 'now', type: 'product' });
  }

  while (activities.length < 6) {
    activities.push({
      action: 'Getting started',
      detail: 'Add products and receive orders to see more activity',
      time: 'today',
      type: 'product',
    });
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
    order_id: displayOrderId(order),
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    status: order.status,
    total: Number(order.total || 0),
    created_at: order.created_at,
  }))), 'Recent Orders');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(payload.activityFeed), 'Activity Feed');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(payload.orders.map((order) => ({
    order_id: displayOrderId(order),
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
  const activityFeed = buildActivityFeed(orders, products);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your store activity and performance</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 transition-colors w-full sm:w-auto shrink-0"
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
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10"
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
