import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import type { StockStatus, Product } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return formatINR(amount);
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
  return `VK-${year}${month}-${random}`;
}

export function calculateCartTotal(
  items: Array<{ quantity: number; unit_price: number; discount: number }>,
  orderDiscount = 0,
  taxRate = 18
) {
  const subtotal = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unit_price - item.discount;
    return sum + lineTotal;
  }, 0);
  const totalDiscount = items.reduce((s, i) => s + i.discount, 0) + orderDiscount;
  const taxableAmount = subtotal - orderDiscount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const grandTotal = taxableAmount + taxAmount;
  return { subtotal, totalDiscount, taxAmount, grandTotal };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI / QR",
  card: "Card",
  bank_transfer: "Bank Transfer",
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
