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
import { formatNPR, formatDateTime, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import type { Sale, Company } from "@/lib/types";

function BillingContent() {
  const params = useSearchParams();
  const saleIdParam = params.get("sale");
  const invoiceParam = params.get("invoice");
  const totalParam = params.get("total");

  const { user } = useAuth();
  const [sale, setSale] = useState<Sale | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  // Fix #12: merged two sequential effects into one parallel Promise.all
  useEffect(() => {
    if (!user?.company_id) return;
    Promise.all([
      getCompany(user.company_id),
      saleIdParam ? getSaleWithItems(saleIdParam) : Promise.resolve(null as Sale | null),
    ])
      .then(([c, s]) => { setCompany(c); if (s) setSale(s); })
      .catch(() => {});
  }, [user?.company_id, saleIdParam]);

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
            {totalParam && ` · Total: ${formatNPR(Number(totalParam))}`}
          </span>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-3xl mx-auto print-invoice" id="invoice">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-100">
          <div>
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-12 object-contain mb-3" />
            ) : (
              <p className="text-xl font-black text-slate-900 mb-2">{company?.name}</p>
            )}
            <div className="text-xs text-slate-500 space-y-0.5">
              <p className="font-bold text-slate-700">{company?.name ?? "—"}</p>
              {company?.address && <p>{company.address}</p>}
              {company?.pan_vat_number && <p>PAN/VAT: {company.pan_vat_number}</p>}
              {company?.contact_email && <p>{company.contact_email}</p>}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">INVOICE</h1>
            <p className="text-sm font-semibold text-brand-700 mt-1">{sale.invoice_number}</p>
            <p className="text-xs text-slate-400 mt-1">{formatDateTime(sale.created_at)}</p>
          </div>
        </div>

        {/* Bill to */}
        <div className="flex items-start justify-between py-6">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Bill To</p>
            <p className="text-base font-bold text-slate-800">{sale.customer_name || "Walk-in Customer"}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Payment</p>
            {sale.payment_method === "mixed" ? (
              <div className="text-sm text-slate-700 space-y-0.5">
                <p>Cash: {formatNPR(sale.cash_amount ?? 0)}</p>
                <p>Online: {formatNPR(sale.online_amount ?? 0)}</p>
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-700">{PAYMENT_METHOD_LABELS[sale.payment_method]}</p>
            )}
          </div>
        </div>

        {/* Items table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Item Description", "Qty", "Unit Price", "Disc", "Total"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider ${i === 0 ? "text-left" : i === 1 ? "text-center" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(sale.items ?? []).map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4 font-medium text-slate-800">{item.product_name}</td>
                  <td className="px-4 py-4 text-center text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-4 text-right text-slate-600">{formatNPR(item.unit_price)}</td>
                  <td className="px-4 py-4 text-right text-rose-500">{item.discount > 0 ? `−${formatNPR(item.discount)}` : "—"}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900">{formatNPR(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-between items-start">
          <div className="text-xs text-slate-400 italic">
            Note: This is a computer generated invoice.
          </div>
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600 px-1"><span>Subtotal</span><span>{formatNPR(sale.subtotal)}</span></div>
            {sale.discount > 0 && <div className="flex justify-between text-rose-600 px-1 font-medium"><span>Order Discount</span><span>−{formatNPR(sale.discount)}</span></div>}
            <div className="flex justify-between font-black text-lg text-white bg-slate-900 p-3 rounded-xl mt-4">
              <span>Grand Total</span>
              <span>{formatNPR(sale.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Remarks */}
        {sale.notes && (
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 no-print">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remarks</p>
            <p className="text-sm text-slate-700">{sale.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm font-medium text-slate-800">Thank you for your business!</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Powered by HamroHisab</p>
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
