import { OperatorSidebar } from "@/components/layout/OperatorSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { DEMO_OPERATOR } from "@/lib/mock-data";

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <OperatorSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title="VyaparKhata" user={DEMO_OPERATOR} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
