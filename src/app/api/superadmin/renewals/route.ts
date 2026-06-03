import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/lib/supabase/superadmin-guard";

export async function GET(req: Request) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("subscription_renewals")
    .select("*, company:companies(name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const renewals = (data ?? []).map((r: Record<string, unknown> & { company?: { name: string } }) => ({
    id: r.id,
    company_id: r.company_id,
    company_name: (r.company as { name: string } | null)?.name ?? "",
    plan: r.plan,
    start_date: r.start_date,
    end_date: r.end_date,
    amount: r.amount,
    renewed_by: r.renewed_by,
    created_at: r.created_at,
  }));

  return NextResponse.json(renewals);
}
