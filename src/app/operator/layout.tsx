"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { OperatorSidebar } from "@/components/layout/OperatorSidebar";
import { AuthenticatedTopbar } from "@/components/layout/AuthenticatedTopbar";

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-[#f8f9fc] overflow-hidden">
        <OperatorSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AuthenticatedTopbar title="HamroHisab" />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
