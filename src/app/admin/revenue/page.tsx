"use client";

import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import { RevenueAreaChart } from "@/components/charts/RevenueAreaChart";
import { SalesBarChart } from "@/components/charts/SalesBarChart";
import { DEMO_MONTHLY_DATA, DEMO_KPIS } from "@/lib/mock-data";
import { formatINR, formatINRCompact } from "@/lib/utils";

const monthlyTotals = DEMO_MONTHLY_DATA.map((m) => ({
  ...m,
  growth: 0,
})).map((m, i, arr) => ({
  ...m,
  growth: i === 0 ? 0 : Math.round(((m.sales - arr[i - 1].sales) / arr[i - 1].sales) * 100),
}));

const summaryCards = [
  { label: "Total Revenue (MTD)", value: DEMO_KPIS.total_sales, change: DEMO_KPIS.sales_change, color: "emerald" },
  { label: "Avg Monthly Revenue", value: Math.round(DEMO_MONTHLY_DATA.reduce((s, m) => s + m.sales, 0) / DEMO_MONTHLY_DATA.length), change: null, color: "blue" },
  { label: "Best Month", value: Math.max(...DEMO_MONTHLY_DATA.map((m) => m.sales)), change: null, color: "violet" },
  { label: "YTD Revenue", value: DEMO_MONTHLY_DATA.reduce((s, m) => s + m.sales, 0), change: null, color: "indigo" },
];

export default function RevenuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Revenue</h2>
        <p className="text-sm text-slate-500 mt-0.5">Detailed revenue analysis and trends</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
          >
            <p className="text-xs text-slate-500 mb-2">{card.label}</p>
            <p className="text-xl font-bold text-slate-900">{formatINRCompact(card.value)}</p>
            {card.change !== null && (
              <div className="flex items-center gap-1 mt-1.5">
                <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">+{card.change}% vs last month</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Revenue chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Revenue Trend</h3>
            <p className="text-xs text-slate-400">Monthly sales revenue — Dec 2025 to May 2026</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5" />
            +{DEMO_KPIS.sales_change}% growth
          </div>
        </div>
        <RevenueAreaChart data={DEMO_MONTHLY_DATA} height={280} />
      </motion.div>

      {/* Monthly bar chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Monthly Breakdown</h3>
        <p className="text-xs text-slate-400 mb-4">Sales vs Purchases vs Expenses</p>
        <SalesBarChart data={DEMO_MONTHLY_DATA} height={260} />
      </motion.div>

      {/* Monthly table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">Monthly Revenue Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Month</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sales</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Purchases</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expenses</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Profit</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {monthlyTotals.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{row.month} 2026</td>
                  <td className="px-5 py-3 text-right text-emerald-700 font-semibold">{formatINR(row.sales)}</td>
                  <td className="px-5 py-3 text-right text-rose-600">{formatINR(row.purchases)}</td>
                  <td className="px-5 py-3 text-right text-amber-600">{formatINR(row.expenses)}</td>
                  <td className="px-5 py-3 text-right font-bold text-slate-900">{formatINR(row.profit)}</td>
                  <td className="px-5 py-3 text-right">
                    {row.growth > 0 ? (
                      <span className="text-xs font-medium text-emerald-600">+{row.growth}%</span>
                    ) : row.growth < 0 ? (
                      <span className="text-xs font-medium text-rose-600">{row.growth}%</span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
