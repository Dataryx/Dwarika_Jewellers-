import { X, ExternalLink, Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/home-banner': 'Home Banner',
  '/products': 'Products',
  '/orders': 'Orders',
  '/customers': 'Customers',
  '/settings': 'Settings',
};

export default function TopBar() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors border border-slate-700">
          <ExternalLink className="w-4 h-4" />
          View Store
        </button>
      </div>
    </header>
  );
}
