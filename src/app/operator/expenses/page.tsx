"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getExpenses, createExpense } from "@/lib/services/expenses";
import { formatNPR, EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import type { Expense, ExpenseCategory, PaymentMethod } from "@/lib/types";

type ExpenseForm = {
  category: ExpenseCategory;
  description: string;
  amount: string;
  payment_method: PaymentMethod;
  expense_date: string;
  reference_note: string;
};

const today = new Date().toISOString().split("T")[0];

const emptyForm: ExpenseForm = {
  category: "other", description: "", amount: "",
  payment_method: "cash", expense_date: today, reference_note: "",
};

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getExpenses(user.company_id)
      .then(setExpenses)
      .catch(() => toast.error("Failed to load expenses."))
      .finally(() => setLoading(false));
  }, [user]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  async function handleSave() {
    if (!form.description || !form.amount) {
      toast.error("Description and amount are required.");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const created = await createExpense({
        company_id: user.company_id,
        operator_id: user.id,
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        payment_method: form.payment_method,
        reference_note: form.reference_note || undefined,
        expense_date: form.expense_date,
      });
      setExpenses((prev) => [created, ...prev]);
      toast.success("Expense recorded.");
      setDialogOpen(false);
      setForm(emptyForm);
    } catch {
      toast.error("Failed to record expense.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Expenses</h2>
          <p className="text-sm text-slate-500 mt-0.5">{expenses.length} records · Total: {formatNPR(total)}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="h-9 gap-1.5 text-sm bg-brand-600 hover:bg-brand-700">
          <Plus className="w-4 h-4" /> Add Expense
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-auto scrollbar-thin scrollbar-thumb-slate-200 max-h-[65vh]">
          <table className="w-full text-sm relative border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Category", "Description", "Recorded By", "Payment", "Amount", "Date"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">Loading…</td></tr>
              )}
              <AnimatePresence>
                {!loading && expenses.map((exp, i) => (
                  <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3"><StatusBadge status={exp.category} /></td>
                    <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{exp.description}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{exp.operator?.full_name ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={exp.payment_method} /></td>
                    <td className="px-4 py-3 font-semibold text-rose-700">{formatNPR(exp.amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{exp.expense_date}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {!loading && expenses.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center"><DollarSign className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-400">No expenses recorded</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Log a business expense with category, amount, and payment details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as ExpenseCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (Rs.) *</Label>
                <Input type="number" min={0} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Office rent — May 2026" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm((f) => ({ ...f, payment_method: v as PaymentMethod }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["cash", "online"] as PaymentMethod[]).map((m) => (
                      <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.expense_date} onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reference Note</Label>
              <Input value={form.reference_note} onChange={(e) => setForm((f) => ({ ...f, reference_note: e.target.value }))} placeholder="Optional reference or notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-brand-600 hover:bg-brand-700">
              {saving ? "Saving…" : "Record Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
