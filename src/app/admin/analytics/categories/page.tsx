"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tag, Boxes, TrendingUp, ShoppingBag, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/shared/KPICard";
import { DataTable } from "@/components/shared/DataTable";
import { useAuth } from "@/hooks/useAuth";
import { getCategoryAnalytics, type CategoryStat } from "@/lib/services/analytics";
import { formatNPR, formatNPRCompact } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from "recharts";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export default function CategoryAnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.company_id) return;
    getCategoryAnalytics(user.company_id)
      .then(setStats)
      .catch((err) => {
        console.error("[category analytics]", err);
      })
      .finally(() => setLoading(false));
  }, [user?.company_id]);

  const bestSelling = [...stats].sort((a, b) => b.total_sales - a.total_sales)[0];
  const outOfStockCats = stats.filter(s => s.product_count > 0 && s.inventory_value === 0).length;

  const chartData = stats.map(s => ({
    name: s.name,
    sales: s.total_sales,
    stock: s.inventory_value,
    products: s.product_count
  })).sort((a, b) => b.sales - a.sales).slice(0, 8);

  const COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#64748b"];

  const columns = [
    { key: "name", header: "Category", render: (r: CategoryStat) => <span className="font-bold text-slate-800">{r.name}</span> },
    { key: "product_count", header: "Products", render: (r: CategoryStat) => <span className="text-slate-600">{r.product_count}</span> },
    { key: "total_sales", header: "Total Sales", render: (r: CategoryStat) => <span className="font-bold text-emerald-600">{formatNPR(r.total_sales)}</span> },
    { key: "total_purchases", header: "Purchases", hideBelow: "md" as const, render: (r: CategoryStat) => <span className="text-slate-600">{formatNPR(r.total_purchases)}</span> },
    { key: "inventory_value", header: "Stock Value", hideBelow: "md" as const, render: (r: CategoryStat) => <span className="font-semibold text-slate-700">{formatNPR(r.inventory_value)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Breadcrumbs items={[{ label: "Insights" }, { label: "Category Analytics" }]} />
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Category Analytics</h2>
            <p className="text-sm text-slate-500 mt-0.5">Insights and performance by product category</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Top Category" value={bestSelling?.name ?? "—"} icon={Tag} colorScheme="indigo" format="text" />
        <KPICard title="Total Categories" value={stats.length} icon={Boxes} colorScheme="cyan" format="number" />
        <KPICard title="Out of Stock Categories" value={outOfStockCats} icon={ShoppingBag} colorScheme="rose" format="number" />
        <KPICard title="Avg Sales / Category" value={stats.length ? stats.reduce((s, c) => s + c.total_sales, 0) / stats.length : 0} icon={TrendingUp} colorScheme="emerald" format="currency" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6">Sales Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs. ${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                  formatter={(v: any) => [formatNPR(Number(v)), "Sales"]}
                />
                <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6">Stock Value by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="stock"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                   formatter={(v: any) => [formatNPR(Number(v)), "Stock Value"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {chartData.slice(0, 4).map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-[10px] text-slate-500 truncate">{d.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Category Breakdown</h3>
        </div>
        <DataTable
          columns={columns}
          data={stats}
          rowKey="id"
          emptyMessage={loading ? "Loading statistics…" : "No categories found"}
          className="m-0"
        />
      </motion.div>
    </div>
  );
}
