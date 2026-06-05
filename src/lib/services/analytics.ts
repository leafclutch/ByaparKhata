import { createClient } from "@/lib/supabase/client";
import type { DashboardKPIs, MonthlyData, CategoryBreakdown, ProductStat, Sale } from "@/lib/types";

function monthRange(monthsAgo: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsAgo);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
  return { start, end };
}

export interface CategoryStat {
  id: string;
  name: string;
  product_count: number;
  inventory_value: number;
  total_sales: number;
  total_purchases: number;
}

export async function getCategoryAnalytics(companyId: string): Promise<CategoryStat[]> {
  const supabase = createClient();
  const { start } = monthRange(0);

  const [categories, products, sales, purchases] = await Promise.all([
    supabase.from("categories").select("id, name").eq("company_id", companyId),
    supabase.from("products").select("id, category_id, quantity, purchase_price").eq("company_id", companyId),
    supabase
      .from("sale_items")
      .select("product_id, line_total, sale:sales!inner(company_id, created_at)")
      .eq("sale.company_id", companyId)
      .gte("sale.created_at", start),
    // Fix #5: scope purchases to current month to match sale_items scope
    supabase
      .from("purchases")
      .select("product_id, total_cost")
      .eq("company_id", companyId)
      .gte("purchased_at", start),
  ]);

  const stats: Record<string, CategoryStat> = {};
  (categories.data ?? []).forEach((c) => {
    stats[c.id] = { id: c.id, name: c.name, product_count: 0, inventory_value: 0, total_sales: 0, total_purchases: 0 };
  });

  const productToCat: Record<string, string> = {};
  (products.data ?? []).forEach((p) => {
    if (p.category_id && stats[p.category_id]) {
      productToCat[p.id] = p.category_id;
      stats[p.category_id].product_count++;
      stats[p.category_id].inventory_value += p.quantity * p.purchase_price;
    }
  });

  (sales.data ?? []).forEach((s) => {
    const cid = productToCat[s.product_id];
    if (cid) stats[cid].total_sales += s.line_total;
  });

  (purchases.data ?? []).forEach((p) => {
    const cid = productToCat[p.product_id];
    if (cid) stats[cid].total_purchases += p.total_cost;
  });

  return Object.values(stats);
}

// Fix #3: removed getCategoryAnalytics call — derive top_category from products+categories join instead
export async function getDashboardKPIs(companyId: string): Promise<DashboardKPIs> {
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
      supabase.from("products")
        .select("id, name, quantity, purchase_price, min_stock, category_id, category:categories(id, name)")
        .eq("company_id", companyId)
        .eq("is_active", true),
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

  const prods = products.data ?? [];
  const inventoryValue = prods.reduce((s, p) => s + p.quantity * p.purchase_price, 0);
  const lowStockItems = prods.filter((p) => p.quantity > 0 && p.quantity <= p.min_stock);
  const outOfStockItems = prods.filter((p) => p.quantity <= 0);

  // Top category by inventory value — no extra queries needed
  const catValue: Record<string, { name: string; value: number }> = {};
  for (const p of prods) {
    const cat = (p as any).category;
    if (p.category_id && cat?.name) {
      if (!catValue[p.category_id]) catValue[p.category_id] = { name: cat.name, value: 0 };
      catValue[p.category_id].value += p.quantity * p.purchase_price;
    }
  }
  const topCat = Object.values(catValue).sort((a, b) => b.value - a.value)[0]?.name;

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
    total_products: prods.length,
    low_stock_count: lowStockItems.length,
    out_of_stock_count: outOfStockItems.length,
    top_category: topCat,
    low_stock_products: lowStockItems.map((p) => ({ id: p.id, name: p.name, quantity: p.quantity, min_stock: p.min_stock })),
  };
}

// Fix #1: consolidated admin dashboard — 18 queries → 6 queries in one Promise.all
export interface DashboardData {
  kpis: DashboardKPIs;
  monthlyData: MonthlyData[];
  expenseBreakdown: CategoryBreakdown[];
  topProducts: ProductStat[];
  recentSales: Sale[];
}

