"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Edit2, AlertTriangle, Package, History, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "@/components/shared/DataTable";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getProducts, updateProduct, getInventoryTransactions } from "@/lib/services/products";
import { formatNPR, getStockStatus, formatDateTime, cn } from "@/lib/utils";
import type { Product, InventoryTransaction } from "@/lib/types";

type Tab = "stock" | "history";

export default function InventoryPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("stock");
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit stock
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newQty, setNewQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    if (tab === "stock") {
      getProducts(user.company_id)
        .then(setProducts)
        .catch(() => toast.error("Failed to load inventory."))
        .finally(() => setLoading(false));
    } else {
      getInventoryTransactions(user.company_id)
        .then(setTransactions)
        .catch(() => toast.error("Failed to load transaction history."))
        .finally(() => setLoading(false));
    }
  }, [user, tab]);

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = products.filter((p) => getStockStatus(p.quantity, p.min_stock) !== "ok");
  const totalValue = products.reduce((s, p) => s + p.quantity * p.purchase_price, 0);

  function openEdit(product: Product) {
    setEditProduct(product);
    setNewQty(String(product.quantity));
    setAdjustReason("");
  }

  async function handleUpdate() {
    if (!editProduct || newQty === "") return;
    setSaving(true);
    try {
      const actor = user ? { id: user.id, name: user.full_name, role: user.role } : undefined;
      const updated = await updateProduct(editProduct.id, { quantity: Number(newQty) }, actor, adjustReason || undefined);
      setProducts((prev) => prev.map((p) => p.id === editProduct.id ? { ...p, ...updated } : p));
      toast.success(`Stock updated for ${editProduct.name}`);
      setEditProduct(null);
    } catch {
      toast.error("Failed to update stock.");
    } finally {
      setSaving(false);
    }
  }

  const transactionColumns = [
    { key: "created_at", header: "Date", render: (r: InventoryTransaction) => <span className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(r.created_at)}</span> },
    { key: "product_name", header: "Product", render: (r: any) => (
      <div>
        <p className="font-medium text-slate-800">{r.product?.name ?? "Unknown"}</p>
        <p className="text-[10px] text-slate-400 font-mono uppercase">{r.product?.sku ?? "—"}</p>
      </div>
    )},
    { key: "reference_type", header: "Type", render: (r: InventoryTransaction) => (
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
        r.reference_type === "sale" ? "bg-rose-50 text-rose-600" :
        r.reference_type === "purchase" ? "bg-emerald-50 text-emerald-600" :
        "bg-slate-100 text-slate-600"
      )}>
        {r.reference_type}
      </span>
    )},
    { key: "quantity_change", header: "Change", render: (r: InventoryTransaction) => (
      <span className={cn("font-bold", r.quantity_change > 0 ? "text-emerald-600" : "text-rose-600")}>
        {r.quantity_change > 0 ? "+" : ""}{r.quantity_change}
      </span>
    )},
    { key: "new_stock", header: "Result", render: (r: InventoryTransaction) => (
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-slate-400">{r.previous_stock}</span>
        <ArrowRightLeft className="w-2.5 h-2.5 text-slate-300" />
        <span className="font-semibold text-slate-700">{r.new_stock}</span>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Inventory Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {tab === "stock" 
              ? `${products.length} products · Total value: ${formatNPR(totalValue)}`
              : "Full stock movement history"
            }
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab("stock")} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors", tab === "stock" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
          <Package className="w-3.5 h-3.5" /> Stock
        </button>
        <button onClick={() => setTab("history")} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors", tab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
          <History className="w-3.5 h-3.5" /> Movement History
        </button>
      </div>

      {tab === "stock" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {lowStock.length > 0 && (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="text-sm font-semibold text-amber-800">{lowStock.length} product{lowStock.length > 1 ? "s" : ""} need restocking</p>
                <p className="text-xs text-amber-700 mt-0.5">{lowStock.map((p) => p.name).join(" · ")}</p>
              </div>
            </div>
          )}

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-auto scrollbar-thin scrollbar-thumb-slate-200 max-h-[65vh]">
              <table className="w-full text-sm relative border-separate border-spacing-0">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["SKU", "Product", "Category", "In Stock", "Min", "Status", "Sell Price", "Stock Value", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">Loading…</td></tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const status = getStockStatus(product.quantity, product.min_stock);
                      return (
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3"><code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{product.sku}</code></td>
                          <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{product.category?.name ?? "—"}</td>
                          <td className="px-4 py-3"><span className={`font-semibold ${status === "ok" ? "text-slate-800" : status === "low" ? "text-amber-700" : "text-rose-700"}`}>{product.quantity}</span></td>
                          <td className="px-4 py-3 text-slate-500">{product.min_stock}</td>
                          <td className="px-4 py-3"><StatusBadge status={status} /></td>
                          <td className="px-4 py-3 text-slate-700">{formatNPR(product.selling_price)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{formatNPR(product.quantity * product.purchase_price)}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {!loading && filteredProducts.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">No products found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {tab === "history" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-sm text-slate-400">Loading history…</div>
          ) : (
            <DataTable 
              columns={transactionColumns} 
              data={transactions} 
              rowKey="id" 
              emptyMessage="No stock movements recorded yet"
              className="bg-white rounded-2xl"
            />
          )}
        </motion.div>
      )}

      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
            <DialogDescription><strong>{editProduct?.name}</strong> — currently {editProduct?.quantity} units</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>New Quantity</Label>
              <Input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} min={0} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Reason (Optional)</Label>
              <Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="e.g. Physical count correction, damaged goods removed…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving} className="bg-brand-600 hover:bg-brand-700">{saving ? "Saving…" : "Update Stock"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

