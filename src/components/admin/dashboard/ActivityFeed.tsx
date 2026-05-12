import { motion } from 'framer-motion';

interface Activity {
  action: string;
  detail: string;
  time: string;
  type: string;
}

const typeColors: Record<string, string> = {
  order: 'bg-blue-400',
  product: 'bg-purple-400',
  customer: 'bg-emerald-400',
  review: 'bg-amber-400',
  alert: 'bg-red-400',
};

interface ActivityFeedProps {
  activities: Activity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55 }}
      className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6"
    >
      <h3 className="text-base font-semibold text-white mb-1">Activity Feed</h3>
      <p className="text-sm text-gray-500 mb-5">Latest actions across your store</p>
      <div className="space-y-4">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${typeColors[activity.type] || 'bg-gray-400'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{activity.action}</p>
              <p className="text-xs text-gray-500 mt-0.5">{activity.detail}</p>
            </div>
            <span className="text-xs text-gray-600 shrink-0">{activity.time}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
