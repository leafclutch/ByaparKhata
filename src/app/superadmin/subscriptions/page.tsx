"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { getSubscriptionRenewals, getCompanies } from "@/superadmin/services";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatNPR, getDaysRemaining } from "@/lib/utils";
import Link from "next/link";
import type { SubscriptionRenewal, CompanyStat } from "@/lib/types";

export default function SASubscriptionsPage() {
  const [renewals, setRenewals] = useState<SubscriptionRenewal[]>([]);
  const [companies, setCompanies] = useState<CompanyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSubscriptionRenewals(), getCompanies()])
      .then(([r, c]) => { setRenewals(r); setCompanies(c); })
      .finally(() => setLoading(false));
  }, []);

  const expiringSoon = companies.filter((c) => {
    const days = getDaysRemaining(c.subscription_end);
    return days !== null && days >= 0 && days <= 30;
  });

  const totalActive = companies.filter((c) => c.company_status === "active").length;
  const totalExpired = companies.filter((c) => c.company_status === "expired").length;
  const totalRevenue = renewals.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Subscriptions</h1>
        <p className="text-sm text-slate-500 mt-0.5">Renewal history and upcoming expirations</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Subscriptions", value: totalActive, color: "text-emerald-600" },
          { label: "Expiring This Month", value: expiringSoon.length, color: "text-amber-600" },
          { label: "Expired", value: totalExpired, color: "text-rose-600" },
          { label: "Total Renewal Revenue", value: formatNPR(totalRevenue), color: "text-indigo-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Expiring soon */}
      {expiringSoon.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-50 bg-amber-50/50">
            <p className="text-sm font-semibold text-amber-800">Expiring in the next 30 days</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                {["Company", "Plan", "Expires", "Days Left"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expiringSoon.map((c) => {
                const days = getDaysRemaining(c.subscription_end);
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/superadmin/companies/${c.id}`} className="font-medium text-slate-800 hover:text-indigo-600">{c.name}</Link>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={c.plan} /></td>
                    <td className="px-5 py-3 text-xs text-slate-600">{c.subscription_end}</td>
                    <td className="px-5 py-3 text-xs font-bold text-amber-600">{days === 0 ? "Today" : `${days} days`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Renewal log */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <p className="text-sm font-semibold text-slate-800">Renewal History</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Company", "Plan", "Start", "End", "Amount", "Renewed By", "Date"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">Loading…</td></tr>}
              {!loading && renewals.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{r.company_name}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.plan} /></td>
                  <td className="px-5 py-3 text-xs text-slate-600">{r.start_date}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">{r.end_date}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{formatNPR(r.amount)}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{r.renewed_by}</td>
                  <td className="px-5 py-3 text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {!loading && renewals.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center"><CreditCard className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-400">No renewals yet</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
