import type {
  Company, AppUser, Category, Product, Sale, SaleItem,
  Purchase, Expense, Notification, DashboardKPIs,
  MonthlyData, CategoryBreakdown, ProductStat, Transaction,
} from "./types";

export const DEMO_COMPANY: Company = {
  id: "comp-001",
  name: "Nexus Retail Pvt. Ltd.",
  slug: "nexus-retail",
  address: "12, MG Road, Bengaluru, Karnataka - 560001",
  gst_number: "29ABCDE1234F1Z5",
  currency: "INR",
  timezone: "Asia/Kolkata",
  created_at: "2025-01-15T10:00:00Z",
};

export const DEMO_ADMIN: AppUser = {
  id: "user-001",
  company_id: "comp-001",
  full_name: "Arjun Mehta",
  role: "admin",
  email: "admin@nexusretail.in",
  is_active: true,
  created_at: "2025-01-15T10:00:00Z",
};

export const DEMO_OPERATOR: AppUser = {
  id: "user-002",
  company_id: "comp-001",
  full_name: "Raj Kumar",
  role: "operator",
  email: "operator@nexusretail.in",
  is_active: true,
  created_at: "2025-01-20T10:00:00Z",
};

export const DEMO_OPERATOR_2: AppUser = {
  id: "user-003",
  company_id: "comp-001",
  full_name: "Priya Shah",
  role: "operator",
  email: "priya@nexusretail.in",
  is_active: true,
  created_at: "2025-02-01T10:00:00Z",
};

export const DEMO_CATEGORIES: Category[] = [
  { id: "cat-001", company_id: "comp-001", name: "Footwear", slug: "footwear", level: 0, color: "#4f46e5" },
  { id: "cat-001-1", company_id: "comp-001", name: "Sports Shoes", slug: "sports-shoes", parent_id: "cat-001", level: 1, color: "#4f46e5" },
  { id: "cat-001-2", company_id: "comp-001", name: "Casual Shoes", slug: "casual-shoes", parent_id: "cat-001", level: 1, color: "#4f46e5" },
  { id: "cat-002", company_id: "comp-001", name: "Electronics", slug: "electronics", level: 0, color: "#0891b2" },
  { id: "cat-002-1", company_id: "comp-001", name: "Audio", slug: "audio", parent_id: "cat-002", level: 1, color: "#0891b2" },
  { id: "cat-002-2", company_id: "comp-001", name: "Computing", slug: "computing", parent_id: "cat-002", level: 1, color: "#0891b2" },
  { id: "cat-002-2-1", company_id: "comp-001", name: "Peripherals", slug: "peripherals", parent_id: "cat-002-2", level: 2, color: "#0891b2" },
  { id: "cat-003", company_id: "comp-001", name: "Apparel", slug: "apparel", level: 0, color: "#059669" },
  { id: "cat-003-1", company_id: "comp-001", name: "Men", slug: "men", parent_id: "cat-003", level: 1, color: "#059669" },
  { id: "cat-003-2", company_id: "comp-001", name: "Women", slug: "women", parent_id: "cat-003", level: 1, color: "#059669" },
  { id: "cat-004", company_id: "comp-001", name: "Accessories", slug: "accessories", level: 0, color: "#d97706" },
  { id: "cat-004-1", company_id: "comp-001", name: "Phone Accessories", slug: "phone-accessories", parent_id: "cat-004", level: 1, color: "#d97706" },
  { id: "cat-004-2", company_id: "comp-001", name: "Desk Accessories", slug: "desk-accessories", parent_id: "cat-004", level: 1, color: "#d97706" },
];

