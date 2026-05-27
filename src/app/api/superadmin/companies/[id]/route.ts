import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/lib/supabase/superadmin-guard";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("companies").select("*").eq("id", params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("companies").update(body).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const supabase = createAdminClient();
  const { error } = await supabase.from("companies").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
