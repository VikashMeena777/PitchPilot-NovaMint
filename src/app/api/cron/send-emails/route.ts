import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Cron Job: Process Email Queue
 * Schedule: Every 5 minutes
 * Sends queued emails that are past their scheduled_at time
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch queued emails ready to send
  const { data: queuedEmails, error: fetchError } = await supabase
    .from("emails")
    .select(
      "*, prospects(first_name, last_name, email), users(sending_email, sending_name, daily_send_limit, created_at)"
    )
    .eq("status", "queued")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(10); // Process max 10 per run

  if (fetchError || !queuedEmails) {
    return NextResponse.json(
      { error: fetchError?.message || "No emails found" },
      { status: 500 }
    );
  }

  let sent = 0;
  let failed = 0;

  for (const email of queuedEmails) {
    try {
      // Check daily send limit
      const today = new Date().toISOString().split("T")[0];
      const { count: sentToday } = await supabase
        .from("emails")
        .select("id", { count: "exact", head: true })
        .eq("user_id", email.user_id)
        .eq("status", "sent")
        .gte("sent_at", `${today}T00:00:00`)
        .lte("sent_at", `${today}T23:59:59`);

      // Warm-up enforcement: gradually increase sending limits for new accounts
      const { canSendMore } = await import("@/lib/email/warmup");
      const userCreatedAt = email.users?.created_at || new Date().toISOString();
      const dailyLimit = email.users?.daily_send_limit || 50;
      const warmupCheck = canSendMore(sentToday || 0, userCreatedAt, dailyLimit);

      if (!warmupCheck.allowed) {
        console.log(
          `[Cron] Daily limit reached for user ${email.user_id} (${sentToday}/${warmupCheck.limit}, ${warmupCheck.stage})`
        );
        continue;
      }

      if (!resendApiKey) {
        // Mark as failed if no email provider
        await supabase
          .from("emails")
          .update({
            status: "failed",
            error_message: "No email provider configured (RESEND_API_KEY missing)",
          })
          .eq("id", email.id);
        failed++;
        continue;
      }

      // Send via the premium email sender
      const defaultFrom = process.env.DEFAULT_FROM_EMAIL || "outreach@novamintnetworks.in";
      const fromEmail = email.from_email || defaultFrom;
      const fromName =
        email.from_name || email.users?.sending_name || "PitchPilot";

      // Fetch full user profile for template context
      const { data: userProfile } = await supabase
        .from("users")
        .select("company_name, mailing_address")
        .eq("id", email.user_id)
        .single();

      // Build premium HTML using the email sender's template
      const { sendEmail: sendPremiumEmail } = await import("@/lib/email/sender");

      const sendResult = await sendPremiumEmail({
        to: email.to_email,
        from: fromEmail,
        senderName: fromName,
        subject: email.subject,
        body: email.body_text || "",
        bodyHtml: email.body_html || undefined,
        companyName: userProfile?.company_name || "",
        mailingAddress: userProfile?.mailing_address || "",
        trackOpens: true,
        emailId: email.id,
      });

      if (!sendResult.success) {
        throw new Error(sendResult.error || "Send failed");
      }

      // Update email status to sent
      await supabase
        .from("emails")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          resend_id: sendResult.messageId || null,
        })
        .eq("id", email.id);

      // Update prospect
      await supabase
        .from("prospects")
        .update({
          status: "contacted",
          last_contacted_at: new Date().toISOString(),
          total_emails_sent: (email.prospects?.total_emails_sent || 0) + 1,
        })
        .eq("id", email.prospect_id);

      sent++;

      // Random delay between sends (45-180 seconds simulated by smaller delay here)
      const delay = Math.floor(Math.random() * 3000) + 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`[Cron] Failed to send email ${email.id}:`, error);

      await supabase
        .from("emails")
        .update({
          status: "failed",
          error_message:
            error instanceof Error ? error.message : "Unknown error",
          retry_count: (email.retry_count || 0) + 1,
        })
        .eq("id", email.id);

      failed++;
    }
  }

  return NextResponse.json({
    processed: queuedEmails.length,
    sent,
    failed,
    timestamp: new Date().toISOString(),
  });
}
