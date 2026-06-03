import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function requireSuperadmin(req: Request): Promise<NextResponse | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookiePairs = cookieHeader.split(";").map((c) => {
    const [name, ...rest] = c.trim().split("=");
    return { name: name.trim(), value: rest.join("=") };
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookiePairs,
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  return null;
}
