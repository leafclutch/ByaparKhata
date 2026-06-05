"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Eye, Trash2, Printer, Search, Download, ChevronLeft, ChevronRight, RotateCcw, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getSales, deleteSale } from "@/lib/services/sales";
import { getCompanyTeam } from "@/lib/services/company";
import { formatNPR, formatDateTime, PAYMENT_METHOD_LABELS, getDateRange, downloadCSV, cn } from "@/lib/utils";
import type { Sale, AppUser, PaymentMethod } from "@/lib/types";
import type { DatePeriod } from "@/lib/utils";

const PAGE_SIZE = 25;

const PERIOD_LABELS: Record<DatePeriod, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7days": "Last 7 Days",
  "30days": "Last 30 Days",
  month: "This Month",
  all: "All Time",
  custom: "Custom",
};

function SalesHistoryContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const initPeriod = (searchParams.get("period") as DatePeriod) ?? "month";
  const [period, setPeriod] = useState<DatePeriod>(initPeriod);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [team, setTeam] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterOperator, setFilterOperator] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [page, setPage] = useState(1);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.company_id) return;
    setLoading(true);
    const { from, to } = getDateRange(period, customFrom, customTo);
    try {
      const [sales, members] = await Promise.all([
        getSales(user.company_id, {
          from_date: from || undefined,
          to_date: to || undefined,
        }),
        getCompanyTeam(user.company_id),
      ]);
      setAllSales(sales);
      setTeam(members);
    } catch {
      toast.error("Failed to load sales.");
    } finally {
      setLoading(false);
    }
  }, [user?.company_id, period, customFrom, customTo]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    return allSales.filter((s) => {
      if (filterOperator !== "all" && s.operator_id !== filterOperator) return false;
      if (filterPayment !== "all" && s.payment_method !== filterPayment) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.invoice_number.toLowerCase().includes(q) &&
            !(s.customer_name ?? "").toLowerCase().includes(q) &&
            !(s.notes ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allSales, filterOperator, filterPayment, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalRevenue = filtered.reduce((s, r) => s + r.grand_total, 0);
  const avgSale = filtered.length ? totalRevenue / filtered.length : 0;

  const hasFilters = search || filterOperator !== "all" || filterPayment !== "all";

  function resetFilters() {
    setSearch(""); setFilterOperator("all"); setFilterPayment("all"); setPage(1);
  }

  function handlePeriod(p: DatePeriod) {
    setPeriod(p); setPage(1);
  }

  function handleExportCSV() {
    if (!filtered.length) { toast.error("Nothing to export."); return; }
    downloadCSV(
      filtered.map((s) => ({
        "Invoice": s.invoice_number,
        "Customer": s.customer_name || "Walk-in",
        "Subtotal (Rs.)": s.subtotal,
        "Discount (Rs.)": s.discount,
        "Total (Rs.)": s.grand_total,
        "Payment": PAYMENT_METHOD_LABELS[s.payment_method] || s.payment_method,
        "Created By": s.operator?.full_name || "",
        "Date": formatDateTime(s.created_at),
      })),
      "sales-history"
    );
  }

  async function handleDelete() {
    if (!saleToDelete) return;
    setDeleting(true);
    try {
      const actor = user ? { id: user.id, name: user.full_name, role: user.role } : undefined;
      await deleteSale(saleToDelete.id, actor);
      setAllSales((prev) => prev.filter((s) => s.id !== saleToDelete.id));
      toast.success(`Sale ${saleToDelete.invoice_number} deleted.`);
      setSaleToDelete(null);
    } catch {
      toast.error("Failed to delete sale.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sales History</h2>
          <p className="text-sm text-slate-500 mt-0.5">Browse, filter and export all sales transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 gap-1.5 text-xs">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Link href="/operator/sales/new">
            <Button className="h-9 gap-1.5 text-sm bg-brand-600 hover:bg-brand-700">
              <Plus className="w-4 h-4" /> New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Period selector + filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        {/* Period pills */}
        <div className="flex flex-wrap gap-1.5">
          {(["today", "yesterday", "7days", "30days", "month", "all", "custom"] as DatePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriod(p)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                period === p
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {period === "custom" && (
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={customFrom} onChange={(e) => { setCustomFrom(e.target.value); setPage(1); }} className="h-8 text-xs w-36" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={customTo} onChange={(e) => { setCustomTo(e.target.value); setPage(1); }} className="h-8 text-xs w-36" />
            </div>
          </div>
        )}

        {/* Search + dropdowns */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Invoice # or customer…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 h-9 text-sm bg-slate-50"
            />
          </div>
          <Select value={filterOperator} onValueChange={(v) => { setFilterOperator(v); setPage(1); }}>
            <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="All Users" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {team.map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPayment} onValueChange={(v) => { setFilterPayment(v); setPage(1); }}>
            <SelectTrigger className="h-9 text-sm w-40"><SelectValue placeholder="All Payments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              {(["cash", "online", "mixed"] as PaymentMethod[]).map((m) => (
                <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 gap-1 text-xs text-slate-500">
              <RotateCcw className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>
      </motion.div>

      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-slate-900">{filtered.length}</span>
          <span className="text-slate-500">sales</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-emerald-700">{formatNPR(totalRevenue)}</span>
          <span className="text-slate-500">total</span>
        </div>
        {filtered.length > 0 && (
          <>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-slate-700">{formatNPR(Math.round(avgSale))}</span>
              <span className="text-slate-500">avg sale</span>
            </div>
          </>
        )}
        {loading && <span className="text-xs text-slate-400 animate-pulse">Loading…</span>}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-auto scrollbar-thin scrollbar-thumb-slate-200 max-h-[58vh]">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr>
                {["Invoice", "Customer", "Total", "Discount", "Payment", "Remarks", "Created By", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">Loading sales…</td></tr>
              )}
              {!loading && paginated.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-14 text-center">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">No sales found for this period</p>
                </td></tr>
              )}
              {!loading && paginated.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5">
                    <code className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded font-semibold">{sale.invoice_number}</code>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">{sale.customer_name || "Walk-in"}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">{formatNPR(sale.grand_total)}</td>
                  <td className="px-4 py-3.5 text-slate-500">
                    {sale.discount > 0 ? <span className="text-rose-600">−{formatNPR(sale.discount)}</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    {sale.payment_method === "mixed" ? (
                      <div>
                        <StatusBadge status="mixed" />
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatNPR(sale.cash_amount ?? 0)} / {formatNPR(sale.online_amount ?? 0)}
                        </p>
                      </div>
                    ) : (
                      <StatusBadge status={sale.payment_method as any} />
                    )}
                  </td>
                  <td className="px-4 py-3.5 max-w-[140px]">
                    {sale.notes ? (
                      <p className="text-xs text-slate-500 truncate" title={sale.notes}>{sale.notes}</p>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{sale.operator?.full_name ?? "—"}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">{formatDateTime(sale.created_at)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/operator/billing?sale=${sale.id}`}>
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="View Invoice">
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                      <Link href={`/operator/sales/new?id=${sale.id}`}>
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="Edit">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                      <button onClick={() => setSaleToDelete(sale)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 p-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-slate-600 px-3 py-1 bg-white border border-slate-200 rounded-lg">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 w-8 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      <Dialog open={!!saleToDelete} onOpenChange={() => setSaleToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Sale</DialogTitle>
            <DialogDescription>
              Delete invoice <strong>{saleToDelete?.invoice_number}</strong>? Stock will be restored. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Loading…</div>}>
      <SalesHistoryContent />
    </Suspense>
  );
}
