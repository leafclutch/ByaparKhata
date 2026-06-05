"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, ShoppingCart, PackageSearch,
  DollarSign, Package, AlertTriangle, Boxes, Tag,
} from "lucide-react";
import { KPICard } from "@/components/shared/KPICard";
import { RevenueAreaChart } from "@/components/charts/RevenueAreaChart";
import { ExpenseDonutChart } from "@/components/charts/ExpenseDonutChart";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardData } from "@/lib/services/analytics";
import { toast } from "sonner";
import { formatNPR, formatDate } from "@/lib/utils";
import Link from "next/link";
import type { DashboardKPIs, MonthlyData, CategoryBreakdown, ProductStat, Sale } from "@/lib/types";

const txnColumns = [
  { key: "invoice_number", header: "Invoice", render: (r: Sale) => <code className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{r.invoice_number}</code> },
  { key: "customer_name", header: "Customer", render: (r: Sale) => <span className="text-sm text-slate-700">{r.customer_name || "Walk-in"}</span> },
  { key: "operator", header: "By", render: (r: Sale) => <span className="text-xs text-slate-500">{r.operator?.full_name ?? "—"}</span> },
  { key: "payment_method", header: "Payment", render: (r: Sale) => <StatusBadge status={r.payment_method} /> },
  { key: "created_at", header: "Date", render: (r: Sale) => <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span> },
  { key: "grand_total", header: "Amount", render: (r: Sale) => <span className="text-sm font-semibold text-emerald-600">+{formatNPR(r.grand_total)}</span> },
];

const productColumns = [
  { key: "name", header: "Product", render: (r: ProductStat) => <span className="text-sm font-medium text-slate-800">{r.name}</span> },
  { key: "units_sold", header: "Units Sold", render: (r: ProductStat) => <span className="text-sm text-slate-600">{r.units_sold.toLocaleString()}</span> },
  { key: "total_revenue", header: "Revenue", render: (r: ProductStat) => <span className="text-sm font-semibold text-slate-800">{formatNPR(r.total_revenue)}</span> },
  {
    key: "percentage", header: "Share", render: (r: ProductStat) => (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full max-w-[80px]">
          <div className="h-1.5 bg-brand-500 rounded-full" style={{ width: `${r.percentage}%` }} />
        </div>
        <span className="text-xs text-slate-500">{r.percentage}%</span>
      </div>
    ),
  },
];

// Fix #1: single getDashboardData call replaces 18 individual queries
export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryBreakdown[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (!user?.company_id) return;
    getDashboardData(user.company_id)
      .then(({ kpis, monthlyData, expenseBreakdown, topProducts, recentSales }) => {
        setKpis(kpis);
        setMonthlyData(monthlyData);
        setExpenseBreakdown(expenseBreakdown);
        setTopProducts(topProducts);
        setRecentSales(recentSales);
      })
      .catch((err) => {
        console.error("[admin dashboard]", err);
        toast.error("Failed to load dashboard data.");
      });
  }, [user?.company_id]);

  const kpiCards = useMemo(() => kpis ? [
    { title: "Total Revenue", value: kpis.total_sales, delta: kpis.sales_change, icon: DollarSign, colorScheme: "indigo" as const, format: "currency" as const },
    { title: "Total Purchases", value: kpis.total_purchases, delta: kpis.purchases_change, icon: PackageSearch, colorScheme: "cyan" as const, format: "currency" as const },
    { title: "Net Profit", value: kpis.net_profit, delta: kpis.profit_change, icon: kpis.net_profit >= 0 ? TrendingUp : TrendingDown, colorScheme: kpis.net_profit >= 0 ? "emerald" as const : "rose" as const, format: "currency" as const },
    { title: "Inventory Value", value: kpis.inventory_value, icon: Boxes, colorScheme: "violet" as const, format: "currency" as const },
    { title: "Total Products", value: kpis.total_products, icon: Package, colorScheme: "blue" as const, format: "number" as const },
    { title: "Out of Stock", value: kpis.out_of_stock_count, icon: AlertTriangle, colorScheme: "rose" as const, format: "number" as const },
    { title: "Top Category", value: kpis.top_category ?? "—", icon: Tag, colorScheme: "amber" as const, format: "text" as const },
  ] : [], [kpis]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">Business overview for this month</p>
      </div>

      {/* Fix #2: low stock products now sourced from kpis — no separate getProducts call */}
      {kpis?.low_stock_products && kpis.low_stock_products.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
          <span className="text-amber-800 font-semibold">
            {kpis.low_stock_products.length} item{kpis.low_stock_products.length > 1 ? "s" : ""} low on stock:
          </span>
          <span className="text-amber-700 truncate flex-1">
            {kpis.low_stock_products.map((p) => p.name).join(" · ")}
          </span>
        </motion.div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {kpiCards.map((kpi, i) => <KPICard key={kpi.title} {...kpi} index={i} />)}
      </div>

      {/* Quick analytics links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Sales Analytics", sub: "Revenue, trends, top products", href: "/admin/analytics", color: "border-l-4 border-brand-500" },
          { label: "Profit & Loss", sub: "Monthly P&L statement", href: "/admin/profit-loss", color: "border-l-4 border-emerald-500" },
          { label: "Purchase Reports", sub: "Supplier & cost analysis", href: "/admin/reports", color: "border-l-4 border-cyan-500" },
          { label: "Team Performance", sub: "Per-operator stats", href: "/admin/analytics/operators", color: "border-l-4 border-violet-500" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
            <Link href={card.href}
              className={`block bg-white rounded-xl ${card.color} p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
            >
              <p className="text-sm font-bold text-slate-800">{card.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Revenue Overview</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sales · Expenses · Profit — last 6 months</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-500" />Sales</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" />Expenses</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Profit</span>
            </div>
          </div>
          <RevenueAreaChart data={monthlyData} height={220} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
          <h3 className="text-sm font-bold text-slate-800 mb-0.5">Expense Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">By category — current month</p>
          <ExpenseDonutChart data={expenseBreakdown} />
        </motion.div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Top Products</h3>
              <p className="text-xs text-slate-400 mt-0.5">By revenue this month</p>
            </div>
          </div>
          <DataTable columns={productColumns} data={topProducts} rowKey="id" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Recent Sales</h3>
            <p className="text-xs text-slate-400 mt-0.5">Last 10 transactions</p>
          </div>
          <DataTable columns={txnColumns} data={recentSales} rowKey="id" />
        </motion.div>
      </div>
    </div>
  );
}
