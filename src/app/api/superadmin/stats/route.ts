import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/lib/supabase/superadmin-guard";

export async function GET(req: Request) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const supabase = createAdminClient();

  const [{ count: total }, { count: active }, { count: expired }, { count: users }, { count: activeUsers }] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("company_status", "active"),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("company_status", "expired"),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const { count: expiringSoon } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .gte("subscription_end", today)
    .lte("subscription_end", in30);

  const { data: revData } = await supabase.from("subscription_renewals").select("amount");
  const totalRevenue = (revData ?? []).reduce((s: number, r: { amount: number }) => s + Number(r.amount), 0);

  const thisMonth = new Date(); thisMonth.setDate(1);
  const { data: monthRevData } = await supabase.from("subscription_renewals").select("amount").gte("created_at", thisMonth.toISOString());
  const monthlyRevenue = (monthRevData ?? []).reduce((s: number, r: { amount: number }) => s + Number(r.amount), 0);

  return NextResponse.json({
    total_companies: total ?? 0,
    active_companies: active ?? 0,
    expired_companies: expired ?? 0,
    total_users: users ?? 0,
    active_users: activeUsers ?? 0,
    total_revenue: totalRevenue,
    monthly_revenue: monthlyRevenue,
    expiring_soon: expiringSoon ?? 0,
  });
}
