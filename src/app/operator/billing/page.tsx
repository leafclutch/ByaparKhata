"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Printer, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSaleWithItems } from "@/lib/services/sales";
import { getCompany } from "@/lib/services/company";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { formatINR, formatDateTime, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import type { Sale, Company } from "@/lib/types";

function BillingContent() {
  const params = useSearchParams();
  const saleIdParam = params.get("sale");
  const invoiceParam = params.get("invoice");
  const totalParam = params.get("total");

  const { user } = useAuth();
  const [sale, setSale] = useState<Sale | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (!user) return;
    getCompany(user.company_id).then(setCompany).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (saleIdParam) {
      getSaleWithItems(saleIdParam).then(setSale);
    }
  }, [saleIdParam, user]);

  if (!sale && !invoiceParam) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 no-print">
          <Link href="/operator/sales">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sales
            </Button>
          </Link>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">Billing & Invoice</h2>
            <p className="text-sm text-slate-500 mt-0.5">Preview and print invoice</p>
          </div>
        </div>
        <div className="text-sm text-slate-400 p-8 text-center">Select a sale to view its invoice.</div>
      </div>
    );
  }

  if (!sale) {
    return <div className="text-sm text-slate-400 p-8">Loading invoice…</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 no-print">
        <Link href="/operator/sales">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sales
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900">Billing & Invoice</h2>
          <p className="text-sm text-slate-500 mt-0.5">Preview and print invoice</p>
        </div>
        <Button onClick={() => window.print()} className="h-9 gap-1.5 text-sm bg-brand-600 hover:bg-brand-700">
          <Printer className="w-4 h-4" /> Print Invoice
        </Button>
      </div>

      {invoiceParam && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-sm text-emerald-800">
            Sale recorded successfully — Invoice <strong>{invoiceParam}</strong>
            {totalParam && ` · Total: ${formatINR(Number(totalParam))}`}
          </span>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-2xl mx-auto print-invoice" id="invoice">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-100">
          <div>
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-10 object-contain" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
                {getInitials(company?.name ?? "?")}
              </div>
            )}
            <div className="mt-3 text-xs text-slate-500 space-y-0.5">
              <p className="font-bold text-base text-slate-900">{company?.name ?? "—"}</p>
              {company?.address && <p>{company.address}</p>}
              {company?.gst_number && <p>PAN/VAT: {company.gst_number}</p>}
              {company?.contact_email && <p>{company.contact_email}</p>}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">INVOICE</h1>
            <p className="text-sm font-semibold text-brand-700 mt-1">{sale.invoice_number}</p>
            <p className="text-xs text-slate-400 mt-1">{formatDateTime(sale.created_at)}</p>
          </div>
        </div>

        {/* Bill to */}
        <div className="flex items-start justify-between py-5">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Bill To</p>
            <p className="text-sm font-semibold text-slate-800">{sale.customer_name || "Walk-in Customer"}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Payment</p>
            <p className="text-sm font-medium text-slate-700">{PAYMENT_METHOD_LABELS[sale.payment_method]}</p>
          </div>
        </div>

        {/* Items table */}
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {["Item", "Qty", "Price", "Disc", "Total"].map((h, i) => (
                  <th key={h} className={`px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider ${i === 0 ? "text-left" : i === 1 ? "text-center" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(sale.items ?? []).map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.product_name}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatINR(item.unit_price)}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{item.discount > 0 ? `−${formatINR(item.discount)}` : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatINR(item.line_total)}</td>
                </tr>
              ))}
              {(!sale.items || sale.items.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-xs text-slate-400">No items</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-4">
          <div className="w-56 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatINR(sale.subtotal)}</span></div>
            {sale.discount > 0 && <div className="flex justify-between text-rose-600"><span>Discount</span><span>−{formatINR(sale.discount)}</span></div>}
            <div className="flex justify-between text-slate-600"><span>Tax ({sale.tax_rate}%)</span><span>{formatINR(sale.tax_amount)}</span></div>
            <div className="flex justify-between font-bold text-base text-slate-900 pt-2 border-t border-slate-200">
              <span>Grand Total</span>
              <span className="text-brand-700">{formatINR(sale.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">Thank you for your business!</p>
          <p className="text-[10px] text-slate-300 mt-1">Powered by ByaparKhata</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-400 p-8">Loading invoice…</div>}>
      <BillingContent />
    </Suspense>
  );
}
