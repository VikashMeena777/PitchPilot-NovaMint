"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sender";

/**
 * Send a single email to a prospect and track it in the database
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

  // Fetch user profile for sender info
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, sending_email, sending_name, company_name, mailing_address")
    .eq("id", user.id)
    .single();

  const senderName = profile?.sending_name || profile?.full_name || "PitchPilot User";
  
  // Build a personalized from address using the verified domain
  // e.g., "Vikash Meena <vikash@novamintnetworks.in>"
  const verifiedDomain = (process.env.DEFAULT_FROM_EMAIL || "outreach@novamintnetworks.in").split("@")[1];
  const namePrefix = (profile?.full_name || user.email?.split("@")[0] || "outreach")
    .toLowerCase()
    .replace(/\s+/g, ".")   // "Vikash Meena" → "vikash.meena"
    .replace(/[^a-z0-9.]/g, ""); // remove special chars
  const fromAddress = `${namePrefix}@${verifiedDomain}`;
  const userEmail = profile?.sending_email || user.email;

  // Send via Resend
  const result = await sendEmail({
    to: prospect.email,
    from: fromAddress,
    senderName,
    subject: params.subject,
    body: params.body,
    replyTo: userEmail, // replies go to the user's actual email
    companyName: profile?.company_name || "",
    mailingAddress: profile?.mailing_address || "",
    tags: [
      { name: "prospect_id", value: params.prospectId },
      { name: "user_id", value: user.id },
      ...(params.sequenceId ? [{ name: "sequence_id", value: params.sequenceId }] : []),
    ],
  });

  if (!result.success) {
    return { success: false, error: result.error || "Send failed" };
  }

  // Record email in database
  await supabase.from("emails").insert({
    user_id: user.id,
    prospect_id: params.prospectId,
    to_email: prospect.email,
    sequence_id: params.sequenceId || null,
    sequence_step_id: params.sequenceStepId || null,
    subject: params.subject,
    body_html: params.body,
    body_text: params.body.replace(/<[^>]*>/g, ""),
    status: "sent",
    sent_at: new Date().toISOString(),
    resend_id: result.messageId || null,
  });

  // Update prospect email count (manual increment)
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

  return { success: true, error: null };
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
