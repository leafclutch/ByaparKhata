"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Edit2, AlertTriangle, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getProducts, updateProduct } from "@/lib/services/products";
import { formatINR, getStockStatus } from "@/lib/utils";
import type { Product } from "@/lib/types";

export default function InventoryPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newQty, setNewQty] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProducts(user.company_id).then(setProducts).catch(() => toast.error("Failed to load inventory."));
  }, [user]);

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = products.filter((p) => getStockStatus(p.quantity, p.min_stock) !== "ok");
  const totalValue = products.reduce((s, p) => s + p.quantity * p.purchase_price, 0);

  function openEdit(product: Product) {
    setEditProduct(product);
    setNewQty(String(product.quantity));
  }

  async function handleUpdate() {
    if (!editProduct || newQty === "") return;
    setSaving(true);
    try {
      const updated = await updateProduct(editProduct.id, { quantity: Number(newQty) });
      setProducts((prev) => prev.map((p) => p.id === editProduct.id ? { ...p, ...updated } : p));
      toast.success(`Stock updated for ${editProduct.name}`);
      setEditProduct(null);
    } catch {
      toast.error("Failed to update stock.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Inventory</h2>
          <p className="text-sm text-slate-500 mt-0.5">{products.length} products · Total value: {formatINR(totalValue)}</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-amber-800">{lowStock.length} product{lowStock.length > 1 ? "s" : ""} need restocking</p>
            <p className="text-xs text-amber-700 mt-0.5">{lowStock.map((p) => p.name).join(" · ")}</p>
          </div>
        </motion.div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["SKU", "Product", "Category", "In Stock", "Min Stock", "Status", "Sell Price", "Stock Value", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((product, i) => {
                const status = getStockStatus(product.quantity, product.min_stock);
                return (
                  <motion.tr key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3"><code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{product.sku}</code></td>
                    <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{product.category?.name ?? "—"}</td>
                    <td className="px-4 py-3"><span className={`font-semibold ${status === "ok" ? "text-slate-800" : status === "low" ? "text-amber-700" : "text-rose-700"}`}>{product.quantity}</span></td>
                    <td className="px-4 py-3 text-slate-500">{product.min_stock}</td>
                    <td className="px-4 py-3"><StatusBadge status={status} /></td>
                    <td className="px-4 py-3 text-slate-700">{formatINR(product.selling_price)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatINR(product.quantity * product.purchase_price)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors" title="Update stock">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center"><Package className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-400">No products found</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Update Stock</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600"><strong>{editProduct?.name}</strong> — currently {editProduct?.quantity} units</p>
            <div className="space-y-1.5">
              <Label>New Quantity</Label>
              <Input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} min={0} autoFocus />
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
