"use client";

import { motion } from "framer-motion";
import { Building2, Users, Shield, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Logo } from "@/components/brand/Logo";
import { DEMO_COMPANY, DEMO_ADMIN, DEMO_OPERATOR, DEMO_OPERATOR_2 } from "@/lib/mock-data";

const users = [DEMO_ADMIN, DEMO_OPERATOR, DEMO_OPERATOR_2];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Company info, team members, and platform details</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <Tabs defaultValue="company">
          <div className="border-b border-slate-100 px-4 pt-3">
            <TabsList className="bg-transparent gap-1 h-auto pb-0">
              {[
                { value: "company", label: "Company", icon: Building2 },
                { value: "team", label: "Team", icon: Users },
                { value: "security", label: "Security", icon: Shield },
                { value: "about", label: "About", icon: Info },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-1.5 text-sm px-4 py-2 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700 data-[state=active]:shadow-none rounded-t-lg"
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Company tab */}
          <TabsContent value="company" className="m-0 p-6">
            <div className="max-w-lg space-y-4">
              {[
                { label: "Company Name", value: DEMO_COMPANY.name },
                { label: "Slug", value: DEMO_COMPANY.slug },
                { label: "GST Number", value: DEMO_COMPANY.gst_number ?? "—" },
                { label: "Address", value: DEMO_COMPANY.address ?? "—" },
                { label: "Currency", value: DEMO_COMPANY.currency },
                { label: "Timezone", value: DEMO_COMPANY.timezone },
              ].map((field) => (
                <div key={field.label} className="flex items-start gap-4 py-3 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-400 w-36 flex-shrink-0">{field.label}</span>
                  <span className="text-sm font-medium text-slate-800">{field.value}</span>
                </div>
              ))}
              <p className="text-xs text-slate-400 pt-2 flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Company details can only be updated by contacting support.
              </p>
            </div>
          </TabsContent>

          {/* Team tab */}
          <TabsContent value="team" className="m-0 p-6">
            <div className="space-y-3 max-w-lg">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    user.role === "admin" ? "bg-brand-100 text-brand-700" : "bg-cyan-100 text-cyan-700"
                  }`}>
                    {user.full_name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{user.full_name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <StatusBadge status={user.role} />
                  <StatusBadge status={user.is_active ? "active" : "inactive"} />
                </div>
              ))}
              <p className="text-xs text-slate-400 pt-2">
                Team management (invite, deactivate) is available in the full production version with Supabase auth.
              </p>
            </div>
          </TabsContent>

          {/* Security tab */}
          <TabsContent value="security" className="m-0 p-6">
            <div className="max-w-lg space-y-3">
              {[
                { label: "Authentication", value: "Email / Password", note: "Supabase Auth" },
                { label: "Row-Level Security", value: "Enabled", note: "All tables isolated by company_id" },
                { label: "Role-Based Access", value: "Admin + Operator", note: "Enforced via middleware" },
                { label: "Session Management", value: "JWT + Cookie", note: "Supabase SSR session refresh" },
                { label: "Service Role Key", value: "Server-only", note: "Never exposed to client" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4 py-3 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-400 w-44 flex-shrink-0">{item.label}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.value}</p>
                    <p className="text-xs text-slate-400">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* About tab */}
          <TabsContent value="about" className="m-0 p-6">
            <div className="max-w-md">
              <div className="flex items-center gap-4 mb-6">
                <Logo size="lg" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex gap-4 py-2 border-b border-slate-50">
                  <span className="text-slate-400 w-32">Product</span>
                  <span className="font-medium text-slate-800">VyaparKhata</span>
                </div>
                <div className="flex gap-4 py-2 border-b border-slate-50">
                  <span className="text-slate-400 w-32">Version</span>
                  <span className="font-medium text-slate-800">v1.0.0</span>
                </div>
                <div className="flex gap-4 py-2 border-b border-slate-50">
                  <span className="text-slate-400 w-32">Company</span>
                  <span className="font-medium text-slate-800">Leafclutch Technologies Pvt. Ltd.</span>
                </div>
                <div className="flex gap-4 py-2 border-b border-slate-50">
                  <span className="text-slate-400 w-32">Stack</span>
                  <span className="font-medium text-slate-800">Next.js 16 · Supabase · Vercel</span>
                </div>
                <div className="flex gap-4 py-2">
                  <span className="text-slate-400 w-32">License</span>
                  <span className="font-medium text-slate-800">© 2026 Leafclutch Technologies</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
