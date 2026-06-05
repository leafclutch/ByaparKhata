import { createClient } from "@/lib/supabase/client";
import type { ActivityLog, ActivityAction, ActivityEntityType, Actor, OperatorActivity } from "@/lib/types";

const ACTIVITY_COLUMNS = "id, company_id, created_at, user_id, user_name, user_role, action, entity_type, entity_id, entity_label";

export interface ActivityFilters {
  user_id?: string;
  user_role?: string;
  action?: ActivityAction;
  entity_type?: ActivityEntityType;
  from_date?: string;
  to_date?: string;
}

export async function logActivity(params: {
  company_id: string;
  actor: Actor;
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_id: string;
  entity_label?: string;
}): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from("activity_logs").insert({
      company_id: params.company_id,
      user_id: params.actor.id,
      user_name: params.actor.name,
      user_role: params.actor.role,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      entity_label: params.entity_label,
    });
  } catch {
    // Activity logging is non-critical — never let it break the primary operation
  }
}

export async function getActivityLogs(
  companyId: string,
  filters?: ActivityFilters
): Promise<ActivityLog[]> {
  const supabase = createClient();
  let query = supabase
    .from("activity_logs")
    .select(ACTIVITY_COLUMNS)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (filters?.user_id) query = query.eq("user_id", filters.user_id);
  if (filters?.user_role) query = query.eq("user_role", filters.user_role);
  if (filters?.action) query = query.eq("action", filters.action);
  if (filters?.entity_type) query = query.eq("entity_type", filters.entity_type);
  if (filters?.from_date) query = query.gte("created_at", filters.from_date);
  if (filters?.to_date) query = query.lte("created_at", filters.to_date + "T23:59:59");

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getEntityHistory(
  entityType: ActivityEntityType,
  entityId: string
): Promise<ActivityLog[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select(ACTIVITY_COLUMNS)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function getOperatorStats(companyId: string): Promise<OperatorActivity[]> {
  const supabase = createClient();

  const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

  const [users, sales, purchases, logs] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, role")
      .eq("company_id", companyId)
      .eq("is_active", true),
    supabase
      .from("sales")
      .select("operator_id, grand_total")
      .eq("company_id", companyId)
      .gte("created_at", ytdStart),
    supabase
      .from("purchases")
      .select("operator_id")
      .eq("company_id", companyId)
      .gte("purchased_at", ytdStart),
    // Fix #8: add limit as safety guard — unbounded 90-day window can grow to thousands of rows
    // Long-term fix: use get_operator_activity_stats RPC (supabase/migrations/20260605_performance_rpcs.sql)
    supabase
      .from("activity_logs")
      .select("user_id, created_at")
      .eq("company_id", companyId)
      .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);

  const salesByUser: Record<string, { count: number; total: number }> = {};
  for (const s of sales.data ?? []) {
    if (!salesByUser[s.operator_id]) salesByUser[s.operator_id] = { count: 0, total: 0 };
    salesByUser[s.operator_id].count++;
    salesByUser[s.operator_id].total += s.grand_total;
  }

  const purchasesByUser: Record<string, number> = {};
  for (const p of purchases.data ?? []) {
    purchasesByUser[p.operator_id] = (purchasesByUser[p.operator_id] ?? 0) + 1;
  }

  const logsByUser: Record<string, { count: number; last: string }> = {};
  for (const l of logs.data ?? []) {
    if (!logsByUser[l.user_id]) {
      logsByUser[l.user_id] = { count: 0, last: l.created_at };
    }
    logsByUser[l.user_id].count++;
  }

  return (users.data ?? [])
    .map((u) => ({
      user_id: u.id,
      user_name: u.full_name,
      role: u.role,
      sales_count: salesByUser[u.id]?.count ?? 0,
      total_sales_value: salesByUser[u.id]?.total ?? 0,
      purchases_count: purchasesByUser[u.id] ?? 0,
      total_actions: logsByUser[u.id]?.count ?? 0,
      last_active: logsByUser[u.id]?.last ?? null,
    }))
    .sort((a, b) => b.total_sales_value - a.total_sales_value);
}