export const DEMO_PRODUCTS: Product[] = [
  { id: "prod-001", company_id: "comp-001", category_id: "cat-001", category: DEMO_CATEGORIES[0], name: "Nike Air Max 90", sku: "SKU-001", barcode: "8901234567890", purchase_price: 4200, selling_price: 6999, quantity: 3, min_stock: 10, is_active: true, created_at: "2025-01-20T10:00:00Z", updated_at: "2026-05-24T10:00:00Z" },
  { id: "prod-002", company_id: "comp-001", category_id: "cat-002", category: DEMO_CATEGORIES[1], name: 'Samsung TV 43"', sku: "SKU-002", barcode: "8901234567891", purchase_price: 24000, selling_price: 38000, quantity: 12, min_stock: 5, is_active: true, created_at: "2025-01-20T10:00:00Z", updated_at: "2026-05-23T10:00:00Z" },
  { id: "prod-003", company_id: "comp-001", category_id: "cat-003", category: DEMO_CATEGORIES[2], name: "Jeans Classic Fit", sku: "SKU-003", barcode: "8901234567892", purchase_price: 450, selling_price: 1299, quantity: 85, min_stock: 20, is_active: true, created_at: "2025-01-20T10:00:00Z", updated_at: "2026-05-20T10:00:00Z" },
  { id: "prod-004", company_id: "comp-001", category_id: "cat-004", category: DEMO_CATEGORIES[3], name: "USB-C Hub 7-in-1", sku: "SKU-004", barcode: "8901234567893", purchase_price: 1100, selling_price: 2499, quantity: 5, min_stock: 15, is_active: true, created_at: "2025-02-01T10:00:00Z", updated_at: "2026-05-22T10:00:00Z" },
  { id: "prod-005", company_id: "comp-001", category_id: "cat-004", category: DEMO_CATEGORIES[3], name: "Laptop Stand Pro", sku: "SKU-005", barcode: "8901234567894", purchase_price: 850, selling_price: 1999, quantity: 28, min_stock: 10, is_active: true, created_at: "2025-02-01T10:00:00Z", updated_at: "2026-05-21T10:00:00Z" },
  { id: "prod-006", company_id: "comp-001", category_id: "cat-003", category: DEMO_CATEGORIES[2], name: "Running Shorts M", sku: "SKU-006", barcode: "8901234567895", purchase_price: 280, selling_price: 699, quantity: 7, min_stock: 20, is_active: true, created_at: "2025-02-10T10:00:00Z", updated_at: "2026-05-19T10:00:00Z" },
  { id: "prod-007", company_id: "comp-001", category_id: "cat-002", category: DEMO_CATEGORIES[1], name: "Bluetooth Speaker", sku: "SKU-007", barcode: "8901234567896", purchase_price: 1800, selling_price: 3499, quantity: 2, min_stock: 8, is_active: true, created_at: "2025-02-10T10:00:00Z", updated_at: "2026-05-25T10:00:00Z" },
  { id: "prod-008", company_id: "comp-001", category_id: "cat-002", category: DEMO_CATEGORIES[1], name: "Wireless Mouse", sku: "SKU-008", barcode: "8901234567897", purchase_price: 620, selling_price: 1299, quantity: 42, min_stock: 15, is_active: true, created_at: "2025-03-01T10:00:00Z", updated_at: "2026-05-18T10:00:00Z" },
  { id: "prod-009", company_id: "comp-001", category_id: "cat-001", category: DEMO_CATEGORIES[0], name: "Adidas Ultraboost", sku: "SKU-009", barcode: "8901234567898", purchase_price: 5800, selling_price: 9499, quantity: 15, min_stock: 8, is_active: true, created_at: "2025-03-10T10:00:00Z", updated_at: "2026-05-15T10:00:00Z" },
  { id: "prod-010", company_id: "comp-001", category_id: "cat-003", category: DEMO_CATEGORIES[2], name: "Cotton T-Shirt (Pack 3)", sku: "SKU-010", barcode: "8901234567899", purchase_price: 350, selling_price: 899, quantity: 120, min_stock: 30, is_active: true, created_at: "2025-03-10T10:00:00Z", updated_at: "2026-05-10T10:00:00Z" },
  { id: "prod-011", company_id: "comp-001", category_id: "cat-002", category: DEMO_CATEGORIES[1], name: "Mechanical Keyboard", sku: "SKU-011", barcode: "8901234567900", purchase_price: 3200, selling_price: 5999, quantity: 18, min_stock: 5, is_active: true, created_at: "2025-04-01T10:00:00Z", updated_at: "2026-05-05T10:00:00Z" },
  { id: "prod-012", company_id: "comp-001", category_id: "cat-004", category: DEMO_CATEGORIES[3], name: "Phone Case Premium", sku: "SKU-012", barcode: "8901234567901", purchase_price: 120, selling_price: 399, quantity: 200, min_stock: 50, is_active: true, created_at: "2025-04-01T10:00:00Z", updated_at: "2026-05-01T10:00:00Z" },
];

