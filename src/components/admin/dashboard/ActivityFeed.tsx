import { motion } from 'framer-motion';
import { useState } from 'react';

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
  review: 'bg-violet-400',
  alert: 'bg-red-400',
};

interface ActivityFeedProps {
  activities: Activity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(activities.length / itemsPerPage));
  const visibleActivities = activities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55 }}
      className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 h-full flex flex-col"
    >
      <h3 className="text-base font-semibold text-white mb-1">Activity Feed</h3>
      <p className="text-sm text-gray-500 mb-5">Latest actions across your store</p>
      <div className="space-y-4 flex-1 min-h-[360px]">
        {visibleActivities.map((activity, i) => (
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
      {activities.length > 0 && (
        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#c9a962] hover:text-[#c9a962] transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${page === currentPage ? 'border-[#c9a962] bg-[#c9a962] text-white' : 'border-gray-700 text-gray-300 hover:border-[#c9a962] hover:text-[#c9a962]'}`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#c9a962] hover:text-[#c9a962] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
