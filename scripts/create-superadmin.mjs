// One-time script to create the superadmin user.
// Run with: node scripts/create-superadmin.mjs
// Requires .env.local to be present with the Supabase credentials.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local — split only on the FIRST "=" so base64 JWT values are kept intact
const envPath = resolve(process.cwd(), ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL     = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Edit these before running ───────────────────────────────────────────────
const SA_EMAIL    = "admin@hamrohisab.com";
const SA_PASSWORD = "HamroHisab@2026";
const SA_NAME     = "Super Admin";
const SA_CONTACT  = "";
// ───────────────────────────────────────────────────────────────────────────

async function run() {
  console.log("Creating superadmin…");

  let userId;

  // 1. Create auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: SA_EMAIL,
    password: SA_PASSWORD,
    email_confirm: true,
    user_metadata: { role: "superadmin", full_name: SA_NAME },
  });

  if (authErr) {
    const alreadyExists =
      authErr.message.toLowerCase().includes("already been registered") ||
      authErr.message.toLowerCase().includes("already exists");

    if (!alreadyExists) {
      console.error("Auth error:", authErr.message);
      return;
    }

    // User exists — fetch and update
    console.log("User already exists — updating…");
    const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const existing = list?.users?.find((u) => u.email === SA_EMAIL);
    if (!existing) { console.error("Could not locate existing user."); return; }

    userId = existing.id;
    const { error: upErr } = await supabase.auth.admin.updateUserById(userId, {
      password: SA_PASSWORD,
      user_metadata: { role: "superadmin", full_name: SA_NAME },
    });
    if (upErr) { console.error("Update error:", upErr.message); return; }
    console.log("Auth user updated:", userId);

  } else {
    userId = authData.user.id;
    console.log("Auth user created:", userId);
  }

  // 2. Upsert into superadmin table
  //    (the DB trigger handles this on first INSERT, but explicit upsert
  //    covers the "user already existed" path as well)
  const row = { id: userId, full_name: SA_NAME, email: SA_EMAIL };
  if (SA_CONTACT) row.contact_number = SA_CONTACT;

  const { error: dbErr } = await supabase
    .from("superadmin")
    .upsert(row, { onConflict: "id" });

  if (dbErr) { console.error("DB error:", dbErr.message); return; }
  console.log("superadmin row upserted.");

  console.log("\nDone! Login at /superadmin/login");
  console.log("  Email:   ", SA_EMAIL);
  console.log("  Password:", SA_PASSWORD);
}

run();
