import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/lib/supabase/superadmin-guard";
import { createServerClient } from "@supabase/ssr";

async function getCurrentUserId(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookiePairs = cookieHeader.split(";").map((c) => {
    const [name, ...rest] = c.trim().split("=");
    return { name: name.trim(), value: rest.join("=") };
  });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookiePairs, setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET(req: Request) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("superadmin").select("*").eq("id", userId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const denied = await requireSuperadmin(req);
  if (denied) return denied;

  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("superadmin").update(body).eq("id", userId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
