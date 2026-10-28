import { motion } from 'framer-motion';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatusData {
  name: string;
  orders: number;
}

interface TrafficChartProps {
  data: StatusData[];
}

const barColors = ['#8b5cf6', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#14b8a6'];

export default function TrafficChart({ data }: TrafficChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
      className="bg-white border border-slate-200 rounded-2xl p-6 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Order Status</h3>
          <p className="text-sm text-slate-500 mt-0.5">Distribution of orders by status</p>
        </div>
      </div>
      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
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
            cursor={{ fill: '#e5e7eb', opacity: 0.6 }}
          />
          <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.name}`} fill={barColors[index % barColors.length]} />
            ))}
          </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
