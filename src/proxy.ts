import { NextResponse, type NextRequest } from "next/server";
import { IS_DEMO_MODE } from "@/lib/env";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // In demo mode, allow all routes (auth handled client-side)
  if (IS_DEMO_MODE) {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);

  const isLoginPage = pathname === "/login";
  const isAdminRoute = pathname.startsWith("/admin");
  const isOperatorRoute = pathname.startsWith("/operator");
  const isProtectedRoute = isAdminRoute || isOperatorRoute;

  // Unauthenticated — redirect to login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const userRole = (user.user_metadata as { role?: string })?.role;

    // Already signed in — redirect away from login
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
  }

  return supabaseResponse;
}

export const proxyConfig = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
