import { createClient } from "@/lib/supabase/client";
import type { Product, InventoryTransaction, Actor } from "@/lib/types";
import { logActivity } from "./activity";

// Fix #16: add safety limit to prevent unbounded catalogue fetches
export async function getProducts(companyId: string, limit = 2000): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(id, name, color, slug, level, parent_id)")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("name")
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export interface CreateProductInput {
  company_id: string;
  name: string;
  sku?: string;
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

// Fix #17: select("id") instead of select("*") — avoids transferring all column metadata in a HEAD request
export async function generateSKU(companyId: string, categoryPrefix?: string): Promise<string> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);
  if (error) throw error;

  const nextNum = (count ?? 0) + 1;
  const prefix = categoryPrefix ? categoryPrefix.toUpperCase().slice(0, 4) : "HH";
  return `${prefix}-${String(nextNum).padStart(4, "0")}`;
}

export async function createProduct(input: CreateProductInput, actor?: Actor): Promise<Product> {
  const supabase = createClient();

  const sku = input.sku || (await generateSKU(input.company_id));

  const { data, error } = await supabase
    .from("products")
    .insert({ ...input, sku })
    .select("*, category:categories(id, name, color, slug, level, parent_id)")
    .single();
  if (error) throw error;

  if (actor) {
    await logActivity({
      company_id: input.company_id,
      actor,
      action: "create",
      entity_type: "product",
      entity_id: data.id,
      entity_label: `${data.name} (${sku})`,
    });
  }

  return data;
}

export async function updateProduct(
  id: string,
  updates: Partial<CreateProductInput & { is_active: boolean }>,
  actor?: Actor,
  adjustmentNotes?: string
): Promise<Product> {
  const supabase = createClient();

  let oldQty: number | undefined;
  let companyId: string | undefined;
  let productName: string | undefined;

  if (updates.quantity !== undefined || actor) {
    const { data: current } = await supabase
      .from("products")
      .select("quantity, company_id, name, sku")
      .eq("id", id)
      .single();
    oldQty = current?.quantity;
    companyId = current?.company_id;
    productName = current?.name;

    if (updates.quantity !== undefined && oldQty !== undefined) {
      await supabase.from("inventory_transactions").insert({
        company_id: companyId,
        product_id: id,
        quantity_change: updates.quantity - oldQty,
        previous_stock: oldQty,
        new_stock: updates.quantity,
        reference_type: "adjustment",
        notes: adjustmentNotes ?? null,
        // reference_id is null for manual adjustments
      });
    }
  }

  const { data, error } = await supabase
    .from("products")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, category:categories(id, name, color, slug, level, parent_id)")
    .single();
  if (error) throw error;

  if (actor && companyId) {
    const isStockAdjust = updates.quantity !== undefined && oldQty !== undefined;
    await logActivity({
      company_id: companyId,
      actor,
      action: isStockAdjust ? "adjustment" : "update",
      entity_type: "product",
      entity_id: id,
      entity_label: isStockAdjust
        ? `${productName}: ${oldQty} → ${updates.quantity} units`
        : `${data.name} (${data.sku})`,
    });
  }

  return data;
}

export async function getInventoryTransactions(companyId: string): Promise<InventoryTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select("*, product:products(name, sku)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function deleteProduct(id: string, actor?: Actor): Promise<void> {
  const supabase = createClient();

  let companyId: string | undefined;
  let productLabel: string | undefined;
  if (actor) {
    const { data } = await supabase.from("products").select("company_id, name, sku").eq("id", id).single();
    companyId = data?.company_id;
    productLabel = data ? `${data.name} (${data.sku})` : id;
  }

  const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
  if (error) throw error;

  if (actor && companyId) {
    await logActivity({
      company_id: companyId,
      actor,
      action: "delete",
      entity_type: "product",
      entity_id: id,
      entity_label: productLabel,
    });
  }
}
