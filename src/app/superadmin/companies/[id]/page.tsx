"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  getCompanyById, updateCompany, setCompanyStatus, renewSubscription,
  getCompanyUsers, createUser, setUserStatus, resetUserPassword, deleteCompany,
} from "@/superadmin/services";
import { toast } from "sonner";
import { getDaysRemaining, formatNPRCompact } from "@/lib/utils";
import type { CompanyStat, SuperadminUser, CompanyStatus } from "@/lib/types";

type Tab = "overview" | "subscription" | "users";

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<CompanyStat | null>(null);
  const [users, setUsers] = useState<SuperadminUser[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);

  // Create user dialog
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ username: "", full_name: "", role: "operator" as "admin" | "operator", password: "" });
  const [userSaving, setUserSaving] = useState(false);

  // Reset password dialog
  const [resetPwUser, setResetPwUser] = useState<SuperadminUser | null>(null);
  const [newPw, setNewPw] = useState("");

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getCompanyById(id), getCompanyUsers(id)])
      .then(([c, u]) => { setCompany(c); setUsers(u); })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(status: CompanyStatus) {
    if (!company) return;
    try {
      await setCompanyStatus(company.id, status);
      setCompany((c) => c ? { ...c, company_status: status } : c);
      toast.success(`Company ${status}.`);
    } catch { toast.error("Failed to update status."); }
  }

  async function handleRenew(months: number) {
    if (!company) return;
    try {
      await renewSubscription(company.id, company.plan, months);
      const newEnd = new Date(company.subscription_end ?? new Date());
      newEnd.setMonth(newEnd.getMonth() + months);
      setCompany((c) => c ? { ...c, subscription_end: newEnd.toISOString().split("T")[0], company_status: "active" } : c);
      toast.success(`Subscription extended by ${months} months.`);
    } catch { toast.error("Failed to renew subscription."); }
  }

  async function handleCreateUser() {
    if (!company) return;
    if (!newUserForm.username || !newUserForm.full_name || !newUserForm.password) {
      toast.error("Username, full name and password are required.");
      return;
    }
    setUserSaving(true);
    try {
      const u = await createUser({
        company_id: company.id,
        company_slug: company.slug ?? company.id,
        ...newUserForm,
      });
      setUsers((prev) => [u, ...prev]);
      setNewUserOpen(false);
      setNewUserForm({ username: "", full_name: "", role: "operator", password: "" });
      toast.success("User created.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setUserSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!resetPwUser || !newPw) return;
    if (newPw.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    try {
      await resetUserPassword(resetPwUser.id, newPw);
      setResetPwUser(null);
      setNewPw("");
      toast.success("Password reset.");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to reset password."); }
  }

  async function handleDelete() {
    if (!company) return;
    try {
      await deleteCompany(company.id);
      toast.success("Company deleted.");
      router.replace("/superadmin/companies");
    } catch { toast.error("Failed to delete company."); }
  }

  if (loading) return <div className="text-sm text-slate-400 p-8">Loading…</div>;
  if (!company) return <div className="text-sm text-rose-500 p-8">Company not found.</div>;

  const daysLeft = getDaysRemaining(company.subscription_end);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/superadmin/companies">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs"><ArrowLeft className="w-3.5 h-3.5" /> Back</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{company.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{company.slug}</p>
        </div>
        <StatusBadge status={company.company_status} />
        <StatusBadge status={company.plan} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(["overview", "subscription", "users"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 grid grid-cols-2 gap-4">
            {[
              ["Name", company.name],
              ["Slug", company.slug],
              ["Address", company.address ?? "—"],
              ["PAN/VAT", company.pan_vat_number ?? "—"],
              ["Contact", company.contact_number ?? "—"],
              ["Email", company.contact_email ?? "—"],
              ["Users", String(company.users_count)],
              ["Products", String(company.products_count)],
              ["Total Sales", formatNPRCompact(company.total_sales_value)],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm text-slate-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Status actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-800 mb-4">Status Actions</p>
            <div className="flex flex-wrap gap-2">
              {company.company_status !== "active" && (
                <Button onClick={() => handleStatusChange("active")} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">Activate</Button>
              )}
              {company.company_status === "active" && (
                <Button onClick={() => handleStatusChange("paused")} variant="outline" className="h-8 text-xs text-amber-700 border-amber-200 hover:bg-amber-50">Pause</Button>
              )}
              {company.company_status !== "disabled" && (
                <Button onClick={() => handleStatusChange("disabled")} variant="outline" className="h-8 text-xs text-rose-700 border-rose-200 hover:bg-rose-50">Disable</Button>
              )}
              <Button onClick={() => setConfirmDelete(true)} variant="outline" className="h-8 text-xs text-rose-700 border-rose-200 hover:bg-rose-50 ml-auto">Delete Company</Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Subscription */}
      {tab === "subscription" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Plan", company.plan],
              ["Status", company.subscription_status ?? "—"],
              ["Start", company.subscription_start ?? "—"],
              ["End", company.subscription_end ?? "—"],
              ["Joining Date", company.joining_date ?? "—"],
              ["Days Remaining", daysLeft !== null ? (daysLeft >= 0 ? `${daysLeft} days` : "Expired") : "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm text-slate-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {company.subscription_start && company.subscription_end && (() => {
            const start = new Date(company.subscription_start).getTime();
            const end = new Date(company.subscription_end).getTime();
            const now = Date.now();
            const pct = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
            return (
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>{company.subscription_start}</span>
                  <span>{company.subscription_end}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })()}

          <div>
            <p className="text-sm font-semibold text-slate-800 mb-3">Renew / Extend</p>
            <div className="flex gap-2 flex-wrap">
              {[1, 3, 6, 12].map((m) => (
                <button key={m} onClick={() => handleRenew(m)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                  <RefreshCw className="w-3 h-3" /> +{m}m
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Users */}
      {tab === "users" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setNewUserOpen(true)} className="h-9 gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Add User
            </Button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["User", "Role", "Email", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.full_name}</td>
                    <td className="px-4 py-3"><StatusBadge status={u.role} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{u.email}</td>
                    <td className="px-4 py-3"><StatusBadge status={u.is_active ? "active" : "disabled"} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setResetPwUser(u); setNewPw(""); }} className="px-2.5 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">Reset PW</button>
                        <button
                          onClick={async () => {
                            await setUserStatus(u.id, !u.is_active);
                            setUsers((prev) => prev.map((p) => p.id === u.id ? { ...p, is_active: !p.is_active } : p));
                            toast.success(u.is_active ? "User disabled." : "User enabled.");
                          }}
                          className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${u.is_active ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                        >
                          {u.is_active ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No users yet</td></tr>}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Create user dialog */}
      <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new admin or operator account for this company.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={newUserForm.full_name} onChange={(e) => setNewUserForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Raj Kumar" />
            </div>
            <div className="space-y-1.5">
              <Label>Username *</Label>
              <div className="flex items-center gap-1">
                <Input value={newUserForm.username} onChange={(e) => setNewUserForm((f) => ({ ...f, username: e.target.value }))} placeholder="raj" className="flex-1" />
                <span className="text-xs text-slate-400 shrink-0">@{company.slug}.com</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={newUserForm.role} onValueChange={(v) => setNewUserForm((f) => ({ ...f, role: v as "admin" | "operator" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input type="password" value={newUserForm.password} onChange={(e) => setNewUserForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewUserOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={userSaving} className="bg-indigo-600 hover:bg-indigo-700">{userSaving ? "Creating…" : "Create User"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetPwUser} onOpenChange={() => setResetPwUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password — {resetPwUser?.full_name}</DialogTitle>
            <DialogDescription>Set a new password for this user. They will need to log in with the new password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>New Password</Label>
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwUser(null)}>Cancel</Button>
            <Button onClick={handleResetPassword} className="bg-indigo-600 hover:bg-indigo-700">Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{company.name}</strong> and all its data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
