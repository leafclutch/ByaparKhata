import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Zone 1: Super Admin routes ──────────────────────────────────────────────
  // Completely separate from company routes. SA users can never reach /admin or /operator.
  if (pathname.startsWith("/superadmin")) {
    const { supabaseResponse, user } = await updateSession(request);
    const role = (user?.user_metadata as Record<string, string> | undefined)?.role;

    if (pathname === "/superadmin/login") {
      if (role === "superadmin") {
        return NextResponse.redirect(new URL("/superadmin/dashboard", request.url));
      }
      return supabaseResponse;
    }

    if (!user || role !== "superadmin") {
      return NextResponse.redirect(new URL("/superadmin/login", request.url));
    }
    return supabaseResponse;
  }

  // ── Zone 2: Company routes (admin / operator) ────────────────────────────────
  const { supabaseResponse, user } = await updateSession(request);

  const isLoginPage = pathname === "/login";
  const isAdminRoute = pathname.startsWith("/admin");
  const isOperatorRoute = pathname.startsWith("/operator");
  const isProtectedRoute = isAdminRoute || isOperatorRoute;

  // Unauthenticated → login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const meta = user.user_metadata as Record<string, string> | undefined;
    const userRole = meta?.role;

    // Superadmin trying to access company routes → push them to their login
    if (userRole === "superadmin" && isProtectedRoute) {
      return NextResponse.redirect(new URL("/superadmin/dashboard", request.url));
    }

    // Already signed in → redirect away from login
    if (isLoginPage) {
      const dest = userRole === "operator" ? "/operator" : "/admin";
      return NextResponse.redirect(new URL(dest, request.url));
    }

    // Role mismatch guard
    if (isAdminRoute && userRole !== "admin") {
      return NextResponse.redirect(new URL("/operator", request.url));
    }
    if (isOperatorRoute && userRole !== "operator") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Company status check — cached in a 5-min httpOnly cookie to avoid a DB
    // round-trip on every request. Cookie value = company_id so a new login
    // (different company) always invalidates the cache.
    const CO_STATUS_COOKIE = "co_ok";
    if (isProtectedRoute && pathname !== "/subscription-expired") {
      const companyId = meta?.company_id;
      const cached = request.cookies.get(CO_STATUS_COOKIE)?.value;

      if (companyId && cached !== companyId) {
        try {
          const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              cookies: {
                getAll() { return request.cookies.getAll(); },
                setAll() {},
              },
            }
          );
          const { data } = await supabase
            .from("companies")
            .select("company_status, subscription_end, name, contact_email")
            .eq("id", companyId)
            .single();

          const today = new Date().toISOString().split("T")[0];
          const isBlocked =
            data?.company_status === "paused" ||
            data?.company_status === "disabled" ||
            data?.company_status === "expired" ||
            (data?.subscription_end && data.subscription_end < today);

          if (isBlocked) {
            const url = new URL("/subscription-expired", request.url);
            if (data?.name) url.searchParams.set("name", data.name);
            if (data?.contact_email) url.searchParams.set("email", data.contact_email);
            return NextResponse.redirect(url);
          }

          // Active — stamp the cache so the next 5 min skip this query
          supabaseResponse.cookies.set(CO_STATUS_COOKIE, companyId, {
            maxAge: 300,
            httpOnly: true,
            sameSite: "lax",
            path: "/",
          });
        } catch {
          // Fail open — never block the user due to a check failure
        }
      }
    }
  }

  return supabaseResponse;
}

export const proxyConfig = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
