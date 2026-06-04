"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Info, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/useAuth";
import { getCompany, getCompanyTeam } from "@/lib/services/company";
import type { Company, AppUser } from "@/lib/types";

export default function SettingsPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [team, setTeam] = useState<AppUser[]>([]);

  useEffect(() => {
    if (!user) return;
    const cid = user.company_id;
    Promise.all([getCompany(cid), getCompanyTeam(cid)])
      .then(([c, t]) => { setCompany(c); setTeam(t); })
      .catch(() => {});
  }, [user]);

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

          <TabsContent value="company" className="m-0 p-6">
            <div className="max-w-lg space-y-4">
              {[
                { label: "Company Name", value: company?.name ?? "Loading…" },
                { label: "Slug", value: company?.slug ?? "—" },
                { label: "PAN/VAT Number", value: company?.pan_vat_number ?? "—" },
                { label: "Address", value: company?.address ?? "—" },
                { label: "Timezone", value: company?.timezone ?? "Asia/Kathmandu" },
              ].map((field) => (
                <div key={field.label} className="flex items-start gap-4 py-3 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-400 w-36 flex-shrink-0">{field.label}</span>
                  <span className="text-sm font-medium text-slate-800">{field.value}</span>
                </div>
              ))}
              <p className="text-xs text-slate-400 pt-2 flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Company details can only be updated by contacting support.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="team" className="m-0 p-6">
            <div className="space-y-3 max-w-lg">
              {team.length === 0 && <p className="text-sm text-slate-400">Loading team members…</p>}
              {team.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    member.role === "admin" ? "bg-brand-100 text-brand-700" : "bg-cyan-100 text-cyan-700"
                  }`}>
                    {member.full_name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{member.full_name}</p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                  <StatusBadge status={member.role} />
                  <StatusBadge status={member.is_active ? "active" : "inactive"} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="about" className="m-0 p-6">
            <div className="max-w-md">
              <div className="flex items-center gap-4 mb-6">
                <Logo size="lg" logoUrl={company?.logo_url} companyName={company?.name} />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex gap-4 py-2 border-b border-slate-50">
                  <span className="text-slate-400 w-32">Product</span>
                  <span className="font-medium text-slate-800">HamroHisab</span>
                </div>
                <div className="flex gap-4 py-2 border-b border-slate-50">
                  <span className="text-slate-400 w-32">Version</span>
                  <span className="font-medium text-slate-800">v1.0.0</span>
                </div>
                <div className="flex gap-4 py-2">
                  <span className="text-slate-400 w-32">Company</span>
                  <span className="font-medium text-slate-800">Leafclutch Technologies Pvt. Ltd.</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
