"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getSales } from "@/lib/services/sales";
import { getPurchases } from "@/lib/services/purchases";
import { getExpenses } from "@/lib/services/expenses";
import { formatNPR, formatDate } from "@/lib/utils";
import type { Sale, Purchase, Expense } from "@/lib/types";

const salesColumns = [
  { key: "invoice_number", header: "Invoice", hideBelow: "sm" as const, render: (r: Sale) => <code className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-medium">{r.invoice_number}</code> },
  { key: "customer_name", header: "Customer", render: (r: Sale) => <span className="text-sm text-slate-700">{r.customer_name || "Walk-in"}</span> },
  { key: "payment_method", header: "Payment", hideBelow: "md" as const, render: (r: Sale) => <StatusBadge status={r.payment_method} /> },
  { key: "grand_total", header: "Total", render: (r: Sale) => <span className="text-sm font-semibold text-emerald-700">{formatNPR(r.grand_total)}</span> },
  { key: "created_at", header: "Date", render: (r: Sale) => <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span> },
];

const purchaseColumns = [
  { key: "invoice_number", header: "Invoice", hideBelow: "sm" as const, render: (r: Purchase) => <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{r.invoice_number ?? "—"}</code> },
  { key: "supplier_name", header: "Supplier", render: (r: Purchase) => <span className="text-sm text-slate-700">{r.supplier_name}</span> },
  { key: "product_name", header: "Product", render: (r: Purchase) => <span className="text-sm text-slate-600">{r.product_name}</span> },
  { key: "quantity", header: "Qty", hideBelow: "md" as const, render: (r: Purchase) => <span className="text-sm text-slate-600">×{r.quantity}</span> },
  { key: "total_cost", header: "Cost", render: (r: Purchase) => <span className="text-sm font-semibold text-rose-700">{formatNPR(r.total_cost)}</span> },
  { key: "purchased_at", header: "Date", render: (r: Purchase) => <span className="text-xs text-slate-400">{formatDate(r.purchased_at)}</span> },
];

const expenseColumns = [
  { key: "category", header: "Category", render: (r: Expense) => <StatusBadge status={r.category} /> },
  { key: "description", header: "Description", render: (r: Expense) => <span className="text-sm text-slate-700">{r.description}</span> },
  { key: "payment_method", header: "Payment", render: (r: Expense) => <StatusBadge status={r.payment_method} /> },
  { key: "amount", header: "Amount", render: (r: Expense) => <span className="text-sm font-semibold text-rose-700">{formatNPR(r.amount)}</span> },
  { key: "expense_date", header: "Date", render: (r: Expense) => <span className="text-xs text-slate-400">{r.expense_date}</span> },
];

export default function TransactionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("sales");
  const [mySales, setMySales] = useState<Sale[]>([]);
  const [myPurchases, setMyPurchases] = useState<Purchase[]>([]);
  const [myExpenses, setMyExpenses] = useState<Expense[]>([]);
  const fetchedTabs = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.company_id || !user?.id) return;
    if (fetchedTabs.current.has(activeTab)) return;
    fetchedTabs.current.add(activeTab);

    const cid = user.company_id;
    const uid = user.id;

    const load = async () => {
      try {
        switch (activeTab) {
          case "sales":
            setMySales(await getSales(cid, { operator_id: uid }));
            break;
          case "purchases":
            setMyPurchases(await getPurchases(cid, { operator_id: uid }));
            break;
          case "expenses":
            setMyExpenses(await getExpenses(cid, { operator_id: uid }));
            break;
        }
      } catch {
        fetchedTabs.current.delete(activeTab);
        toast.error(`Failed to load ${activeTab}.`);
      }
    };
    load();
  }, [user?.company_id, user?.id, activeTab]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Transactions</h2>
        <p className="text-sm text-slate-500 mt-0.5">Your complete transaction history</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {[
          { label: "Sales", count: mySales.length, value: mySales.reduce((s, r) => s + r.grand_total, 0), color: "bg-emerald-50 text-emerald-700" },
          { label: "Purchases", count: myPurchases.length, value: myPurchases.reduce((s, r) => s + r.total_cost, 0), color: "bg-rose-50 text-rose-700" },
          { label: "Expenses", count: myExpenses.length, value: myExpenses.reduce((s, r) => s + r.amount, 0), color: "bg-amber-50 text-amber-700" },
        ].map((chip) => (
          <motion.div key={chip.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium ${chip.color}`}>
            <span>{chip.label}</span>
            <span className="text-xs opacity-70">{chip.count} records</span>
            <span className="font-bold">{formatNPR(chip.value)}</span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-slate-100 px-4 pt-3">
            <TabsList className="bg-transparent gap-1 h-auto pb-0">
              {["sales", "purchases", "expenses"].map((t) => (
                <TabsTrigger key={t} value={t} className="capitalize text-sm px-4 py-2 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700 data-[state=active]:shadow-none rounded-t-lg">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="sales" className="m-0">
            <div className="px-5 py-3 border-b border-slate-50">
              <span className="text-xs font-semibold text-emerald-700">{mySales.length} sales · Total: {formatNPR(mySales.reduce((s, r) => s + r.grand_total, 0))}</span>
            </div>
            {mySales.length > 0
              ? <DataTable columns={salesColumns} data={mySales} rowKey="id" searchable searchKeys={["customer_name", "invoice_number"]} />
              : <div className="py-12 text-center"><History className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-400">No sales yet</p></div>}
          </TabsContent>

          <TabsContent value="purchases" className="m-0">
            <div className="px-5 py-3 border-b border-slate-50">
              <span className="text-xs font-semibold text-rose-700">{myPurchases.length} purchases · Total: {formatNPR(myPurchases.reduce((s, r) => s + r.total_cost, 0))}</span>
            </div>
            {myPurchases.length > 0
              ? <DataTable columns={purchaseColumns} data={myPurchases} rowKey="id" />
              : <div className="py-12 text-center"><History className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-400">No purchases yet</p></div>}
          </TabsContent>

          <TabsContent value="expenses" className="m-0">
            <div className="px-5 py-3 border-b border-slate-50">
              <span className="text-xs font-semibold text-amber-700">{myExpenses.length} expenses · Total: {formatNPR(myExpenses.reduce((s, r) => s + r.amount, 0))}</span>
            </div>
            {myExpenses.length > 0
              ? <DataTable columns={expenseColumns} data={myExpenses} rowKey="id" />
              : <div className="py-12 text-center"><History className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-400">No expenses yet</p></div>}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
