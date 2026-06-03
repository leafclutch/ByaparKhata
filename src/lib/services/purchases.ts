import { createClient } from "@/lib/supabase/client";
import type { Purchase } from "@/lib/types";
import { IS_DEMO_MODE } from "@/lib/env";
import { DEMO_PURCHASES } from "@/lib/mock-data";

export async function getPurchases(companyId: string): Promise<Purchase[]> {
  if (IS_DEMO_MODE) return DEMO_PURCHASES;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("*, operator:users(id, full_name, email, role)")
    .eq("company_id", companyId)
    .order("purchased_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
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
  notes?: string;
}

export async function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  if (IS_DEMO_MODE) {
    return {
      id: `pur-${Date.now()}`,
      ...input,
      purchased_at: new Date().toISOString(),
    } as Purchase;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("purchases")
    .insert({ ...input, purchased_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}
