// ─── Core roles ─────────────────────────────────────────────────────────────
export type UserRole = "admin" | "operator" | "superadmin";

// ─── Company ─────────────────────────────────────────────────────────────────
export type CompanyStatus = "active" | "paused" | "disabled" | "expired";
export type SubscriptionStatus = "active" | "trial" | "paused" | "expired";
export type PlanType = "free" | "starter" | "pro" | "enterprise";

export interface Company {
  id: string;
  name: string;
  slug?: string;
  logo_url?: string;
  address?: string;
  pan_vat_number?: string;
  contact_number?: string;
  contact_email?: string;
  currency: string;
  timezone: string;
  joining_date?: string;
  subscription_start?: string;
  subscription_end?: string;
  subscription_status?: SubscriptionStatus;
  company_status?: CompanyStatus;
  plan?: PlanType;
  created_at: string;
}

// ─── App user (company-scoped) ───────────────────────────────────────────────
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

// ─── Category ────────────────────────────────────────────────────────────────
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

// ─── Product ─────────────────────────────────────────────────────────────────
export type StockStatus = "ok" | "low" | "out";
export type ExpiryStatus = "expired" | "expiring" | "ok";

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
  manufacture_date?: string;
  expiration_date?: string;
  expiry_notification_days?: number;
  created_at: string;
  updated_at: string;
}

// ─── Sales ────────────────────────────────────────────────────────────────────
export interface Sale {
  id: string;
  company_id: string;
  operator_id: string;
  operator?: AppUser;
  invoice_number: string;
  customer_name?: string;
  subtotal: number;
  discount: number;
  grand_total: number;
  payment_method: PaymentMethod;
  cash_amount?: number;
  online_amount?: number;
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

// ─── Purchases / Expenses ────────────────────────────────────────────────────
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
  cash_amount?: number;
  online_amount?: number;
  notes?: string;
  purchased_at: string;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  phone?: string;
  current_balance: number;
  created_at: string;
  updated_at: string;
}

export type CreditTransactionType = "issue" | "payment";

export interface CreditTransaction {
  id: string;
  customer_id: string;
  company_id: string;
  type: CreditTransactionType;
  amount: number;
  notes?: string;
  created_at: string;
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

// ─── Invoice / Notification ───────────────────────────────────────────────────
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

// ─── Enums ───────────────────────────────────────────────────────────────────
export type PaymentMethod = "cash" | "online" | "mixed";
export type ExpenseCategory =
  | "rent" | "salary" | "electricity" | "transport"
  | "marketing" | "maintenance" | "other";

// ─── Analytics / KPIs ────────────────────────────────────────────────────────
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
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  top_category?: string;
  low_stock_products: Array<{ id: string; name: string; quantity: number; min_stock: number }>;
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

// ─── Superadmin ───────────────────────────────────────────────────────────────
export interface SuperadminProfile {
  id: string;
  full_name: string;
  email: string;
  contact_number?: string;
  avatar_url?: string;
  created_at: string;
}

export interface CompanyStat {
  id: string;
  name: string;
  slug?: string;
  address?: string;
  contact_number?: string;
  contact_email?: string;
  logo_url?: string;
  pan_vat_number?: string;
  joining_date?: string;
  subscription_start?: string;
  subscription_end?: string;
  subscription_status: SubscriptionStatus;
  company_status: CompanyStatus;
  plan: PlanType;
  users_count: number;
  products_count: number;
  sales_count: number;
  total_sales_value: number;
  created_at: string;
}

export type InventoryTransactionReferenceType = "purchase" | "sale" | "return" | "adjustment";

export interface InventoryTransaction {
  id: string;
  company_id: string;
  product_id: string;
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  reference_type: InventoryTransactionReferenceType;
  reference_id?: string;
  user_id?: string;
  notes?: string;
  created_at: string;
}

export interface SuperadminUser {
  id: string;
  company_id: string;
  company_name: string;
  full_name: string;
  role: UserRole;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface PlatformKPIs {
  total_companies: number;
  active_companies: number;
  expired_companies: number;
  total_users: number;
  active_users: number;
  total_revenue: number;
  monthly_revenue: number;
  expiring_soon: number;
}

export interface SubscriptionRenewal {
  id: string;
  company_id: string;
  company_name: string;
  company_logo?: string;
  plan: PlanType;
  start_date: string;
  end_date: string;
  amount: number;
  renewed_by: string;
  created_at: string;
}

export interface CompanyGrowthPoint {
  month: string;
  new_companies: number;
  new_users: number;
  revenue: number;
}

// ─── Activity / Audit ─────────────────────────────────────────────────────────
export type ActivityAction = "create" | "update" | "delete" | "adjustment";
export type ActivityEntityType = "sale" | "purchase" | "product" | "expense" | "category" | "customer" | "credit_transaction";

export interface Actor {
  id: string;
  name: string;
  role: string;
}

export interface ActivityLog {
  id: string;
  company_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_id: string;
  entity_label?: string;
  created_at: string;
}

export interface OperatorActivity {
  user_id: string;
  user_name: string;
  role: string;
  sales_count: number;
  total_sales_value: number;
  purchases_count: number;
  total_actions: number;
  last_active: string | null;
}
