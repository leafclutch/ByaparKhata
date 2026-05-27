"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, CreditCard, Settings,
  LogOut, Shield,
} from "lucide-react";
import { useSuperadminAuth } from "@/superadmin/hooks/useSuperadminAuth";

const NAV = [
  {
    group: "Platform",
    items: [
      { href: "/superadmin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/superadmin/companies", label: "Companies", icon: Building2 },
      { href: "/superadmin/users", label: "Users", icon: Users },
      { href: "/superadmin/subscriptions", label: "Subscriptions", icon: CreditCard },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/superadmin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function SuperadminSidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useSuperadminAuth();

  return (
    <aside className="flex flex-col w-60 bg-slate-900 text-slate-100 shrink-0 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">VyaparKhata</p>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Super Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map(({ group, items }) => (
          <div key={group}>
            <p className="px-2 mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{group}</p>
            <ul className="space-y-0.5">
              {items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/superadmin/dashboard" && pathname.startsWith(href));
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Profile */}
      <div className="px-3 py-3 border-t border-slate-800">
        {profile && (
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {profile.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{profile.full_name}</p>
              <p className="text-[10px] text-slate-500 truncate">{profile.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={signOut}
          className="mt-1 w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
