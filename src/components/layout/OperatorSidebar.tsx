"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Package, Tag, Boxes, ShoppingCart,
  PackageSearch, DollarSign, FileText, History, X, LogOut, ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useUIStore } from "@/store/uiStore";
import { cn, getInitials } from "@/lib/utils";
import { DEMO_OPERATOR, DEMO_COMPANY } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { IS_DEMO_MODE } from "@/lib/env";

const navItems = [
  { href: "/operator", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/operator/products", icon: Package, label: "Products" },
  { href: "/operator/categories", icon: Tag, label: "Categories" },
  { href: "/operator/inventory", icon: Boxes, label: "Inventory" },
  { href: "/operator/sales", icon: ShoppingCart, label: "Sales" },
  { href: "/operator/purchases", icon: PackageSearch, label: "Purchases" },
  { href: "/operator/expenses", icon: DollarSign, label: "Expenses" },
  { href: "/operator/billing", icon: FileText, label: "Billing" },
  { href: "/operator/transactions", icon: History, label: "Transactions" },
];

async function handleSignOut() {
  if (!IS_DEMO_MODE) await createClient().auth.signOut();
  window.location.assign("/login");
}

export function OperatorSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const isActive = (href: string) =>
    href === "/operator" ? pathname === "/operator" : pathname.startsWith(href);

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 w-56 bg-white border-r border-slate-100 flex flex-col",
          "transition-transform duration-250 ease-out lg:translate-x-0 lg:relative lg:z-auto",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <Logo size="sm" />
          <button
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-2.5 border-b border-slate-50">
          <p className="text-xs font-medium text-slate-400 truncate">{DEMO_COMPANY.name}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Operations
          </p>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all duration-150",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-brand-600" : "text-slate-400")} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-brand-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer mb-1">
            <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {getInitials(DEMO_OPERATOR.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{DEMO_OPERATOR.full_name}</p>
              <p className="text-xs text-slate-400">Operator</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
