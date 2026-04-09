import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { categorizeReply } from "@/lib/ai/engine";

/**
 * Cron Job: Process Replies
 * Schedule: Every 10 minutes
 * Detects replies via Resend webhooks or polling,
 * categorizes them with AI, and stops sequences accordingly.
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

  // Find emails that have replies but haven't been categorized yet
  const { data: uncategorized, error: fetchError } = await supabase
    .from("emails")
    .select(
      "*, prospects(first_name, last_name, email, status)"
    )
    .eq("has_reply", true)
    .is("reply_category", null)
    .order("reply_received_at", { ascending: true })
    .limit(20);

  if (fetchError || !uncategorized) {
    return NextResponse.json(
      { error: fetchError?.message || "No replies found" },
      { status: 500 }
    );
  }

  let processed = 0;
  let sequencesStopped = 0;

  for (const email of uncategorized) {
    try {
      const prospectName = [
        email.prospects?.first_name,
        email.prospects?.last_name,
      ]
        .filter(Boolean)
        .join(" ") || "Unknown";

      // Categorize reply using AI
      const categorization = await categorizeReply({
        replyBody: email.reply_body || "",
        originalSubject: email.subject || "",
        originalBody: email.body_text || email.body_html || "",
        prospectName,
      });

      if (!categorization) {
        console.warn(`[Cron] Could not categorize reply for email ${email.id}`);
        continue;
      }

      // Update email with categorization
      await supabase
        .from("emails")
        .update({
          reply_category: categorization.category,
          reply_sentiment: categorization.confidence > 0.7 ? "positive" : "neutral",
        })
        .eq("id", email.id);

      // Update prospect status based on category
      const statusMap: Record<string, string> = {
        interested: "interested",
        not_interested: "not_interested",
        unsubscribe: "unsubscribed",
        ooo: "contacted", // Keep as contacted, will re-engage
        wrong_person: "not_interested",
        ask_later: "contacted",
      };

      const newStatus = statusMap[categorization.category];
      if (newStatus && email.prospect_id) {
        await supabase
          .from("prospects")
          .update({
            status: newStatus,
            ...(categorization.category === "unsubscribe"
              ? { unsubscribed: true }
              : {}),
          })
          .eq("id", email.prospect_id);
      }

      // Stop active sequences if needed
      if (categorization.should_stop_sequence && email.prospect_id) {
        const { data: activeEnrollments } = await supabase
          .from("sequence_enrollments")
          .select("id")
          .eq("prospect_id", email.prospect_id)
          .eq("status", "active");

        if (activeEnrollments && activeEnrollments.length > 0) {
          const stopReason =
            categorization.category === "interested"
              ? "Prospect replied with interest"
              : categorization.category === "unsubscribe"
              ? "Prospect unsubscribed"
              : categorization.category === "not_interested"
              ? "Prospect not interested"
              : `Reply categorized as: ${categorization.category}`;

          await supabase
            .from("sequence_enrollments")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .in(
              "id",
              activeEnrollments.map((e) => e.id)
            );

          sequencesStopped += activeEnrollments.length;
          console.log(
            `[Cron] Stopped ${activeEnrollments.length} sequences for prospect ${email.prospect_id}: ${stopReason}`
          );
        }
      }

      processed++;
    } catch (error) {
      console.error(
        `[Cron] Error processing reply for email ${email.id}:`,
        error
      );
    }
  }

  return NextResponse.json({
    processed,
    sequencesStopped,
    total: uncategorized.length,
    timestamp: new Date().toISOString(),
  });
}