const makeSaleItems = (saleId: string, items: Array<{ product: Product; qty: number; discount?: number }>): SaleItem[] =>
  items.map((it, i) => ({
    id: `si-${saleId}-${i}`,
    sale_id: saleId,
    product_id: it.product.id,
    product_name: it.product.name,
    quantity: it.qty,
    unit_price: it.product.selling_price,
    discount: it.discount ?? 0,
    line_total: it.qty * it.product.selling_price - (it.discount ?? 0),
  }));

export const DEMO_SALES: Sale[] = [
  { id: "sale-001", company_id: "comp-001", operator_id: "user-002", operator: DEMO_OPERATOR, invoice_number: "VK-2605-2847", customer_name: "Amit Sharma", subtotal: 13998, discount: 0, tax_rate: 18, tax_amount: 2519.64, grand_total: 16517.64, payment_method: "upi", created_at: "2026-05-26T14:30:00Z", items: makeSaleItems("sale-001", [{ product: DEMO_PRODUCTS[0], qty: 2 }]) },
  { id: "sale-002", company_id: "comp-001", operator_id: "user-002", operator: DEMO_OPERATOR, invoice_number: "VK-2605-2846", customer_name: "Walk-in", subtotal: 5997, discount: 500, tax_rate: 18, tax_amount: 989.46, grand_total: 6486.46, payment_method: "cash", created_at: "2026-05-26T13:20:00Z", items: makeSaleItems("sale-002", [{ product: DEMO_PRODUCTS[4], qty: 3, discount: 500 }]) },
  { id: "sale-003", company_id: "comp-001", operator_id: "user-003", operator: DEMO_OPERATOR_2, invoice_number: "VK-2605-2845", customer_name: "Sunita Verma", subtotal: 38000, discount: 2000, tax_rate: 18, tax_amount: 6480, grand_total: 42480, payment_method: "card", created_at: "2026-05-25T16:45:00Z", items: makeSaleItems("sale-003", [{ product: DEMO_PRODUCTS[1], qty: 1, discount: 2000 }]) },
  { id: "sale-004", company_id: "comp-001", operator_id: "user-002", operator: DEMO_OPERATOR, invoice_number: "VK-2605-2844", customer_name: "Rahul Nair", subtotal: 7794, discount: 0, tax_rate: 18, tax_amount: 1402.92, grand_total: 9196.92, payment_method: "upi", created_at: "2026-05-25T11:00:00Z", items: makeSaleItems("sale-004", [{ product: DEMO_PRODUCTS[2], qty: 6 }]) },
  { id: "sale-005", company_id: "comp-001", operator_id: "user-003", operator: DEMO_OPERATOR_2, invoice_number: "VK-2405-2843", customer_name: "Walk-in", subtotal: 9499, discount: 0, tax_rate: 18, tax_amount: 1709.82, grand_total: 11208.82, payment_method: "cash", created_at: "2026-05-24T15:20:00Z", items: makeSaleItems("sale-005", [{ product: DEMO_PRODUCTS[8], qty: 1 }]) },
  { id: "sale-006", company_id: "comp-001", operator_id: "user-002", operator: DEMO_OPERATOR, invoice_number: "VK-2405-2842", customer_name: "Deepa Iyer", subtotal: 3995, discount: 0, tax_rate: 18, tax_amount: 719.1, grand_total: 4714.1, payment_method: "upi", created_at: "2026-05-24T10:30:00Z", items: makeSaleItems("sale-006", [{ product: DEMO_PRODUCTS[11], qty: 10 }]) },
  { id: "sale-007", company_id: "comp-001", operator_id: "user-002", operator: DEMO_OPERATOR, invoice_number: "VK-2305-2841", customer_name: "Mohan Das", subtotal: 11998, discount: 1000, tax_rate: 18, tax_amount: 1979.64, grand_total: 12977.64, payment_method: "card", created_at: "2026-05-23T14:00:00Z", items: makeSaleItems("sale-007", [{ product: DEMO_PRODUCTS[10], qty: 2, discount: 1000 }]) },
  { id: "sale-008", company_id: "comp-001", operator_id: "user-003", operator: DEMO_OPERATOR_2, invoice_number: "VK-2205-2840", customer_name: "Walk-in", subtotal: 2598, discount: 0, tax_rate: 18, tax_amount: 467.64, grand_total: 3065.64, payment_method: "cash", created_at: "2026-05-22T12:15:00Z" },
];

