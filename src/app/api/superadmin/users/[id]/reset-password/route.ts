import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/lib/supabase/superadmin-guard";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const { id } = await params;
  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "Password is required." }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(id, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
