import { useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Clock3, Package, ShoppingCart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { displayOrderId } from '../../../lib/orderId';

type Metric = {
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  tone: string;
};

type RevenuePoint = { name: string; revenue: number; orders: number };
type CategoryPoint = { name: string; value: number; color: string };
type StatusPoint = { name: string; orders: number };
type ProductPoint = { name: string; sales: number; revenue: string; stock: number };
type Order = {
  id: number;
  customer_name: string;
  customer_email: string;
  status: string;
  total: number;
  created_at: string;
};
type Activity = { action: string; detail: string; time: string; type: string };

type DashboardOverviewProps = {
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
  revenueData: RevenuePoint[];
  categoryData: CategoryPoint[];
  orderStatusData: StatusPoint[];
  topProducts: ProductPoint[];
  recentOrders: Order[];
  activityFeed: Activity[];
  onExport: () => void;
};

function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => onChange(page - 1)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="px-2 text-[11px] font-medium text-slate-500">{page} / {pages}</span>
      <button type="button" aria-label="Next page" disabled={page === pages} onClick={() => onChange(page + 1)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function MetricRail({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, change, icon: Icon, tone }) => (
        <div key={label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)]">
          <div className={`absolute right-0 top-0 h-20 w-20 translate-x-7 -translate-y-7 rounded-full ${tone} opacity-70`} />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-[#17233d]">{value}</p>
            </div>
            <Icon className="h-5 w-5 text-[#b08d45]" />
          </div>
          <div className="relative mt-5 flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowUpRight className={`h-3.5 w-3.5 ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
            <span className={change >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{change >= 0 ? '+' : ''}{change}%</span>
            <span>from last month</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RevenuePanel({ data }: { data: RevenuePoint[] }) {
  const max = Math.max(1, ...data.map((point) => point.revenue));
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b08d45]">Revenue</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#17233d]">Weekly momentum</h2>
        </div>
        <span className="rounded-full bg-[#f7f3e8] px-3 py-1.5 text-xs font-medium text-[#8d6b2e]">Last 7 days</span>
      </div>
      <div className="mt-8 flex h-56 items-end gap-2 sm:gap-4">
        {data.map((point) => (
          <div key={point.name} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="relative flex h-full w-full items-end justify-center">
              <span className="pointer-events-none absolute bottom-full mb-2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                रु {point.revenue.toLocaleString('en-IN')}
              </span>
              <div className="w-full max-w-8 rounded-t-lg bg-gradient-to-t from-[#c9a962] to-[#f1d69a] transition-all group-hover:from-violet-600 group-hover:to-violet-400" style={{ height: `${Math.max(7, (point.revenue / max) * 100)}%` }} />
            </div>
            <span className="text-[10px] font-medium text-slate-400">{point.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryPanel({ data }: { data: CategoryPoint[] }) {
  const gradient = data.map((item, index) => {
    const start = data.slice(0, index).reduce((sum, entry) => sum + entry.value, 0);
    return `${item.color} ${start}% ${start + item.value}%`;
  }).join(', ');
  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-6 text-slate-900 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d6b2e]">Catalog mix</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">Where your collection lives</h2>
      <div className="mt-7 flex items-center gap-6">
        <div className="relative h-32 w-32 shrink-0 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white">
            <span className="text-xl font-semibold">{data.reduce((sum, item) => sum + item.value, 0)}%</span>
            <span className="text-[10px] text-slate-400">catalog</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {data.slice(0, 4).map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-slate-500"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
              <span className="font-semibold text-slate-900">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OrderStream({ orders }: { orders: Order[] }) {
  const [page, setPage] = useState(1);
  const pageSize = 4;
  const pages = Math.max(1, Math.ceil(orders.length / pageSize));
  const visible = orders.slice((page - 1) * pageSize, page * pageSize);
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgb(15_23_42_/_0.04)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b08d45]">Operations</p><h2 className="mt-1 text-xl font-semibold text-[#17233d]">Latest orders</h2></div>
        <div className="flex items-center gap-3"><Pager page={page} pages={pages} onChange={setPage} /><Link to="/orders" className="text-xs font-semibold text-[#9a7732] hover:text-[#17233d]">View all</Link></div>
      </div>
      <div className="divide-y divide-slate-100">
        {visible.length === 0 ? <p className="px-6 py-10 text-center text-sm text-slate-500">No orders yet</p> : visible.map((order) => (
          <div key={order.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f3e8] text-[#9a7732]"><ShoppingCart className="h-4 w-4" /></div>
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#17233d]">{order.customer_name}</p><p className="mt-0.5 truncate text-xs text-slate-500">{displayOrderId(order)} · {order.customer_email}</p></div>
            <div className="text-right"><p className="text-sm font-semibold text-[#17233d]">रु {Number(order.total).toLocaleString('en-IN')}</p><span className="text-[11px] capitalize text-slate-400">{order.status}</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductRanking({ products }: { products: ProductPoint[] }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(products.length / 4));
  const visible = products.slice((page - 1) * 4, page * 4);
  return (
    <section className="rounded-2xl border border-[#eadfca] bg-[#f7f3e8] p-6">
      <div className="flex items-start justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a88b4a]">Merchandising</p><h2 className="mt-1 text-xl font-semibold text-[#17233d]">Best sellers</h2></div><Pager page={page} pages={pages} onChange={setPage} /></div>
      <div className="mt-6 space-y-3">{visible.map((product, index) => <div key={product.name} className="flex items-center gap-3 rounded-xl bg-white/75 p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-xs font-semibold text-white">{(page - 1) * 4 + index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[#17233d]">{product.name}</p><p className="mt-0.5 text-xs text-slate-500">{product.sales} sold · {product.stock} in stock</p></div><span className="text-xs font-semibold text-[#8d6b2e]">{product.revenue}</span></div>)}</div>
    </section>
  );
}

function StatusPanel({ data }: { data: StatusPoint[] }) {
  const max = Math.max(1, ...data.map((item) => item.orders));
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgb(15_23_42_/_0.04)]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b08d45]">Fulfillment</p><h2 className="mt-1 text-xl font-semibold text-[#17233d]">Order health</h2><div className="mt-7 space-y-4">{data.map((item) => <div key={item.name}><div className="mb-1.5 flex justify-between text-xs"><span className="capitalize text-slate-500">{item.name}</span><span className="font-semibold text-[#17233d]">{item.orders}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[#c9a962]" style={{ width: `${Math.max(4, (item.orders / max) * 100)}%` }} /></div></div>)}</div></section>;
}

function ActivityPanel({ activities }: { activities: Activity[] }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(activities.length / 4));
  const visible = activities.slice((page - 1) * 4, page * 4);
  return <section className="rounded-2xl bg-white border border-slate-200 p-6 text-slate-900"><div className="flex items-start justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d6b2e]">Live log</p><h2 className="mt-1 text-xl font-semibold">Store activity</h2></div><Pager page={page} pages={pages} onChange={setPage} /></div>  <div className="mt-6 space-y-5">{visible.map((activity, index) => <div key={`${activity.action}-${index}`} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c9a962]" /><div className="min-w-0"><p className="text-sm font-medium text-slate-900">{activity.action}</p><p className="mt-0.5 text-xs text-slate-500">{activity.detail}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{activity.time}</p></div></div>)}</div></section>;
}

export default function DashboardOverview({ stats, statChanges, revenueData, categoryData, orderStatusData, topProducts, recentOrders, activityFeed, onExport }: DashboardOverviewProps) {
  const metrics: Metric[] = [
    { label: 'Products', value: stats.totalProducts.toLocaleString(), change: statChanges.products, icon: Package, tone: 'bg-amber-100' },
    { label: 'Orders', value: stats.totalOrders.toLocaleString(), change: statChanges.orders, icon: ShoppingCart, tone: 'bg-blue-100' },
    { label: 'Revenue', value: `रु ${stats.totalRevenue.toLocaleString('en-IN')}`, change: statChanges.revenue, icon: Sparkles, tone: 'bg-emerald-100' },
    { label: 'Pending', value: stats.pendingOrders.toLocaleString(), change: statChanges.pending, icon: Clock3, tone: 'bg-rose-100' },
  ];
  return (
    <div className="admin-dashboard-v2 space-y-5">
      <header className="flex flex-col justify-between gap-5 rounded-2xl bg-white border border-slate-200 px-6 py-7 text-slate-900 shadow-sm sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8d6b2e]">Dwarika Jewellers</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Your store, in focus.</h1><p className="mt-2 max-w-xl text-sm text-slate-500">Monitor the collection, orders, and customer momentum from one calm workspace.</p></div>
        <button type="button" onClick={onExport} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c9a962] px-4 py-2.5 text-sm font-semibold text-[#17233d] transition-colors hover:bg-[#f1d69a]"><ArrowUpRight className="h-4 w-4" />Export report</button>
      </header>
      <MetricRail metrics={metrics} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.85fr)]"><RevenuePanel data={revenueData} /><CategoryPanel data={categoryData} /></div>
      <OrderStream orders={recentOrders} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3"><ProductRanking products={topProducts} /><StatusPanel data={orderStatusData} /><ActivityPanel activities={activityFeed} /></div>
    </div>
  );
}
