"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BarChart3, TrendingUp, DollarSign,
  ArrowLeftRight, PackageSearch, Settings, X, LogOut, ChevronRight, Bell,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useUIStore } from "@/store/uiStore";
import { cn, getInitials } from "@/lib/utils";
import { DEMO_ADMIN, DEMO_COMPANY, DEMO_NOTIFICATIONS } from "@/lib/mock-data";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    ],
  },
  {
    label: "Financial",
    items: [
      { href: "/admin/reports", icon: TrendingUp, label: "Reports" },
      { href: "/admin/revenue", icon: DollarSign, label: "Revenue" },
      { href: "/admin/profit-loss", icon: ArrowLeftRight, label: "Profit & Loss" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { href: "/admin/inventory-insights", icon: PackageSearch, label: "Inventory Insights" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/admin/notifications", icon: Bell, label: "Notifications", badge: true },
      { href: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const unreadCount = DEMO_NOTIFICATIONS.filter((n) => !n.is_read).length;

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

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
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-2.5 border-b border-slate-50">
          <p className="text-xs font-medium text-slate-400 truncate">{DEMO_COMPANY.name}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
                {group.label}
              </p>
              {group.items.map((item) => {
                const active = isActive(item.href);
                const badgeCount = "badge" in item && item.badge ? unreadCount : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-all duration-150",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-brand-600" : "text-slate-400")} />
                    <span className="flex-1">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className="w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {badgeCount}
                      </span>
                    )}
                    {active && <ChevronRight className="w-3.5 h-3.5 text-brand-400" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer mb-1">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {getInitials(DEMO_ADMIN.full_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{DEMO_ADMIN.full_name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{DEMO_ADMIN.role}</p>
            </div>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </Link>
        </div>
      </aside>
    </>
  );
}
