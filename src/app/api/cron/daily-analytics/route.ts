import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Cron Job: Daily Analytics Aggregator
 * Schedule: Once daily at midnight UTC
 * Pre-computes daily stats for fast dashboard loading
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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

  // Get yesterday's date (we aggregate the completed day)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split("T")[0];
  const dayStart = `${dateStr}T00:00:00.000Z`;
  const dayEnd = `${dateStr}T23:59:59.999Z`;

  // Get all active users
  const { data: users } = await supabase
    .from("users")
    .select("id");

  if (!users) {
    return NextResponse.json({ error: "No users found" }, { status: 500 });
  }

  let aggregated = 0;

  for (const user of users) {
    try {
      // Count emails sent
      const { count: emailsSent } = await supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "sent")
        .gte("sent_at", dayStart)
        .lte("sent_at", dayEnd);

      // Count opens
      const { count: emailsOpened } = await supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("first_opened_at", dayStart)
        .lte("first_opened_at", dayEnd);

      // Count clicks
      const { count: emailsClicked } = await supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("first_clicked_at", dayStart)
        .lte("first_clicked_at", dayEnd);

      // Count replies
      const { count: emailsReplied } = await supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("has_reply", true)
        .gte("reply_received_at", dayStart)
        .lte("reply_received_at", dayEnd);

      // Count bounces
      const { count: emailsBounced } = await supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "bounced")
        .gte("created_at", dayStart)
        .lte("created_at", dayEnd);

      // Count positive replies
      const { count: positiveReplies } = await supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("reply_category", "interested")
        .gte("reply_received_at", dayStart)
        .lte("reply_received_at", dayEnd);

      // Count meetings booked
      const { count: meetingsBooked } = await supabase
        .from("prospects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "meeting_booked")
        .gte("updated_at", dayStart)
        .lte("updated_at", dayEnd);

      // Count prospects added
      const { count: prospectsAdded } = await supabase
        .from("prospects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", dayStart)
        .lte("created_at", dayEnd);

      // Upsert analytics record
      await supabase.from("analytics_daily").upsert(
        {
          user_id: user.id,
          date: dateStr,
          emails_sent: emailsSent || 0,
          emails_opened: emailsOpened || 0,
          emails_clicked: emailsClicked || 0,
          emails_replied: emailsReplied || 0,
          emails_bounced: emailsBounced || 0,
          positive_replies: positiveReplies || 0,
          meetings_booked: meetingsBooked || 0,
          prospects_added: prospectsAdded || 0,
        },
        { onConflict: "user_id,date" }
      );

      aggregated++;
    } catch (error) {
      console.error(
        `[Cron] Analytics aggregation failed for user ${user.id}:`,
        error
      );
    }
  }

  return NextResponse.json({
    usersProcessed: aggregated,
    date: dateStr,
    timestamp: new Date().toISOString(),
  });
}
