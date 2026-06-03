"use client";

import { useState, useEffect } from "react";
import { Bell, Menu } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DEMO_NOTIFICATIONS } from "@/lib/mock-data";
import { getNotifications } from "@/lib/services/notifications";
import { IS_DEMO_MODE } from "@/lib/env";
import { getInitials, timeAgo, cn } from "@/lib/utils";
import type { AppUser, Notification } from "@/lib/types";

interface TopbarProps {
  title: string;
  user: AppUser;
  actions?: React.ReactNode;
}

const notifColors: Record<string, string> = {
  alert: "bg-rose-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
  success: "bg-emerald-500",
};

export function Topbar({ title, user, actions }: TopbarProps) {
  const { toggleSidebar } = useUIStore();
  const [notifications, setNotifications] = useState<Notification[]>(IS_DEMO_MODE ? DEMO_NOTIFICATIONS : []);

  useEffect(() => {
    if (IS_DEMO_MODE || !user?.company_id) return;
    getNotifications(user.company_id).then(setNotifications).catch(() => {});
  }, [user?.company_id]);

  const unread = notifications.filter((n) => !n.is_read);

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-3 flex-shrink-0 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        onClick={toggleSidebar}
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="text-sm font-semibold text-slate-800 flex-1 truncate">{title}</h1>

      <div className="flex items-center gap-2 ml-auto">
        {actions}

        {/* Notification bell */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5" />
              {unread.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 shadow-xl rounded-xl border-slate-100">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-800">Notifications</span>
              {unread.length > 0 && (
                <span className="text-xs text-brand-600 font-medium cursor-pointer hover:underline">
                  Mark all read
                </span>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {notifications.slice(0, 6).map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors",
                    !n.is_read && "bg-brand-50/30"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", notifColors[n.type] ?? "bg-slate-400")} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium text-slate-800 leading-snug", n.is_read && "text-slate-600")}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-100">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
            {getInitials(user.full_name)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-800 leading-tight">{user.full_name}</p>
            <p className="text-xs text-slate-400 capitalize">{user.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
