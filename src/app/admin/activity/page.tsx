"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Activity, Search, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { getActivityLogs } from "@/lib/services/activity";
import { getCompanyTeam } from "@/lib/services/company";
import { formatDateTime, cn } from "@/lib/utils";
import type { ActivityLog, ActivityAction, ActivityEntityType, AppUser } from "@/lib/types";

const ACTION_COLORS: Record<ActivityAction, string> = {
  create: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  update: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  delete: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  adjustment: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
};

const ACTION_LABELS: Record<ActivityAction, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  adjustment: "Adjusted",
};

const ENTITY_LABELS: Record<ActivityEntityType, string> = {
  sale: "Sale",
  purchase: "Purchase",
  product: "Product",
  expense: "Expense",
  category: "Category",
  customer: "Customer",
  credit_transaction: "Credit Transaction",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  operator: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
};

export default function ActivityPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [team, setTeam] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterUser, setFilterUser] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [search, setSearch] = useState("");

  const loadLogs = useCallback(async () => {
    if (!user?.company_id) return;
    setLoading(true);
    try {
      const [fetchedLogs, fetchedTeam] = await Promise.all([
        getActivityLogs(user.company_id, {
          user_id: filterUser !== "all" ? filterUser : undefined,
          user_role: filterRole !== "all" ? filterRole : undefined,
          action: filterAction !== "all" ? (filterAction as ActivityAction) : undefined,
          entity_type: filterEntity !== "all" ? (filterEntity as ActivityEntityType) : undefined,
          from_date: filterFrom || undefined,
          to_date: filterTo || undefined,
        }),
        getCompanyTeam(user.company_id),
      ]);
      setLogs(fetchedLogs);
      setTeam(fetchedTeam);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user?.company_id, filterUser, filterRole, filterAction, filterEntity, filterFrom, filterTo]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const displayed = search
    ? logs.filter(
        (l) =>
          l.user_name.toLowerCase().includes(search.toLowerCase()) ||
          (l.entity_label ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  function resetFilters() {
    setFilterUser("all");
    setFilterRole("all");
    setFilterAction("all");
    setFilterEntity("all");
    setFilterFrom("");
    setFilterTo("");
    setSearch("");
  }

  const hasFilters = filterUser !== "all" || filterRole !== "all" || filterAction !== "all" || filterEntity !== "all" || filterFrom || filterTo || search;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Activity Log</h2>
          <p className="text-sm text-slate-500 mt-0.5">Full audit trail of all business transactions</p>
        </div>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={resetFilters} className="h-8 gap-1.5 text-xs text-slate-500">
            <RotateCcw className="w-3 h-3" /> Clear Filters
          </Button>
        )}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
      >
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" /> Filters
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>

          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Users" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {team.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="operator">Operator</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Actions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Created</SelectItem>
              <SelectItem value="update">Updated</SelectItem>
              <SelectItem value="delete">Deleted</SelectItem>
              <SelectItem value="adjustment">Adjusted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterEntity} onValueChange={setFilterEntity}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="sale">Sales</SelectItem>
              <SelectItem value="purchase">Purchases</SelectItem>
              <SelectItem value="product">Products</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-1.5">
            <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="h-9 text-xs" title="From date" />
            <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="h-9 text-xs" title="To date" />
          </div>
        </div>
      </motion.div>

      {/* Log table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-3 border-b border-slate-50 flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {displayed.length} {displayed.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        <div className="overflow-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Timestamp", "User", "Action", "Type", "Details"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">Loading activity log…</td></tr>
              )}
              {!loading && displayed.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No activity found{hasFilters ? " — try adjusting filters" : ""}</p>
                  </td>
                </tr>
              )}
              {!loading && displayed.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {log.user_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 leading-tight">{log.user_name}</p>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", ROLE_COLORS[log.user_role] ?? "bg-slate-100 text-slate-600")}>
                          {log.user_role}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full", ACTION_COLORS[log.action])}>
                      {ACTION_LABELS[log.action]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {ENTITY_LABELS[log.entity_type] ?? log.entity_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 max-w-[280px] truncate" title={log.entity_label}>
                    {log.entity_label ?? log.entity_id}
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