export async function getDashboardData(companyId: string): Promise<DashboardData> {
  const supabase = createClient();
  const { start: thisStart } = monthRange(0);
  const { start: rangeStart } = monthRange(5);
  const { end: rangeEnd } = monthRange(0);

  const [productsRes, salesRes, purchasesRes, expensesRes, saleItemsRes, recentSalesRes] =
    await Promise.all([
      // Products with category join — covers KPI stats + low-stock banner + top-category derivation
      supabase
        .from("products")
        .select("id, name, quantity, purchase_price, min_stock, category_id, category:categories(id, name)")
        .eq("company_id", companyId)
        .eq("is_active", true),
      // 6-month sales window — covers both monthly chart data AND current/prev month KPI totals
      supabase
        .from("sales")
        .select("grand_total, created_at")
        .eq("company_id", companyId)
        .gte("created_at", rangeStart)
        .lte("created_at", rangeEnd),
      supabase
        .from("purchases")
        .select("total_cost, purchased_at")
        .eq("company_id", companyId)
        .gte("purchased_at", rangeStart)
        .lte("purchased_at", rangeEnd),
      // Expenses with category — covers both monthly chart AND current-month breakdown donut
      supabase
        .from("expenses")
        .select("category, amount, expense_date")
        .eq("company_id", companyId)
        .gte("expense_date", rangeStart.slice(0, 10)),
      // Current-month sale_items — covers top products AND top category derivation
      supabase
        .from("sale_items")
        .select("product_id, product_name, quantity, line_total, sale:sales!inner(company_id, created_at)")
        .eq("sale.company_id", companyId)
        .gte("sale.created_at", thisStart),
      // Fix #2: recent 10 sales only — not 500
      supabase
        .from("sales")
        .select("id, invoice_number, customer_name, grand_total, payment_method, cash_amount, online_amount, notes, created_at, operator:users(id, full_name)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  // Build ordered YYYY-MM month keys for last 6 months
  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const currentKey = monthKeys[monthKeys.length - 1];
  const prevKey = monthKeys[monthKeys.length - 2];

  // Bucket raw rows by month key
  const sBuckets: Record<string, number> = {};
  const pBuckets: Record<string, number> = {};
  const eBuckets: Record<string, number> = {};
  for (const k of monthKeys) { sBuckets[k] = 0; pBuckets[k] = 0; eBuckets[k] = 0; }

  for (const row of salesRes.data ?? []) {
    const k = row.created_at.slice(0, 7);
    if (k in sBuckets) sBuckets[k] += row.grand_total;
  }
  for (const row of purchasesRes.data ?? []) {
    const k = row.purchased_at.slice(0, 7);
    if (k in pBuckets) pBuckets[k] += row.total_cost;
  }
  for (const row of expensesRes.data ?? []) {
    const k = (row.expense_date as string).slice(0, 7);
    if (k in eBuckets) eBuckets[k] += row.amount;
  }

  const monthlyData: MonthlyData[] = monthKeys.map((k) => {
    const [year, month] = k.split("-").map(Number);
    const label = new Date(year, month - 1, 1).toLocaleString("en-US", { month: "short" });
    return { month: label, sales: sBuckets[k], purchases: pBuckets[k], expenses: eBuckets[k], profit: sBuckets[k] - pBuckets[k] - eBuckets[k] };
  });

  // KPI totals from 6-month buckets — no extra queries needed
  const curSalesTotal = sBuckets[currentKey] ?? 0;
  const prevSalesTotal = sBuckets[prevKey] ?? 0;
  const curPurchasesTotal = pBuckets[currentKey] ?? 0;
  const prevPurchasesTotal = pBuckets[prevKey] ?? 0;
  const curExpensesTotal = eBuckets[currentKey] ?? 0;
  const prevExpensesTotal = eBuckets[prevKey] ?? 0;
  const netProfit = curSalesTotal - curPurchasesTotal - curExpensesTotal;
  const prevNetProfit = prevSalesTotal - prevPurchasesTotal - prevExpensesTotal;
  const pct = (c: number, p: number) => p === 0 ? 0 : Math.round(((c - p) / p) * 100 * 10) / 10;

  const prods = productsRes.data ?? [];
  const inventoryValue = prods.reduce((s, p) => s + p.quantity * p.purchase_price, 0);
  const lowStockItems = prods.filter((p) => p.quantity > 0 && p.quantity <= p.min_stock);
  const outOfStockItems = prods.filter((p) => p.quantity <= 0);

  // Top category from current-month sale_items × products map — no extra query
  const productCatMap: Record<string, { catId: string; catName: string } | undefined> = {};
  for (const p of prods) {
    const cat = (p as any).category;
    if (p.category_id && cat?.name) {
      productCatMap[p.id] = { catId: p.category_id, catName: cat.name };
    }
  }
  const revByCat: Record<string, { name: string; total: number }> = {};
  for (const si of saleItemsRes.data ?? []) {
    const c = productCatMap[si.product_id];
    if (c) {
      if (!revByCat[c.catId]) revByCat[c.catId] = { name: c.catName, total: 0 };
      revByCat[c.catId].total += si.line_total;
    }
  }
  const topCat = Object.values(revByCat).sort((a, b) => b.total - a.total)[0]?.name;

  const kpis: DashboardKPIs = {
    total_sales: curSalesTotal,
    total_purchases: curPurchasesTotal,
    total_expenses: curExpensesTotal,
    net_profit: netProfit,
    inventory_value: inventoryValue,
    sales_change: pct(curSalesTotal, prevSalesTotal),
    purchases_change: pct(curPurchasesTotal, prevPurchasesTotal),
    expenses_change: pct(curExpensesTotal, prevExpensesTotal),
    profit_change: pct(netProfit, prevNetProfit),
    total_products: prods.length,
    low_stock_count: lowStockItems.length,
    out_of_stock_count: outOfStockItems.length,
    top_category: topCat,
    low_stock_products: lowStockItems.map((p) => ({ id: p.id, name: p.name, quantity: p.quantity, min_stock: p.min_stock })),
  };

  // Expense breakdown — current month only, derived from the 6-month expenses query
  const EXPENSE_COLORS: Record<string, string> = {
    salary: "#4f46e5", rent: "#0891b2", marketing: "#d97706",
    electricity: "#059669", transport: "#7c3aed", maintenance: "#dc2626", other: "#94a3b8",
  };
  const expGrouped: Record<string, number> = {};
  for (const row of expensesRes.data ?? []) {
    if ((row.expense_date as string).slice(0, 7) === currentKey) {
      expGrouped[row.category] = (expGrouped[row.category] ?? 0) + row.amount;
    }
  }
  const expenseBreakdown: CategoryBreakdown[] = Object.entries(expGrouped).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: EXPENSE_COLORS[name] ?? "#94a3b8",
  }));

  // Top products — from current-month sale_items (already fetched above)
  const byProduct: Record<string, { name: string; revenue: number; units: number }> = {};
  for (const item of saleItemsRes.data ?? []) {
    if (!byProduct[item.product_id]) byProduct[item.product_id] = { name: item.product_name, revenue: 0, units: 0 };
    byProduct[item.product_id].revenue += item.line_total;
    byProduct[item.product_id].units += item.quantity;
  }
  const sortedProds = Object.entries(byProduct).sort(([, a], [, b]) => b.revenue - a.revenue).slice(0, 5);
  const maxRev = sortedProds[0]?.[1].revenue ?? 1;
  const topProducts: ProductStat[] = sortedProds.map(([id, s]) => ({
    id,
    name: s.name,
    total_revenue: s.revenue,
    units_sold: s.units,
    percentage: Math.round((s.revenue / maxRev) * 100),
  }));

  return {
    kpis,
    monthlyData,
    expenseBreakdown,
    topProducts,
    recentSales: (recentSalesRes.data ?? []) as unknown as Sale[],
  };
}

