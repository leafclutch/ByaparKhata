"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DEMO_SALES, DEMO_PURCHASES, DEMO_EXPENSES, DEMO_PRODUCTS } from "@/lib/mock-data";
import { formatINR, formatDate, getStockStatus, EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/utils";
import type { Sale, Purchase, Expense, Product } from "@/lib/types";

const salesColumns = [
  { key: "invoice_number", header: "Invoice", render: (r: Sale) => <code className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-medium">{r.invoice_number}</code> },
  { key: "customer_name", header: "Customer", render: (r: Sale) => <span className="text-sm text-slate-700">{r.customer_name || "Walk-in"}</span> },
  { key: "operator", header: "Operator", render: (r: Sale) => <span className="text-xs text-slate-500">{r.operator?.full_name}</span> },
  { key: "payment_method", header: "Payment", render: (r: Sale) => <StatusBadge status={r.payment_method} /> },
  { key: "grand_total", header: "Total", render: (r: Sale) => <span className="text-sm font-semibold text-emerald-700">{formatINR(r.grand_total)}</span> },
  { key: "created_at", header: "Date", render: (r: Sale) => <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span> },
];

const purchaseColumns = [
  { key: "invoice_number", header: "Invoice", render: (r: Purchase) => <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{r.invoice_number}</code> },
  { key: "supplier_name", header: "Supplier", render: (r: Purchase) => <span className="text-sm text-slate-700">{r.supplier_name}</span> },
  { key: "product_name", header: "Product", render: (r: Purchase) => <span className="text-sm text-slate-600">{r.product_name}</span> },
  { key: "quantity", header: "Qty", render: (r: Purchase) => <span className="text-sm text-slate-600">×{r.quantity}</span> },
  { key: "total_cost", header: "Cost", render: (r: Purchase) => <span className="text-sm font-semibold text-rose-700">{formatINR(r.total_cost)}</span> },
  { key: "purchased_at", header: "Date", render: (r: Purchase) => <span className="text-xs text-slate-400">{formatDate(r.purchased_at)}</span> },
];

const expenseColumns = [
  { key: "category", header: "Category", render: (r: Expense) => <StatusBadge status={r.category} /> },
  { key: "description", header: "Description", render: (r: Expense) => <span className="text-sm text-slate-700">{r.description}</span> },
  { key: "operator", header: "Recorded By", render: (r: Expense) => <span className="text-xs text-slate-500">{r.operator?.full_name}</span> },
  { key: "payment_method", header: "Payment", render: (r: Expense) => <StatusBadge status={r.payment_method} /> },
  { key: "amount", header: "Amount", render: (r: Expense) => <span className="text-sm font-semibold text-rose-700">{formatINR(r.amount)}</span> },
  { key: "expense_date", header: "Date", render: (r: Expense) => <span className="text-xs text-slate-400">{r.expense_date}</span> },
];

const inventoryColumns = [
  { key: "sku", header: "SKU", render: (r: Product) => <code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{r.sku}</code> },
  { key: "name", header: "Product", render: (r: Product) => <span className="text-sm font-medium text-slate-800">{r.name}</span> },
  { key: "category", header: "Category", render: (r: Product) => <span className="text-xs text-slate-500">{r.category?.name}</span> },
  { key: "quantity", header: "Stock", render: (r: Product) => <span className="text-sm text-slate-700">{r.quantity} units</span> },
  { key: "status", header: "Status", render: (r: Product) => <StatusBadge status={getStockStatus(r.quantity, r.min_stock)} /> },
  { key: "selling_price", header: "Sell Price", render: (r: Product) => <span className="text-sm text-slate-700">{formatINR(r.selling_price)}</span> },
  {
    key: "value", header: "Stock Value",
    render: (r: Product) => <span className="text-sm font-semibold text-slate-800">{formatINR(r.quantity * r.purchase_price)}</span>,
  },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("may-2026");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Reports</h2>
          <p className="text-sm text-slate-500 mt-0.5">View detailed transaction reports by category</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 w-36 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="may-2026">May 2026</SelectItem>
              <SelectItem value="apr-2026">Apr 2026</SelectItem>
              <SelectItem value="mar-2026">Mar 2026</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <Tabs defaultValue="sales" className="w-full">
          <div className="border-b border-slate-100 px-4 pt-3">
            <TabsList className="bg-transparent gap-1 h-auto pb-0">
              {["sales", "purchases", "expenses", "inventory"].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="capitalize text-sm px-4 py-2 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700 data-[state=active]:shadow-none rounded-t-lg"
                >
                  {t === "inventory" ? "Inventory" : t.charAt(0).toUpperCase() + t.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="sales" className="m-0">
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">{DEMO_SALES.length} records</span>
              <span className="text-xs font-semibold text-emerald-700">
                Total: {formatINR(DEMO_SALES.reduce((s, r) => s + r.grand_total, 0))}
              </span>
            </div>
            <DataTable columns={salesColumns} data={DEMO_SALES} rowKey="id" searchable searchKeys={["customer_name", "invoice_number"]} />
          </TabsContent>

          <TabsContent value="purchases" className="m-0">
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">{DEMO_PURCHASES.length} records</span>
              <span className="text-xs font-semibold text-rose-700">
                Total: {formatINR(DEMO_PURCHASES.reduce((s, r) => s + r.total_cost, 0))}
              </span>
            </div>
            <DataTable columns={purchaseColumns} data={DEMO_PURCHASES} rowKey="id" searchable searchKeys={["supplier_name", "product_name"]} />
          </TabsContent>

          <TabsContent value="expenses" className="m-0">
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">{DEMO_EXPENSES.length} records</span>
              <span className="text-xs font-semibold text-rose-700">
                Total: {formatINR(DEMO_EXPENSES.reduce((s, r) => s + r.amount, 0))}
              </span>
            </div>
            <DataTable columns={expenseColumns} data={DEMO_EXPENSES} rowKey="id" searchable searchKeys={["description"]} />
          </TabsContent>

          <TabsContent value="inventory" className="m-0">
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">{DEMO_PRODUCTS.length} products</span>
              <span className="text-xs font-semibold text-slate-700">
                Total value: {formatINR(DEMO_PRODUCTS.reduce((s, r) => s + r.quantity * r.purchase_price, 0))}
              </span>
            </div>
            <DataTable columns={inventoryColumns} data={DEMO_PRODUCTS} rowKey="id" searchable searchKeys={["name", "sku"]} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
