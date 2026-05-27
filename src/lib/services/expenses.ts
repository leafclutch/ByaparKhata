import { createClient } from "@/lib/supabase/client";
import type { Expense, ExpenseCategory, PaymentMethod } from "@/lib/types";
import { IS_DEMO_MODE } from "@/lib/env";
import { DEMO_EXPENSES } from "@/lib/mock-data";

export async function getExpenses(companyId: string): Promise<Expense[]> {
  if (IS_DEMO_MODE) return DEMO_EXPENSES;
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
  if (IS_DEMO_MODE) {
    return {
      id: `exp-${Date.now()}`,
      ...input,
      created_at: new Date().toISOString(),
    } as Expense;
  }
  const supabase = createClient();
  const { data, error } = await supabase.from("expenses").insert(input).select().single();
  if (error) throw error;
  return data;
}
