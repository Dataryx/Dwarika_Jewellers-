import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Electronics', value: 35, color: '#8b5cf6' },
  { name: 'Fashion', value: 25, color: '#8b5cf6' },
  { name: 'Home', value: 20, color: '#10b981' },
  { name: 'Sports', value: 12, color: '#3b82f6' },
  { name: 'Books', value: 8, color: '#ec4899' },
];

export default function CategoryChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6"
    >
      <h3 className="text-base font-semibold text-white mb-1">Sales by Category</h3>
      <p className="text-sm text-slate-500 mb-6">Distribution across product categories</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              color: '#e2e8f0',
              fontSize: '13px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-3 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-slate-400">{item.name}</span>
            </div>
            <span className="text-sm font-medium text-white">{item.value}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
