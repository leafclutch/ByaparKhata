export type UserRole = "admin" | "operator";

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  address?: string;
  gst_number?: string;
  currency: string;
  timezone: string;
  created_at: string;
}

export interface AppUser {
  id: string;
  company_id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  email: string;
  created_at: string;
}

export interface Category {
  id: string;
  company_id: string;
  name: string;
  parent_id?: string;
  slug?: string;
  level?: number;
  color?: string;
  children?: Category[];
}

export type StockStatus = "ok" | "low" | "out";

export interface Product {
  id: string;
  company_id: string;
  category_id?: string;
  category?: Category;
  name: string;
  sku: string;
  barcode?: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  company_id: string;
  operator_id: string;
  operator?: AppUser;
  invoice_number: string;
  customer_name?: string;
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  grand_total: number;
  payment_method: PaymentMethod;
  notes?: string;
  created_at: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
}

export interface Purchase {
  id: string;
  company_id: string;
  operator_id: string;
  operator?: AppUser;
  supplier_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  invoice_number?: string;
  payment_method: PaymentMethod;
  notes?: string;
  purchased_at: string;
}

export interface Expense {
  id: string;
  company_id: string;
  operator_id: string;
  operator?: AppUser;
  category: ExpenseCategory;
  description: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_note?: string;
  expense_date: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  sale_id: string;
  sale?: Sale;
  invoice_number: string;
  pdf_url?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  company_id: string;
  type: "alert" | "info" | "warning" | "success";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer";
export type ExpenseCategory =
  | "rent"
  | "salary"
  | "electricity"
  | "transport"
  | "marketing"
  | "maintenance"
  | "other";

export interface DashboardKPIs {
  total_sales: number;
  total_purchases: number;
  total_expenses: number;
  net_profit: number;
  inventory_value: number;
  sales_change: number;
  purchases_change: number;
  expenses_change: number;
  profit_change: number;
}

export interface MonthlyData {
  month: string;
  sales: number;
  purchases: number;
  expenses: number;
  profit: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
  color: string;
}

export interface ProductStat {
  id: string;
  name: string;
  total_revenue: number;
  units_sold: number;
  percentage: number;
}

export interface OperatorStat {
  operator: AppUser;
  sales_count: number;
  total_revenue: number;
  last_active: string;
}

export type TransactionType = "sale" | "purchase" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  ref_id: string;
  description: string;
  amount: number;
  operator_name: string;
  created_at: string;
  payment_method?: PaymentMethod;
}
