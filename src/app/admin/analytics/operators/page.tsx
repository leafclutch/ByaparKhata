"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, ShoppingCart, PackageSearch, Zap, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getOperatorStats } from "@/lib/services/activity";
import { formatNPR, timeAgo, cn } from "@/lib/utils";
import type { OperatorActivity } from "@/lib/types";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  operator: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
};

export default function OperatorAnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<OperatorActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.company_id) return;
    getOperatorStats(user.company_id)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.company_id]);

  const totalSalesValue = stats.reduce((s, r) => s + r.total_sales_value, 0);
  const totalSalesCount = stats.reduce((s, r) => s + r.sales_count, 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Operator Performance</h2>
        <p className="text-sm text-slate-500 mt-0.5">Sales and activity breakdown per team member</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Team Members", value: String(stats.length), icon: Users, color: "indigo" },
          { label: "Total Sales", value: String(totalSalesCount), icon: ShoppingCart, color: "emerald" },
          { label: "Total Revenue", value: formatNPR(totalSalesValue), icon: Zap, color: "violet" },
          { label: "Active Users", value: String(stats.filter((s) => s.last_active).length), icon: Clock, color: "cyan" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm"
          >
            <p className="text-xs text-slate-500 mb-2">{card.label}</p>
            <p className="text-xl font-bold text-slate-900">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Per-operator table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-50">
          <h3 className="text-sm font-semibold text-slate-800">Team Breakdown</h3>
          <p className="text-xs text-slate-400 mt-0.5">Sorted by sales value</p>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Team Member", "Role", "Sales (Count)", "Sales (Value)", "Purchases", "Activity", "Last Active"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">Loading…</td></tr>
              )}
              {!loading && stats.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No team data available</p>
                  </td>
                </tr>
              )}
              {!loading && stats.map((s) => (
                <tr
                  key={s.user_id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                        s.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-cyan-100 text-cyan-700"
                      )}>
                        {s.user_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <p className="font-semibold text-slate-800">{s.user_name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full capitalize", ROLE_COLORS[s.role])}>
                      {s.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-slate-800">{s.sales_count}</span>
                    <span className="text-xs text-slate-400 ml-1">transactions</span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-emerald-700">{formatNPR(s.total_sales_value)}</td>
                  <td className="px-5 py-4 text-slate-700">{s.purchases_count}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-700">{s.total_actions}</span>
                    <span className="text-xs text-slate-400 ml-1">actions</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-400">
                    {s.last_active ? timeAgo(s.last_active) : <span className="text-slate-300">—</span>}
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
