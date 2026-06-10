"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BarChart3, TrendingUp, DollarSign,
  PackageSearch, Bell, Boxes, Users, Building2, User,
  LogOut, X, ChevronDown, Activity, ShoppingCart,
  PieChart, Tag, HandCoins
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useUIStore } from "@/store/uiStore";
import { cn, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { getNotifications } from "@/lib/services/notifications";
import { useState, useEffect } from "react";
import type { Notification } from "@/lib/types";

type NavItem = {
  label: string;
  icon: any;
  href?: string;
  badge?: boolean;
  children?: { label: string; href: string; icon?: any }[];
};

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        label: "Reports",
        icon: BarChart3,
        children: [
          { label: "Revenue", href: "/admin/revenue", icon: TrendingUp },
          { label: "Sales Analytics", href: "/admin/analytics", icon: ShoppingCart },
          { label: "Profit & Loss", href: "/admin/profit-loss", icon: DollarSign },
          { label: "Purchase Reports", href: "/admin/reports", icon: PackageSearch },
          { label: "Inventory", href: "/admin/inventory-insights", icon: Boxes },
          { label: "Categories", href: "/admin/analytics/categories", icon: Tag },
          { label: "Team Performance", href: "/admin/analytics/operators", icon: Users },
        ],
      },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/admin/settings", icon: Building2, label: "Company Settings" },
      { href: "/admin/notifications", icon: Bell, label: "Notifications", badge: true },
      { href: "/admin/activity", icon: Activity, label: "Activity Log" },
      { href: "/admin/credit", icon: HandCoins, label: "Credit Khata" },
    ],
  },
];

async function handleSignOut() {
  await createClient().auth.signOut();
  window.location.assign("/login");
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { user: authUser } = useAuth();
  const company = useCompany();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Reports"]);

  useEffect(() => {
    if (!authUser?.company_id) return;
    getNotifications(authUser.company_id).then(setNotifications).catch(() => {});
  }, [authUser?.company_id]);

  useEffect(() => {
    const toExpand: string[] = [];
    navGroups.forEach((g) => {
      g.items.forEach((item) => {
        if (item.children?.some((c) => pathname.startsWith(c.href))) {
          toExpand.push(item.label);
        }
      });
    });
    if (toExpand.length) {
      setExpandedGroups((prev) => Array.from(new Set([...prev, ...toExpand])));
    }
  }, [pathname]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const isActive = (href?: string) =>
    href === "/admin" ? pathname === "/admin" : href ? pathname.startsWith(href) : false;

  const toggleGroup = (label: string) =>
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );

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
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-slate-100 flex-shrink-0">
          <Logo size="sm" logoUrl={company?.logo_url} companyName={company?.name} />
          <button
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 sidebar-scroll">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="px-3 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const isExpanded = expandedGroups.includes(item.label);
                  const childActive = item.children?.some((c) => pathname.startsWith(c.href));

                  if (item.children) {
                    return (
                      <div key={item.label}>
                        <button
                          onClick={() => toggleGroup(item.label)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                            childActive
                              ? "text-brand-700 bg-brand-50"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "w-4 h-4 flex-shrink-0",
                              childActive ? "text-brand-600" : "text-slate-400"
                            )}
                          />
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="ml-4 mt-0.5 pl-3 border-l-2 border-slate-100 space-y-0.5 pb-1">
                                {item.children.map((child) => {
                                  const cActive =
                                    child.href === "/admin/analytics"
                                      ? pathname === "/admin/analytics"
                                      : pathname.startsWith(child.href);
                                  return (
                                    <Link
                                      key={child.label}
                                      href={child.href}
                                      onClick={() => setSidebarOpen(false)}
                                      className={cn(
                                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                                        cActive
                                          ? "text-brand-700 bg-brand-50 font-semibold"
                                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                      )}
                                    >
                                      {child.icon && (
                                        <child.icon
                                          className={cn(
                                            "w-3.5 h-3.5 flex-shrink-0",
                                            cActive ? "text-brand-600" : "text-slate-400"
                                          )}
                                        />
                                      )}
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
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                        active
                          ? "bg-brand-600 text-white shadow-sm shadow-brand-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-4 h-4 flex-shrink-0",
                          active ? "text-white" : "text-slate-400"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && unreadCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
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

      <style jsx global>{`
        .sidebar-scroll::-webkit-scrollbar { width: 3px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </>
  );
}
