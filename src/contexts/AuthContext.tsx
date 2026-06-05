"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppUser } from "@/lib/types";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

function toAppUser(user: { id: string; email?: string; created_at: string; user_metadata: Record<string, unknown> }): AppUser {
  const meta = user.user_metadata as { full_name?: string; role?: string; company_id?: string };
  return {
    id: user.id,
    company_id: meta.company_id ?? "",
    full_name: meta.full_name ?? user.email ?? "User",
    role: (meta.role as "admin" | "operator") ?? "operator",
    email: user.email ?? "",
    is_active: true,
    created_at: user.created_at,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setState(user ? { user: toAppUser(user), loading: false } : { user: null, loading: false });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setState(u ? { user: toAppUser(u), loading: false } : { user: null, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
