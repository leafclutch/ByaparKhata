import { createClient } from "@/lib/supabase/client";
import type { Customer, CreditTransaction, Actor } from "@/lib/types";
import { logActivity } from "./activity";

export async function getCustomers(companyId: string): Promise<Customer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getCustomerWithLedger(
  customerId: string
): Promise<{ customer: Customer; ledger: CreditTransaction[] } | null> {
  const supabase = createClient();

  const { data: customer, error: cErr } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (cErr) throw cErr;
  if (!customer) return null;

  const { data: ledger, error: lErr } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (lErr) throw lErr;

  return {
    customer,
    ledger: ledger ?? [],
  };
}

export interface CreateCustomerInput {
  company_id: string;
  name: string;
  phone?: string;
}

export async function createCustomer(input: CreateCustomerInput, actor?: Actor): Promise<Customer> {
  const supabase = createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      company_id: input.company_id,
      name: input.name,
      phone: input.phone || null,
      current_balance: 0,
    })
    .select()
    .single();

  if (error) throw error;

  if (actor) {
    await logActivity({
      company_id: input.company_id,
      actor,
      action: "create",
      entity_type: "customer",
      entity_id: customer.id,
      entity_label: `Customer ${customer.name} created`,
    });
  }

  return customer;
}

export interface CreditTxInput {
  company_id: string;
  customer_id: string;
  amount: number;
  notes?: string;
}

export async function issueCredit(input: CreditTxInput, actor?: Actor): Promise<CreditTransaction> {
  const supabase = createClient();

  // Get current customer balance
  const { data: customer, error: cErr } = await supabase
    .from("customers")
    .select("current_balance, name")
    .eq("id", input.customer_id)
    .single();
  if (cErr) throw cErr;

  const newBalance = Number(customer.current_balance) + input.amount;

  // Update customer balance
  const { error: uErr } = await supabase
    .from("customers")
    .update({ current_balance: newBalance })
    .eq("id", input.customer_id);
  if (uErr) throw uErr;

  // Create credit transaction
  const { data: tx, error: tErr } = await supabase
    .from("credit_transactions")
    .insert({
      customer_id: input.customer_id,
      company_id: input.company_id,
      type: "issue",
      amount: input.amount,
      notes: input.notes || null,
    })
    .select()
    .single();
  if (tErr) throw tErr;

  if (actor) {
    await logActivity({
      company_id: input.company_id,
      actor,
      action: "create",
      entity_type: "credit_transaction",
      entity_id: tx.id,
      entity_label: `Issued credit of Rs. ${input.amount} to ${customer.name}`,
    });
  }

  return tx;
}

export async function settleCredit(input: CreditTxInput, actor?: Actor): Promise<CreditTransaction> {
  const supabase = createClient();

  // Get current customer balance
  const { data: customer, error: cErr } = await supabase
    .from("customers")
    .select("current_balance, name")
    .eq("id", input.customer_id)
    .single();
  if (cErr) throw cErr;

  if (input.amount > Number(customer.current_balance)) {
    throw new Error("Settlement amount exceeds outstanding balance.");
  }

  const newBalance = Number(customer.current_balance) - input.amount;

  // Update customer balance with optimistic lock
  const { error: uErr } = await supabase
    .from("customers")
    .update({ current_balance: newBalance })
    .eq("id", input.customer_id)
    .gte("current_balance", input.amount);
  if (uErr) throw uErr;

  // Create credit transaction
  const { data: tx, error: tErr } = await supabase
    .from("credit_transactions")
    .insert({
      customer_id: input.customer_id,
      company_id: input.company_id,
      type: "payment",
      amount: input.amount,
      notes: input.notes || null,
    })
    .select()
    .single();
  if (tErr) throw tErr;

  if (actor) {
    await logActivity({
      company_id: input.company_id,
      actor,
      action: "create",
      entity_type: "credit_transaction",
      entity_id: tx.id,
      entity_label: `Collected payment of Rs. ${input.amount} from ${customer.name}`,
    });
  }

  return tx;
}
