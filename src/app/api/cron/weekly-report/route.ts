import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWeeklyReport } from "@/lib/email/notifications";

/**
 * Cron Job: Weekly Report Notifications
 * Schedule: Every Monday at 9:00 AM UTC
 * Sends a weekly performance report to users who have notify_weekly_report enabled.
 * Includes comparison with the previous week for trend tracking.
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

  // This week = last 7 days (Mon–Sun)
  const now = new Date();
  const thisWeekEnd = new Date(now);
  thisWeekEnd.setDate(now.getDate() - 1); // yesterday (Sunday)
  const thisWeekStart = new Date(thisWeekEnd);
  thisWeekStart.setDate(thisWeekEnd.getDate() - 6); // last Monday

  // Previous week = the 7 days before that
  const prevWeekEnd = new Date(thisWeekStart);
  prevWeekEnd.setDate(thisWeekStart.getDate() - 1);
  const prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setDate(prevWeekEnd.getDate() - 6);

  const thisStart = thisWeekStart.toISOString().split("T")[0] + "T00:00:00.000Z";
  const thisEnd = thisWeekEnd.toISOString().split("T")[0] + "T23:59:59.999Z";
  const prevStart = prevWeekStart.toISOString().split("T")[0] + "T00:00:00.000Z";
  const prevEnd = prevWeekEnd.toISOString().split("T")[0] + "T23:59:59.999Z";

  // Format date range for display
  const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekRange = `${formatDate(thisWeekStart)} – ${formatDate(thisWeekEnd)}, ${thisWeekEnd.getFullYear()}`;

  // Get users who have weekly report enabled
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email, full_name, notify_weekly_report")
    .eq("notify_weekly_report", true);

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
      // Helper to count emails in a date range
      async function countEmails(
        userId: string,
        filters: Record<string, unknown>,
        rangeStart: string,
        rangeEnd: string,
        dateField = "sent_at"
      ) {
        let query = supabase
          .from("emails")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte(dateField, rangeStart)
          .lte(dateField, rangeEnd);

        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value);
        }

        const { count } = await query;
        return count || 0;
      }

      // This week stats
      const emailsSent = await countEmails(user.id, { status: "sent" }, thisStart, thisEnd);
      const emailsOpened = await countEmails(user.id, {}, thisStart, thisEnd, "first_opened_at");
      const emailsReplied = await countEmails(user.id, { has_reply: true }, thisStart, thisEnd, "reply_received_at");
      const emailsBounced = await countEmails(user.id, { status: "bounced" }, thisStart, thisEnd, "created_at");
      const positiveReplies = await countEmails(user.id, { reply_category: "interested" }, thisStart, thisEnd, "reply_received_at");

      const { count: meetingsBooked } = await supabase
        .from("prospects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "meeting_booked")
        .gte("updated_at", thisStart)
        .lte("updated_at", thisEnd);

      const { count: prospectsAdded } = await supabase
        .from("prospects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", thisStart)
        .lte("created_at", thisEnd);

      // Previous week stats (for trend comparison)
      const prevEmailsSent = await countEmails(user.id, { status: "sent" }, prevStart, prevEnd);
      const prevEmailsOpened = await countEmails(user.id, {}, prevStart, prevEnd, "first_opened_at");
      const prevEmailsReplied = await countEmails(user.id, { has_reply: true }, prevStart, prevEnd, "reply_received_at");

      // Skip if zero activity both weeks
      if (emailsSent === 0 && prevEmailsSent === 0) {
        skipped++;
        continue;
      }

      await sendWeeklyReport(user.email, {
        userName: user.full_name || "User",
        weekRange,
        stats: {
          emailsSent,
          emailsOpened,
          emailsReplied,
          emailsBounced,
          positiveReplies,
          meetingsBooked: meetingsBooked || 0,
          prospectsAdded: prospectsAdded || 0,
        },
        prevStats: {
          emailsSent: prevEmailsSent,
          emailsOpened: prevEmailsOpened,
          emailsReplied: prevEmailsReplied,
        },
      });

      sent++;
    } catch (error) {
      console.error(
        `[Cron] Weekly report failed for user ${user.id}:`,
        error
      );
    }
  }

  return NextResponse.json({
    sent,
    skipped,
    totalUsers: users.length,
    weekRange,
    timestamp: new Date().toISOString(),
  });
}
