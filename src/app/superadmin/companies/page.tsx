"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getCompanies, setCompanyStatus } from "@/superadmin/services";
import { formatINRCompact, getDaysRemaining } from "@/lib/utils";
import { toast } from "sonner";
import type { CompanyStat, CompanyStatus } from "@/lib/types";

const TABS: { label: string; value: CompanyStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Expired", value: "expired" },
  { label: "Disabled", value: "disabled" },
];

export default function SACompaniesPage() {
  const [companies, setCompanies] = useState<CompanyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<CompanyStatus | "all">("all");

  useEffect(() => {
    getCompanies().then(setCompanies).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchTab = tab === "all" || c.company_status === tab;
      const q = search.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.slug ?? "").toLowerCase().includes(q) || (c.gst_number ?? "").toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [companies, tab, search]);

  async function handleStatusChange(id: string, status: CompanyStatus) {
    try {
      await setCompanyStatus(id, status);
      setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, company_status: status } : c));
      toast.success(`Company ${status}.`);
    } catch {
      toast.error("Failed to update status.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Companies</h1>
          <p className="text-sm text-slate-500 mt-0.5">{companies.length} total companies</p>
        </div>
        <Button asChild className="h-9 gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700">
          <Link href="/superadmin/companies/new"><Plus className="w-4 h-4" /> New Company</Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === t.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search name, slug, PAN/VAT…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Company", "Plan", "Status", "Subscription End", "Users", "Revenue", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">Loading…</td></tr>}
              {!loading && filtered.map((c) => {
                const days = getDaysRemaining(c.subscription_end);
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/superadmin/companies/${c.id}`} className="font-medium text-slate-800 hover:text-indigo-600">{c.name}</Link>
                      <p className="text-xs text-slate-400">{c.slug}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.plan} /></td>
                    <td className="px-4 py-3"><StatusBadge status={c.company_status} /></td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">{c.subscription_end ?? "—"}</span>
                      {days !== null && days >= 0 && days <= 30 && (
                        <span className="ml-1.5 text-[10px] font-semibold text-amber-600">{days}d left</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.users_count}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{formatINRCompact(c.total_sales_value)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/superadmin/companies/${c.id}`} className="px-2.5 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors">View</Link>
                        {c.company_status === "active" && (
                          <button onClick={() => handleStatusChange(c.id, "paused")} className="px-2.5 py-1 text-xs bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors">Pause</button>
                        )}
                        {c.company_status === "paused" && (
                          <button onClick={() => handleStatusChange(c.id, "active")} className="px-2.5 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">Resume</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><Building2 className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-400">No companies found</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
