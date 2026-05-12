import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Image,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Hexagon,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/home-banner', label: 'Home Banner', icon: Image },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center mr-3">
          <Hexagon className="w-5 h-5 text-slate-950" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Dwarika</h1>
          <p className="text-xs text-slate-500">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 group ${
                  isActive
                    ? 'text-accent'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-slate-800/80 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center w-full">
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="activeChevron"
                    className="ml-auto"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  >
                    <span className="text-accent text-xs">›</span>
                  </motion.div>
                )}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center px-3 py-3 rounded-xl bg-slate-800/50">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Admin</p>
            <p className="text-xs text-slate-500 truncate">admin@dwarika.com</p>
          </div>
        </div>
        <button className="flex items-center w-full px-3 py-2.5 mt-2 text-sm text-slate-500 hover:text-slate-300 transition-colors rounded-xl hover:bg-slate-800/50">
          <LogOut className="w-4 h-4 mr-3" />
          Logout
        </button>
      </div>
    </aside>
  );
}
