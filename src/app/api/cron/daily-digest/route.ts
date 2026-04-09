import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendDailyDigest } from "@/lib/email/notifications";

/**
 * Cron Job: Daily Digest Notifications
 * Schedule: Every day at 8:00 AM UTC
 * Sends a daily performance summary to users who have notify_daily_digest enabled.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Yesterday's date range
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split("T")[0];
  const dayStart = `${dateStr}T00:00:00.000Z`;
  const dayEnd = `${dateStr}T23:59:59.999Z`;

  // Get users who have daily digest enabled
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email, full_name, notify_daily_digest")
    .eq("notify_daily_digest", true);

  if (usersError || !users) {
    return NextResponse.json(
      { error: usersError?.message || "No users found" },
      { status: 500 }
    );
  }

  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.email) {
      skipped++;
      continue;
    }

    try {
      // Gather yesterday's stats for this user
      const { count: emailsSent } = await supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "sent")
        .gte("sent_at", dayStart)
        .lte("sent_at", dayEnd);

      const { count: emailsOpened } = await supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("first_opened_at", dayStart)
        .lte("first_opened_at", dayEnd);

      const { count: emailsReplied } = await supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("has_reply", true)
        .gte("reply_received_at", dayStart)
        .lte("reply_received_at", dayEnd);

      const { count: emailsBounced } = await supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "bounced")
        .gte("created_at", dayStart)
        .lte("created_at", dayEnd);

      const { count: positiveReplies } = await supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("reply_category", "interested")
        .gte("reply_received_at", dayStart)
        .lte("reply_received_at", dayEnd);

      const { count: prospectsAdded } = await supabase
        .from("prospects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", dayStart)
        .lte("created_at", dayEnd);

      // Skip sending if zero activity
      const totalActivity = (emailsSent || 0) + (emailsReplied || 0) + (prospectsAdded || 0);
      if (totalActivity === 0) {
        skipped++;
        continue;
      }

      // Get top replies for the digest
      const { data: replyEmails } = await supabase
        .from("emails")
        .select("reply_body, reply_category, subject, prospects(first_name, last_name)")
        .eq("user_id", user.id)
        .eq("has_reply", true)
        .gte("reply_received_at", dayStart)
        .lte("reply_received_at", dayEnd)
        .order("reply_received_at", { ascending: false })
        .limit(3);

      const topReplies = (replyEmails || []).map((e: Record<string, unknown>) => ({
        prospectName: [
          (e.prospects as Record<string, unknown>)?.first_name,
          (e.prospects as Record<string, unknown>)?.last_name,
        ]
          .filter(Boolean)
          .join(" ") || "Unknown",
        category: (e.reply_category as string) || "unknown",
        snippet: (e.reply_body as string) || "",
      }));

      await sendDailyDigest(user.email, {
        userName: user.full_name || "User",
        date: dateStr,
        stats: {
          emailsSent: emailsSent || 0,
          emailsOpened: emailsOpened || 0,
          emailsReplied: emailsReplied || 0,
          emailsBounced: emailsBounced || 0,
          positiveReplies: positiveReplies || 0,
          prospectsAdded: prospectsAdded || 0,
        },
        topReplies,
      });

      sent++;
    } catch (error) {
      console.error(
        `[Cron] Daily digest failed for user ${user.id}:`,
        error
      );
    }
  }

  return NextResponse.json({
    sent,
    skipped,
    totalUsers: users.length,
    date: dateStr,
    timestamp: new Date().toISOString(),
  });
}
