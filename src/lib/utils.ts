import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import type { StockStatus, Product, ExpiryStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNPR(amount: number): string {
  return "Rs. " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

export function formatNPRCompact(amount: number): string {
  if (amount >= 10000000) return `Rs. ${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `Rs. ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `Rs. ${(amount / 1000).toFixed(1)}K`;
  return formatNPR(amount);
}

export function formatDate(dateStr: string, fmt = "dd MMM yyyy"): string {
  try {
    return format(new Date(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd MMM yyyy, hh:mm a");
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function getStockStatus(quantityOrProduct: Product | number, minStock?: number): StockStatus {
  const qty = typeof quantityOrProduct === "number" ? quantityOrProduct : quantityOrProduct.quantity;
  const min = typeof quantityOrProduct === "number" ? (minStock ?? 0) : quantityOrProduct.min_stock;
  if (qty === 0) return "out";
  if (qty <= min) return "low";
  return "ok";
}

export function getExpiryStatus(expirationDate?: string | null, notifyDays = 30): ExpiryStatus | null {
  if (!expirationDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expirationDate);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.round((expiry.getTime() - today.getTime()) / 864e5);
  if (diffDays < 0) return "expired";
  if (diffDays <= notifyDays) return "expiring";
  return "ok";
}

export function getDaysRemaining(endDate?: string | null): number | null {
  if (!endDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 864e5);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `HH-${year}${month}-${random}`;
}

export function calculateCartTotal(
  items: Array<{ quantity: number; unit_price: number; discount: number }>,
  orderDiscount = 0
) {
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unit_price - item.discount;
    return sum + lineTotal;
  }, 0);
  const totalDiscount = items.reduce((s, i) => s + i.discount, 0) + orderDiscount;
  const grandTotal = Math.max(0, subtotal - orderDiscount);
  return { subtotal, totalDiscount, grandTotal };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type DatePeriod = "today" | "yesterday" | "7days" | "30days" | "month" | "all" | "custom";

export function getDateRange(period: DatePeriod, customFrom?: string, customTo?: string): { from: string; to: string } {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  switch (period) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const d = new Date(now); d.setDate(d.getDate() - 1);
      const y = d.toISOString().split("T")[0];
      return { from: y, to: y };
    }
    case "7days": {
      const d = new Date(now); d.setDate(d.getDate() - 6);
      return { from: d.toISOString().split("T")[0], to: today };
    }
    case "30days": {
      const d = new Date(now); d.setDate(d.getDate() - 29);
      return { from: d.toISOString().split("T")[0], to: today };
    }
    case "month": {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: d.toISOString().split("T")[0], to: today };
    }
    case "custom":
      return { from: customFrom ?? "", to: customTo ?? "" };
    default:
      return { from: "", to: "" };
  }
}

export function downloadCSV(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = rows.map((r) =>
    headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const csv = "﻿" + [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  online: "Online",
  mixed: "Cash + Online",
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  rent: "Rent",
  salary: "Salary",
  electricity: "Electricity",
  transport: "Transport",
  marketing: "Marketing",
  maintenance: "Maintenance",
  other: "Other",
};

export const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

export const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 4999,
  pro: 9999,
  enterprise: 24999,
};
