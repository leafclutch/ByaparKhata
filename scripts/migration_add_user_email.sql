-- Patch: add email column to users table
-- The original schema omitted this column; the API requires it for user creation.
-- Safe to run multiple times (IF NOT EXISTS).

ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;
