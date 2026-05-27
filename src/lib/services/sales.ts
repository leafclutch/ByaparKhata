import { createClient } from "@/lib/supabase/client";
import type { Sale, CartItem } from "@/lib/types";
import { IS_DEMO_MODE } from "@/lib/env";
import { DEMO_SALES } from "@/lib/mock-data";
import { generateInvoiceNumber, calculateCartTotal } from "@/lib/utils";

export async function getSales(companyId: string): Promise<Sale[]> {
  if (IS_DEMO_MODE) return DEMO_SALES;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sales")
    .select("*, items:sale_items(*), operator:users(id, full_name, email, role)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function getSaleWithItems(saleId: string): Promise<Sale | null> {
  if (IS_DEMO_MODE) {
    return DEMO_SALES.find((s) => s.id === saleId) ?? DEMO_SALES[0];
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sales")
    .select("*, items:sale_items(*), operator:users(id, full_name, email, role)")
    .eq("id", saleId)
    .single();
  if (error) throw error;
  return data;
}

export interface CreateSaleInput {
  company_id: string;
  operator_id: string;
  customer_name?: string;
  payment_method: string;
  discount?: number;
  tax_rate?: number;
  notes?: string;
}

export async function createSale(input: CreateSaleInput, cartItems: CartItem[]): Promise<Sale> {
  const taxRate = input.tax_rate ?? 18;
  const orderDiscount = input.discount ?? 0;
  const { subtotal, taxAmount, grandTotal } = calculateCartTotal(
    cartItems.map((i) => ({ quantity: i.quantity, unit_price: i.unit_price, discount: i.discount })),
    orderDiscount,
    taxRate
  );

  if (IS_DEMO_MODE) {
    const now = new Date().toISOString();
    const invoiceNumber = generateInvoiceNumber();
    return {
      id: `sale-${Date.now()}`,
      invoice_number: invoiceNumber,
      subtotal,
      discount: orderDiscount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      grand_total: grandTotal,
      ...input,
      created_at: now,
    } as Sale;
  }

  const supabase = createClient();
  const invoiceNumber = generateInvoiceNumber();

  const { data: sale, error: saleErr } = await supabase
    .from("sales")
    .insert({
      company_id: input.company_id,
      operator_id: input.operator_id,
      invoice_number: invoiceNumber,
      customer_name: input.customer_name,
      subtotal,
      discount: orderDiscount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      grand_total: grandTotal,
      payment_method: input.payment_method,
      notes: input.notes,
    })
    .select()
    .single();

  if (saleErr) throw saleErr;

  const saleItemsPayload = cartItems.map((item) => ({
    sale_id: sale.id,
    product_id: item.product.id,
    product_name: item.product.name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount: item.discount,
    line_total: item.quantity * item.unit_price - item.discount,
  }));

  const { error: itemsErr } = await supabase.from("sale_items").insert(saleItemsPayload);
  if (itemsErr) throw itemsErr;

  return sale;
}
