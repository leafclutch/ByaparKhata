-- Fix: RLS infinite recursion (PostgreSQL error 54001 on INSERT/UPDATE/DELETE)
--
-- Root cause:
--   get_user_company_id()  → SELECT company_id FROM users WHERE id = auth.uid()
--   users table has RLS   → company_isolation policy calls get_user_company_id()
--   → infinite loop → 54001
--
-- Fix: read company_id and role from the authenticated JWT (user_metadata),
-- which is already populated at login time and contains both fields.
-- This removes the dependency on querying the users table from within an RLS policy.

CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
$$;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT auth.jwt() -> 'user_metadata' ->> 'role'
$$;
