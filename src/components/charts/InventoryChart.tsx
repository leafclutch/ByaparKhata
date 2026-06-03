"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ProductStat } from "@/lib/types";
import { formatINRCompact } from "@/lib/utils";

interface InventoryChartProps {
  data: ProductStat[];
  height?: number;
}

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ProductStat;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-sm max-w-[180px]">
      <p className="font-semibold text-slate-800 mb-1">{d.name}</p>
      <p className="text-slate-500">Revenue: <span className="font-semibold text-slate-800">{formatINRCompact(d.total_revenue)}</span></p>
      <p className="text-slate-500">Units sold: <span className="font-semibold text-slate-800">{d.units_sold}</span></p>
    </div>
  );
};

export function InventoryChart({ data, height = 240 }: InventoryChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    shortName: d.name.length > 14 ? d.name.slice(0, 14) + "…" : d.name,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total_revenue" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {chartData.map((_, i) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
