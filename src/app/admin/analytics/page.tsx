"use client";

import { motion } from "framer-motion";
import { RevenueAreaChart } from "@/components/charts/RevenueAreaChart";
import { SalesBarChart } from "@/components/charts/SalesBarChart";
import { InventoryChart } from "@/components/charts/InventoryChart";
import { DataTable } from "@/components/shared/DataTable";
import {
  DEMO_MONTHLY_DATA, DEMO_TOP_PRODUCTS, DEMO_OPERATOR, DEMO_OPERATOR_2,
  DEMO_SALES,
} from "@/lib/mock-data";
import { formatINR, formatDate } from "@/lib/utils";
import type { ProductStat } from "@/lib/types";

const operatorStats = [
  { operator: DEMO_OPERATOR, sales_count: 5, total_revenue: 47913.12, last_active: "2026-05-26T14:30:00Z" },
  { operator: DEMO_OPERATOR_2, sales_count: 3, total_revenue: 56754.82, last_active: "2026-05-25T16:45:00Z" },
];

const topProductColumns = [
  {
    key: "rank", header: "#",
    render: (_: ProductStat, i?: number) => (
      <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center">
        {(i ?? 0) + 1}
      </span>
    ),
  },
  { key: "name", header: "Product", render: (r: ProductStat) => <span className="text-sm font-medium text-slate-800">{r.name}</span> },
  { key: "units_sold", header: "Units", render: (r: ProductStat) => <span className="text-sm text-slate-600">{r.units_sold}</span> },
  { key: "total_revenue", header: "Revenue", render: (r: ProductStat) => <span className="text-sm font-semibold text-emerald-700">{formatINR(r.total_revenue)}</span> },
  {
    key: "percentage", header: "Share",
    render: (r: ProductStat) => (
      <div className="flex items-center gap-2">
        <div className="h-1.5 bg-slate-100 rounded-full w-16">
          <div className="h-1.5 bg-brand-500 rounded-full" style={{ width: `${r.percentage}%` }} />
        </div>
        <span className="text-xs text-slate-500">{r.percentage}%</span>
      </div>
    ),
  },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Analytics</h2>
        <p className="text-sm text-slate-500 mt-0.5">Deep-dive into your business performance metrics</p>
      </div>

      {/* Revenue trend */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Revenue Trend</h3>
        <p className="text-xs text-slate-400 mb-4">Sales, purchases, expenses and profit — last 6 months</p>
        <RevenueAreaChart data={DEMO_MONTHLY_DATA} height={260} />
      </motion.div>

      {/* Bar chart + operator performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Monthly Comparison</h3>
          <p className="text-xs text-slate-400 mb-4">Sales vs Purchases vs Expenses</p>
          <SalesBarChart data={DEMO_MONTHLY_DATA} height={220} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Operator Performance</h3>
          <p className="text-xs text-slate-400 mb-4">Sales activity by team members</p>
          <div className="space-y-3 mt-4">
            {operatorStats.map((stat) => (
              <div key={stat.operator.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {stat.operator.full_name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{stat.operator.full_name}</p>
                  <p className="text-xs text-slate-400">{stat.sales_count} sales · Last active {formatDate(stat.last_active)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-700">{formatINR(stat.total_revenue)}</p>
                  <p className="text-xs text-slate-400">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top products + inventory chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm"
        >
          <div className="px-5 py-4 border-b border-slate-50">
            <h3 className="text-sm font-semibold text-slate-800">Top Selling Products</h3>
          </div>
          <DataTable columns={topProductColumns} data={DEMO_TOP_PRODUCTS} rowKey="id" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Revenue by Product</h3>
          <p className="text-xs text-slate-400 mb-4">Top 5 products this month</p>
          <InventoryChart data={DEMO_TOP_PRODUCTS} height={240} />
        </motion.div>
      </div>
    </div>
  );
}