// Fix #4: try server-side RPC first; fall back to client-side bucketing
// Requires migration: supabase/migrations/20260605_performance_rpcs.sql
export async function getMonthlyRevenue(companyId: string, months = 6): Promise<MonthlyData[]> {
  const supabase = createClient();

  const { data: rpcData, error: rpcErr } = await (supabase.rpc as any)("get_monthly_revenue", {
    p_company_id: companyId,
    p_months: months,
  });
  if (!rpcErr && Array.isArray(rpcData)) {
    return rpcData.map((row: any) => ({
      month: row.label,
      sales: Number(row.sales_total),
      purchases: Number(row.purchases_total),
      expenses: Number(row.expenses_total),
      profit: Number(row.sales_total) - Number(row.purchases_total) - Number(row.expenses_total),
    }));
  }

  const { start: rangeStart } = monthRange(months - 1);
  const { end: rangeEnd } = monthRange(0);

  const [salesRes, purchasesRes, expensesRes] = await Promise.all([
    supabase.from("sales").select("grand_total, created_at").eq("company_id", companyId).gte("created_at", rangeStart).lte("created_at", rangeEnd),
    supabase.from("purchases").select("total_cost, purchased_at").eq("company_id", companyId).gte("purchased_at", rangeStart).lte("purchased_at", rangeEnd),
    supabase.from("expenses").select("amount, expense_date").eq("company_id", companyId).gte("expense_date", rangeStart.slice(0, 10)).lte("expense_date", rangeEnd.slice(0, 10)),
  ]);

  const monthKeys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const buckets: Record<string, { label: string; s: number; p: number; e: number }> = {};
  for (const key of monthKeys) {
    const [year, month] = key.split("-").map(Number);
    const label = new Date(year, month - 1, 1).toLocaleString("en-US", { month: "short" });
    buckets[key] = { label, s: 0, p: 0, e: 0 };
  }

  for (const row of salesRes.data ?? []) {
    const key = row.created_at.slice(0, 7);
    if (buckets[key]) buckets[key].s += row.grand_total;
  }
  for (const row of purchasesRes.data ?? []) {
    const key = row.purchased_at.slice(0, 7);
    if (buckets[key]) buckets[key].p += row.total_cost;
  }
  for (const row of expensesRes.data ?? []) {
    const key = (row.expense_date as string).slice(0, 7);
    if (buckets[key]) buckets[key].e += row.amount;
  }

  return monthKeys.map((key) => {
    const { label, s, p, e } = buckets[key];
    return { month: label, sales: s, purchases: p, expenses: e, profit: s - p - e };
  });
}

