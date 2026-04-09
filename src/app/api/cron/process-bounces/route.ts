import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Cron Job: Process Bounces
 * Schedule: Every 30 minutes
 * Checks Resend webhook data for bounced emails and updates prospect status
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

  // Process emails that bounced (from Resend webhook updates)
  const { data: bouncedEmails, error: fetchError } = await supabase
    .from("emails")
    .select("id, prospect_id, user_id, to_email, bounce_type")
    .not("bounce_type", "is", null)
    .is("bounced_at", null) // Not yet processed
    .limit(50);

  if (fetchError || !bouncedEmails) {
    return NextResponse.json(
      { error: fetchError?.message || "No bounced emails", processed: 0 },
      { status: 200 }
    );
  }

  let hardBounces = 0;
  let softBounces = 0;

  for (const email of bouncedEmails) {
    try {
      // Mark bounce as processed
      await supabase
        .from("emails")
        .update({ bounced_at: new Date().toISOString() })
        .eq("id", email.id);

      if (email.bounce_type === "hard") {
        // Hard bounce: mark prospect as bounced, stop all sequences
        await supabase
          .from("prospects")
          .update({ status: "bounced" })
          .eq("id", email.prospect_id);

        // Stop any active sequence enrollments
        await supabase
          .from("sequence_enrollments")
          .update({
            status: "stopped",
            stopped_at: new Date().toISOString(),
            stopped_reason: "email_bounced",
          })
          .eq("prospect_id", email.prospect_id)
          .eq("status", "active");

        hardBounces++;
      } else {
        // Soft bounce: increment retry, will be retried
        softBounces++;
      }
    } catch (error) {
      console.error(
        `[Cron] Bounce processing failed for email ${email.id}:`,
        error
      );
    }
  }

  return NextResponse.json({
    total: bouncedEmails.length,
    hardBounces,
    softBounces,
    timestamp: new Date().toISOString(),
  });
}
