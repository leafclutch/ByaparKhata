"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AuthenticatedTopbar } from "@/components/layout/AuthenticatedTopbar";
import { useNotificationsStore } from "@/store/notificationsStore";

// Fix #18: notifications state lives in the store — layout and notifications page share one fetch
function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { notifications, fetch } = useNotificationsStore();

  useEffect(() => {
    if (!user?.company_id) return;
    fetch(user.company_id);
  }, [user?.company_id, fetch]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex h-screen bg-[#f8f9fc] overflow-hidden">
      <AdminSidebar unreadCount={unreadCount} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AuthenticatedTopbar title="HamroHisab" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