// Fix #6: try server-side RPC first; fall back to client-side grouping
// Requires migration: supabase/migrations/20260605_performance_rpcs.sql
export async function getExpenseBreakdown(companyId: string): Promise<CategoryBreakdown[]> {
  const supabase = createClient();
  const { start } = monthRange(0);

  const COLORS: Record<string, string> = {
    salary: "#4f46e5", rent: "#0891b2", marketing: "#d97706",
    electricity: "#059669", transport: "#7c3aed", maintenance: "#dc2626", other: "#94a3b8",
  };

  const { data: rpcData, error: rpcErr } = await (supabase.rpc as any)("get_expense_breakdown", {
    p_company_id: companyId,
    p_start: start.slice(0, 10),
  });
  if (!rpcErr && Array.isArray(rpcData)) {
    return rpcData.map((row: any) => ({
      name: String(row.category).charAt(0).toUpperCase() + String(row.category).slice(1),
      value: Number(row.total),
      color: COLORS[row.category] ?? "#94a3b8",
    }));
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("category, amount")
    .eq("company_id", companyId)
    .gte("expense_date", start.slice(0, 10));
  if (error) throw error;

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

// Fix #6: try server-side RPC first; fall back to client-side grouping
// Requires migration: supabase/migrations/20260605_performance_rpcs.sql
export async function getTopProducts(companyId: string, limit = 5): Promise<ProductStat[]> {
  const supabase = createClient();
  const { start } = monthRange(0);

  const { data: rpcData, error: rpcErr } = await (supabase.rpc as any)("get_top_products", {
    p_company_id: companyId,
    p_start: start,
    p_limit: limit,
  });
  if (!rpcErr && Array.isArray(rpcData)) {
    return rpcData.map((row: any) => ({
      id: row.product_id,
      name: row.product_name,
      total_revenue: Number(row.total_revenue),
      units_sold: Number(row.units_sold),
      percentage: Number(row.percentage),
    }));
  }

  const { data, error } = await supabase
    .from("sale_items")
    .select("product_id, product_name, quantity, line_total, sale:sales!inner(company_id, created_at)")
    .eq("sale.company_id", companyId)
    .gte("sale.created_at", start);
  if (error) throw error;

  const byProduct: Record<string, { name: string; revenue: number; units: number }> = {};
  for (const item of data ?? []) {
    if (!byProduct[item.product_id]) byProduct[item.product_id] = { name: item.product_name, revenue: 0, units: 0 };
    byProduct[item.product_id].revenue += item.line_total;
    byProduct[item.product_id].units += item.quantity;
  }

  const sorted = Object.entries(byProduct).sort(([, a], [, b]) => b.revenue - a.revenue).slice(0, limit);
  const maxRevenue = sorted[0]?.[1].revenue ?? 1;
  return sorted.map(([id, stat]) => ({
    id,
    name: stat.name,
    total_revenue: stat.revenue,
    units_sold: stat.units,
    percentage: Math.round((stat.revenue / maxRevenue) * 100),
  }));
}

export async function getMTDRevenue(companyId: string): Promise<{ total: number; change: number }> {
  const supabase = createClient();
  const { start: thisStart, end: thisEnd } = monthRange(0);
  const { start: prevStart, end: prevEnd } = monthRange(1);

  const [cur, prev] = await Promise.all([
    supabase.from("sales").select("grand_total").eq("company_id", companyId).gte("created_at", thisStart).lte("created_at", thisEnd),
    supabase.from("sales").select("grand_total").eq("company_id", companyId).gte("created_at", prevStart).lte("created_at", prevEnd),
  ]);

  const total = (cur.data ?? []).reduce((s, r) => s + r.grand_total, 0);
  const prevTotal = (prev.data ?? []).reduce((s, r) => s + r.grand_total, 0);
  const change = prevTotal === 0 ? 0 : Math.round(((total - prevTotal) / prevTotal) * 100 * 10) / 10;
  return { total, change };
}
