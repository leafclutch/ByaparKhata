"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, PackageSearch, DollarSign, Package, AlertTriangle, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getSales } from "@/lib/services/sales";
import { getPurchases } from "@/lib/services/purchases";
import { getProducts } from "@/lib/services/products";
import { formatNPR, formatDate, getStockStatus, getDateRange } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Sale, Purchase, Product } from "@/lib/types";

const quickActions = [
  { href: "/operator/sales/new", icon: ShoppingCart, label: "New Sale", desc: "Record a sale transaction", color: "bg-brand-600 hover:bg-brand-700 text-white" },
  { href: "/operator/purchases", icon: PackageSearch, label: "New Purchase", desc: "Add stock from supplier", color: "bg-cyan-600 hover:bg-cyan-700 text-white" },
  { href: "/operator/expenses", icon: DollarSign, label: "Add Expense", desc: "Log business expense", color: "bg-amber-500 hover:bg-amber-600 text-white" },
  { href: "/operator/products", icon: Package, label: "Manage Products", desc: "Add or edit products", color: "bg-violet-600 hover:bg-violet-700 text-white" },
];

// Fix #7: date-scoped queries (35 days) — eliminates 1100+ row fetches for "today" sums
// Fix #7: removed dead getExpenses fetch — expenses are not displayed on this page
export default function OperatorDashboardPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!user?.company_id || !user?.id) return;
    const cid = user.company_id;
    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    Promise.all([
      getSales(cid, { operator_id: user.id, from_date: thirtyFiveDaysAgo }),
      getPurchases(cid, { operator_id: user.id, from_date: thirtyFiveDaysAgo }),
      getProducts(cid),
    ])
      .then(([s, p, pr]) => { setSales(s); setPurchases(p); setProducts(pr); })
      .catch((err) => {
        console.error("[operator dashboard]", err);
        toast.error("Failed to load dashboard data.");
      });
  }, [user?.company_id, user?.id]);

  const today = new Date().toISOString().split("T")[0];
  const weekRange = getDateRange("7days");
  const monthRange = getDateRange("month");

  function salesInRange(from: string, to: string) {
    return sales.filter((s) => s.created_at >= `${from}T00:00:00` && s.created_at <= `${to}T23:59:59`);
  }
  function purchasesInRange(from: string, to: string) {
    return purchases.filter((p) => p.purchased_at >= `${from}T00:00:00` && p.purchased_at <= `${to}T23:59:59`);
  }

  const todaySales = salesInRange(today, today);
  const weekSales = salesInRange(weekRange.from, weekRange.to);
  const monthSales = salesInRange(monthRange.from, monthRange.to);

  const todayPurchases = purchasesInRange(today, today);
  const weekPurchases = purchasesInRange(weekRange.from, weekRange.to);
  const monthPurchases = purchasesInRange(monthRange.from, monthRange.to);

  const lowStockProducts = products.filter((p) => getStockStatus(p.quantity, p.min_stock) !== "ok");
  const firstName = user?.full_name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  const sum = (arr: { grand_total?: number; total_cost?: number }[], key: "grand_total" | "total_cost") =>
    arr.reduce((s, r) => s + (r[key] as number ?? 0), 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-slate-900">Good {greeting}, {firstName}</h2>
        <p className="text-sm text-slate-500 mt-0.5">Here's your activity summary</p>
      </motion.div>

      {lowStockProducts.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
          <span className="text-amber-800 flex-1 truncate">
            <span className="font-semibold">{lowStockProducts.length} items</span> low on stock — {lowStockProducts.map((p) => p.name).join(", ")}
          </span>
          <Link href="/operator/inventory" className="text-amber-700 font-semibold hover:underline flex-shrink-0">View</Link>
        </motion.div>
      )}

      {/* Sales Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700">Sales Overview</h3>
          <Link href="/operator/sales" className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1">
            Full History <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Today", value: sum(todaySales, "grand_total"), count: todaySales.length, period: "today", color: "brand" },
            { label: "This Week", value: sum(weekSales, "grand_total"), count: weekSales.length, period: "7days", color: "indigo" },
            { label: "This Month", value: sum(monthSales, "grand_total"), count: monthSales.length, period: "month", color: "violet" },
            { label: "All Loaded", value: sum(sales, "grand_total"), count: sales.length, period: "all", color: "slate" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <Link href={`/operator/sales?period=${card.period}`}
                className="block bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  <TrendingUp className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-500 transition-colors" />
                </div>
                <p className="text-lg font-black text-slate-900">{formatNPR(card.value)}</p>
                <p className="text-xs text-slate-400 mt-0.5">{card.count} transaction{card.count !== 1 ? "s" : ""}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Purchase Overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700">Purchase Overview</h3>
          <Link href="/operator/purchases" className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1">
            Full History <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Today", value: sum(todayPurchases, "total_cost"), count: todayPurchases.length, period: "today" },
            { label: "This Week", value: sum(weekPurchases, "total_cost"), count: weekPurchases.length, period: "7days" },
            { label: "This Month", value: sum(monthPurchases, "total_cost"), count: monthPurchases.length, period: "month" },
            { label: "All Loaded", value: sum(purchases, "total_cost"), count: purchases.length, period: "all" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
              <Link href={`/operator/purchases?period=${card.period}`}
                className="block bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  <PackageSearch className="w-3.5 h-3.5 text-slate-300 group-hover:text-cyan-500 transition-colors" />
                </div>
                <p className="text-lg font-black text-slate-900">{formatNPR(card.value)}</p>
                <p className="text-xs text-slate-400 mt-0.5">{card.count} order{card.count !== 1 ? "s" : ""}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <motion.div key={action.href} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.06 }}>
              <Link href={action.href} className={`flex flex-col gap-3 p-4 rounded-2xl transition-all duration-150 group ${action.color}`}>
                <action.icon className="w-6 h-6" />
                <div>
                  <p className="text-sm font-bold">{action.label}</p>
                  <p className="text-xs opacity-75">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 self-end opacity-60 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Sales */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
          <h3 className="text-sm font-bold text-slate-800">My Recent Sales</h3>
          <Link href="/operator/sales?period=month" className="text-xs text-brand-600 font-medium hover:underline">View all</Link>
        </div>
        {sales.length === 0 ? (
          <div className="py-10 text-center">
            <ShoppingCart className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No sales recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{sale.customer_name || "Walk-in"}</p>
                  <p className="text-xs text-slate-400">{sale.invoice_number} · {formatDate(sale.created_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-emerald-700">{formatNPR(sale.grand_total)}</p>
                  <StatusBadge status={sale.payment_method as any} />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
