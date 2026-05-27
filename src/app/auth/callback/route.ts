import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO_MODE } from "@/lib/env";

export async function GET(request: NextRequest) {
  if (IS_DEMO_MODE) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role as string | undefined;
      const dest = role === "operator" ? "/operator" : "/admin";
      return NextResponse.redirect(new URL(dest, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback_failed", origin));
}