export const DEMO_PURCHASES: Purchase[] = [
  { id: "pur-001", company_id: "comp-001", operator_id: "user-002", operator: DEMO_OPERATOR, supplier_name: "Samsung Distributor India", product_id: "prod-002", product_name: 'Samsung TV 43"', quantity: 5, unit_cost: 24000, total_cost: 120000, invoice_number: "SUP-4521", payment_method: "bank_transfer", purchased_at: "2026-05-25T16:45:00Z" },
  { id: "pur-002", company_id: "comp-001", operator_id: "user-003", operator: DEMO_OPERATOR_2, supplier_name: "Nike India Wholesale", product_id: "prod-001", product_name: "Nike Air Max 90", quantity: 20, unit_cost: 4200, total_cost: 84000, invoice_number: "SUP-4489", payment_method: "bank_transfer", purchased_at: "2026-05-22T10:00:00Z" },
  { id: "pur-003", company_id: "comp-001", operator_id: "user-002", operator: DEMO_OPERATOR, supplier_name: "Tech Accessories Hub", product_id: "prod-008", product_name: "Wireless Mouse", quantity: 30, unit_cost: 620, total_cost: 18600, invoice_number: "SUP-4401", payment_method: "upi", purchased_at: "2026-05-18T11:30:00Z" },
  { id: "pur-004", company_id: "comp-001", operator_id: "user-003", operator: DEMO_OPERATOR_2, supplier_name: "Apparel Galaxy", product_id: "prod-003", product_name: "Jeans Classic Fit", quantity: 50, unit_cost: 450, total_cost: 22500, invoice_number: "SUP-4350", payment_method: "cash", purchased_at: "2026-05-15T09:00:00Z" },
  { id: "pur-005", company_id: "comp-001", operator_id: "user-002", operator: DEMO_OPERATOR, supplier_name: "Electronics World", product_id: "prod-011", product_name: "Mechanical Keyboard", quantity: 10, unit_cost: 3200, total_cost: 32000, invoice_number: "SUP-4280", payment_method: "bank_transfer", purchased_at: "2026-05-10T14:00:00Z" },
];

