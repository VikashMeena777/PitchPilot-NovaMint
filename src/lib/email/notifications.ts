import { render } from "@react-email/render";
import { sendEmail } from "./sender";
import {
  ReplyNotificationEmail,
  DailyDigestEmail,
  WeeklyReportEmail,
  type ReplyNotificationProps,
  type DailyDigestProps,
  type WeeklyReportProps,
} from "./notification-templates";

const defaultFrom = process.env.DEFAULT_FROM_EMAIL || "notifications@novamintnetworks.in";

/**
 * Send a reply notification email to the user
 * Only sends if notify_replies is enabled
 */
export async function sendReplyNotification(
  userEmail: string,
  props: ReplyNotificationProps
) {
  const html = await render(ReplyNotificationEmail(props));

  return sendEmail({
    to: userEmail,
    from: defaultFrom,
    senderName: "PitchPilot",
    subject: `🎯 ${props.prospectName} replied to your outreach`,
    body: `${props.prospectName} (${props.prospectEmail}) replied to "${props.subject}". Category: ${props.replyCategory}`,
    bodyHtml: html,
    trackOpens: false,
    trackClicks: false,
  });
}

/**
 * Send daily digest email to the user
 * Only sends if notify_daily_digest is enabled
 */
export async function sendDailyDigest(
  userEmail: string,
  props: DailyDigestProps
) {
  const html = await render(DailyDigestEmail(props));

  return sendEmail({
    to: userEmail,
    from: defaultFrom,
    senderName: "PitchPilot",
    subject: `📊 Daily Digest — ${props.stats.emailsSent} sent, ${props.stats.positiveReplies} hot leads`,
    body: `Your daily outreach summary for ${props.date}`,
    bodyHtml: html,
    trackOpens: false,
    trackClicks: false,
  });
}

/**
 * Send weekly report email to the user
 * Only sends if notify_weekly_report is enabled
 */
export async function sendWeeklyReport(
  userEmail: string,
  props: WeeklyReportProps
) {
  const html = await render(WeeklyReportEmail(props));

  return sendEmail({
    to: userEmail,
    from: defaultFrom,
    senderName: "PitchPilot",
    subject: `📈 Weekly Report — ${props.stats.emailsSent} emails, ${props.stats.positiveReplies} leads, ${props.stats.meetingsBooked} meetings`,
    body: `Your weekly performance report for ${props.weekRange}`,
    bodyHtml: html,
    trackOpens: false,
    trackClicks: false,
  });
}
