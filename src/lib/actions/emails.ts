"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail, formatOutreachHtml } from "@/lib/email/sender";
import { sendViaGmail } from "@/lib/email/gmail";
import { logActivity } from "@/lib/utils/activity-logger";
import { randomUUID } from "crypto";

/**
 * Send a single email to a prospect and track it in the database.
 *
 * Sender Strategy (in priority order):
 *  1. Gmail API — if the user has connected their Gmail account
 *  2. Resend — default fallback via verified domain
 */
export async function sendProspectEmail(params: {
  prospectId: string;
  subject: string;
  body: string;
  sequenceId?: string;
  sequenceStepId?: string;
}): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "Database not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Fetch prospect
  const { data: prospect } = await supabase
    .from("prospects")
    .select("email, first_name, last_name, total_emails_sent")
    .eq("id", params.prospectId)
    .eq("user_id", user.id)
    .single();

  if (!prospect) return { success: false, error: "Prospect not found" };

  // Fetch user profile — include Gmail fields for routing decision
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, sending_email, sending_name, company_name, mailing_address, gmail_connected, gmail_email")
    .eq("id", user.id)
    .single();

  const senderName = profile?.sending_name || profile?.full_name || "PitchPilot User";
  const userEmail = profile?.sending_email || user.email;
  const companyName = (profile as Record<string, unknown>)?.company_name as string || "";
  const mailingAddress = (profile as Record<string, unknown>)?.mailing_address as string || "";

  // ─── Build professional HTML template ────────────────────────
  // The editor body is raw HTML — we wrap it in our premium email
  // template so it looks polished regardless of Gmail vs Resend
  const professionalHtml = formatOutreachHtml(params.body, {
    senderName,
    companyName,
    fromEmail: userEmail || "",
    mailingAddress,
  });

  // ─── Generate tracking pixel ─────────────────────────────────
  const trackingPixelId = randomUUID();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const trackingPixelUrl = `${appUrl}/api/emails/track/open/${trackingPixelId}`;
  const trackingPixelTag = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />`;

  // Inject tracking pixel into the professional HTML
  const bodyWithTracking = professionalHtml.includes("</body>")
    ? professionalHtml.replace("</body>", `${trackingPixelTag}</body>`)
    : `${professionalHtml}${trackingPixelTag}`;

  let sendResult: { success: boolean; messageId?: string; error?: string };
  let sentViaGmail = false;

  // ─── Strategy 1: Gmail (primary when connected) ───────────────────
  if (profile?.gmail_connected && profile?.gmail_email) {
    const gmailResult = await sendViaGmail(user.id, {
      to: prospect.email,
      subject: params.subject,
      body: bodyWithTracking,
      bodyHtml: bodyWithTracking,
      senderName,
      replyTo: userEmail,
    });

    if (gmailResult.success) {
      sendResult = gmailResult;
      sentViaGmail = true;
    } else {
      // Gmail failed — fall through to Resend as backup
      console.warn(`[Email] Gmail send failed, falling back to Resend: ${gmailResult.error}`);
      sendResult = await sendViaResend(prospect.email, senderName, userEmail, { ...params, body: bodyWithTracking, bodyHtml: bodyWithTracking }, profile, user.id);
    }
  } else {
    // ─── Strategy 2: Resend (default) ─────────────────────────────
    sendResult = await sendViaResend(prospect.email, senderName, userEmail, { ...params, body: bodyWithTracking, bodyHtml: bodyWithTracking }, profile, user.id);
  }

  if (!sendResult.success) {
    return { success: false, error: sendResult.error || "Send failed" };
  }

  // Record email in database — with tracking pixel ID
  await supabase.from("emails").insert({
    user_id: user.id,
    prospect_id: params.prospectId,
    to_email: prospect.email,
    sequence_id: params.sequenceId || null,
    sequence_step_id: params.sequenceStepId || null,
    subject: params.subject,
    body_html: bodyWithTracking,
    body_text: params.body.replace(/<[^>]*>/g, ""),
    status: "sent",
    sent_at: new Date().toISOString(),
    resend_id: sendResult.messageId || null,
    tracking_pixel_id: trackingPixelId,
  });

  // Update prospect email count
  try {
    await supabase
      .from("prospects")
      .update({
        total_emails_sent: (prospect.total_emails_sent || 0) + 1,
        last_contacted_at: new Date().toISOString(),
      })
      .eq("id", params.prospectId)
      .eq("user_id", user.id);
  } catch {
    // Silently fail — non-critical
  }

  // Update prospect status if it's still "new"
  await supabase
    .from("prospects")
    .update({ status: "contacted" })
    .eq("id", params.prospectId)
    .eq("user_id", user.id)
    .eq("status", "new");

  // ─── Activity Logging (fire-and-forget) ────────────────────────
  logActivity({
    user_id: user.id,
    action: "email.sent",
    resource_type: "email",
    resource_id: params.prospectId,
    metadata: {
      to: prospect.email,
      subject: params.subject,
      via: sentViaGmail ? "gmail" : "resend",
      sequence_id: params.sequenceId || null,
    },
  });

  return { success: true, error: null };
}

/**
 * Send via Resend (fallback path)
 */
async function sendViaResend(
  toEmail: string,
  senderName: string,
  userEmail: string | undefined | null,
  params: { subject: string; body: string; bodyHtml?: string; prospectId: string; sequenceId?: string },
  profile: { full_name?: string; company_name?: string; mailing_address?: string } | null,
  userId: string,
) {
  const verifiedDomain = (process.env.DEFAULT_FROM_EMAIL || "outreach@novamintnetworks.in").split("@")[1];
  const namePrefix = (profile?.full_name || "outreach")
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "");
  const fromAddress = `${namePrefix}@${verifiedDomain}`;

  return sendEmail({
    to: toEmail,
    from: fromAddress,
    senderName,
    subject: params.subject,
    body: params.body,
    bodyHtml: params.bodyHtml,
    replyTo: userEmail || undefined,
    companyName: profile?.company_name || "",
    mailingAddress: profile?.mailing_address || "",
    tags: [
      { name: "prospect_id", value: params.prospectId },
      { name: "user_id", value: userId },
      ...(params.sequenceId ? [{ name: "sequence_id", value: params.sequenceId }] : []),
    ],
  });
}

/**
 * Get email sending stats for the current user
 */
export async function getEmailStats(): Promise<{
  totalSent: number;
  totalOpened: number;
  totalReplied: number;
  openRate: number;
  replyRate: number;
}> {
  const supabase = await createClient();
  if (!supabase) return { totalSent: 0, totalOpened: 0, totalReplied: 0, openRate: 0, replyRate: 0 };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { totalSent: 0, totalOpened: 0, totalReplied: 0, openRate: 0, replyRate: 0 };

  const { count: totalSent } = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "sent");

  const { count: totalOpened } = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gt("open_count", 0);

  const { count: totalReplied } = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("has_reply", true);

  const sent = totalSent || 0;
  const opened = totalOpened || 0;
  const replied = totalReplied || 0;

  return {
    totalSent: sent,
    totalOpened: opened,
    totalReplied: replied,
    openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
    replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
  };
}
