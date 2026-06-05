import { createClient } from "@/lib/supabase/client";
import type { Purchase, Actor } from "@/lib/types";
import { logActivity } from "./activity";

export interface PurchaseFilters {
  from_date?: string;
  to_date?: string;
  payment_method?: string;
  operator_id?: string;
}

export async function getPurchases(companyId: string, filters?: PurchaseFilters): Promise<Purchase[]> {
  const supabase = createClient();
  // Fix #20: explicit column list instead of select("*")
  let query = supabase
    .from("purchases")
    .select("id, company_id, operator_id, supplier_name, product_id, product_name, quantity, unit_cost, total_cost, invoice_number, payment_method, cash_amount, online_amount, notes, purchased_at, operator:users(id, full_name, email, role)")
    .eq("company_id", companyId)
    .order("purchased_at", { ascending: false })
    .limit(500);

  if (filters?.from_date) query = query.gte("purchased_at", `${filters.from_date}T00:00:00`);
  if (filters?.to_date) query = query.lte("purchased_at", `${filters.to_date}T23:59:59`);
  if (filters?.payment_method) query = query.eq("payment_method", filters.payment_method);
  if (filters?.operator_id) query = query.eq("operator_id", filters.operator_id);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Purchase[];
}

export interface CreatePurchaseInput {
  company_id: string;
  operator_id: string;
  supplier_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  invoice_number?: string;
  payment_method: string;
  cash_amount?: number;
  online_amount?: number;
  notes?: string;
}

export async function createPurchase(input: CreatePurchaseInput, actor?: Actor): Promise<Purchase> {
  const supabase = createClient();

  const { data: product, error: pErr } = await supabase
    .from("products")
    .select("quantity")
    .eq("id", input.product_id)
    .single();
  if (pErr) throw pErr;

  const { data: purchase, error } = await supabase
    .from("purchases")
    .insert({ ...input, purchased_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;

  const newQty = (product?.quantity ?? 0) + input.quantity;
  await supabase.from("products").update({ quantity: newQty }).eq("id", input.product_id);

  await supabase.from("inventory_transactions").insert({
    company_id: input.company_id,
    product_id: input.product_id,
    quantity_change: input.quantity,
    previous_stock: product?.quantity ?? 0,
    new_stock: newQty,
    reference_type: "purchase",
    reference_id: purchase.id,
    user_id: input.operator_id,
  });

  if (actor) {
    await logActivity({
      company_id: input.company_id,
      actor,
      action: "create",
      entity_type: "purchase",
      entity_id: purchase.id,
      entity_label: `${input.product_name} ×${input.quantity} from ${input.supplier_name}`,
    });
  }

  return purchase;
}

export async function updatePurchase(id: string, updates: Partial<CreatePurchaseInput>, actor?: Actor): Promise<Purchase> {
  const supabase = createClient();

  const { data: old, error: oldErr } = await supabase.from("purchases").select("*").eq("id", id).single();
  if (oldErr) throw oldErr;

  const qtyDiff = (updates.quantity ?? old.quantity) - old.quantity;

  if (qtyDiff !== 0) {
    const { data: product } = await supabase.from("products").select("quantity").eq("id", old.product_id).single();
    const oldStock = product?.quantity ?? 0;
    const newStock = oldStock + qtyDiff;

    await supabase.from("products").update({ quantity: newStock }).eq("id", old.product_id);

    await supabase.from("inventory_transactions").insert({
      company_id: old.company_id,
      product_id: old.product_id,
      quantity_change: qtyDiff,
      previous_stock: oldStock,
      new_stock: newStock,
      reference_type: "adjustment",
      reference_id: id,
    });
  }

  const { data: updated, error } = await supabase.from("purchases").update(updates).eq("id", id).select().single();
  if (error) throw error;

  if (actor) {
    await logActivity({
      company_id: old.company_id,
      actor,
      action: "update",
      entity_type: "purchase",
      entity_id: id,
      entity_label: `${old.product_name} ×${updated.quantity} from ${old.supplier_name}`,
    });
  }

  return updated;
}

export async function deletePurchase(purchaseId: string, actor?: Actor): Promise<void> {
  const supabase = createClient();

  const { data: p, error: pErr } = await supabase.from("purchases").select("*").eq("id", purchaseId).single();
  if (pErr) throw pErr;

  const { data: product } = await supabase.from("products").select("quantity").eq("id", p.product_id).single();
  const oldQty = product?.quantity ?? 0;
  const newQty = oldQty - p.quantity;

  await supabase.from("products").update({ quantity: newQty }).eq("id", p.product_id);

  await supabase.from("inventory_transactions").insert({
    company_id: p.company_id,
    product_id: p.product_id,
    quantity_change: -p.quantity,
    previous_stock: oldQty,
    new_stock: newQty,
    reference_type: "adjustment",
    reference_id: p.id,
  });

  const { error } = await supabase.from("purchases").delete().eq("id", purchaseId);
  if (error) throw error;

  if (actor) {
    await logActivity({
      company_id: p.company_id,
      actor,
      action: "delete",
      entity_type: "purchase",
      entity_id: purchaseId,
      entity_label: `${p.product_name} ×${p.quantity} from ${p.supplier_name}`,
    });
  }
}
