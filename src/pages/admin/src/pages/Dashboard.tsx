import { Package, ShoppingCart, Clock } from 'lucide-react';
import StatCard from '../components/StatCard';
import RevenueChart from '../components/RevenueChart';
import CategoryChart from '../components/CategoryChart';
import TrafficChart from '../components/TrafficChart';
import RecentOrders from '../components/RecentOrders';
import TopProducts from '../components/TopProducts';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value="1,284"
          change={12}
          icon={Package}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
          delay={0}
        />
        <StatCard
          title="Total Orders"
          value="8,542"
          change={8}
          icon={ShoppingCart}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          delay={0.1}
        />
        <StatCard
          title="Revenue"
          value="रु 48,294"
          change={23}
          iconText="रु"
          iconColor="text-accent"
          iconBg="bg-accent/10"
          delay={0.2}
        />
        <StatCard
          title="Pending Orders"
          value="142"
          change={-5}
          icon={Clock}
          iconColor="text-red-400"
          iconBg="bg-red-500/10"
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <CategoryChart />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>
        <TopProducts />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficChart />
        <ActivityFeed />
      </div>
    </div>
  );
}

function ActivityFeed() {
  const activities = [
    { action: 'New order received', detail: '#ORD-7829 from Sarah Mitchell', time: '2 min ago', type: 'order' },
    { action: 'Product updated', detail: 'Wireless Headphones Pro stock increased', time: '15 min ago', type: 'product' },
    { action: 'New customer registered', detail: 'David Lee created an account', time: '32 min ago', type: 'customer' },
    { action: 'Review submitted', detail: '5-star review on Smart Watch Series 5', time: '1 hr ago', type: 'review' },
    { action: 'Order shipped', detail: '#ORD-7824 dispatched via FedEx', time: '2 hrs ago', type: 'order' },
    { action: 'Low stock alert', detail: 'Leather Messenger Bag (3 remaining)', time: '3 hrs ago', type: 'alert' },
  ];

  const typeColors: Record<string, string> = {
    order: 'bg-blue-500/10 text-blue-400',
    product: 'bg-purple-500/10 text-purple-400',
    customer: 'bg-emerald-500/10 text-emerald-400',
    review: 'bg-accent/10 text-accent',
    alert: 'bg-red-500/10 text-red-400',
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
      <h3 className="text-base font-semibold text-white mb-1">Activity Feed</h3>
      <p className="text-sm text-slate-500 mb-5">Latest actions across your store</p>
      <div className="space-y-4">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${typeColors[activity.type].split(' ')[1].replace('text-', 'bg-')}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{activity.action}</p>
              <p className="text-xs text-slate-500 mt-0.5">{activity.detail}</p>
            </div>
            <span className="text-xs text-slate-600 shrink-0">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
