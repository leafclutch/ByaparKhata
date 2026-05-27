import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/lib/supabase/superadmin-guard";

export async function GET(req: Request) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id");

  const supabase = createAdminClient();
  let query = supabase.from("users").select("*, company:companies(name)").order("created_at", { ascending: false });
  if (companyId) query = query.eq("company_id", companyId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = (data ?? []).map((u: Record<string, unknown> & { company?: { name: string } }) => ({
    id: u.id,
    company_id: u.company_id,
    company_name: (u.company as { name: string } | null)?.name ?? "",
    full_name: u.full_name,
    role: u.role,
    email: u.email,
    is_active: u.is_active,
    created_at: u.created_at,
  }));

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const { company_id, company_slug, username, full_name, role, password } = await req.json();
  const email = `${username}@${company_slug}`;

  const supabase = createAdminClient();

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role, company_id },
  });
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });

  const { data: userData, error: dbErr } = await supabase.from("users").insert({
    id: authData.user.id,
    company_id,
    full_name,
    role,
    email,
    is_active: true,
  }).select().single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ...userData, company_name: "" }, { status: 201 });
}
