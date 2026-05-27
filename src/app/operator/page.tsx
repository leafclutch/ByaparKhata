"use client";

import { motion } from "framer-motion";
import { ShoppingCart, PackageSearch, DollarSign, Package, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { DEMO_SALES, DEMO_PURCHASES, DEMO_EXPENSES, DEMO_PRODUCTS, DEMO_OPERATOR } from "@/lib/mock-data";
import { formatINR, formatDate, getStockStatus } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { Sale } from "@/lib/types";

const todaySales = DEMO_SALES.filter((s) => s.operator_id === DEMO_OPERATOR.id);
const totalRevenue = todaySales.reduce((s, r) => s + r.grand_total, 0);
const lowStockProducts = DEMO_PRODUCTS.filter((p) => getStockStatus(p.quantity, p.min_stock) !== "ok");

const quickActions = [
  { href: "/operator/sales", icon: ShoppingCart, label: "New Sale", desc: "Record a sale transaction", color: "bg-brand-600 hover:bg-brand-700 text-white" },
  { href: "/operator/purchases", icon: PackageSearch, label: "New Purchase", desc: "Add stock from supplier", color: "bg-cyan-600 hover:bg-cyan-700 text-white" },
  { href: "/operator/expenses", icon: DollarSign, label: "Add Expense", desc: "Log business expense", color: "bg-amber-500 hover:bg-amber-600 text-white" },
  { href: "/operator/products", icon: Package, label: "Manage Products", desc: "Add or edit products", color: "bg-violet-600 hover:bg-violet-700 text-white" },
];

export default function OperatorDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-lg font-bold text-slate-900">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
          {DEMO_OPERATOR.full_name.split(" ")[0]} 👋
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">Here's a summary of today's activity</p>
      </motion.div>

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
          <span className="text-amber-800 flex-1 truncate">
            <span className="font-semibold">{lowStockProducts.length} items</span> are low on stock — {lowStockProducts.map((p) => p.name).join(", ")}
          </span>
          <Link href="/operator/inventory" className="text-amber-700 font-medium hover:underline flex-shrink-0">
            View →
          </Link>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "My Sales Today", value: formatINR(totalRevenue), sub: `${todaySales.length} transactions`, color: "emerald" },
          { label: "Purchases (MTD)", value: formatINR(DEMO_PURCHASES.reduce((s, r) => s + r.total_cost, 0)), sub: `${DEMO_PURCHASES.length} purchase orders`, color: "cyan" },
          { label: "Expenses (MTD)", value: formatINR(DEMO_EXPENSES.reduce((s, r) => s + r.amount, 0)), sub: `${DEMO_EXPENSES.length} records`, color: "amber" },
          { label: "Low Stock Items", value: String(lowStockProducts.length), sub: "need restocking", color: lowStockProducts.length > 0 ? "rose" : "emerald" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
          >
            <p className="text-xs text-slate-500 mb-2">{stat.label}</p>
            <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.07 }}
            >
              <Link
                href={action.href}
                className={`flex flex-col gap-3 p-4 rounded-2xl transition-all duration-150 group ${action.color}`}
              >
                <action.icon className="w-6 h-6" />
                <div>
                  <p className="text-sm font-bold">{action.label}</p>
                  <p className="text-xs opacity-80">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 self-end opacity-60 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent sales */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">My Recent Sales</h3>
          <Link href="/operator/transactions" className="text-xs text-brand-600 font-medium hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {DEMO_SALES.slice(0, 5).map((sale) => (
            <div key={sale.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-4 h-4 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{sale.customer_name || "Walk-in"}</p>
                <p className="text-xs text-slate-400">{sale.invoice_number} · {formatDate(sale.created_at)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-emerald-700">{formatINR(sale.grand_total)}</p>
                <StatusBadge status={sale.payment_method} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
