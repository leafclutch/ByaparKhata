import { createClient } from "@/lib/supabase/client";
import type { DashboardKPIs, MonthlyData, CategoryBreakdown, ProductStat } from "@/lib/types";
import { IS_DEMO_MODE } from "@/lib/env";
import {
  DEMO_KPIS, DEMO_MONTHLY_DATA, DEMO_EXPENSE_BREAKDOWN, DEMO_TOP_PRODUCTS,
} from "@/lib/mock-data";

function monthRange(monthsAgo: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
  return { start, end };
}

function shortMonth(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short" });
}

export async function getDashboardKPIs(companyId: string): Promise<DashboardKPIs> {
  if (IS_DEMO_MODE) return DEMO_KPIS;

  const supabase = createClient();
  const { start: thisStart, end: thisEnd } = monthRange(0);
  const { start: prevStart, end: prevEnd } = monthRange(1);

  const [curSales, prevSales, curPurchases, prevPurchases, curExpenses, prevExpenses, products] =
    await Promise.all([
      supabase.from("sales").select("grand_total").eq("company_id", companyId).gte("created_at", thisStart).lte("created_at", thisEnd),
      supabase.from("sales").select("grand_total").eq("company_id", companyId).gte("created_at", prevStart).lte("created_at", prevEnd),
      supabase.from("purchases").select("total_cost").eq("company_id", companyId).gte("purchased_at", thisStart).lte("purchased_at", thisEnd),
      supabase.from("purchases").select("total_cost").eq("company_id", companyId).gte("purchased_at", prevStart).lte("purchased_at", prevEnd),
      supabase.from("expenses").select("amount").eq("company_id", companyId).gte("expense_date", thisStart.slice(0, 10)).lte("expense_date", thisEnd.slice(0, 10)),
      supabase.from("expenses").select("amount").eq("company_id", companyId).gte("expense_date", prevStart.slice(0, 10)).lte("expense_date", prevEnd.slice(0, 10)),
      supabase.from("products").select("quantity, purchase_price").eq("company_id", companyId).eq("is_active", true),
    ]);

  const sum = (rows: { [k: string]: number }[], key: string) =>
    (rows ?? []).reduce((s, r) => s + (r[key] ?? 0), 0);
  const pct = (curr: number, prev: number) =>
    prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100 * 10) / 10;

  const totalSales = sum(curSales.data ?? [], "grand_total");
  const prevTotalSales = sum(prevSales.data ?? [], "grand_total");
  const totalPurchases = sum(curPurchases.data ?? [], "total_cost");
  const prevTotalPurchases = sum(prevPurchases.data ?? [], "total_cost");
  const totalExpenses = sum(curExpenses.data ?? [], "amount");
  const prevTotalExpenses = sum(prevExpenses.data ?? [], "amount");
  const netProfit = totalSales - totalPurchases - totalExpenses;
  const prevNetProfit = prevTotalSales - prevTotalPurchases - prevTotalExpenses;
  const inventoryValue = (products.data ?? []).reduce((s, p) => s + p.quantity * p.purchase_price, 0);

  return {
    total_sales: totalSales,
    total_purchases: totalPurchases,
    total_expenses: totalExpenses,
    net_profit: netProfit,
    inventory_value: inventoryValue,
    sales_change: pct(totalSales, prevTotalSales),
    purchases_change: pct(totalPurchases, prevTotalPurchases),
    expenses_change: pct(totalExpenses, prevTotalExpenses),
    profit_change: pct(netProfit, prevNetProfit),
  };
}

export async function getMonthlyRevenue(companyId: string, months = 6): Promise<MonthlyData[]> {
  if (IS_DEMO_MODE) return DEMO_MONTHLY_DATA;

  const supabase = createClient();
  const results: MonthlyData[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const { start, end } = monthRange(i);
    const [sales, purchases, expenses] = await Promise.all([
      supabase.from("sales").select("grand_total").eq("company_id", companyId).gte("created_at", start).lte("created_at", end),
      supabase.from("purchases").select("total_cost").eq("company_id", companyId).gte("purchased_at", start).lte("purchased_at", end),
      supabase.from("expenses").select("amount").eq("company_id", companyId).gte("expense_date", start.slice(0, 10)).lte("expense_date", end.slice(0, 10)),
    ]);
    const s = (sales.data ?? []).reduce((acc, r) => acc + r.grand_total, 0);
    const p = (purchases.data ?? []).reduce((acc, r) => acc + r.total_cost, 0);
    const e = (expenses.data ?? []).reduce((acc, r) => acc + r.amount, 0);
    results.push({ month: shortMonth(start), sales: s, purchases: p, expenses: e, profit: s - p - e });
  }

  return results;
}

export async function getExpenseBreakdown(companyId: string): Promise<CategoryBreakdown[]> {
  if (IS_DEMO_MODE) return DEMO_EXPENSE_BREAKDOWN;

  const supabase = createClient();
  const { start } = monthRange(0);
  const { data, error } = await supabase
    .from("expenses")
    .select("category, amount")
    .eq("company_id", companyId)
    .gte("expense_date", start.slice(0, 10));
  if (error) throw error;

  const COLORS: Record<string, string> = {
    salary: "#4f46e5", rent: "#0891b2", marketing: "#d97706",
    electricity: "#059669", transport: "#7c3aed", maintenance: "#dc2626", other: "#94a3b8",
  };

  const grouped: Record<string, number> = {};
  for (const row of data ?? []) {
    grouped[row.category] = (grouped[row.category] ?? 0) + row.amount;
  }

  return Object.entries(grouped).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: COLORS[name] ?? "#94a3b8",
  }));
}

export async function getTopProducts(companyId: string, limit = 5): Promise<ProductStat[]> {
  if (IS_DEMO_MODE) return DEMO_TOP_PRODUCTS;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("sale_items")
    .select("product_id, product_name, quantity, line_total, sale:sales!inner(company_id)")
    .eq("sale.company_id", companyId);
  if (error) throw error;

  const byProduct: Record<string, { name: string; revenue: number; units: number }> = {};
  for (const item of data ?? []) {
    if (!byProduct[item.product_id]) {
      byProduct[item.product_id] = { name: item.product_name, revenue: 0, units: 0 };
    }
    byProduct[item.product_id].revenue += item.line_total;
    byProduct[item.product_id].units += item.quantity;
  }

  const sorted = Object.entries(byProduct)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, limit);

  const maxRevenue = sorted[0]?.[1].revenue ?? 1;
  return sorted.map(([id, stat]) => ({
    id,
    name: stat.name,
    total_revenue: stat.revenue,
    units_sold: stat.units,
    percentage: Math.round((stat.revenue / maxRevenue) * 100),
  }));
}
