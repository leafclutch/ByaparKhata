"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, TrendingUp, IndianRupee, AlertTriangle, XCircle } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { KPICard } from "@/components/shared/KPICard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getPlatformKPIs, getCompanies, getSubscriptionRenewals, getCompanyGrowth } from "@/superadmin/services";
import { formatINR, formatINRCompact, getDaysRemaining } from "@/lib/utils";
import type { PlatformKPIs, CompanyStat, SubscriptionRenewal, CompanyGrowthPoint } from "@/lib/types";
import Link from "next/link";

export default function SuperadminDashboardPage() {
  const [kpis, setKpis] = useState<PlatformKPIs | null>(null);
  const [companies, setCompanies] = useState<CompanyStat[]>([]);
  const [renewals, setRenewals] = useState<SubscriptionRenewal[]>([]);
  const [growth, setGrowth] = useState<CompanyGrowthPoint[]>([]);

  useEffect(() => {
    Promise.all([getPlatformKPIs(), getCompanies(), getSubscriptionRenewals(), getCompanyGrowth()])
      .then(([k, c, r, g]) => { setKpis(k); setCompanies(c); setRenewals(r); setGrowth(g); });
  }, []);

  const recentCompanies = companies.slice(0, 5);
  const expiringSoon = companies.filter((c) => {
    const days = getDaysRemaining(c.subscription_end);
    return days !== null && days >= 0 && days <= 30;
  });
  const disabledCompanies = companies.filter((c) => c.company_status === "disabled" || c.company_status === "paused");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Platform overview</p>
      </div>

      {/* KPI row */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard title="Total Companies" value={kpis.total_companies} icon={Building2} colorScheme="indigo" format="number" index={0} />
          <KPICard title="Active Companies" value={kpis.active_companies} icon={Building2} colorScheme="emerald" format="number" index={1} />
          <KPICard title="Expired Companies" value={kpis.expired_companies} icon={XCircle} colorScheme="rose" format="number" index={2} />
          <KPICard title="Total Revenue" value={kpis.total_revenue} icon={IndianRupee} colorScheme="violet" format="currency" index={3} />
          <KPICard title="Active Users" value={kpis.active_users} icon={Users} colorScheme="cyan" format="number" index={4} />
          <KPICard title="Expiring Soon" value={kpis.expiring_soon} icon={AlertTriangle} colorScheme="amber" format="number" index={5} />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-800 mb-4">Monthly Revenue</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={growth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatINRCompact(v)} />
              <Tooltip formatter={(v) => [formatINR(Number(v)), "Revenue"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-800 mb-4">New Companies / Month</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={growth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="new_companies" name="Companies" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent companies */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <p className="text-sm font-semibold text-slate-800">Recent Companies</p>
            <Link href="/superadmin/companies" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-50">
              {recentCompanies.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/superadmin/companies/${c.id}`} className="font-medium text-slate-800 hover:text-indigo-600">{c.name}</Link>
                    <p className="text-xs text-slate-400">{c.slug}</p>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <StatusBadge status={c.company_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Expiring soon */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <p className="text-sm font-semibold text-slate-800">Expiring Soon</p>
            <Link href="/superadmin/subscriptions" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          {expiringSoon.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">No subscriptions expiring in the next 30 days.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-50">
                {expiringSoon.map((c) => {
                  const days = getDaysRemaining(c.subscription_end);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/superadmin/companies/${c.id}`} className="font-medium text-slate-800 hover:text-indigo-600">{c.name}</Link>
                      </td>
                      <td className="px-5 py-3 text-right text-xs font-semibold text-amber-600">
                        {days === 0 ? "Today" : `${days}d left`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>

      {/* Disabled / paused strip */}
      {disabledCompanies.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <p className="text-sm font-semibold text-slate-800">Paused / Disabled</p>
          </div>
          <div className="flex flex-wrap gap-3 px-5 py-4">
            {disabledCompanies.map((c) => (
              <Link key={c.id} href={`/superadmin/companies/${c.id}`} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <span className="text-sm font-medium text-slate-700">{c.name}</span>
                <StatusBadge status={c.company_status} />
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
