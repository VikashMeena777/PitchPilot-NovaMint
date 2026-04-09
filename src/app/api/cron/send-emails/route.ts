import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

/**
 * Cron Job: Process Email Queue
 * Schedule: Every 5 minutes
 * Sends queued emails that are past their scheduled_at time.
 *
 * Sender strategy per-user:
 *  1. Gmail API — if user has gmail_connected = true
 *  2. Resend    — default fallback
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
      "*, prospects(first_name, last_name, email), users(sending_email, sending_name, daily_send_limit, created_at, gmail_connected, gmail_email)"
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

      // Warm-up enforcement
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

      const senderName = email.from_name || email.users?.sending_name || "PitchPilot";

      // ─── Wrap in professional HTML template ────────────────────────
      const { formatOutreachHtml } = await import("@/lib/email/sender");

      // Fetch user profile for template context
      const { data: userProfile } = await supabase
        .from("users")
        .select("company_name, mailing_address, sending_email")
        .eq("id", email.user_id)
        .single();

      const rawBody = email.body_text || email.body_html || "";
      const professionalHtml = formatOutreachHtml(rawBody, {
        senderName,
        companyName: (userProfile as Record<string, unknown>)?.company_name as string || "",
        fromEmail: (userProfile as Record<string, unknown>)?.sending_email as string || email.from_email || "",
        mailingAddress: (userProfile as Record<string, unknown>)?.mailing_address as string || "",
      });

      // ─── Generate tracking pixel ──────────────────────────────────
      const trackingPixelId = randomUUID();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const trackingPixelUrl = `${appUrl}/api/emails/track/open/${trackingPixelId}`;
      const trackingPixelTag = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />`;

      const bodyHtmlWithPixel = professionalHtml.includes("</body>")
        ? professionalHtml.replace("</body>", `${trackingPixelTag}</body>`)
        : `${professionalHtml}${trackingPixelTag}`;

      const userHasGmail = email.users?.gmail_connected && email.users?.gmail_email;
      let sendResult: { success: boolean; messageId?: string; error?: string };

      if (userHasGmail) {
        // Strategy 1: Gmail API (primary)
        const { sendViaGmail } = await import("@/lib/email/gmail");
        const gmailResult = await sendViaGmail(email.user_id, {
          to: email.to_email,
          subject: email.subject,
          body: email.body_text || "",
          bodyHtml: bodyHtmlWithPixel,
          senderName,
        });

        if (gmailResult.success) {
          sendResult = gmailResult;
        } else {
          // Gmail failed — fall back to Resend
          console.warn(`[Cron] Gmail failed for ${email.id}, falling back to Resend: ${gmailResult.error}`);
          sendResult = await sendViaResendCron(email, resendApiKey, supabase);
        }
      } else {
        // Strategy 2: Resend (default)
        sendResult = await sendViaResendCron(email, resendApiKey, supabase);
      }

      if (!sendResult.success) {
        throw new Error(sendResult.error || "Send failed");
      }

      // Update email status to sent + store tracking pixel ID
      await supabase
        .from("emails")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          resend_id: sendResult.messageId || null,
          tracking_pixel_id: trackingPixelId,
          body_html: bodyHtmlWithPixel,
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

      // Random delay between sends (1-3 seconds)
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

/**
 * Resend fallback for cron sends
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendViaResendCron(
  email: any,
  resendApiKey: string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
) {
  if (!resendApiKey) {
    return { success: false, error: "No email provider configured (RESEND_API_KEY missing)" };
  }

  const defaultFrom = process.env.DEFAULT_FROM_EMAIL || "outreach@novamintnetworks.in";
  const fromEmail: string = email.from_email || defaultFrom;
  const fromName: string =
    email.from_name || email.users?.sending_name || "PitchPilot";

  // Fetch full user profile for template context
  const { data: userProfile } = await supabase
    .from("users")
    .select("company_name, mailing_address")
    .eq("id", email.user_id)
    .single();

  const { sendEmail: sendPremiumEmail } = await import("@/lib/email/sender");

  return sendPremiumEmail({
    to: email.to_email,
    from: fromEmail,
    senderName: fromName,
    subject: email.subject,
    body: email.body_text || "",
    bodyHtml: email.body_html || undefined,
    companyName: (userProfile as any)?.company_name || "",
    mailingAddress: (userProfile as any)?.mailing_address || "",
    trackOpens: true,
    emailId: email.id,
  });
}

