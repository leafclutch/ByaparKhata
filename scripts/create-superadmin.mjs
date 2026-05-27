// One-time script to create the superadmin user.
// Run with: node scripts/create-superadmin.mjs
// Requires .env.local to be present with SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Read .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim()))
);

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL = "admin@vyaparkhata.com";
const PASSWORD = "admin@123";
const FULL_NAME = "Roshan Singh";
const CONTACT = "+91 98765 43210";

async function run() {
  console.log("Creating superadmin user…");

  // Create auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role: "superadmin", full_name: FULL_NAME },
  });

  if (authErr) {
    if (authErr.message.includes("already been registered")) {
      console.log("ℹ️  User already exists — updating metadata…");
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === EMAIL);
      if (existing) {
        await supabase.auth.admin.updateUserById(existing.id, {
          password: PASSWORD,
          user_metadata: { role: "superadmin", full_name: FULL_NAME },
        });
        console.log("✅  Metadata updated.");

        await supabase.from("superadmin").upsert({
          id: existing.id, full_name: FULL_NAME, email: EMAIL, contact_number: CONTACT,
        }, { onConflict: "id" });
        console.log("✅  superadmin table row upserted.");
      }
    } else {
      console.error("❌  Auth error:", authErr.message);
    }
    return;
  }

  console.log("✅  Auth user created:", authData.user.id);

  // Insert into superadmin table
  const { error: dbErr } = await supabase.from("superadmin").upsert({
    id: authData.user.id, full_name: FULL_NAME, email: EMAIL, contact_number: CONTACT,
  }, { onConflict: "id" });

  if (dbErr) console.error("❌  superadmin table:", dbErr.message);
  else console.log("✅  superadmin table row created.");

  console.log("\n🎉  Done! Login at /superadmin/login");
  console.log(`   Email:    ${EMAIL}`);
  console.log(`   Password: ${PASSWORD}`);
}

run();
