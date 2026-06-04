import { createClient } from "@/lib/supabase/client";
import type { Sale, CartItem, Actor } from "@/lib/types";
import { generateInvoiceNumber, calculateCartTotal, formatNPR } from "@/lib/utils";
import { logActivity } from "./activity";

export interface SalesFilters {
  from_date?: string;
  to_date?: string;
  payment_method?: string;
  operator_id?: string;
}

export async function getSales(companyId: string, filters?: SalesFilters): Promise<Sale[]> {
  const supabase = createClient();
  let query = supabase
    .from("sales")
    .select("*, items:sale_items(*), operator:users(id, full_name, email, role)")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (filters?.from_date) query = query.gte("created_at", `${filters.from_date}T00:00:00`);
  if (filters?.to_date) query = query.lte("created_at", `${filters.to_date}T23:59:59`);
  if (filters?.payment_method) query = query.eq("payment_method", filters.payment_method);
  if (filters?.operator_id) query = query.eq("operator_id", filters.operator_id);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getSaleWithItems(saleId: string): Promise<Sale | null> {
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
  cash_amount?: number;
  online_amount?: number;
  discount?: number;
  notes?: string;
}

export async function createSale(input: CreateSaleInput, cartItems: CartItem[], actor?: Actor): Promise<Sale> {
  const orderDiscount = input.discount ?? 0;
  const { subtotal, grandTotal } = calculateCartTotal(
    cartItems.map((i) => ({ quantity: i.quantity, unit_price: i.unit_price, discount: i.discount })),
    orderDiscount
  );

  const supabase = createClient();
  const invoiceNumber = generateInvoiceNumber();

  const productIds = cartItems.map((i) => i.product.id);
  const { data: currentProducts, error: fetchErr } = await supabase
    .from("products")
    .select("id, quantity, name")
    .in("id", productIds);
  if (fetchErr) throw fetchErr;

  for (const item of cartItems) {
    const p = currentProducts?.find((cp) => cp.id === item.product.id);
    if (!p || p.quantity < item.quantity) {
      throw new Error(`Insufficient stock for ${item.product.name}. Available: ${p?.quantity ?? 0}`);
    }
  }

  const { data: sale, error: saleErr } = await supabase
    .from("sales")
    .insert({
      company_id: input.company_id,
      operator_id: input.operator_id,
      invoice_number: invoiceNumber,
      customer_name: input.customer_name,
      subtotal,
      discount: orderDiscount,
      grand_total: grandTotal,
      payment_method: input.payment_method,
      cash_amount: input.cash_amount ?? null,
      online_amount: input.online_amount ?? null,
      notes: input.notes,
    })
    .select()
    .single();
  if (saleErr) throw saleErr;

  await supabase.from("sale_items").insert(
    cartItems.map((item) => ({
      sale_id: sale.id,
      company_id: input.company_id,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      line_total: item.line_total,
    }))
  );

  const productQtyMap = Object.fromEntries(
    (currentProducts ?? []).map((p) => [p.id, p.quantity])
  );

  await Promise.all(
    cartItems.map((item) =>
      supabase
        .from("products")
        .update({ quantity: productQtyMap[item.product.id] - item.quantity })
        .eq("id", item.product.id)
    )
  );

  await supabase.from("inventory_transactions").insert(
    cartItems.map((item) => {
      const oldQty = productQtyMap[item.product.id];
      return {
        company_id: input.company_id,
        product_id: item.product.id,
        quantity_change: -item.quantity,
        previous_stock: oldQty,
        new_stock: oldQty - item.quantity,
        reference_type: "sale",
        reference_id: sale.id,
        user_id: input.operator_id,
      };
    })
  );

  if (actor) {
    await logActivity({
      company_id: input.company_id,
      actor,
      action: "create",
      entity_type: "sale",
      entity_id: sale.id,
      entity_label: `${invoiceNumber} — ${input.customer_name || "Walk-in"} — ${formatNPR(grandTotal)}`,
    });
  }

  return sale;
}

export async function updateSale(id: string, updates: Partial<CreateSaleInput>, cartItems?: CartItem[], actor?: Actor): Promise<Sale> {
  const supabase = createClient();

  const { data: old, error: oldErr } = await supabase
    .from("sales")
    .select("*, items:sale_items(*)")
    .eq("id", id)
    .single();
  if (oldErr) throw oldErr;

  if (cartItems) {
    const oldProductIds = (old.items ?? []).map((i: { product_id: string }) => i.product_id);
    const { data: oldProducts } = await supabase
      .from("products")
      .select("id, quantity")
      .in("id", oldProductIds);
    const oldQtyMap = Object.fromEntries((oldProducts ?? []).map((p) => [p.id, p.quantity]));

    await Promise.all(
      (old.items ?? []).map((item: { product_id: string; quantity: number }) =>
        supabase
          .from("products")
          .update({ quantity: (oldQtyMap[item.product_id] ?? 0) + item.quantity })
          .eq("id", item.product_id)
      )
    );

    const newProductIds = cartItems.map((i) => i.product.id);
    const { data: currentProducts } = await supabase
      .from("products")
      .select("id, quantity, name")
      .in("id", newProductIds);

    for (const item of cartItems) {
      const p = currentProducts?.find((cp) => cp.id === item.product.id);
      if (!p || p.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${item.product.name} after update.`);
      }
    }

    await supabase.from("sale_items").delete().eq("sale_id", id);

    await supabase.from("sale_items").insert(
      cartItems.map((item) => ({
        sale_id: id,
        company_id: old.company_id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        line_total: item.line_total,
      }))
    );

    const currentQtyMap = Object.fromEntries(
      (currentProducts ?? []).map((p) => [p.id, p.quantity])
    );

    await Promise.all(
      cartItems.map((item) =>
        supabase
          .from("products")
          .update({ quantity: currentQtyMap[item.product.id] - item.quantity })
          .eq("id", item.product.id)
      )
    );

    await supabase.from("inventory_transactions").insert(
      cartItems.map((item) => {
        const oldQty = currentQtyMap[item.product.id];
        return {
          company_id: old.company_id,
          product_id: item.product.id,
          quantity_change: -item.quantity,
          previous_stock: oldQty,
          new_stock: oldQty - item.quantity,
          reference_type: "adjustment",
          reference_id: id,
        };
      })
    );
  }

  const { data: updated, error } = await supabase
    .from("sales")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  if (actor) {
    await logActivity({
      company_id: old.company_id,
      actor,
      action: "update",
      entity_type: "sale",
      entity_id: id,
      entity_label: `${old.invoice_number} — ${old.customer_name || "Walk-in"}`,
    });
  }

  return updated;
}

export async function deleteSale(saleId: string, actor?: Actor): Promise<void> {
  const supabase = createClient();

  const { data: sale, error: saleErr } = await supabase
    .from("sales")
    .select("*, items:sale_items(*)")
    .eq("id", saleId)
    .single();
  if (saleErr) throw saleErr;

  const items = sale.items ?? [];
  const productIds = items.map((i: { product_id: string }) => i.product_id);

  const { data: currentProducts } = await supabase
    .from("products")
    .select("id, quantity")
    .in("id", productIds);
  const qtyMap = Object.fromEntries((currentProducts ?? []).map((p) => [p.id, p.quantity]));

  await Promise.all(
    items.map((item: { product_id: string; quantity: number }) =>
      supabase
        .from("products")
        .update({ quantity: (qtyMap[item.product_id] ?? 0) + item.quantity })
        .eq("id", item.product_id)
    )
  );

  await supabase.from("inventory_transactions").insert(
    items.map((item: { product_id: string; quantity: number }) => {
      const oldQty = qtyMap[item.product_id] ?? 0;
      return {
        company_id: sale.company_id,
        product_id: item.product_id,
        quantity_change: item.quantity,
        previous_stock: oldQty,
        new_stock: oldQty + item.quantity,
        reference_type: "return",
        reference_id: sale.id,
      };
    })
  );

  const { error } = await supabase.from("sales").delete().eq("id", saleId);
  if (error) throw error;

  if (actor) {
    await logActivity({
      company_id: sale.company_id,
      actor,
      action: "delete",
      entity_type: "sale",
      entity_id: saleId,
      entity_label: `${sale.invoice_number} — ${sale.customer_name || "Walk-in"}`,
    });
  }
}
