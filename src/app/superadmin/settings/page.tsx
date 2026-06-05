"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSuperadminAuth } from "@/superadmin/hooks/useSuperadminAuth";
import { updateSAProfile } from "@/superadmin/services";
import { toast } from "sonner";
import type { SuperadminProfile } from "@/lib/types";

export default function SASettingsPage() {
  const { profile } = useSuperadminAuth();
  const [form, setForm] = useState({ full_name: "", contact_number: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name, contact_number: profile.contact_number ?? "" });
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSAProfile(form as Partial<SuperadminProfile>);
      toast.success("Profile updated.");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your super admin profile</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        {/* Avatar */}
        {profile && (
          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-50">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
              {profile.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{profile.full_name}</p>
              <p className="text-sm text-slate-500">{profile.email}</p>
              <p className="text-xs text-slate-400 mt-0.5">Super Administrator</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <p className="text-sm font-semibold text-slate-800">Edit Profile</p>
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Roshan Singh" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={profile?.email ?? ""} disabled className="bg-slate-50 text-slate-400 cursor-not-allowed" />
          </div>
          <div className="space-y-1.5">
            <Label>Contact Number</Label>
            <Input value={form.contact_number} onChange={(e) => setForm((f) => ({ ...f, contact_number: e.target.value }))} placeholder="+977 98XXXXXXXX" />
          </div>
          <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
