"use client";

import { useEffect, useState } from "react";
import { IS_DEMO_MODE } from "@/lib/env";
import { DEMO_ADMIN, DEMO_OPERATOR } from "@/lib/mock-data";
import type { AppUser } from "@/lib/types";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    if (IS_DEMO_MODE) {
      // In demo mode, infer role from current path
      const path = window.location.pathname;
      const user = path.startsWith("/operator") ? DEMO_OPERATOR : DEMO_ADMIN;
      setState({ user, loading: false });
      return;
    }

    // Real Supabase auth — dynamically imported to avoid SSR issues
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) {
          setState({ user: null, loading: false });
          return;
        }
        const meta = user.user_metadata as { full_name?: string; role?: string; company_id?: string };
        setState({
          user: {
            id: user.id,
            company_id: meta.company_id ?? "",
            full_name: meta.full_name ?? user.email ?? "User",
            role: (meta.role as "admin" | "operator") ?? "operator",
            email: user.email ?? "",
            is_active: true,
            created_at: user.created_at,
          },
          loading: false,
        });
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) {
          setState({ user: null, loading: false });
          return;
        }
        const u = session.user;
        const meta = u.user_metadata as { full_name?: string; role?: string; company_id?: string };
        setState({
          user: {
            id: u.id,
            company_id: meta.company_id ?? "",
            full_name: meta.full_name ?? u.email ?? "User",
            role: (meta.role as "admin" | "operator") ?? "operator",
            email: u.email ?? "",
            is_active: true,
            created_at: u.created_at,
          },
          loading: false,
        });
      });

      return () => subscription.unsubscribe();
    });
  }, []);

  return state;
}
