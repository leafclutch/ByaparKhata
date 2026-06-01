import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: object }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  // Stale/invalid refresh token — clear auth cookies immediately so the browser
  // doesn't keep retrying and blocking every subsequent request for 10-20s.
  if (error && (error as { code?: string }).code === "refresh_token_not_found") {
    const cleared = NextResponse.next({ request });
    request.cookies
      .getAll()
      .filter(({ name }) => name.startsWith("sb-"))
      .forEach(({ name }) => cleared.cookies.delete(name));
    return { supabaseResponse: cleared, user: null };
  }

  return { supabaseResponse, user };
}
