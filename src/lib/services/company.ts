import { createClient } from "@/lib/supabase/client";
import type { Company, AppUser } from "@/lib/types";

// Fix #19: explicit column list instead of select("*")
export async function getCompany(companyId: string): Promise<Company | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug, logo_url, address, pan_vat_number, contact_number, contact_email, currency, timezone, joining_date, subscription_start, subscription_end, subscription_status, company_status, plan, created_at")
    .eq("id", companyId)
    .single();
  if (error) return null;
  return data;
}

export async function getCompanyTeam(companyId: string): Promise<AppUser[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, role, is_active, created_at, company_id")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("created_at");
  if (error) return [];
  return (data ?? []) as AppUser[];
}
