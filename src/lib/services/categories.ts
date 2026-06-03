import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/lib/types";
import { IS_DEMO_MODE } from "@/lib/env";
import { DEMO_CATEGORIES } from "@/lib/mock-data";

export async function getCategories(companyId: string): Promise<Category[]> {
  if (IS_DEMO_MODE) return DEMO_CATEGORIES;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("company_id", companyId)
    .order("level")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export interface CreateCategoryInput {
  company_id: string;
  name: string;
  slug?: string;
  parent_id?: string;
  level?: number;
  color?: string;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  if (IS_DEMO_MODE) {
    return { id: `cat-${Date.now()}`, ...input } as Category;
  }
  const supabase = createClient();
  const { data, error } = await supabase.from("categories").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, updates: Partial<CreateCategoryInput>): Promise<Category> {
  if (IS_DEMO_MODE) {
    const existing = DEMO_CATEGORIES.find((c) => c.id === id);
    return { ...(existing ?? {}), ...updates, id } as Category;
  }
  const supabase = createClient();
  const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  if (IS_DEMO_MODE) return;
  const supabase = createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
