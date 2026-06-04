import { createClient } from "@/lib/supabase/client";
import type { Expense, ExpenseCategory, PaymentMethod } from "@/lib/types";

export async function getExpenses(companyId: string): Promise<Expense[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, operator:users(id, full_name, email, role)")
    .eq("company_id", companyId)
    .order("expense_date", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export interface CreateExpenseInput {
  company_id: string;
  operator_id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_note?: string;
  expense_date: string;
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const supabase = createClient();
  const { data, error } = await supabase.from("expenses").insert(input).select().single();
  if (error) throw error;
  return data;
}
