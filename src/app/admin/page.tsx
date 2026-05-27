"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, ShoppingCart, PackageSearch,
  DollarSign, BarChart3, Package, AlertTriangle,
} from "lucide-react";
import { KPICard } from "@/components/shared/KPICard";
import { RevenueAreaChart } from "@/components/charts/RevenueAreaChart";
import { ExpenseDonutChart } from "@/components/charts/ExpenseDonutChart";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardKPIs, getMonthlyRevenue, getExpenseBreakdown, getTopProducts } from "@/lib/services/analytics";
import { getSales } from "@/lib/services/sales";
import { getProducts } from "@/lib/services/products";
import { formatINR, formatDate, getStockStatus } from "@/lib/utils";
import {
  DEMO_KPIS, DEMO_MONTHLY_DATA, DEMO_EXPENSE_BREAKDOWN, DEMO_TOP_PRODUCTS,
} from "@/lib/mock-data";
import type { DashboardKPIs, MonthlyData, CategoryBreakdown, ProductStat, Sale, Product } from "@/lib/types";

const txnColumns = [
  { key: "invoice_number", header: "Invoice", render: (r: Sale) => <code className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{r.invoice_number}</code> },
  { key: "customer_name", header: "Customer", render: (r: Sale) => <span className="text-sm text-slate-700">{r.customer_name || "Walk-in"}</span> },
  { key: "operator", header: "By", render: (r: Sale) => <span className="text-xs text-slate-500">{r.operator?.full_name ?? "—"}</span> },
  { key: "payment_method", header: "Payment", render: (r: Sale) => <StatusBadge status={r.payment_method} /> },
  { key: "created_at", header: "Date", render: (r: Sale) => <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span> },
  { key: "grand_total", header: "Amount", render: (r: Sale) => <span className="text-sm font-semibold text-emerald-600">+{formatINR(r.grand_total)}</span> },
];

const productColumns = [
  { key: "name", header: "Product", render: (r: ProductStat) => <span className="text-sm font-medium text-slate-800">{r.name}</span> },
  { key: "units_sold", header: "Units Sold", render: (r: ProductStat) => <span className="text-sm text-slate-600">{r.units_sold.toLocaleString()}</span> },
  { key: "total_revenue", header: "Revenue", render: (r: ProductStat) => <span className="text-sm font-semibold text-slate-800">{formatINR(r.total_revenue)}</span> },
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

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<DashboardKPIs>(DEMO_KPIS);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>(DEMO_MONTHLY_DATA);
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryBreakdown[]>(DEMO_EXPENSE_BREAKDOWN);
  const [topProducts, setTopProducts] = useState<ProductStat[]>(DEMO_TOP_PRODUCTS);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!user) return;
    const cid = user.company_id;
    Promise.all([
      getDashboardKPIs(cid),
      getMonthlyRevenue(cid, 6),
      getExpenseBreakdown(cid),
      getTopProducts(cid, 5),
      getSales(cid),
      getProducts(cid),
    ]).then(([k, m, e, tp, sales, products]) => {
      setKpis(k);
      setMonthlyData(m);
      setExpenseBreakdown(e);
      setTopProducts(tp);
      setRecentSales(sales.slice(0, 10));
      setLowStockProducts(products.filter((p) => getStockStatus(p.quantity, p.min_stock) !== "ok"));
    }).catch(() => {});
  }, [user]);

  const kpiCards = [
    { title: "Total Sales (MTD)", value: kpis.total_sales, delta: kpis.sales_change, icon: ShoppingCart, colorScheme: "indigo" as const, format: "currency" as const },
    { title: "Total Purchases", value: kpis.total_purchases, delta: kpis.purchases_change, icon: PackageSearch, colorScheme: "cyan" as const, format: "currency" as const },
    { title: "Total Expenses", value: kpis.total_expenses, delta: kpis.expenses_change, icon: DollarSign, colorScheme: "amber" as const, format: "currency" as const },
    { title: "Net Profit", value: kpis.net_profit, delta: kpis.profit_change, icon: kpis.net_profit >= 0 ? TrendingUp : TrendingDown, colorScheme: kpis.net_profit >= 0 ? "emerald" as const : "rose" as const, format: "currency" as const },
    { title: "Inventory Value", value: kpis.inventory_value, icon: Package, colorScheme: "violet" as const, format: "currency" as const },
  ];

  return (
    <div className="space-y-6">
      {lowStockProducts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
          <span className="text-amber-800 font-medium">{lowStockProducts.length} product{lowStockProducts.length > 1 ? "s are" : " is"} running low on stock:</span>
          <span className="text-amber-700 truncate">{lowStockProducts.map((p) => p.name).join(", ")}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi, i) => <KPICard key={kpi.title} {...kpi} index={i} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Revenue Overview</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sales vs Expenses — last 6 months</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />Sales</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />Expenses</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Profit</span>
            </div>
          </div>
          <RevenueAreaChart data={monthlyData} height={220} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Expense Breakdown</h3>
          <p className="text-xs text-slate-400 mb-4">By category — current month</p>
          <ExpenseDonutChart data={expenseBreakdown} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-50">
            <h3 className="text-sm font-semibold text-slate-800">Top Products</h3>
            <p className="text-xs text-slate-400 mt-0.5">By revenue this month</p>
          </div>
          <DataTable columns={productColumns} data={topProducts} rowKey="id" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-50">
            <h3 className="text-sm font-semibold text-slate-800">Recent Sales</h3>
            <p className="text-xs text-slate-400 mt-0.5">Last 10 transactions</p>
          </div>
          <DataTable columns={txnColumns} data={recentSales} rowKey="id" />
        </motion.div>
      </div>
    </div>
  );
}
