"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from "@/lib/services/products";
import { formatINR, getStockStatus, getExpiryStatus } from "@/lib/utils";
import type { Product, Category, ExpiryStatus } from "@/lib/types";

type ProductFormData = {
  name: string; sku: string; barcode: string; category_id: string;
  purchase_price: string; selling_price: string; quantity: string; min_stock: string;
  manufacture_date: string; expiration_date: string; expiry_notification_days: string;
};

const emptyForm: ProductFormData = {
  name: "", sku: "", barcode: "", category_id: "",
  purchase_price: "", selling_price: "", quantity: "", min_stock: "10",
  manufacture_date: "", expiration_date: "", expiry_notification_days: "30",
};

function ExpiryBadge({ date, notifyDays }: { date?: string; notifyDays?: number }) {
  if (!date) return <span className="text-slate-300">—</span>;
  const status: ExpiryStatus | null = getExpiryStatus(date, notifyDays ?? 30);
  const formatted = new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  if (status === "expired") {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-rose-600 font-medium">{formatted}</span>
        <span className="text-[10px] text-rose-400">Expired</span>
      </div>
    );
  }
  if (status === "expiring") {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-amber-600 font-medium">{formatted}</span>
        <span className="text-[10px] text-amber-400">Expiring soon</span>
      </div>
    );
  }
  return <span className="text-xs text-slate-500">{formatted}</span>;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([getProducts(user.company_id), getCategories(user.company_id)])
      .then(([prods, cats]) => { setProducts(prods); setCategories(cats); })
      .catch(() => toast.error("Failed to load products."))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(
    () => products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.category?.name ?? "").toLowerCase().includes(search.toLowerCase())
    ),
    [products, search]
  );

  function openAdd() {
    setEditProduct(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    setForm({
      name: product.name, sku: product.sku, barcode: product.barcode ?? "",
      category_id: product.category_id ?? "",
      purchase_price: String(product.purchase_price),
      selling_price: String(product.selling_price),
      quantity: String(product.quantity),
      min_stock: String(product.min_stock),
      manufacture_date: product.manufacture_date ?? "",
      expiration_date: product.expiration_date ?? "",
      expiry_notification_days: String(product.expiry_notification_days ?? 30),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.sku || !form.selling_price) {
      toast.error("Name, SKU and selling price are required.");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        company_id: user.company_id,
        name: form.name, sku: form.sku, barcode: form.barcode || undefined,
        category_id: form.category_id || undefined,
        purchase_price: Number(form.purchase_price),
        selling_price: Number(form.selling_price),
        quantity: Number(form.quantity),
        min_stock: Number(form.min_stock),
        manufacture_date: form.manufacture_date || undefined,
        expiration_date: form.expiration_date || undefined,
        expiry_notification_days: form.expiration_date ? Number(form.expiry_notification_days) : undefined,
      };
      if (editProduct) {
        const updated = await updateProduct(editProduct.id, payload);
        setProducts((prev) => prev.map((p) => p.id === editProduct.id ? updated : p));
        toast.success("Product updated.");
      } else {
        const created = await createProduct(payload);
        setProducts((prev) => [created, ...prev]);
        toast.success("Product added.");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteProduct(deleteId);
      setProducts((prev) => prev.filter((p) => p.id !== deleteId));
      toast.success("Product deleted.");
    } catch {
      toast.error("Failed to delete product.");
    }
    setDeleteId(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Products</h2>
          <p className="text-sm text-slate-500 mt-0.5">{products.length} products in catalogue</p>
        </div>
        <Button onClick={openAdd} className="h-9 gap-1.5 text-sm bg-brand-600 hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search by name, SKU, category…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["SKU", "Product", "Category", "Expiry", "Stock", "Status", "Buy Price", "Sell Price", "Stock Value", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-400">Loading products…</td></tr>
              )}
              <AnimatePresence>
                {!loading && filtered.map((product, i) => (
                  <motion.tr key={product.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3"><code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{product.sku}</code></td>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[180px] truncate">{product.name}</td>
                    <td className="px-4 py-3"><span className="text-xs text-slate-500">{product.category?.name ?? "—"}</span></td>
                    <td className="px-4 py-3"><ExpiryBadge date={product.expiration_date} notifyDays={product.expiry_notification_days} /></td>
                    <td className="px-4 py-3 text-slate-700">{product.quantity}</td>
                    <td className="px-4 py-3"><StatusBadge status={getStockStatus(product.quantity, product.min_stock)} /></td>
                    <td className="px-4 py-3 text-slate-600">{formatINR(product.purchase_price)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatINR(product.selling_price)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatINR(product.quantity * product.purchase_price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(product.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-12 text-center"><Package className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-400">No products found</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editProduct ? "Update product details, pricing, or stock levels." : "Add a new product to your catalogue."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Product Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Nike Air Max 90" />
            </div>
            <div className="space-y-1.5">
              <Label>SKU *</Label>
              <Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="SKU-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Barcode</Label>
              <Input value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} placeholder="8901234567890" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span style={{ paddingLeft: `${(cat.level ?? 0) * 12}px` }}>
                        {(cat.level ?? 0) > 0 ? "└ " : ""}{cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Purchase Price (₹)</Label>
              <Input type="number" value={form.purchase_price} onChange={(e) => setForm((f) => ({ ...f, purchase_price: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Selling Price (₹) *</Label>
              <Input type="number" value={form.selling_price} onChange={(e) => setForm((f) => ({ ...f, selling_price: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Opening Stock</Label>
              <Input type="number" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Minimum Stock</Label>
              <Input type="number" value={form.min_stock} onChange={(e) => setForm((f) => ({ ...f, min_stock: e.target.value }))} placeholder="10" />
            </div>
            <div className="space-y-1.5">
              <Label>Manufacture Date</Label>
              <Input type="date" value={form.manufacture_date} onChange={(e) => setForm((f) => ({ ...f, manufacture_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Expiration Date</Label>
              <Input type="date" value={form.expiration_date} onChange={(e) => setForm((f) => ({ ...f, expiration_date: e.target.value }))} />
            </div>
            {form.expiration_date && (
              <div className="col-span-2 space-y-1.5">
                <Label>Notify Before Expiry (days)</Label>
                <Input type="number" value={form.expiry_notification_days} onChange={(e) => setForm((f) => ({ ...f, expiry_notification_days: e.target.value }))} placeholder="30" min="1" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-brand-600 hover:bg-brand-700">
              {saving ? "Saving…" : editProduct ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>Are you sure you want to delete this product? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
