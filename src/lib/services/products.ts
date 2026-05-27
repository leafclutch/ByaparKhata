import { createClient } from "@/lib/supabase/client";
import type { Product, Category } from "@/lib/types";
import { IS_DEMO_MODE } from "@/lib/env";
import { DEMO_PRODUCTS, DEMO_CATEGORIES } from "@/lib/mock-data";

export async function getProducts(companyId: string): Promise<Product[]> {
  if (IS_DEMO_MODE) return DEMO_PRODUCTS;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(id, name, color, slug, level, parent_id)")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getCategories(companyId: string): Promise<Category[]> {
  if (IS_DEMO_MODE) return DEMO_CATEGORIES;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("company_id", companyId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export interface CreateProductInput {
  company_id: string;
  name: string;
  sku: string;
  barcode?: string;
  category_id?: string;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  min_stock: number;
  manufacture_date?: string;
  expiration_date?: string;
  expiry_notification_days?: number;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  if (IS_DEMO_MODE) {
    const now = new Date().toISOString();
    const cat = DEMO_CATEGORIES.find((c) => c.id === input.category_id);
    return { id: `prod-${Date.now()}`, ...input, is_active: true, category: cat, created_at: now, updated_at: now } as Product;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .insert(input)
    .select("*, category:categories(id, name, color, slug, level, parent_id)")
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, updates: Partial<CreateProductInput & { is_active: boolean }>): Promise<Product> {
  if (IS_DEMO_MODE) {
    const now = new Date().toISOString();
    const existing = DEMO_PRODUCTS.find((p) => p.id === id);
    const cat = updates.category_id ? DEMO_CATEGORIES.find((c) => c.id === updates.category_id) : existing?.category;
    return { ...(existing ?? {}), ...updates, category: cat, id, updated_at: now } as Product;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, category:categories(id, name, color, slug, level, parent_id)")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  if (IS_DEMO_MODE) return;
  const supabase = createClient();
  const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}
