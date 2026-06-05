"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/services/notifications";
import { useNotificationsStore } from "@/store/notificationsStore";
import { timeAgo, cn } from "@/lib/utils";

const typeConfig: Record<string, { icon: React.ElementType; bg: string; text: string; dot: string }> = {
  alert: { icon: AlertTriangle, bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  warning: { icon: AlertCircle, bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  info: { icon: Info, bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  success: { icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
};

// Fix #18: reads from shared store — no duplicate getNotifications call
export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, setNotifications } = useNotificationsStore();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAllRead() {
    if (!user) return;
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    try { await markAllNotificationsRead(user.company_id); } catch {}
  }

  async function markRead(id: string) {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try { await markNotificationRead(id); } catch {}
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
          <p className="text-sm text-slate-500 mt-0.5">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={markAllRead}>
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {notifications.map((notif, i) => {
            const cfg = typeConfig[notif.type];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => markRead(notif.id)}
                className={cn(
                  "flex gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-150",
                  notif.is_read
                    ? "bg-white border-slate-100 opacity-60 hover:opacity-80"
                    : `${cfg.bg} border-transparent hover:opacity-90`
                )}
              >
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", notif.is_read ? "bg-slate-100" : "bg-white/60")}>
                  <Icon className={cn("w-4 h-4", notif.is_read ? "text-slate-400" : cfg.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-semibold leading-tight", notif.is_read ? "text-slate-600" : "text-slate-900")}>
                      {notif.title}
                      {!notif.is_read && <span className={cn("inline-block w-1.5 h-1.5 rounded-full ml-1.5 mb-0.5", cfg.dot)} />}
                    </p>
                    <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(notif.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
