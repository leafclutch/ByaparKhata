"use client";

import { useEffect, useState, useCallback } from "react";
import type { SuperadminProfile } from "@/lib/types";

interface SAAuthState {
  profile: SuperadminProfile | null;
  loading: boolean;
}

export function useSuperadminAuth(): SAAuthState & { signOut: () => void } {
  const [state, setState] = useState<SAAuthState>({ profile: null, loading: true });

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user || user.user_metadata?.role !== "superadmin") {
          setState({ profile: null, loading: false });
          return;
        }
        setState({
          profile: {
            id: user.id,
            full_name: user.user_metadata?.full_name ?? "Super Admin",
            email: user.email ?? "",
            contact_number: user.user_metadata?.contact_number,
            created_at: user.created_at,
          },
          loading: false,
        });
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session?.user || session.user.user_metadata?.role !== "superadmin") {
          setState({ profile: null, loading: false });
          return;
        }
        const u = session.user;
        setState({
          profile: {
            id: u.id,
            full_name: u.user_metadata?.full_name ?? "Super Admin",
            email: u.email ?? "",
            contact_number: u.user_metadata?.contact_number,
            created_at: u.created_at,
          },
          loading: false,
        });
      });

      return () => subscription.unsubscribe();
    });
  }, []);

  const signOut = useCallback(async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/superadmin/login";
  }, []);

  return { ...state, signOut };
}
