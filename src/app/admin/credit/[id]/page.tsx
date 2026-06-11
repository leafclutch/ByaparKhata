"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, History, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getCustomerWithLedger } from "@/lib/services/credits";
import { formatNPR, formatDate } from "@/lib/utils";
import type { Customer, CreditTransaction } from "@/lib/types";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export default function AdminCustomerLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ledger, setLedger] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await getCustomerWithLedger(customerId);
      if (data) {
        setCustomer(data.customer);
        setLedger(data.ledger);
      }
    } catch {
      toast.error("Failed to load customer statement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading customer account…</div>;
  if (!customer) return <div className="p-8 text-center text-rose-500">Customer account not found.</div>;

  return (
    <div className="space-y-5 px-0 md:px-2">
      <div className="space-y-1">
        <Breadcrumbs homeHref="/admin" items={[{ label: "Credit Khata", href: "/admin/credit" }, { label: customer.name }]} />
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{customer.name}</h2>
            {customer.phone && (
              <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {customer.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding Balance</p>
            <h3 className="text-2xl font-black mt-2 text-rose-600">
              {formatNPR(customer.current_balance)}
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 mt-4">Positive balance means customer owes you money.</p>
        </div>

        <div className="md:col-span-2 bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <History className="w-4 h-4 text-brand-600" /> Account Summary
            </h4>
            <p className="text-xs text-slate-500">
              Read-only view of credit history and outstanding balance for <strong>{customer.name}</strong>.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-100 text-xs">
              <span className="text-slate-400">Total Transactions: </span>
              <span className="font-bold text-slate-800">{ledger.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
          <History className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-800">Chronological Ledger Statement</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left border-b border-slate-100">Date</th>
                <th className="px-5 py-3 text-left border-b border-slate-100">Type</th>
                <th className="px-5 py-3 text-left border-b border-slate-100">Remarks / Notes</th>
                <th className="px-5 py-3 text-right border-b border-slate-100">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-slate-400 text-xs">
                    No credit history found for this customer profile ledger.
                  </td>
                </tr>
              ) : (
                ledger.map((tx) => {
                  const isIssue = tx.type === "issue";
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          isIssue ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {isIssue ? "Credit Issued" : "Payment Received"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 text-xs max-w-xs truncate">
                        {tx.notes || <span className="text-slate-300 italic">—</span>}
                      </td>
                      <td className={`px-5 py-4 text-right font-black ${
                        isIssue ? "text-rose-600" : "text-emerald-600"
                      }`}>
                        {isIssue ? "+" : "−"} {formatNPR(tx.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
