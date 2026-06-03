import { createClient } from "@/lib/supabase/client";
import type { Company, AppUser } from "@/lib/types";
import { IS_DEMO_MODE } from "@/lib/env";
import { DEMO_COMPANY, DEMO_ADMIN, DEMO_OPERATOR, DEMO_OPERATOR_2 } from "@/lib/mock-data";

export async function getCompany(companyId: string): Promise<Company | null> {
  if (IS_DEMO_MODE) return DEMO_COMPANY;
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
  if (IS_DEMO_MODE) return [DEMO_ADMIN, DEMO_OPERATOR, DEMO_OPERATOR_2];
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
