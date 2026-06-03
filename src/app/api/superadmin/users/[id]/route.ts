import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/lib/supabase/superadmin-guard";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("users").update(body).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const { id } = await params;
  const supabase = createAdminClient();
  await supabase.from("users").delete().eq("id", id);
  await supabase.auth.admin.deleteUser(id);
  return new NextResponse(null, { status: 204 });
}
