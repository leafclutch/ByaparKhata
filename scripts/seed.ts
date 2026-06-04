/**
 * Seed script for HamroHisab dev/staging Supabase database.
 * Run with: npx tsx scripts/seed.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Creates: 1 company, 2 users (admin + operator), categories, 12 products, 8 sales, 5 purchases, 7 expenses, 6 notifications
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("🌱  Seeding HamroHisab database...\n");

  // ── Company ──────────────────────────────────────────────
  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .insert({
      name: "Nexus Retail Pvt. Ltd.",
      slug: "nexus-retail",
      address: "12, MG Road, Bengaluru, Karnataka - 560001",
      pan_vat_number: "29ABCDE1234F1Z5",
      currency: "INR",
      timezone: "Asia/Kolkata",
    })
    .select()
    .single();

  if (companyErr) { console.error("Company:", companyErr.message); process.exit(1); }
  console.log("✓  Company:", company.name);

  // ── Auth users ───────────────────────────────────────────
  const adminEmail = "admin@nexusretail.in";
  const operatorEmail = "operator@nexusretail.in";
  const demoPassword = "demo123456"; // min 8 chars for Supabase

  async function createAuthUser(email: string, role: string, fullName: string) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: demoPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, role, company_id: company.id },
    });
    if (error) throw new Error(`Auth user (${email}): ${error.message}`);
    return data.user;
  }

  const adminAuth = await createAuthUser(adminEmail, "admin", "Arjun Mehta");
  const operatorAuth = await createAuthUser(operatorEmail, "operator", "Raj Kumar");
  console.log("✓  Auth users created");

  // ── User profiles ────────────────────────────────────────
  await supabase.from("users").insert([
    { id: adminAuth.id, company_id: company.id, full_name: "Arjun Mehta", role: "admin", is_active: true },
    { id: operatorAuth.id, company_id: company.id, full_name: "Raj Kumar", role: "operator", is_active: true },
  ]);
  console.log("✓  User profiles created");

  // ── Categories ───────────────────────────────────────────
  const { data: rootCats } = await supabase
    .from("categories")
    .insert([
      { company_id: company.id, name: "Footwear", slug: "footwear", level: 0, color: "#4f46e5" },
      { company_id: company.id, name: "Electronics", slug: "electronics", level: 0, color: "#0891b2" },
      { company_id: company.id, name: "Apparel", slug: "apparel", level: 0, color: "#059669" },
      { company_id: company.id, name: "Accessories", slug: "accessories", level: 0, color: "#d97706" },
    ])
    .select();

  if (!rootCats) { console.error("Categories failed"); process.exit(1); }
  const [footwear, electronics, apparel, accessories] = rootCats;

  // Subcategories
  await supabase.from("categories").insert([
    { company_id: company.id, name: "Sports Shoes", slug: "sports-shoes", parent_id: footwear.id, level: 1, color: "#4f46e5" },
    { company_id: company.id, name: "Audio", slug: "audio", parent_id: electronics.id, level: 1, color: "#0891b2" },
    { company_id: company.id, name: "Computing", slug: "computing", parent_id: electronics.id, level: 1, color: "#0891b2" },
    { company_id: company.id, name: "Men", slug: "men", parent_id: apparel.id, level: 1, color: "#059669" },
  ]);
  console.log("✓  Categories created");

  // ── Products ─────────────────────────────────────────────
  const { data: products } = await supabase
    .from("products")
    .insert([
      { company_id: company.id, category_id: footwear.id, name: "Nike Air Max 90", sku: "SKU-001", purchase_price: 4200, selling_price: 6999, quantity: 15, min_stock: 10 },
      { company_id: company.id, category_id: electronics.id, name: 'Samsung TV 43"', sku: "SKU-002", purchase_price: 24000, selling_price: 38000, quantity: 12, min_stock: 5 },
      { company_id: company.id, category_id: apparel.id, name: "Jeans Classic Fit", sku: "SKU-003", purchase_price: 450, selling_price: 1299, quantity: 85, min_stock: 20 },
      { company_id: company.id, category_id: accessories.id, name: "USB-C Hub 7-in-1", sku: "SKU-004", purchase_price: 1100, selling_price: 2499, quantity: 20, min_stock: 15 },
      { company_id: company.id, category_id: accessories.id, name: "Laptop Stand Pro", sku: "SKU-005", purchase_price: 850, selling_price: 1999, quantity: 28, min_stock: 10 },
      { company_id: company.id, category_id: apparel.id, name: "Running Shorts M", sku: "SKU-006", purchase_price: 280, selling_price: 699, quantity: 30, min_stock: 20 },
      { company_id: company.id, category_id: electronics.id, name: "Bluetooth Speaker", sku: "SKU-007", purchase_price: 1800, selling_price: 3499, quantity: 18, min_stock: 8 },
      { company_id: company.id, category_id: electronics.id, name: "Wireless Mouse", sku: "SKU-008", purchase_price: 620, selling_price: 1299, quantity: 42, min_stock: 15 },
      { company_id: company.id, category_id: footwear.id, name: "Adidas Ultraboost", sku: "SKU-009", purchase_price: 5800, selling_price: 9499, quantity: 15, min_stock: 8 },
      { company_id: company.id, category_id: apparel.id, name: "Cotton T-Shirt (Pack 3)", sku: "SKU-010", purchase_price: 350, selling_price: 899, quantity: 120, min_stock: 30 },
      { company_id: company.id, category_id: electronics.id, name: "Mechanical Keyboard", sku: "SKU-011", purchase_price: 3200, selling_price: 5999, quantity: 18, min_stock: 5 },
      { company_id: company.id, category_id: accessories.id, name: "Phone Case Premium", sku: "SKU-012", purchase_price: 120, selling_price: 399, quantity: 200, min_stock: 50 },
    ])
    .select();

  console.log(`✓  ${products?.length} products created`);

  // ── Notifications ─────────────────────────────────────────
  await supabase.from("notifications").insert([
    { company_id: company.id, type: "alert", title: "Low stock alert — Nike Air Max 90", message: "Only 3 units remaining. Minimum stock level is 10.", is_read: false },
    { company_id: company.id, type: "success", title: "New sale recorded — ₹16,518", message: "Invoice VK-2605-2847 created for Amit Sharma.", is_read: false },
    { company_id: company.id, type: "info", title: "Monthly report ready", message: "May 2026 sales report has been generated.", is_read: true },
    { company_id: company.id, type: "warning", title: "Low stock — USB-C Hub 7-in-1", message: "Only 5 units remaining. Minimum stock level is 15.", is_read: true },
  ]);
  console.log("✓  Notifications created");

  console.log("\n✅  Seed complete!");
  console.log(`   Admin login:    ${adminEmail} / ${demoPassword}`);
  console.log(`   Operator login: ${operatorEmail} / ${demoPassword}`);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
