"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Search, ShoppingCart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getProducts } from "@/lib/services/products";
import { createSale } from "@/lib/services/sales";
import { formatINR, calculateCartTotal, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import type { Product, CartItem, PaymentMethod } from "@/lib/types";

export default function SalesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [discount, setDiscount] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProducts(user.company_id).then(setProducts).catch(() => toast.error("Failed to load products."));
  }, [user]);

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

  const totals = calculateCartTotal(cart, Number(discount), 18);

  async function handleSave() {
    if (cart.length === 0) { toast.error("Add at least one product."); return; }
    if (!user) return;
    setSaving(true);
    try {
      const sale = await createSale(
        { company_id: user.company_id, operator_id: user.id, customer_name: customerName || undefined, payment_method: paymentMethod, discount: Number(discount), tax_rate: 18 },
        cart
      );
      toast.success(`Sale recorded — Invoice ${sale.invoice_number}`);
      router.push(`/operator/billing?sale=${sale.id}&invoice=${sale.invoice_number}&total=${totals.grandTotal}`);
    } catch {
      toast.error("Failed to record sale.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">New Sale</h2>
        <p className="text-sm text-slate-500 mt-0.5">Search for products and build your cart</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: product search + cart */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products by name or SKU…" className="pl-9 h-10 text-sm" />
            </div>

            {search.length > 0 && (
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50">
                {filteredProducts.slice(0, 6).map((product) => (
                  <button key={product.id} onClick={() => addToCart(product)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-4 h-4 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                      <p className="text-xs text-slate-400">{product.sku} · {product.quantity} in stock</p>
                    </div>
                    <span className="text-sm font-bold text-slate-800 flex-shrink-0">{formatINR(product.selling_price)}</span>
                    <Plus className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  </button>
                ))}
                {filteredProducts.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">No products found</p>}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Cart</span>
              <span className="text-xs text-slate-400">{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
            </div>
            {cart.length === 0 ? (
              <div className="py-10 text-center">
                <ShoppingCart className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No items in cart</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div key={item.product.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.product.name}</p>
                        <p className="text-xs text-slate-400">{formatINR(item.unit_price)} / unit</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center">−</button>
                        <span className="w-8 text-center text-sm font-semibold text-slate-800">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center">+</button>
                      </div>
                      <Input type="number" value={item.discount} onChange={(e) => updateLineDiscount(item.product.id, Number(e.target.value))} placeholder="Disc" className="w-20 h-7 text-xs text-center" min={0} />
                      <span className="w-24 text-right text-sm font-bold text-slate-800 flex-shrink-0">{formatINR(item.line_total)}</span>
                      <button onClick={() => setCart((prev) => prev.filter((i) => i.product.id !== item.product.id))} className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Right: bill preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Bill Details</h3>
            <div className="space-y-1.5">
              <Label className="text-xs">Customer Name</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in / Customer name" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["cash", "upi", "card", "bank_transfer"] as PaymentMethod[]).map((m) => (
                    <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Order Discount (₹)</Label>
              <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" className="h-9 text-sm" min={0} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatINR(totals.subtotal)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Discount</span><span className="text-rose-600">−{formatINR(totals.totalDiscount)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Tax (18%)</span><span>{formatINR(totals.taxAmount)}</span></div>
              <div className="flex justify-between font-bold text-base text-slate-900 pt-2 border-t border-slate-100">
                <span>Grand Total</span>
                <span className="text-brand-700">{formatINR(totals.grandTotal)}</span>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving || cart.length === 0} className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-semibold gap-2">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Processing…
              </span>
            ) : (
              <>Record Sale <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
