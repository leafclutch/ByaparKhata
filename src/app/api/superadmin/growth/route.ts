import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/lib/supabase/superadmin-guard";

export async function GET(req: Request) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const supabase = createAdminClient();

  // Fetch the last 6 months of company/user/renewal data
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const since = sixMonthsAgo.toISOString();

  const [{ data: companiesData }, { data: usersData }, { data: renewalsData }] = await Promise.all([
    supabase.from("companies").select("created_at").gte("created_at", since),
    supabase.from("users").select("created_at").gte("created_at", since),
    supabase.from("subscription_renewals").select("created_at, amount").gte("created_at", since),
  ]);

  const months: Record<string, { month: string; new_companies: number; new_users: number; revenue: number }> = {};
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const getKey = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}`;
  };
  const getLabel = (iso: string) => MONTHS[new Date(iso).getMonth()];

  (companiesData ?? []).forEach((c: { created_at: string }) => {
    const k = getKey(c.created_at);
    if (!months[k]) months[k] = { month: getLabel(c.created_at), new_companies: 0, new_users: 0, revenue: 0 };
    months[k].new_companies += 1;
  });
  (usersData ?? []).forEach((u: { created_at: string }) => {
    const k = getKey(u.created_at);
    if (!months[k]) months[k] = { month: getLabel(u.created_at), new_companies: 0, new_users: 0, revenue: 0 };
    months[k].new_users += 1;
  });
  (renewalsData ?? []).forEach((r: { created_at: string; amount: number }) => {
    const k = getKey(r.created_at);
    if (!months[k]) months[k] = { month: getLabel(r.created_at), new_companies: 0, new_users: 0, revenue: 0 };
    months[k].revenue += Number(r.amount);
  });

  const result = Object.values(months).sort((a, b) => {
    const ai = MONTHS.indexOf(a.month);
    const bi = MONTHS.indexOf(b.month);
    return ai - bi;
  });

  return NextResponse.json(result);
}
