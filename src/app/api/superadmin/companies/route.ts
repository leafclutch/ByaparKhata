import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/lib/supabase/superadmin-guard";

function extractCount(val: unknown): number {
  if (typeof val === "number") return val;
  if (Array.isArray(val) && val.length > 0) return Number(val[0]?.count ?? 0);
  return 0;
}

export async function GET(req: Request) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*, users_count:users(count), products_count:products(count), sales_count:sales(count)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const companies = (data ?? []).map((c: Record<string, unknown>) => ({
    ...c,
    users_count: extractCount(c.users_count),
    products_count: extractCount(c.products_count),
    sales_count: extractCount(c.sales_count),
    total_sales_value: 0,
  }));

  return NextResponse.json(companies);
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
