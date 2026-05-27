import { cn } from "@/lib/utils";
import type { StockStatus, TransactionType } from "@/lib/types";

type BadgeVariant =
  | StockStatus
  | TransactionType
  | "approved"
  | "pending"
  | "admin"
  | "operator"
  | "active"
  | "inactive"
  | "cash"
  | "upi"
  | "card"
  | "bank_transfer"
  | "alert"
  | "info"
  | "warning"
  | "success"
  | "rent"
  | "salary"
  | "electricity"
  | "transport"
  | "marketing"
  | "maintenance"
  | "other";

const variantStyles: Record<BadgeVariant, string> = {
  ok: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  low: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  out: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  sale: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  purchase: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  expense: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  admin: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  operator: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  inactive: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  cash: "bg-slate-50 text-slate-700 ring-1 ring-slate-200",
  upi: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  card: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  bank_transfer: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
  alert: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  info: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  rent: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  salary: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  electricity: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
  transport: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  marketing: "bg-pink-50 text-pink-700 ring-1 ring-pink-200",
  maintenance: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  other: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

const variantLabels: Record<BadgeVariant, string> = {
  ok: "In Stock",
  low: "Low Stock",
  out: "Out of Stock",
  sale: "Sale",
  purchase: "Purchase",
  expense: "Expense",
  approved: "Approved",
  pending: "Pending",
  admin: "Admin",
  operator: "Operator",
  active: "Active",
  inactive: "Inactive",
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank_transfer: "Bank Transfer",
  alert: "Alert",
  info: "Info",
  warning: "Warning",
  success: "Success",
  rent: "Rent",
  salary: "Salary",
  electricity: "Electricity",
  transport: "Transport",
  marketing: "Marketing",
  maintenance: "Maintenance",
  other: "Other",
};

interface StatusBadgeProps {
  status: BadgeVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        variantStyles[status] ?? "bg-slate-100 text-slate-600",
        className
      )}
    >
      {label ?? variantLabels[status] ?? status}
    </span>
  );
}
