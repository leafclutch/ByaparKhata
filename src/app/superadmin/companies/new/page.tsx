"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCompany } from "@/superadmin/services";
import { toast } from "sonner";
import type { PlanType } from "@/lib/types";

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
}

export default function NewCompanyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", slug: "", address: "", contact_number: "", contact_email: "",
    gst_number: "", plan: "starter" as PlanType,
    joining_date: new Date().toISOString().split("T")[0],
    subscription_start: new Date().toISOString().split("T")[0],
    subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.slug) { toast.error("Name and slug are required."); return; }
    setSaving(true);
    try {
      const company = await createCompany(form);
      toast.success("Company created.");
      router.replace(`/superadmin/companies/${company.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create company.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/superadmin/companies">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs"><ArrowLeft className="w-3.5 h-3.5" /> Back</Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Company</h1>
          <p className="text-sm text-slate-500 mt-0.5">Register a new company on the platform</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-800">Company Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Company Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => { setField("name", e.target.value); setField("slug", toSlug(e.target.value)); }}
                placeholder="e.g. Nexus Retail Pvt. Ltd."
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input value={form.slug} onChange={(e) => setField("slug", e.target.value)} placeholder="nexusretail" required />
            </div>
            <div className="space-y-1.5">
              <Label>PAN/VAT Number</Label>
              <Input value={form.gst_number} onChange={(e) => setField("gst_number", e.target.value)} placeholder="e.g. 29ABCDE1234F1Z5" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="12, MG Road, Bengaluru" />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Number</Label>
              <Input value={form.contact_number} onChange={(e) => setField("contact_number", e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Email</Label>
              <Input type="email" value={form.contact_email} onChange={(e) => setField("contact_email", e.target.value)} placeholder="admin@company.in" />
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-800">Subscription</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Plan</Label>
              <Select value={form.plan} onValueChange={(v) => setField("plan", v as PlanType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["free", "starter", "pro", "enterprise"] as PlanType[]).map((p) => (
                    <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Joining Date</Label>
              <Input type="date" value={form.joining_date} onChange={(e) => setField("joining_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Subscription Start</Label>
              <Input type="date" value={form.subscription_start} onChange={(e) => setField("subscription_start", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Subscription End</Label>
              <Input type="date" value={form.subscription_end} onChange={(e) => setField("subscription_end", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? "Creating…" : "Create Company"}
          </Button>
        </div>
      </form>
    </div>
  );
}
