"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Package, Tag, Boxes, ShoppingCart,
  PackageSearch, DollarSign, FileText, History, X, LogOut, ChevronRight,
  List, PlusCircle, ChevronDown, User, Receipt, HandCoins
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useUIStore } from "@/store/uiStore";
import { cn, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useState, useEffect } from "react";

type NavItem = {
  label: string;
  icon: any;
  href?: string;
  children?: { label: string; href: string; icon?: any }[];
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Main",
    items: [
      { href: "/operator", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        label: "Inventory",
        icon: Boxes,
        children: [
          { label: "Products", href: "/operator/products", icon: Package },
          { label: "Categories", href: "/operator/categories", icon: Tag },
          { label: "Stock Movements", href: "/operator/inventory", icon: List },
        ],
      },
    ],
  },
  {
    label: "Transactions",
    items: [
      {
        label: "Sales",
        icon: ShoppingCart,
        children: [
          { label: "Sales List", href: "/operator/sales", icon: List },
          { label: "Create Sale", href: "/operator/sales/new", icon: PlusCircle },
        ],
      },
      {
        label: "Purchases",
        icon: PackageSearch,
        children: [
          { label: "Purchase List", href: "/operator/purchases", icon: List },
          { label: "Create Purchase", href: "/operator/purchases", icon: PlusCircle },
        ],
      },
      { href: "/operator/expenses", icon: DollarSign, label: "Expenses" },
      { href: "/operator/credit", icon: HandCoins, label: "Credit Khata" },
      { href: "/operator/transactions", icon: History, label: "My History" },
    ],
  },
];

async function handleSignOut() {
  await createClient().auth.signOut();
  window.location.assign("/login");
}

export function OperatorSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { user: authUser } = useAuth();
  const company = useCompany();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  useEffect(() => {
    const groupsToExpand: string[] = [];
    navGroups.forEach(g => {
      g.items.forEach(item => {
        if (item.children?.some(child => pathname.startsWith(child.href))) {
          groupsToExpand.push(item.label);
        }
      });
    });
    setExpandedGroups(prev => Array.from(new Set([...prev, ...groupsToExpand])));
  }, [pathname]);

  const isActive = (href?: string) =>
    href === "/operator" ? pathname === "/operator" : href ? pathname.startsWith(href) : false;

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

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
          "fixed left-0 top-0 bottom-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col",
          "transition-transform duration-250 ease-out lg:translate-x-0 lg:relative lg:z-auto",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-slate-100 flex-shrink-0">
          <Logo size="sm" logoUrl={company?.logo_url} companyName={company?.name} />
          <button
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-6 last:mb-2">
              <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const isExpanded = expandedGroups.includes(item.label);
                  const hasChildren = !!item.children;
                  const childActive = item.children?.some(c => pathname.startsWith(c.href));

                  if (hasChildren) {
                    return (
                      <div key={item.label} className="space-y-0.5">
                        <button
                          onClick={() => toggleGroup(item.label)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                            childActive ? "text-cyan-700 bg-cyan-50/50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <item.icon className={cn("w-4 h-4 shrink-0", childActive ? "text-cyan-600" : "text-slate-400")} />
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isExpanded && "rotate-180")} />
                        </button>
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-9 mt-1 space-y-1 border-l-2 border-slate-50 pl-2">
                                {item.children?.map((child) => {
                                  const cActive = pathname === child.href || (child.href !== "/operator/sales" && child.href !== "/operator/purchases" && pathname.startsWith(child.href));
                                  return (
                                    <Link
                                      key={child.label}
                                      href={child.href}
                                      onClick={() => setSidebarOpen(false)}
                                      className={cn(
                                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                                        cActive ? "text-cyan-700 bg-cyan-50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                      )}
                                    >
                                      {child.icon && <child.icon className="w-3.5 h-3.5" />}
                                      {child.label}
                                    </Link>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.label}
                      href={item.href!}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                        active ? "bg-cyan-600 text-white shadow-md shadow-cyan-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-white" : "text-slate-400")} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {getInitials(authUser?.full_name ?? "?")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{authUser?.full_name ?? "—"}</p>
              <p className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                <User className="w-2.5 h-2.5" />
                {authUser?.role ?? ""}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
