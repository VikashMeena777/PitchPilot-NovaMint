import { Resend } from "resend";
import crypto from "crypto";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export type SendEmailParams = {
  to: string;
  from?: string;
  senderName?: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
  // Tracking
  trackOpens?: boolean;
  trackClicks?: boolean;
  emailId?: string; // For click tracking
};

export type SendEmailResult = {
  success: boolean;
  messageId?: string;
  trackingPixelId?: string;
  error?: string;
};

/**
 * Generate a unique tracking pixel ID for open tracking
 */
export function generateTrackingPixelId(): string {
  return crypto.randomUUID();
}

/**
 * Inject tracking pixel into HTML email
 */
function injectTrackingPixel(
  html: string,
  trackingPixelId: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const pixelUrl = `${appUrl}/api/emails/track/open/${trackingPixelId}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;width:1px;height:1px;border:0;" alt="" />`;
  // Insert before </body> if present, otherwise append
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`);
  }
  return html + pixel;
}

/**
 * Rewrite URLs in HTML for click tracking
 */
function injectClickTracking(html: string, emailId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  // Find all href URLs and wrap them
  return html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (match, url) => {
      // Don't track unsubscribe or our own tracking URLs
      if (url.includes("/api/emails/track/") || url.includes("unsubscribe")) {
        return match;
      }
      const trackUrl = `${appUrl}/api/emails/track/click?eid=${emailId}&url=${encodeURIComponent(url)}`;
      return `href="${trackUrl}"`;
    }
  );
}

/**
 * Add unsubscribe footer to HTML email (CAN-SPAM compliant)
 */
function addUnsubscribeFooter(html: string, mailingAddress?: string): string {
  const addressLine = mailingAddress
    ? `<br>${mailingAddress.replace(/\n/g, ", ")}`
    : "";
  const footer = `
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:11px;color:#999;line-height:1.5;">
      If you'd like to stop receiving these emails, simply reply with "unsubscribe" and we'll remove you immediately.${addressLine}
    </div>`;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${footer}</body>`);
  }
  return html + footer;
}

/**
 * Send a single email via Resend with tracking
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const resend = getResend();
  if (!resend) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const defaultFrom = process.env.DEFAULT_FROM_EMAIL || "outreach@novamintnetworks.in";
  const fromAddress = params.from || defaultFrom;
  const displayFrom = params.senderName
    ? `${params.senderName} <${fromAddress}>`
    : fromAddress;

  // Generate tracking pixel ID
  const trackingPixelId = generateTrackingPixelId();

  // Build HTML
  let html = params.bodyHtml || formatEmailHtml(params.body);

  // Add unsubscribe footer
  html = addUnsubscribeFooter(html);

  // Inject tracking if enabled
  if (params.trackOpens !== false) {
    html = injectTrackingPixel(html, trackingPixelId);
  }
  if (params.trackClicks !== false && params.emailId) {
    html = injectClickTracking(html, params.emailId);
  }

  try {
    const { data, error } = await resend.emails.send({
      from: displayFrom,
      to: [params.to],
      subject: params.subject,
      html,
      replyTo: params.replyTo || undefined,
      tags: params.tags || [],
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      messageId: data?.id || undefined,
      trackingPixelId,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown send error";
    console.error("[Email] Send failed:", message);
    return { success: false, error: message };
  }
}

/**
 * Send batch emails (up to 100 at a time)
 */
export async function sendBatchEmails(
  emails: SendEmailParams[]
): Promise<SendEmailResult[]> {
  const resend = getResend();
  if (!resend) {
    return emails.map(() => ({
      success: false,
      error: "RESEND_API_KEY not configured",
    }));
  }

  const batch = emails.slice(0, 100).map((e) => {
    let html = e.bodyHtml || formatEmailHtml(e.body);
    html = addUnsubscribeFooter(html);
    const trackingPixelId = generateTrackingPixelId();
    if (e.trackOpens !== false) {
      html = injectTrackingPixel(html, trackingPixelId);
    }

    return {
      from: e.senderName
        ? `${e.senderName} <${e.from || process.env.DEFAULT_FROM_EMAIL || "outreach@novamintnetworks.in"}>`
        : e.from || process.env.DEFAULT_FROM_EMAIL || "outreach@novamintnetworks.in",
      to: [e.to],
      subject: e.subject,
      html,
      replyTo: e.replyTo || undefined,
      tags: e.tags || [],
    };
  });

  try {
    const { data, error } = await resend.batch.send(batch);

    if (error) {
      return emails.map(() => ({
        success: false,
        error: error.message,
      }));
    }

    return (data?.data || []).map((result) => ({
      success: true,
      messageId: result.id,
    }));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Batch send failed";
    return emails.map(() => ({ success: false, error: message }));
  }
}

/**
 * Convert plain text email body to minimal HTML with proper formatting
 */
function formatEmailHtml(body: string): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  ${escaped}
</body>
</html>`;
}
