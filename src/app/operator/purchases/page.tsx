"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Trash2, Search, ChevronLeft, ChevronRight, RotateCcw, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getPurchases, deletePurchase } from "@/lib/services/purchases";
import { getProducts } from "@/lib/services/products";
import { formatNPR, formatDate, PAYMENT_METHOD_LABELS, getDateRange, downloadCSV, cn } from "@/lib/utils";
import type { Purchase, Product, PaymentMethod } from "@/lib/types";
import type { DatePeriod } from "@/lib/utils";

const PAGE_SIZE = 25;

const PERIOD_LABELS: Record<DatePeriod, string> = {
  today: "Today", yesterday: "Yesterday", "7days": "Last 7 Days",
  "30days": "Last 30 Days", month: "This Month", all: "All Time", custom: "Custom",
};


function PurchaseHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const initPeriod = (searchParams.get("period") as DatePeriod) ?? "month";
  const [period, setPeriod] = useState<DatePeriod>(initPeriod);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterPayment, setFilterPayment] = useState("all");
  const [page, setPage] = useState(1);

  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load products once — they don't change with date period
  useEffect(() => {
    if (!user?.company_id) return;
    getProducts(user.company_id).then(setProducts).catch(() => {});
  }, [user?.company_id]);

  const loadData = useCallback(async () => {
    if (!user?.company_id) return;
    setLoading(true);
    const { from, to } = getDateRange(period, customFrom, customTo);
    try {
      setAllPurchases(await getPurchases(user.company_id, {
        from_date: from || undefined,
        to_date: to || undefined,
      }));
    } catch {
      toast.error("Failed to load purchases.");
    } finally {
      setLoading(false);
    }
  }, [user?.company_id, period, customFrom, customTo]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    return allPurchases.filter((p) => {
      if (filterPayment !== "all" && p.payment_method !== filterPayment) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.supplier_name.toLowerCase().includes(q) &&
            !p.product_name.toLowerCase().includes(q) &&
            !(p.invoice_number ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allPurchases, filterPayment, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalCost = filtered.reduce((s, r) => s + r.total_cost, 0);
  const hasFilters = search || filterPayment !== "all";

  function resetFilters() {
    setSearch(""); setFilterPayment("all"); setPage(1);
  }



  async function handleDelete() {
    if (!purchaseToDelete) return;
    setDeleting(true);
    try {
      const actor = user ? { id: user.id, name: user.full_name, role: user.role } : undefined;
      await deletePurchase(purchaseToDelete.id, actor);
      setAllPurchases((prev) => prev.filter((p) => p.id !== purchaseToDelete.id));
      toast.success("Purchase deleted and stock adjusted.");
      setPurchaseToDelete(null);
    } catch {
      toast.error("Failed to delete purchase.");
    } finally {
      setDeleting(false);
    }
  }

  function handleExportCSV() {
    if (!filtered.length) { toast.error("Nothing to export."); return; }
    downloadCSV(
      filtered.map((p) => ({
        "Invoice": p.invoice_number ?? "",
        "Supplier": p.supplier_name,
        "Product": p.product_name,
        "Qty": p.quantity,
        "Unit Cost (Rs.)": p.unit_cost,
        "Total (Rs.)": p.total_cost,
        "Payment": PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method,
        "Cash (Rs.)": p.cash_amount ?? "",
        "Online (Rs.)": p.online_amount ?? "",
        "Created By": p.operator?.full_name || "",
        "Date": formatDate(p.purchased_at),
      })),
      "purchase-history"
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Purchase History</h2>
          <p className="text-sm text-slate-500 mt-0.5">Browse, filter and export all purchase records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 gap-1.5 text-xs">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Button onClick={() => router.push("/operator/purchases/new")} className="h-9 gap-1.5 text-sm bg-brand-600 hover:bg-brand-700">
            <Plus className="w-4 h-4" /> New Purchase
          </Button>
        </div>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {(["today", "yesterday", "7days", "30days", "month", "all", "custom"] as DatePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setPage(1); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                period === p ? "bg-brand-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
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
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Supplier, product, invoice…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 h-9 text-sm bg-slate-50"
            />
          </div>
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

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-4 px-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-slate-900">{filtered.length}</span>
          <span className="text-slate-500">purchases</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-rose-700">{formatNPR(totalCost)}</span>
          <span className="text-slate-500">total cost</span>
        </div>
        {loading && <span className="text-xs text-slate-400 animate-pulse">Loading…</span>}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-auto scrollbar-thin scrollbar-thumb-slate-200 max-h-[58vh]">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 whitespace-nowrap hidden sm:table-cell">Invoice</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 whitespace-nowrap">Supplier</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 whitespace-nowrap">Product</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 whitespace-nowrap">Qty</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 whitespace-nowrap">Total</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 whitespace-nowrap">Payment</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 whitespace-nowrap hidden md:table-cell">Created By</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 whitespace-nowrap">Date</th>
                <th className="px-4 py-3 bg-slate-50 border-b border-slate-200" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">Loading purchases…</td></tr>}
              {!loading && paginated.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-14 text-center">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">No purchases found for this period</p>
                </td></tr>
              )}
              {!loading && paginated.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5 hidden sm:table-cell"><code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{p.invoice_number ?? "—"}</code></td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">{p.supplier_name}</td>
                  <td className="px-4 py-3.5 text-slate-600">{p.product_name}</td>
                  <td className="px-4 py-3.5 text-slate-700">×{p.quantity}</td>
                  <td className="px-4 py-3.5 font-bold text-rose-700">{formatNPR(p.total_cost)}</td>
                  <td className="px-4 py-3.5">
                    {p.payment_method === "mixed" ? (
                      <div>
                        <StatusBadge status="mixed" />
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatNPR(p.cash_amount ?? 0)} / {formatNPR(p.online_amount ?? 0)}
                        </p>
                      </div>
                    ) : (
                      <StatusBadge status={p.payment_method as any} />
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 hidden md:table-cell">{p.operator?.full_name ?? "—"}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">{formatDate(p.purchased_at)}</td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => setPurchaseToDelete(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
            <span className="text-xs text-slate-600 px-3 py-1 bg-white border border-slate-200 rounded-lg">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 w-8 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}



      {/* Delete confirm */}
      <Dialog open={!!purchaseToDelete} onOpenChange={() => setPurchaseToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Purchase</DialogTitle>
            <DialogDescription>
              Delete purchase from <strong>{purchaseToDelete?.supplier_name}</strong>? Stock for <strong>{purchaseToDelete?.product_name}</strong> will be reduced.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PurchasesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Loading…</div>}>
      <PurchaseHistoryContent />
    </Suspense>
  );
}
