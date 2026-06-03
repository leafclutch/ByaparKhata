import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "@/lib/env";

// ⚠️ Server-only — NEVER import this in any client component or page.
// Uses the service-role key which bypasses RLS.
// Only use in Server Actions and Route Handlers.
export function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
