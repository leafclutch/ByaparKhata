"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Package, TrendingDown, CheckCircle2 } from "lucide-react";
import { InventoryChart } from "@/components/charts/InventoryChart";
import { ExpenseDonutChart } from "@/components/charts/ExpenseDonutChart";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DEMO_PRODUCTS, DEMO_CATEGORIES } from "@/lib/mock-data";
import { formatINR, getStockStatus } from "@/lib/utils";
import type { Product } from "@/lib/types";

const stockStatusCounts = {
  ok: DEMO_PRODUCTS.filter((p) => getStockStatus(p.quantity, p.min_stock) === "ok").length,
  low: DEMO_PRODUCTS.filter((p) => getStockStatus(p.quantity, p.min_stock) === "low").length,
  out: DEMO_PRODUCTS.filter((p) => getStockStatus(p.quantity, p.min_stock) === "out").length,
};

const categoryBreakdown = DEMO_CATEGORIES.filter((c) => !c.parent_id).map((cat) => {
  const products = DEMO_PRODUCTS.filter((p) => p.category_id === cat.id || p.category_id?.startsWith(cat.id));
  const totalValue = products.reduce((s, p) => s + p.quantity * p.purchase_price, 0);
  return { name: cat.name, value: totalValue, color: cat.color ?? "#94a3b8" };
});

const inventoryColumns = [
  { key: "sku", header: "SKU", render: (r: Product) => <code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{r.sku}</code> },
  { key: "name", header: "Product", render: (r: Product) => <span className="text-sm font-medium text-slate-800">{r.name}</span> },
  { key: "category", header: "Category", render: (r: Product) => <span className="text-xs text-slate-500">{r.category?.name}</span> },
  {
    key: "quantity", header: "In Stock",
    render: (r: Product) => (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-800">{r.quantity}</span>
        <span className="text-xs text-slate-400">/ min {r.min_stock}</span>
      </div>
    ),
  },
  { key: "status", header: "Status", render: (r: Product) => <StatusBadge status={getStockStatus(r.quantity, r.min_stock)} /> },
  {
    key: "stock_value", header: "Stock Value",
    render: (r: Product) => <span className="text-sm font-semibold text-slate-800">{formatINR(r.quantity * r.purchase_price)}</span>,
  },
  { key: "selling_price", header: "Sell Price", render: (r: Product) => <span className="text-sm text-slate-600">{formatINR(r.selling_price)}</span> },
];

const lowStockProducts = DEMO_PRODUCTS.filter((p) => getStockStatus(p.quantity, p.min_stock) !== "ok")
  .sort((a, b) => a.quantity - b.quantity);

const topChartData = DEMO_PRODUCTS
  .sort((a, b) => (b.quantity * b.purchase_price) - (a.quantity * a.purchase_price))
  .slice(0, 8)
  .map((p) => ({ id: p.id, name: p.name, total_revenue: p.quantity * p.purchase_price, units_sold: p.quantity, percentage: 0 }));

export default function InventoryInsightsPage() {
  const totalValue = DEMO_PRODUCTS.reduce((s, p) => s + p.quantity * p.purchase_price, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Inventory Insights</h2>
        <p className="text-sm text-slate-500 mt-0.5">Read-only stock analysis and alerts</p>
      </div>

      {/* Stock health cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: DEMO_PRODUCTS.length, icon: Package, color: "text-brand-700 bg-brand-50" },
          { label: "Healthy Stock", value: stockStatusCounts.ok, icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50" },
          { label: "Low Stock", value: stockStatusCounts.low, icon: AlertTriangle, color: "text-amber-700 bg-amber-50" },
          { label: "Out of Stock", value: stockStatusCounts.out, icon: TrendingDown, color: "text-rose-700 bg-rose-50" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
            <span className="text-sm font-semibold text-amber-800">Low / Out of Stock Alerts</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-amber-100">
                <div>
                  <p className="text-xs font-medium text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">Min: {p.min_stock} · Have: {p.quantity}</p>
                </div>
                <StatusBadge status={getStockStatus(p.quantity, p.min_stock)} />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Stock Value by Category</h3>
          <p className="text-xs text-slate-400 mb-4">Total: {formatINR(totalValue)}</p>
          <ExpenseDonutChart data={categoryBreakdown} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Top Products by Stock Value</h3>
          <p className="text-xs text-slate-400 mb-4">Highest value products in inventory</p>
          <InventoryChart data={topChartData} height={240} />
        </motion.div>
      </div>

      {/* Full inventory table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm"
      >
        <div className="px-5 py-4 border-b border-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">All Products</h3>
          <p className="text-xs text-slate-400 mt-0.5">Read-only inventory view</p>
        </div>
        <DataTable
          columns={inventoryColumns}
          data={DEMO_PRODUCTS}
          rowKey="id"
          searchable
          searchKeys={["name", "sku"]}
        />
      </motion.div>
    </div>
  );
}
