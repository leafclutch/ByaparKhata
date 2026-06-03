"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RevenueAreaChart } from "@/components/charts/RevenueAreaChart";
import { SalesBarChart } from "@/components/charts/SalesBarChart";
import { InventoryChart } from "@/components/charts/InventoryChart";
import { DataTable } from "@/components/shared/DataTable";
import { useAuth } from "@/hooks/useAuth";
import { getMonthlyRevenue, getTopProducts } from "@/lib/services/analytics";
import { getSales } from "@/lib/services/sales";
import { getCompanyTeam } from "@/lib/services/company";
import { formatINR, formatDate } from "@/lib/utils";
import type { MonthlyData, ProductStat, AppUser, Sale } from "@/lib/types";

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
  const { user } = useAuth();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);
  const [team, setTeam] = useState<AppUser[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (!user) return;
    const cid = user.company_id;
    Promise.all([
      getMonthlyRevenue(cid, 6),
      getTopProducts(cid, 5),
      getCompanyTeam(cid),
      getSales(cid),
    ])
      .then(([m, tp, t, s]) => { setMonthlyData(m); setTopProducts(tp); setTeam(t); setSales(s); })
      .catch(() => {});
  }, [user]);

  const operatorStats = team
    .filter((u) => u.role === "operator")
    .map((op) => {
      const opSales = sales.filter((s) => s.operator_id === op.id);
      const lastSale = opSales[0];
      return {
        operator: op,
        sales_count: opSales.length,
        total_revenue: opSales.reduce((s, r) => s + r.grand_total, 0),
        last_active: lastSale?.created_at ?? op.created_at,
      };
    })
    .sort((a, b) => b.total_revenue - a.total_revenue);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Analytics</h2>
        <p className="text-sm text-slate-500 mt-0.5">Deep-dive into your business performance metrics</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Revenue Trend</h3>
        <p className="text-xs text-slate-400 mb-4">Sales, purchases, expenses and profit — last 6 months</p>
        <RevenueAreaChart data={monthlyData} height={260} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Monthly Comparison</h3>
          <p className="text-xs text-slate-400 mb-4">Sales vs Purchases vs Expenses</p>
          <SalesBarChart data={monthlyData} height={220} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Operator Performance</h3>
          <p className="text-xs text-slate-400 mb-4">Sales activity by team members</p>
          {operatorStats.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No operator data yet</p>
          ) : (
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
          )}
        </motion.div>
      </div>

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
          <DataTable columns={topProductColumns} data={topProducts} rowKey="id" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Revenue by Product</h3>
          <p className="text-xs text-slate-400 mb-4">Top 5 products this month</p>
          <InventoryChart data={topProducts} height={240} />
        </motion.div>
      </div>
    </div>
  );
}
