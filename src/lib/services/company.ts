import { createClient } from "@/lib/supabase/client";
import type { Company, AppUser } from "@/lib/types";

export async function getCompany(companyId: string): Promise<Company | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();
  if (error) return null;
  return data;
}

export async function getCompanyTeam(companyId: string): Promise<AppUser[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("created_at");
  if (error) return [];
  return (data ?? []) as AppUser[];
}
