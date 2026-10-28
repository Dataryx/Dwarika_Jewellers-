import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryChartProps {
  data: CategoryData[];
}

export default function CategoryChart({ data }: CategoryChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="bg-white border border-slate-200 rounded-2xl p-6 h-full max-h-[420px] min-h-[420px] flex flex-col overflow-hidden"
    >
      <div className="shrink-0 mb-4">
        <h3 className="text-base font-semibold text-slate-900 mb-1">Sales by Category</h3>
        <p className="text-sm text-slate-500">Distribution across product categories</p>
      </div>
      <div className="h-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
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
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                color: '#111827',
                fontSize: '13px',
              }}
              itemStyle={{ color: '#374151' }}
              labelStyle={{ color: '#111827' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
        {data.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-2">No category data</p>
        ) : (
          data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-600 truncate">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-slate-900 shrink-0 ml-2">{item.value}%</span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
