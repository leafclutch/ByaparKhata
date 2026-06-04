"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyData } from "@/lib/types";

interface SalesBarChartProps {
  data: MonthlyData[];
  height?: number;
  showPurchases?: boolean;
  showExpenses?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const fmt = (v: number) =>
    "Rs. " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v);
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.fill }} />
          <span className="text-slate-500 capitalize">{entry.name}:</span>
          <span className="font-semibold">{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function SalesBarChart({ data, height = 260, showPurchases = true, showExpenses = true }: SalesBarChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: any) => `Rs. ${(Number(v) / 100000).toFixed(0)}L`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} formatter={(v: any) => <span className="text-slate-600 capitalize">{v}</span>} />
          <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={36} />
          {showPurchases && <Bar dataKey="purchases" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={36} />}
          {showExpenses && <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={36} />}
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
