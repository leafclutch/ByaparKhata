"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { getSales } from "@/lib/services/sales";
import { getPurchases } from "@/lib/services/purchases";
import { getExpenses } from "@/lib/services/expenses";
import { getProducts } from "@/lib/services/products";
import { formatNPR, formatDate, getStockStatus } from "@/lib/utils";
import type { Sale, Purchase, Expense, Product } from "@/lib/types";

const salesColumns = [
  { key: "invoice_number", header: "Invoice", render: (r: Sale) => <code className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-medium">{r.invoice_number}</code> },
  { key: "customer_name", header: "Customer", render: (r: Sale) => <span className="text-sm text-slate-700">{r.customer_name || "Walk-in"}</span> },
  { key: "operator", header: "Operator", render: (r: Sale) => <span className="text-xs text-slate-500">{r.operator?.full_name}</span> },
  { key: "payment_method", header: "Payment", render: (r: Sale) => <StatusBadge status={r.payment_method} /> },
  { key: "grand_total", header: "Total", render: (r: Sale) => <span className="text-sm font-semibold text-emerald-700">{formatNPR(r.grand_total)}</span> },
  { key: "created_at", header: "Date", render: (r: Sale) => <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span> },
];

const purchaseColumns = [
  { key: "invoice_number", header: "Invoice", render: (r: Purchase) => <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{r.invoice_number}</code> },
  { key: "supplier_name", header: "Supplier", render: (r: Purchase) => <span className="text-sm text-slate-700">{r.supplier_name}</span> },
  { key: "product_name", header: "Product", render: (r: Purchase) => <span className="text-sm text-slate-600">{r.product_name}</span> },
  { key: "quantity", header: "Qty", render: (r: Purchase) => <span className="text-sm text-slate-600">×{r.quantity}</span> },
  { key: "total_cost", header: "Cost", render: (r: Purchase) => <span className="text-sm font-semibold text-rose-700">{formatNPR(r.total_cost)}</span> },
  { key: "purchased_at", header: "Date", render: (r: Purchase) => <span className="text-xs text-slate-400">{formatDate(r.purchased_at)}</span> },
];

const expenseColumns = [
  { key: "category", header: "Category", render: (r: Expense) => <StatusBadge status={r.category} /> },
  { key: "description", header: "Description", render: (r: Expense) => <span className="text-sm text-slate-700">{r.description}</span> },
  { key: "operator", header: "Recorded By", render: (r: Expense) => <span className="text-xs text-slate-500">{r.operator?.full_name}</span> },
  { key: "payment_method", header: "Payment", render: (r: Expense) => <StatusBadge status={r.payment_method} /> },
  { key: "amount", header: "Amount", render: (r: Expense) => <span className="text-sm font-semibold text-rose-700">{formatNPR(r.amount)}</span> },
  { key: "expense_date", header: "Date", render: (r: Expense) => <span className="text-xs text-slate-400">{r.expense_date}</span> },
];

const inventoryColumns = [
  { key: "sku", header: "SKU", render: (r: Product) => <code className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{r.sku}</code> },
  { key: "name", header: "Product", render: (r: Product) => <span className="text-sm font-medium text-slate-800">{r.name}</span> },
  { key: "category", header: "Category", render: (r: Product) => <span className="text-xs text-slate-500">{r.category?.name}</span> },
  { key: "quantity", header: "Stock", render: (r: Product) => <span className="text-sm text-slate-700">{r.quantity} units</span> },
  { key: "status", header: "Status", render: (r: Product) => <StatusBadge status={getStockStatus(r.quantity, r.min_stock)} /> },
  { key: "selling_price", header: "Sell Price", render: (r: Product) => <span className="text-sm text-slate-700">{formatNPR(r.selling_price)}</span> },
  { key: "value", header: "Stock Value", render: (r: Product) => <span className="text-sm font-semibold text-slate-800">{formatNPR(r.quantity * r.purchase_price)}</span> },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!user) return;
    const cid = user.company_id;
    Promise.all([getSales(cid), getPurchases(cid), getExpenses(cid), getProducts(cid)])
      .then(([s, p, e, pr]) => { setSales(s); setPurchases(p); setExpenses(e); setProducts(pr); })
      .catch(() => {});
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Reports</h2>
          <p className="text-sm text-slate-500 mt-0.5">View detailed transaction reports by category</p>
        </div>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
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
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="sales" className="m-0">
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">{sales.length} records</span>
              <span className="text-xs font-semibold text-emerald-700">
                Total: {formatNPR(sales.reduce((s, r) => s + r.grand_total, 0))}
              </span>
            </div>
            <DataTable columns={salesColumns} data={sales} rowKey="id" searchable searchKeys={["customer_name", "invoice_number"]} />
          </TabsContent>

          <TabsContent value="purchases" className="m-0">
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">{purchases.length} records</span>
              <span className="text-xs font-semibold text-rose-700">
                Total: {formatNPR(purchases.reduce((s, r) => s + r.total_cost, 0))}
              </span>
            </div>
            <DataTable columns={purchaseColumns} data={purchases} rowKey="id" searchable searchKeys={["supplier_name", "product_name"]} />
          </TabsContent>

          <TabsContent value="expenses" className="m-0">
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">{expenses.length} records</span>
              <span className="text-xs font-semibold text-rose-700">
                Total: {formatNPR(expenses.reduce((s, r) => s + r.amount, 0))}
              </span>
            </div>
            <DataTable columns={expenseColumns} data={expenses} rowKey="id" searchable searchKeys={["description"]} />
          </TabsContent>

          <TabsContent value="inventory" className="m-0">
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">{products.length} products</span>
              <span className="text-xs font-semibold text-slate-700">
                Total value: {formatNPR(products.reduce((s, r) => s + r.quantity * r.purchase_price, 0))}
              </span>
            </div>
            <DataTable columns={inventoryColumns} data={products} rowKey="id" searchable searchKeys={["name", "sku"]} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
