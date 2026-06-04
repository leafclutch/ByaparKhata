import type {
  CompanyStat, SuperadminUser, PlatformKPIs,
  SubscriptionRenewal, CompanyGrowthPoint, SuperadminProfile,
  CompanyStatus,
} from "@/lib/types";

// ─── Companies ───────────────────────────────────────────────────────────────

export async function getCompanies(): Promise<CompanyStat[]> {
  const res = await fetch("/api/superadmin/companies");
  if (!res.ok) throw new Error("Failed to fetch companies");
  return res.json();
}

export async function getCompanyById(id: string): Promise<CompanyStat> {
  const res = await fetch(`/api/superadmin/companies/${id}`);
  if (!res.ok) throw new Error("Failed to fetch company");
  return res.json();
}

export interface CreateCompanyInput {
  name: string;
  slug: string;
  address?: string;
  contact_number?: string;
  contact_email?: string;
  pan_vat_number?: string;
  logo_url?: string;
  plan: CompanyStat["plan"];
  joining_date: string;
  subscription_start: string;
  subscription_end: string;
}

export async function uploadCompanyLogo(slug: string, file: File): Promise<string> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const fileExt = file.name.split(".").pop();
  const filePath = `${slug}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("company-logos")
    .upload(filePath, file);
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("company-logos").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function createCompany(input: CreateCompanyInput): Promise<CompanyStat> {
  const res = await fetch("/api/superadmin/companies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateCompany(id: string, updates: Partial<CreateCompanyInput>): Promise<CompanyStat> {
  const res = await fetch(`/api/superadmin/companies/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function setCompanyStatus(id: string, status: CompanyStatus): Promise<void> {
  const res = await fetch(`/api/superadmin/companies/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company_status: status }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function renewSubscription(
  id: string,
  plan: CompanyStat["plan"],
  months: number,
  fromDate?: string
): Promise<void> {
  const res = await fetch(`/api/superadmin/companies/${id}/renew`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, months, from_date: fromDate }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function deleteCompany(id: string): Promise<void> {
  const res = await fetch(`/api/superadmin/companies/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getCompanyUsers(companyId: string): Promise<SuperadminUser[]> {
  const res = await fetch(`/api/superadmin/users?company_id=${companyId}`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function getAllUsers(): Promise<SuperadminUser[]> {
  const res = await fetch("/api/superadmin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export interface CreateUserInput {
  company_id: string;
  company_slug: string;
  username: string;
  full_name: string;
  role: "admin" | "operator";
  password: string;
}

export async function createUser(input: CreateUserInput): Promise<SuperadminUser> {
  const res = await fetch("/api/superadmin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateUser(id: string, updates: { full_name?: string }): Promise<SuperadminUser> {
  const res = await fetch(`/api/superadmin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function setUserStatus(id: string, isActive: boolean): Promise<void> {
  const res = await fetch(`/api/superadmin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  const res = await fetch(`/api/superadmin/users/${userId}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: newPassword }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error ?? "Unknown error");
  }
}

// ─── Platform stats ───────────────────────────────────────────────────────────

export async function getPlatformKPIs(): Promise<PlatformKPIs> {
  const res = await fetch("/api/superadmin/stats");
  if (!res.ok) throw new Error("Failed to fetch KPIs");
  return res.json();
}

export async function getSubscriptionRenewals(): Promise<SubscriptionRenewal[]> {
  const res = await fetch("/api/superadmin/renewals");
  if (!res.ok) throw new Error("Failed to fetch renewals");
  return res.json();
}

export async function getCompanyGrowth(): Promise<CompanyGrowthPoint[]> {
  const res = await fetch("/api/superadmin/growth");
  if (!res.ok) throw new Error("Failed to fetch growth data");
  return res.json();
}

// ─── SA Profile ───────────────────────────────────────────────────────────────

export async function getSAProfile(): Promise<SuperadminProfile> {
  const res = await fetch("/api/superadmin/profile");
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function updateSAProfile(updates: Partial<SuperadminProfile>): Promise<SuperadminProfile> {
  const res = await fetch("/api/superadmin/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
