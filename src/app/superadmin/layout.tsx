"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SuperadminSidebar } from "@/superadmin/components/SuperadminSidebar";

export default function SuperadminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/superadmin/login") return <>{children}</>;
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <SuperadminSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
