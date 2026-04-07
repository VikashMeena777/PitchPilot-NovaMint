import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/activity
 * Get recent activity log for the current user
 *
 * Query params:
 * - limit: number (default 50, max 200)
 * - action: filter by action type (e.g., "email.sent")
 * - resource_type: filter by resource (e.g., "prospect")
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const action = searchParams.get("action");
  const resourceType = searchParams.get("resource_type");

  let query = supabase
    .from("activity_log")
    .select("id, action, resource_type, resource_id, metadata, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (action) {
    query = query.eq("action", action);
  }
  if (resourceType) {
    query = query.eq("resource_type", resourceType);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Format for display
  const activities = (data || []).map((item) => ({
    id: item.id,
    action: item.action,
    resource_type: item.resource_type,
    resource_id: item.resource_id,
    metadata: item.metadata,
    created_at: item.created_at,
    display: formatActivityMessage(item.action, item.metadata as Record<string, unknown>),
  }));

  return NextResponse.json({ activities });
}

function formatActivityMessage(action: string, metadata: Record<string, unknown>): string {
  const messages: Record<string, string> = {
    "prospect.created": `Added prospect ${metadata?.email || ""}`,
    "prospect.updated": `Updated prospect ${metadata?.email || ""}`,
    "prospect.deleted": `Deleted prospect`,
    "prospect.enriched": `Enriched prospect with ${metadata?.source || "data"}`,
    "prospect.imported": `Imported ${metadata?.imported || 0} prospects`,
    "sequence.created": `Created sequence "${metadata?.name || ""}"`,
    "sequence.activated": `Activated sequence "${metadata?.name || ""}"`,
    "sequence.paused": `Paused sequence "${metadata?.name || ""}"`,
    "sequence.deleted": `Deleted sequence`,
    "enrollment.created": `Enrolled prospect in sequence`,
    "enrollment.stopped": `Stopped enrollment: ${metadata?.reason || "manual"}`,
    "enrollment.completed": `Prospect completed sequence`,
    "email.sent": `Sent email to ${metadata?.to || "prospect"}`,
    "email.opened": `Email opened by ${metadata?.email || "prospect"}`,
    "email.clicked": `Link clicked by ${metadata?.email || "prospect"}`,
    "email.replied": `Reply received (${metadata?.category || "unknown"})`,
    "email.bounced": `Email bounced (${metadata?.type || "unknown"})`,
    "template.created": `Created email template`,
    "template.updated": `Updated email template`,
    "settings.updated": `Updated ${metadata?.section || "settings"}`,
    "api_key.generated": `Generated API key`,
    "gmail.connected": `Connected Gmail account`,
    "gmail.disconnected": `Disconnected Gmail account`,
    "billing.plan_changed": `Changed plan to ${metadata?.plan || "unknown"}`,
    "webhook.received": `Received webhook: ${metadata?.action || ""}`,
    "export.csv": `Exported ${metadata?.count || 0} records`,
  };

  return messages[action] || action.replace(/\./g, " ");
}
