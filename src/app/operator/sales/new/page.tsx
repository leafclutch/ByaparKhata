"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Search, ShoppingCart, ArrowRight, ArrowLeft, AlertCircle, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getProducts } from "@/lib/services/products";
import { createSale, updateSale, getSaleWithItems } from "@/lib/services/sales";
import { formatNPR, calculateCartTotal, PAYMENT_METHOD_LABELS, cn } from "@/lib/utils";
import type { Product, CartItem, PaymentMethod } from "@/lib/types";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

function SalesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [onlineAmount, setOnlineAmount] = useState("");
  const [discount, setDiscount] = useState("0");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (!user) return;
    getProducts(user.company_id).then(setProducts).catch(() => toast.error("Failed to load products."));
  }, [user]);

  useEffect(() => {
    if (editId && products.length > 0) {
      getSaleWithItems(editId).then((sale) => {
        if (sale) {
          setCustomerName(sale.customer_name || "");
          setPaymentMethod(sale.payment_method);
          setDiscount(String(sale.discount));
          setRemarks(sale.notes || "");
          if (sale.payment_method === "mixed") {
            setCashAmount(String(sale.cash_amount ?? ""));
            setOnlineAmount(String(sale.online_amount ?? ""));
          }
          const items: CartItem[] = (sale.items ?? []).map((it) => {
            const prod = products.find((p) => p.id === it.product_id);
            return {
              product: prod || { id: it.product_id, name: it.product_name, selling_price: it.unit_price } as Product,
              quantity: it.quantity,
              unit_price: it.unit_price,
              discount: it.discount,
              line_total: it.line_total,
            };
          });
          setCart(items);
        }
        setLoading(false);
      }).catch(() => {
        toast.error("Failed to load sale for editing.");
        setLoading(false);
      });
    }
  }, [editId, products]);

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
    (p) => p.is_active && p.quantity > 0 &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1, line_total: (i.quantity + 1) * i.unit_price - i.discount }
            : i
        );
      }
      return [...prev, { product, quantity: 1, unit_price: product.selling_price, discount: 0, line_total: product.selling_price }];
    });
    setSearch("");
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) { setCart((prev) => prev.filter((i) => i.product.id !== productId)); return; }
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, quantity: qty, line_total: qty * i.unit_price - i.discount } : i));
  }

  function updateLineDiscount(productId: string, disc: number) {
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, discount: disc, line_total: i.quantity * i.unit_price - disc } : i));
  }

  const totals = calculateCartTotal(cart, Number(discount));

  // Mixed payment helpers
  const cash = paymentMethod === "mixed" ? Number(cashAmount) || 0 : 0;
  const online = paymentMethod === "mixed" ? Number(onlineAmount) || 0 : 0;
  const mixedBalance = paymentMethod === "mixed"
    ? Math.round((cash + online - totals.grandTotal) * 100) / 100
    : 0;

  async function handleSave() {
    if (cart.length === 0) { toast.error("Add at least one product."); return; }
    if (!user) return;

    if (paymentMethod === "mixed") {
      if (cash < 0 || online < 0) { toast.error("Amounts cannot be negative."); return; }
      if (mixedBalance !== 0) {
        toast.error(`Cash + Online must equal ${formatNPR(totals.grandTotal)}. Difference: ${formatNPR(Math.abs(mixedBalance))}`);
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
      if (editId) {
        await updateSale(editId, {
          customer_name: customerName || undefined,
          ...paymentFields,
          discount: Number(discount),
          notes: remarks || undefined,
        }, cart, actor);
        toast.success("Sale updated successfully.");
        router.push(`/operator/billing?sale=${editId}`);
      } else {
        const sale = await createSale(
          {
            company_id: user.company_id,
            operator_id: user.id,
            customer_name: customerName || undefined,
            ...paymentFields,
            discount: Number(discount),
            notes: remarks || undefined,
          },
          cart,
          actor
        );
        toast.success(`Sale recorded — Invoice ${sale.invoice_number}`);
        router.push(`/operator/billing?sale=${sale.id}&invoice=${sale.invoice_number}&total=${totals.grandTotal}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save sale.");
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Loading sale data…</div>;

  return (
    <div className="space-y-5 px-0 md:px-2">
      <div className="space-y-1">
        <Breadcrumbs items={[{ label: "Sales", href: "/operator/sales" }, { label: editId ? "Edit Sale" : "New Sale" }]} />
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{editId ? "Edit Sale" : "New Sale"}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{editId ? "Modify existing invoice" : "Search for products and build your cart"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Left: product search + cart */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products by name or SKU…" className="pl-9 h-10 text-sm" />
            </div>

            {search.length > 0 && (
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                {filteredProducts.map((product) => (
                  <button key={product.id} onClick={() => addToCart(product)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 transition-colors text-left group">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors">
                      <ShoppingCart className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{product.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase">{product.sku} · <span className={product.quantity < product.min_stock ? "text-rose-500 font-bold" : ""}>{product.quantity} in stock</span></p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-slate-900">{formatNPR(product.selling_price)}</p>
                       <span className="text-[10px] text-brand-600 font-bold uppercase">Add +</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-800">Current Cart</span>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
              {cart.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                     <ShoppingCart className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">Your cart is empty</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  <AnimatePresence initial={false}>
                    {cart.map((item) => (
                      <motion.div key={item.product.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{item.product.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{formatNPR(item.unit_price)} per unit</p>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-6">
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm hover:bg-slate-50 text-slate-600 text-sm font-bold flex items-center justify-center transition-colors">−</button>
                            <span className="w-10 text-center text-sm font-black text-slate-800">{item.quantity}</span>
                            <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-white shadow-sm hover:bg-slate-50 text-slate-600 text-sm font-bold flex items-center justify-center transition-colors">+</button>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="space-y-1">
                              <Label className="text-[9px] uppercase font-bold text-slate-400 ml-1">Disc</Label>
                              <Input type="number" value={item.discount} onChange={(e) => updateLineDiscount(item.product.id, Number(e.target.value))} placeholder="0" className="w-20 h-9 text-sm text-center rounded-xl bg-slate-50 border-none focus-visible:ring-brand-500" min={0} />
                            </div>
                            <div className="text-right min-w-[100px]">
                              <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Subtotal</p>
                              <span className="text-sm font-black text-slate-900">{formatNPR(item.line_total)}</span>
                            </div>
                            <button onClick={() => setCart((prev) => prev.filter((i) => i.product.id !== item.product.id))} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all">
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

        {/* Right: bill preview */}
        <div className="space-y-4 lg:sticky lg:top-20">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
               <Receipt className="w-4 h-4 text-brand-600" /> Bill Details
            </h3>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">Customer Name</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in / Customer name" className="h-10 text-sm rounded-xl" />
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

            <div className="space-y-1.5 pt-2 border-t border-slate-50">
              <Label className="text-xs font-bold text-slate-500">Order Discount (Rs.)</Label>
              <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" className="h-10 text-sm rounded-xl font-bold text-rose-600" min={0} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500">Remarks (Optional)</Label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Home delivery requested, special discount approved…"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-brand-400 focus:outline-none resize-none transition-colors"
              />
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 shadow-lg shadow-slate-200 text-white">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{formatNPR(totals.subtotal)}</span></div>
              <div className="flex justify-between text-slate-400"><span>Total Discount</span><span className="text-rose-400 font-bold">−{formatNPR(totals.totalDiscount)}</span></div>
              <div className="flex justify-between font-black text-xl pt-4 border-t border-white/10 mt-2">
                <span>Grand Total</span>
                <span className="text-brand-400">{formatNPR(totals.grandTotal)}</span>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving || cart.length === 0} className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-brand-100 transition-all active:scale-[0.98]">
            {saving ? "Processing…" : <>{editId ? "Update Sale" : "Record Sale"} <ArrowRight className="ml-2 w-5 h-5" /></>}
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

export default function SalesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading…</div>}>
      <SalesContent />
    </Suspense>
  );
}
