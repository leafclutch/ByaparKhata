"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Search, ShoppingBag, ArrowRight, ArrowLeft, AlertCircle, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getProducts } from "@/lib/services/products";
import { createPurchasesBulk } from "@/lib/services/purchases";
import { formatNPR, cn } from "@/lib/utils";
import type { Product, PaymentMethod } from "@/lib/types";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

interface PurchaseCartItem {
  product: Product;
  quantity: number;
  unit_cost: number;
  line_total: number;
}

function PurchaseNewContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<PurchaseCartItem[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [onlineAmount, setOnlineAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getProducts(user.company_id)
      .then((prods) => {
        setProducts(prods);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load products.");
        setLoading(false);
      });
  }, [user]);

  // Unsaved changes protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (cart.length > 0 && !saving) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [cart.length, saving]);

  const filteredProducts = products.filter(
    (p) => p.is_active &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1, line_total: (i.quantity + 1) * i.unit_cost }
            : i
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unit_cost: product.purchase_price,
          line_total: product.purchase_price,
        },
      ];
    });
    setSearch("");
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: qty, line_total: qty * i.unit_cost }
          : i
      )
    );
  }

  function updateUnitCost(productId: string, cost: number) {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, unit_cost: cost, line_total: i.quantity * cost }
          : i
      )
    );
  }

  const grandTotal = cart.reduce((acc, item) => acc + item.line_total, 0);

  // Mixed payment helpers
  const cash = paymentMethod === "mixed" ? Number(cashAmount) || 0 : 0;
  const online = paymentMethod === "mixed" ? Number(onlineAmount) || 0 : 0;
  const mixedBalance = paymentMethod === "mixed"
    ? Math.round((cash + online - grandTotal) * 100) / 100
    : 0;

  async function handleSave() {
    if (!supplierName) {
      toast.error("Supplier name is required.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Add at least one product to the purchase cart.");
      return;
    }
    if (!user) return;

    if (paymentMethod === "mixed") {
      if (cash < 0 || online < 0) {
        toast.error("Amounts cannot be negative.");
        return;
      }
      if (mixedBalance !== 0) {
        toast.error(
          `Cash + Online must equal ${formatNPR(grandTotal)}. Difference: ${formatNPR(
            Math.abs(mixedBalance)
          )}`
        );
        return;
      }
    }

    setSaving(true);
    try {
      const actor = { id: user.id, name: user.full_name, role: user.role };
      const paymentFields = {
        payment_method: paymentMethod,
        cash_amount: paymentMethod === "mixed" ? cash : undefined,
        online_amount: paymentMethod === "mixed" ? online : undefined,
      };

      const bulkInput = {
        company_id: user.company_id,
        operator_id: user.id,
        supplier_name: supplierName,
        invoice_number: invoiceNumber || undefined,
        notes: remarks || undefined,
        ...paymentFields,
      };

      const serviceItems = cart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.line_total,
      }));

      await createPurchasesBulk(bulkInput, serviceItems, actor);
      toast.success("Purchase recorded successfully.");
      router.push("/operator/purchases");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record purchase.");
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Loading product list…</div>;

  return (
    <div className="space-y-5 px-0 md:px-2">
      <div className="space-y-1">
        <Breadcrumbs items={[{ label: "Purchases", href: "/operator/purchases" }, { label: "New Purchase" }]} />
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">New Purchase</h2>
            <p className="text-sm text-slate-500 mt-0.5">Search products and build your purchase order</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Left: product search + cart */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name or SKU…"
                className="pl-9 h-10 text-sm"
              />
            </div>

            {search.length > 0 && (
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">No matching products found</div>
                ) : (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors">
                        <ShoppingBag className="w-5 h-5 text-brand-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{product.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono uppercase">
                          {product.sku} · Current Stock: {product.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">
                          {formatNPR(product.purchase_price)}
                        </p>
                        <span className="text-[10px] text-brand-600 font-bold uppercase">Add +</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-800">Purchase Cart</span>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
                {cart.length} item{cart.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
              {cart.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                    <ShoppingBag className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">Your purchase cart is empty</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  <AnimatePresence initial={false}>
                    {cart.map((item) => (
                      <motion.div
                        key={item.product.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{item.product.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            SKU: {item.product.sku}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6">
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                              onClick={() => updateQty(item.product.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-lg bg-white shadow-sm hover:bg-slate-50 text-slate-600 text-sm font-bold flex items-center justify-center transition-colors"
                            >
                              −
                            </button>
                            <span className="w-10 text-center text-sm font-black text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty(item.product.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-lg bg-white shadow-sm hover:bg-slate-50 text-slate-600 text-sm font-bold flex items-center justify-center transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="space-y-1">
                              <Label className="text-[9px] uppercase font-bold text-slate-400 ml-1">Unit Cost</Label>
                              <Input
                                type="number"
                                value={item.unit_cost}
                                onChange={(e) => updateUnitCost(item.product.id, Number(e.target.value))}
                                placeholder="0.00"
                                className="w-24 h-9 text-sm text-center rounded-xl bg-slate-50 border-none focus-visible:ring-brand-500"
                                min={0}
                              />
                            </div>
                            <div className="text-right min-w-[100px]">
                              <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Subtotal</p>
                              <span className="text-sm font-black text-slate-900">
                                {formatNPR(item.line_total)}
                              </span>
                            </div>
                            <button
                              onClick={() => setCart((prev) => prev.filter((i) => i.product.id !== item.product.id))}
                              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Supplier & Payment Details */}
        <div className="space-y-4 lg:sticky lg:top-20">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-brand-600" /> Purchase Details
            </h3>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">Supplier Name *</Label>
              <Input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Supplier / Vendor name"
                className="h-10 text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">Invoice Number</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="SUP-1234 (Optional)"
                className="h-10 text-sm rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500">Payment Method</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["cash", "online", "mixed"] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold border-2 transition-all",
                      paymentMethod === m
                        ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {m === "mixed" ? "Mixed" : m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>

              {paymentMethod === "mixed" && (
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-500">Cash (Rs.)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        placeholder="0"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-500">Online (Rs.)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={onlineAmount}
                        onChange={(e) => setOnlineAmount(e.target.value)}
                        placeholder="0"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <p className={cn("text-xs font-semibold", mixedBalance === 0 ? "text-emerald-600" : "text-rose-600")}>
                    {mixedBalance === 0
                      ? "✓ Total matches invoice"
                      : mixedBalance > 0
                      ? `Rs. ${Math.abs(mixedBalance)} excess`
                      : `Rs. ${Math.abs(mixedBalance)} remaining`}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">Remarks (Optional)</Label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Extra stock, pending invoice…"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-brand-400 focus:outline-none resize-none transition-colors"
              />
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 shadow-lg shadow-slate-200 text-white">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between font-black text-xl pt-2 mt-2">
                <span>Grand Total</span>
                <span className="text-brand-400">{formatNPR(grandTotal)}</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || cart.length === 0}
            className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-brand-100 transition-all active:scale-[0.98]"
          >
            {saving ? "Processing…" : <>Record Purchase <ArrowRight className="ml-2 w-5 h-5" /></>}
          </Button>

          {cart.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 rounded-xl text-amber-700 border border-amber-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-[10px] leading-tight font-medium">Unsaved changes will be lost if you leave this page.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PurchasesNewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading…</div>}>
      <PurchaseNewContent />
    </Suspense>
  );
}
