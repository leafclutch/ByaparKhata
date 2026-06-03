import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types";
import { IS_DEMO_MODE } from "@/lib/env";
import { DEMO_NOTIFICATIONS } from "@/lib/mock-data";

export async function getNotifications(companyId: string): Promise<Notification[]> {
  if (IS_DEMO_MODE) return DEMO_NOTIFICATIONS;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  if (IS_DEMO_MODE) return;
  const supabase = createClient();
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(companyId: string): Promise<void> {
  if (IS_DEMO_MODE) return;
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("company_id", companyId)
    .eq("is_read", false);
  if (error) throw error;
}
