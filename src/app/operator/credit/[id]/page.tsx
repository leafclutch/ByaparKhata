"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, HandCoins, History, Plus, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getCustomerWithLedger, issueCredit, settleCredit } from "@/lib/services/credits";
import { formatNPR, formatDate } from "@/lib/utils";
import type { Customer, CreditTransaction } from "@/lib/types";
import { useCreditStore } from "@/store/creditStore";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export default function CustomerLedgerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;

  const { issueCreditOpen, setIssueCreditOpen, settleCreditOpen, setSettleCreditOpen } = useCreditStore();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ledger, setLedger] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form inputs
  const [amountInput, setAmountInput] = useState("");
  const [notesInput, setNotesInput] = useState("");

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

  async function handleIssueCredit() {
    const amt = Number(amountInput);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }
    if (!user || !customer) return;

    setSaving(true);
    try {
      const actor = { id: user.id, name: user.full_name, role: user.role };
      const tx = await issueCredit(
        {
          company_id: user.company_id,
          customer_id: customer.id,
          amount: amt,
          notes: notesInput || undefined,
        },
        actor
      );

      toast.success(`Issued Rs. ${amt} credit to ${customer.name}`);
      setAmountInput("");
      setNotesInput("");
      setIssueCreditOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record credit transaction.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCollectPayment() {
    const amt = Number(amountInput);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount greater than zero.");
      return;
    }
    if (!user || !customer) return;

    setSaving(true);
    try {
      const actor = { id: user.id, name: user.full_name, role: user.role };
      const tx = await settleCredit(
        {
          company_id: user.company_id,
          customer_id: customer.id,
          amount: amt,
          notes: notesInput || undefined,
        },
        actor
      );

      toast.success(`Settled Rs. ${amt} from ${customer.name}`);
      setAmountInput("");
      setNotesInput("");
      setSettleCreditOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record settlement payment.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-400">Loading customer account…</div>;
  if (!customer) return <div className="p-8 text-center text-rose-500">Customer account not found.</div>;

  return (
    <div className="space-y-5 px-0 md:px-2">
      {/* Header & Nav */}
      <div className="space-y-1">
        <Breadcrumbs homeHref="/operator" items={[{ label: "Credit Khata", href: "/operator/credit" }, { label: customer.name }]} />
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

      {/* Overview Ledger Cards */}
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
              <HandCoins className="w-4 h-4 text-cyan-600" /> Quick Ledger Actions
            </h4>
            <p className="text-xs text-slate-500">Log new credit issue records or collect outstanding payments directly.</p>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <Button onClick={() => setIssueCreditOpen(true)} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 gap-1.5 text-xs font-bold">
              <ArrowUpRight className="w-4 h-4" /> Issue New Credit
            </Button>
            <Button onClick={() => setSettleCreditOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 gap-1.5 text-xs font-bold">
              <ArrowDownLeft className="w-4 h-4" /> Collect Payment
            </Button>
          </div>
        </div>
      </div>

      {/* Chronological Statement Ledger */}
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

      {/* Dialog: Issue Credit */}
      <Dialog open={issueCreditOpen} onOpenChange={setIssueCreditOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Issue New Credit</DialogTitle>
            <DialogDescription>
              Increase outstanding balance for <strong>{customer.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Credit Amount (Rs.) *</Label>
              <Input
                type="number"
                min={0}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="rounded-xl font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Remarks / Description (Optional)</Label>
              <Input
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="e.g. Purchased monthly groceries"
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueCreditOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleIssueCredit}
              disabled={saving}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
            >
              {saving ? "Saving…" : "Confirm Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Collect Payment */}
      <Dialog open={settleCreditOpen} onOpenChange={setSettleCreditOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Collect Payment Settlement</DialogTitle>
            <DialogDescription>
              Offset outstanding credit ledger balance for <strong>{customer.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Settlement Amount (Rs.) *</Label>
              <Input
                type="number"
                min={0}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="rounded-xl font-bold text-emerald-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Mode / Notes (Optional)</Label>
              <Input
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="e.g. Paid cash, Esewa, or Bank transfer"
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleCreditOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleCollectPayment}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              {saving ? "Saving…" : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
