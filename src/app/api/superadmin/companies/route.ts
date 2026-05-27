import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/lib/supabase/superadmin-guard";

export async function GET(req: Request) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*, users_count:users(count), products_count:products(count), sales_count:sales(count)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("companies").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
