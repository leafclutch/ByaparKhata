import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/lib/supabase/superadmin-guard";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const { id } = await params;
  const { plan, months, from_date } = await req.json();
  const supabase = createAdminClient();

  const { data: company, error: fetchErr } = await supabase.from("companies").select("subscription_end, name").eq("id", id).single();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 404 });

  const base = from_date ?? company.subscription_end ?? new Date().toISOString().split("T")[0];
  const newEnd = new Date(base);
  newEnd.setMonth(newEnd.getMonth() + months);
  const newEndStr = newEnd.toISOString().split("T")[0];

  const { error: updateErr } = await supabase.from("companies").update({
    plan,
    subscription_end: newEndStr,
    subscription_status: "active",
    company_status: "active",
  }).eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  const { data: saUser } = await supabase.auth.admin.getUserById(id);
  const renewedBy = saUser?.user?.user_metadata?.full_name ?? "Super Admin";

  await supabase.from("subscription_renewals").insert({
    company_id: id,
    plan,
    start_date: base,
    end_date: newEndStr,
    renewed_by: renewedBy,
  });

  return NextResponse.json({ subscription_end: newEndStr });
}