export const DEMO_EXPENSES: Expense[] = [
  { id: "exp-001", company_id: "comp-001", operator_id: "user-001", operator: DEMO_ADMIN, category: "rent", description: "Office rent — May 2026", amount: 45000, payment_method: "bank_transfer", expense_date: "2026-05-24", created_at: "2026-05-24T09:00:00Z" },
  { id: "exp-002", company_id: "comp-001", operator_id: "user-002", operator: DEMO_OPERATOR, category: "electricity", description: "Electricity bill — May 2026", amount: 12800, payment_method: "upi", expense_date: "2026-05-24", created_at: "2026-05-24T11:00:00Z" },
  { id: "exp-003", company_id: "comp-001", operator_id: "user-001", operator: DEMO_ADMIN, category: "salary", description: "Staff salaries — May 2026", amount: 180000, payment_method: "bank_transfer", expense_date: "2026-05-22", created_at: "2026-05-22T10:00:00Z" },
  { id: "exp-004", company_id: "comp-001", operator_id: "user-002", operator: DEMO_OPERATOR, category: "marketing", description: "Google Ads campaign — May", amount: 25000, payment_method: "card", expense_date: "2026-05-20", created_at: "2026-05-20T15:00:00Z" },
  { id: "exp-005", company_id: "comp-001", operator_id: "user-002", operator: DEMO_OPERATOR, category: "transport", description: "Courier & delivery charges", amount: 8400, payment_method: "cash", expense_date: "2026-05-18", created_at: "2026-05-18T14:30:00Z" },
  { id: "exp-006", company_id: "comp-001", operator_id: "user-003", operator: DEMO_OPERATOR_2, category: "maintenance", description: "AC service & repairs", amount: 6200, payment_method: "cash", expense_date: "2026-05-15", created_at: "2026-05-15T11:00:00Z" },
  { id: "exp-007", company_id: "comp-001", operator_id: "user-001", operator: DEMO_ADMIN, category: "other", description: "Office supplies & stationery", amount: 3200, payment_method: "cash", expense_date: "2026-05-12", created_at: "2026-05-12T10:00:00Z" },
];

export const DEMO_NOTIFICATIONS: Notification[] = [
  { id: "notif-001", company_id: "comp-001", type: "alert", title: "Low stock alert — Nike Air Max 90", message: "Only 3 units remaining. Minimum stock level is 10.", is_read: false, created_at: "2026-05-26T10:00:00Z" },
  { id: "notif-002", company_id: "comp-001", type: "alert", title: "Low stock alert — Bluetooth Speaker", message: "Only 2 units remaining. Minimum stock level is 8.", is_read: false, created_at: "2026-05-26T09:30:00Z" },
  { id: "notif-003", company_id: "comp-001", type: "success", title: "New sale recorded — ₹16,518", message: "Invoice VK-2605-2847 created by Raj Kumar for Amit Sharma.", is_read: false, created_at: "2026-05-26T14:30:00Z" },
  { id: "notif-004", company_id: "comp-001", type: "info", title: "Monthly report ready", message: "May 2026 sales report has been generated and is ready for download.", is_read: true, created_at: "2026-05-25T08:00:00Z" },
  { id: "notif-005", company_id: "comp-001", type: "warning", title: "Low stock — USB-C Hub 7-in-1", message: "Only 5 units remaining. Minimum stock level is 15.", is_read: true, created_at: "2026-05-24T11:00:00Z" },
  { id: "notif-006", company_id: "comp-001", type: "warning", title: "Low stock — Running Shorts M", message: "Only 7 units remaining. Minimum stock level is 20.", is_read: true, created_at: "2026-05-23T09:00:00Z" },
];

export const DEMO_MONTHLY_DATA: MonthlyData[] = [
  { month: "Dec", sales: 1820000, purchases: 980000, expenses: 340000, profit: 500000 },
  { month: "Jan", sales: 2140000, purchases: 1150000, expenses: 380000, profit: 610000 },
  { month: "Feb", sales: 1980000, purchases: 1020000, expenses: 360000, profit: 600000 },
  { month: "Mar", sales: 2210000, purchases: 1180000, expenses: 390000, profit: 640000 },
  { month: "Apr", sales: 2380000, purchases: 1240000, expenses: 410000, profit: 730000 },
  { month: "May", sales: 2450000, purchases: 1350000, expenses: 420000, profit: 680000 },
];

