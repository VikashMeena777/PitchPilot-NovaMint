/**
 * Activity Logger — Audit trail for all user actions
 *
 * Logs user actions to an `activity_log` table for:
 * - Compliance (GDPR audit trail)
 * - User activity feeds
 * - Team activity dashboards (Agency plan)
 * - Debugging and support
 */

import { createClient } from "@supabase/supabase-js";

export type ActivityAction =
  | "prospect.created"
  | "prospect.updated"
  | "prospect.deleted"
  | "prospect.enriched"
  | "prospect.imported"
  | "sequence.created"
  | "sequence.updated"
  | "sequence.activated"
  | "sequence.paused"
  | "sequence.deleted"
  | "enrollment.created"
  | "enrollment.stopped"
  | "enrollment.completed"
  | "email.sent"
  | "email.opened"
  | "email.clicked"
  | "email.replied"
  | "email.bounced"
  | "template.created"
  | "template.updated"
  | "template.deleted"
  | "settings.updated"
  | "api_key.generated"
  | "api_key.regenerated"
  | "gmail.connected"
  | "gmail.disconnected"
  | "smtp.configured"
  | "user.login"
  | "user.logout"
  | "user.onboarding_completed"
  | "billing.plan_changed"
  | "billing.subscription_created"
  | "webhook.received"
  | "export.csv";

export type ActivityLogEntry = {
  user_id: string;
  action: ActivityAction;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
};

/**
 * Log an activity event (fire-and-forget — never blocks the caller)
 */
export async function logActivity(entry: ActivityLogEntry): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("activity_log").insert({
      user_id: entry.user_id,
      action: entry.action,
      resource_type: entry.resource_type || entry.action.split(".")[0],
      resource_id: entry.resource_id || null,
      metadata: entry.metadata || {},
      ip_address: entry.ip_address || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Never throw — activity logging is non-critical
    console.error("[Activity Log] Failed to log:", err);
  }
}

/**
 * Batch log multiple activities
 */
export async function logActivities(entries: ActivityLogEntry[]): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const rows = entries.map((entry) => ({
      user_id: entry.user_id,
      action: entry.action,
      resource_type: entry.resource_type || entry.action.split(".")[0],
      resource_id: entry.resource_id || null,
      metadata: entry.metadata || {},
      ip_address: entry.ip_address || null,
      created_at: new Date().toISOString(),
    }));

    await supabase.from("activity_log").insert(rows);
  } catch (err) {
    console.error("[Activity Log] Batch log failed:", err);
  }
}

/**
 * Get recent activity for a user (for activity feed UI)
 */
export async function getRecentActivity(
  userId: string,
  limit = 50
): Promise<Array<{
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}>> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return [];

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data } = await supabase
      .from("activity_log")
      .select("id, action, resource_type, resource_id, metadata, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data as any[]) || [];
  } catch {
    return [];
  }
}
