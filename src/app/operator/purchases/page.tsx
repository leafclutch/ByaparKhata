"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getPurchases, createPurchase } from "@/lib/services/purchases";
import { getProducts } from "@/lib/services/products";
import { formatINR, formatDate, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import type { Purchase, Product, PaymentMethod } from "@/lib/types";

type PurchaseForm = {
  supplier_name: string; product_id: string; quantity: string;
  unit_cost: string; payment_method: PaymentMethod; invoice_number: string; notes: string;
};

const emptyForm: PurchaseForm = {
  supplier_name: "", product_id: "", quantity: "", unit_cost: "",
  payment_method: "bank_transfer", invoice_number: "", notes: "",
};

export default function PurchasesPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<PurchaseForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getPurchases(user.company_id), getProducts(user.company_id)])
      .then(([purs, prods]) => { setPurchases(purs); setProducts(prods); })
      .catch(() => toast.error("Failed to load purchases."))
      .finally(() => setLoading(false));
  }, [user]);

  const selectedProduct = products.find((p) => p.id === form.product_id);

  async function handleSave() {
    if (!form.supplier_name || !form.product_id || !form.quantity || !form.unit_cost) {
      toast.error("Fill in all required fields.");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const qty = Number(form.quantity);
      const cost = Number(form.unit_cost);
      const created = await createPurchase({
        company_id: user.company_id,
        operator_id: user.id,
        supplier_name: form.supplier_name,
        product_id: form.product_id,
        product_name: selectedProduct?.name ?? "",
        quantity: qty,
        unit_cost: cost,
        total_cost: qty * cost,
        invoice_number: form.invoice_number || undefined,
        payment_method: form.payment_method,
        notes: form.notes || undefined,
      });
      setPurchases((prev) => [created, ...prev]);
      toast.success(`Purchase recorded — ${qty} × ${selectedProduct?.name}`);
      setDialogOpen(false);
      setForm(emptyForm);
    } catch {
      toast.error("Failed to record purchase.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Purchases</h2>
          <p className="text-sm text-slate-500 mt-0.5">{purchases.length} purchase orders</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="h-9 gap-1.5 text-sm bg-brand-600 hover:bg-brand-700">
          <Plus className="w-4 h-4" /> New Purchase
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Invoice #", "Supplier", "Product", "Qty", "Unit Cost", "Total", "Payment", "Date"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">Loading…</td></tr>}
              <AnimatePresence>
                {!loading && purchases.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3"><code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{p.invoice_number ?? "—"}</code></td>
                    <td className="px-4 py-3 font-medium text-slate-800">{p.supplier_name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.product_name}</td>
                    <td className="px-4 py-3 text-slate-700">×{p.quantity}</td>
                    <td className="px-4 py-3 text-slate-600">{formatINR(p.unit_cost)}</td>
                    <td className="px-4 py-3 font-semibold text-rose-700">{formatINR(p.total_cost)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.payment_method} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{formatDate(p.purchased_at)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {!loading && purchases.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center"><PackageSearch className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-400">No purchases yet</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Purchase</DialogTitle>
            <DialogDescription>Record an incoming stock purchase from a supplier.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Supplier Name *</Label>
              <Input value={form.supplier_name} onChange={(e) => setForm((f) => ({ ...f, supplier_name: e.target.value }))} placeholder="e.g. Samsung Distributor India" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Product *</Label>
              <Select value={form.product_id} onValueChange={(v) => {
                const prod = products.find((p) => p.id === v);
                setForm((f) => ({ ...f, product_id: v, unit_cost: String(prod?.purchase_price ?? "") }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity *</Label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Unit Cost (₹) *</Label>
              <Input type="number" min={0} value={form.unit_cost} onChange={(e) => setForm((f) => ({ ...f, unit_cost: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm((f) => ({ ...f, payment_method: v as PaymentMethod }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["cash", "upi", "card", "bank_transfer"] as PaymentMethod[]).map((m) => (
                    <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Supplier Invoice #</Label>
              <Input value={form.invoice_number} onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))} placeholder="SUP-1234" />
            </div>
            {form.quantity && form.unit_cost && (
              <div className="col-span-2 flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-600">Total Cost</span>
                <span className="text-base font-bold text-rose-700">{formatINR(Number(form.quantity) * Number(form.unit_cost))}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-brand-600 hover:bg-brand-700">
              {saving ? "Saving…" : "Record Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