export const DEMO_EXPENSE_BREAKDOWN: CategoryBreakdown[] = [
  { name: "Salary", value: 180000, color: "#4f46e5" },
  { name: "Rent", value: 45000, color: "#0891b2" },
  { name: "Marketing", value: 25000, color: "#d97706" },
  { name: "Electricity", value: 12800, color: "#059669" },
  { name: "Transport", value: 8400, color: "#7c3aed" },
  { name: "Maintenance", value: 6200, color: "#dc2626" },
  { name: "Other", value: 3200, color: "#94a3b8" },
];

export const DEMO_TOP_PRODUCTS: ProductStat[] = [
  { id: "prod-002", name: 'Samsung TV 43"', total_revenue: 280000, units_sold: 8, percentage: 85 },
  { id: "prod-001", name: "Nike Air Max 90", total_revenue: 320000, units_sold: 46, percentage: 72 },
  { id: "prod-003", name: "Jeans Classic Fit", total_revenue: 190000, units_sold: 146, percentage: 60 },
  { id: "prod-009", name: "Adidas Ultraboost", total_revenue: 142500, units_sold: 15, percentage: 50 },
  { id: "prod-005", name: "Laptop Stand Pro", total_revenue: 139930, units_sold: 70, percentage: 43 },
];

export const DEMO_KPIS: DashboardKPIs = {
  total_sales: 2450000,
  total_purchases: 1350000,
  total_expenses: 420000,
  net_profit: 680000,
  inventory_value: 1284330,
  sales_change: 18.4,
  purchases_change: 5.7,
  expenses_change: 8.3,
  profit_change: 12.1,
};

export const DEMO_TRANSACTIONS: Transaction[] = [
  { id: "txn-001", type: "sale", ref_id: "VK-2605-2847", description: "Nike Air Max 90 ×2", amount: 16517.64, operator_name: "Raj Kumar", created_at: "2026-05-26T14:30:00Z", payment_method: "upi" },
  { id: "txn-002", type: "expense", ref_id: "EXP-001", description: "Office rent — May 2026", amount: 45000, operator_name: "Arjun Mehta", created_at: "2026-05-24T09:00:00Z", payment_method: "bank_transfer" },
  { id: "txn-003", type: "purchase", ref_id: "SUP-4521", description: 'Samsung TV 43" ×5', amount: 120000, operator_name: "Raj Kumar", created_at: "2026-05-25T16:45:00Z", payment_method: "bank_transfer" },
  { id: "txn-004", type: "sale", ref_id: "VK-2605-2846", description: "Laptop Stand Pro ×3", amount: 6486.46, operator_name: "Raj Kumar", created_at: "2026-05-26T13:20:00Z", payment_method: "cash" },
  { id: "txn-005", type: "expense", ref_id: "EXP-003", description: "Staff salaries — May 2026", amount: 180000, operator_name: "Arjun Mehta", created_at: "2026-05-22T10:00:00Z", payment_method: "bank_transfer" },
  { id: "txn-006", type: "sale", ref_id: "VK-2505-2845", description: "Jeans Classic Fit ×6", amount: 9196.92, operator_name: "Raj Kumar", created_at: "2026-05-25T11:00:00Z", payment_method: "upi" },
  { id: "txn-007", type: "purchase", ref_id: "SUP-4489", description: "Nike Air Max 90 ×20", amount: 84000, operator_name: "Priya Shah", created_at: "2026-05-22T10:00:00Z", payment_method: "bank_transfer" },
  { id: "txn-008", type: "sale", ref_id: "VK-2505-2843", description: "Adidas Ultraboost ×1", amount: 11208.82, operator_name: "Priya Shah", created_at: "2026-05-24T15:20:00Z", payment_method: "cash" },
  { id: "txn-009", type: "expense", ref_id: "EXP-004", description: "Google Ads campaign", amount: 25000, operator_name: "Raj Kumar", created_at: "2026-05-20T15:00:00Z", payment_method: "card" },
  { id: "txn-010", type: "sale", ref_id: "VK-2405-2842", description: "Phone Case Premium ×10", amount: 4714.1, operator_name: "Raj Kumar", created_at: "2026-05-24T10:30:00Z", payment_method: "upi" },
];
