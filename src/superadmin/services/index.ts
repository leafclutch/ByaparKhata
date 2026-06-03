import { IS_DEMO_MODE } from "@/lib/env";
import type {
  CompanyStat, SuperadminUser, PlatformKPIs,
  SubscriptionRenewal, CompanyGrowthPoint, SuperadminProfile,
  CompanyStatus,
} from "@/lib/types";
import {
  SA_COMPANIES, SA_ALL_USERS, SA_PLATFORM_KPIS,
  SA_RENEWALS, SA_GROWTH, SA_PROFILE,
} from "@/superadmin/lib/mock-data";

// ─── Companies ───────────────────────────────────────────────────────────────

export async function getCompanies(): Promise<CompanyStat[]> {
  if (IS_DEMO_MODE) return SA_COMPANIES;
  const res = await fetch("/api/superadmin/companies");
  if (!res.ok) throw new Error("Failed to fetch companies");
  return res.json();
}

export async function getCompanyById(id: string): Promise<CompanyStat> {
  if (IS_DEMO_MODE) {
    const company = SA_COMPANIES.find((c) => c.id === id);
    if (!company) throw new Error("Company not found");
    return company;
  }
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
  gst_number?: string;
  plan: CompanyStat["plan"];
  joining_date: string;
  subscription_start: string;
  subscription_end: string;
}

export async function createCompany(input: CreateCompanyInput): Promise<CompanyStat> {
  if (IS_DEMO_MODE) {
    const now = new Date().toISOString();
    return {
      id: `comp-${Date.now()}`,
      ...input,
      subscription_status: "active",
      company_status: "active",
      users_count: 0,
      products_count: 0,
      sales_count: 0,
      total_sales_value: 0,
      created_at: now,
    } as CompanyStat;
  }
  const res = await fetch("/api/superadmin/companies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateCompany(id: string, updates: Partial<CreateCompanyInput>): Promise<CompanyStat> {
  if (IS_DEMO_MODE) {
    const existing = SA_COMPANIES.find((c) => c.id === id) ?? SA_COMPANIES[0];
    return { ...existing, ...updates };
  }
  const res = await fetch(`/api/superadmin/companies/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function setCompanyStatus(id: string, status: CompanyStatus): Promise<void> {
  if (IS_DEMO_MODE) return;
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
  if (IS_DEMO_MODE) return;
  const res = await fetch(`/api/superadmin/companies/${id}/renew`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, months, from_date: fromDate }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function deleteCompany(id: string): Promise<void> {
  if (IS_DEMO_MODE) return;
  const res = await fetch(`/api/superadmin/companies/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getCompanyUsers(companyId: string): Promise<SuperadminUser[]> {
  if (IS_DEMO_MODE) return SA_ALL_USERS.filter((u) => u.company_id === companyId);
  const res = await fetch(`/api/superadmin/users?company_id=${companyId}`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function getAllUsers(): Promise<SuperadminUser[]> {
  if (IS_DEMO_MODE) return SA_ALL_USERS;
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
  if (IS_DEMO_MODE) {
    const company = SA_COMPANIES.find((c) => c.id === input.company_id);
    return {
      id: `user-${Date.now()}`,
      company_id: input.company_id,
      company_name: company?.name ?? "",
      full_name: input.full_name,
      role: input.role,
      email: `${input.username}@${input.company_slug}`,
      is_active: true,
      created_at: new Date().toISOString(),
    };
  }
  const res = await fetch("/api/superadmin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateUser(id: string, updates: { full_name?: string }): Promise<SuperadminUser> {
  if (IS_DEMO_MODE) {
    const existing = SA_ALL_USERS.find((u) => u.id === id) ?? SA_ALL_USERS[0];
    return { ...existing, ...updates };
  }
  const res = await fetch(`/api/superadmin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function setUserStatus(id: string, isActive: boolean): Promise<void> {
  if (IS_DEMO_MODE) return;
  const res = await fetch(`/api/superadmin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  if (IS_DEMO_MODE) return;
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
  if (IS_DEMO_MODE) return SA_PLATFORM_KPIS;
  const res = await fetch("/api/superadmin/stats");
  if (!res.ok) throw new Error("Failed to fetch KPIs");
  return res.json();
}

export async function getSubscriptionRenewals(): Promise<SubscriptionRenewal[]> {
  if (IS_DEMO_MODE) return SA_RENEWALS;
  const res = await fetch("/api/superadmin/renewals");
  if (!res.ok) throw new Error("Failed to fetch renewals");
  return res.json();
}

export async function getCompanyGrowth(): Promise<CompanyGrowthPoint[]> {
  if (IS_DEMO_MODE) return SA_GROWTH;
  const res = await fetch("/api/superadmin/growth");
  if (!res.ok) throw new Error("Failed to fetch growth data");
  return res.json();
}

// ─── SA Profile ───────────────────────────────────────────────────────────────

export async function getSAProfile(): Promise<SuperadminProfile> {
  if (IS_DEMO_MODE) return SA_PROFILE;
  const res = await fetch("/api/superadmin/profile");
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function updateSAProfile(updates: Partial<SuperadminProfile>): Promise<SuperadminProfile> {
  if (IS_DEMO_MODE) return { ...SA_PROFILE, ...updates };
  const res = await fetch("/api/superadmin/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
