"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { RevenueAreaChart } from "@/components/charts/RevenueAreaChart";
import { ExpenseDonutChart } from "@/components/charts/ExpenseDonutChart";
import { useAuth } from "@/hooks/useAuth";
import { getMonthlyRevenue, getExpenseBreakdown } from "@/lib/services/analytics";
import { formatINR, formatINRCompact } from "@/lib/utils";
import type { MonthlyData, CategoryBreakdown } from "@/lib/types";

export default function ProfitLossPage() {
  const { user } = useAuth();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryBreakdown[]>([]);

  useEffect(() => {
    if (!user) return;
    const cid = user.company_id;
    Promise.all([getMonthlyRevenue(cid, 6), getExpenseBreakdown(cid)])
      .then(([m, e]) => { setMonthlyData(m); setExpenseBreakdown(e); })
      .catch(() => {});
  }, [user]);

  const plData = monthlyData.map((m) => ({
    month: m.month,
    revenue: m.sales,
    cogs: m.purchases,
    opex: m.expenses,
    grossProfit: m.sales - m.purchases,
    netProfit: m.profit,
    margin: m.sales > 0 ? Math.round((m.profit / m.sales) * 100) : 0,
  }));

  const currentMonth = plData[plData.length - 1];
  const prevMonth = plData[plData.length - 2];

  const summaryItems = currentMonth && prevMonth ? [
    { label: "Gross Revenue", value: currentMonth.revenue, prev: prevMonth.revenue, positive: true },
    { label: "Cost of Goods Sold", value: currentMonth.cogs, prev: prevMonth.cogs, positive: false },
    { label: "Gross Profit", value: currentMonth.grossProfit, prev: prevMonth.grossProfit, positive: true },
    { label: "Operating Expenses", value: currentMonth.opex, prev: prevMonth.opex, positive: false },
    { label: "Net Profit", value: currentMonth.netProfit, prev: prevMonth.netProfit, positive: true },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Profit & Loss</h2>
        <p className="text-sm text-slate-500 mt-0.5">P&L statement and profitability analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">P&L Statement — Current Month</h3>
            <span className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-lg font-medium">Current Month</span>
          </div>
          {summaryItems.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No data yet</p>
          ) : (
            <div className="space-y-0">
              {summaryItems.map((item, i) => {
                const change = item.prev !== 0 ? Math.round(((item.value - item.prev) / item.prev) * 100) : 0;
                const isLast = i === summaryItems.length - 1;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between py-3 ${i > 0 ? "border-t border-slate-50" : ""} ${isLast ? "border-t-2 border-slate-200 mt-1 pt-4" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {i === 0 || i === 2 || i === 4 ? (
                        <div className="w-1 h-4 bg-emerald-400 rounded-full" />
                      ) : (
                        <div className="w-1 h-4 bg-rose-400 rounded-full" />
                      )}
                      <span className={`text-sm ${isLast ? "font-bold text-slate-900" : "text-slate-600"}`}>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs flex items-center gap-0.5 ${(item.positive && change > 0) || (!item.positive && change < 0) ? "text-emerald-600" : "text-rose-600"}`}>
                        {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {Math.abs(change)}%
                      </span>
                      <span className={`text-sm ${isLast ? "font-bold text-slate-900 text-base" : "font-medium text-slate-800"}`}>
                        {item.positive ? "" : "−"}{formatINR(item.value)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {currentMonth && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Net Profit Margin</span>
                <span className="text-sm font-bold text-emerald-700">{currentMonth.margin}%</span>
              </div>
              <div className="mt-2 h-2 bg-slate-100 rounded-full">
                <div className="h-2 bg-emerald-400 rounded-full" style={{ width: `${Math.max(0, currentMonth.margin)}%` }} />
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Expense Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">Operating expenses by category</p>
          <ExpenseDonutChart data={expenseBreakdown} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Profit Trend</h3>
        <p className="text-xs text-slate-400 mb-4">Revenue vs costs over time</p>
        <RevenueAreaChart data={monthlyData} height={260} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">Monthly P&L Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Month", "Revenue", "COGS", "Gross Profit", "OpEx", "Net Profit", "Margin"].map((h, i) => (
                  <th key={h} className={`${i === 0 ? "text-left" : "text-right"} px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {plData.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{row.month}</td>
                  <td className="px-5 py-3 text-right text-slate-800">{formatINRCompact(row.revenue)}</td>
                  <td className="px-5 py-3 text-right text-rose-600">{formatINRCompact(row.cogs)}</td>
                  <td className="px-5 py-3 text-right text-slate-700">{formatINRCompact(row.grossProfit)}</td>
                  <td className="px-5 py-3 text-right text-amber-600">{formatINRCompact(row.opex)}</td>
                  <td className="px-5 py-3 text-right font-bold text-emerald-700">{formatINRCompact(row.netProfit)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.margin >= 25 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {row.margin}%
                    </span>
                  </td>
                </tr>
              ))}
              {plData.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-400">No data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
