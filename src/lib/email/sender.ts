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
  // Sender context for template
  companyName?: string;
  mailingAddress?: string;
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

  // Build HTML — use pre-rendered bodyHtml or create from plain text
  let html = params.bodyHtml || formatOutreachHtml(params.body, {
    senderName: params.senderName || "",
    companyName: params.companyName || "",
    fromEmail: fromAddress,
    mailingAddress: params.mailingAddress || "",
  });

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
    let html = e.bodyHtml || formatOutreachHtml(e.body, {
      senderName: e.senderName || "",
      companyName: e.companyName || "",
      fromEmail: e.from || "",
      mailingAddress: e.mailingAddress || "",
    });
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
 * Format outreach email as premium HTML
 * Design: Clean, personal, professional — looks like it came from a real person's email client
 * NOT heavily branded — that kills deliverability for cold outreach
 */
export function formatOutreachHtml(
  body: string,
  context: {
    senderName: string;
    companyName: string;
    fromEmail: string;
    mailingAddress: string;
  }
): string {
  // Convert plain text body to properly formatted HTML paragraphs
  const paragraphs = body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      // Convert single newlines to <br>
      const formatted = p
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
      return `<p style="margin:0 0 16px;line-height:1.7;">${formatted}</p>`;
    })
    .join("\n");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const unsubscribeUrl = `${appUrl}/api/emails/unsubscribe`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td { margin:0; padding:0; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; }
    
    /* Base */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      background-color: #ffffff;
      color: #1a1a2e;
    }
    
    /* Links */
    a { color: #6366f1; text-decoration: none; }
    a:hover { text-decoration: underline; }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body { background-color: #1a1a2e !important; color: #e2e8f0 !important; }
      .email-container { background-color: #1e1e32 !important; }
      .text-body { color: #e2e8f0 !important; }
      .text-muted { color: #94a3b8 !important; }
      .signature-line { border-color: #334155 !important; }
      .footer-text { color: #64748b !important; }
      a { color: #818cf8 !important; }
    }
    
    /* Mobile responsive */
    @media only screen and (max-width: 600px) {
      .email-container { padding: 20px 16px !important; }
      .text-body { font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;padding:40px 24px;">
          <tr>
            <td>
              <!-- Email Body -->
              <div class="text-body" style="font-size:16px;line-height:1.75;color:#1a1a2e;">
                ${paragraphs}
              </div>

              <!-- Signature -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
                <tr>
                  <td style="padding-left:12px;border-left:3px solid #6366f1;">
                    <p style="margin:0;font-size:15px;font-weight:600;color:#1a1a2e;" class="text-body">
                      ${escapeHtml(context.senderName)}
                    </p>
                    ${context.companyName ? `<p style="margin:2px 0 0;font-size:13px;color:#64748b;" class="text-muted">${escapeHtml(context.companyName)}</p>` : ""}
                    ${context.fromEmail ? `<p style="margin:2px 0 0;font-size:12px;color:#94a3b8;" class="text-muted">${escapeHtml(context.fromEmail)}</p>` : ""}
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <hr class="signature-line" style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 16px;" />
              <p class="footer-text" style="font-size:11px;color:#94a3b8;line-height:1.6;margin:0;">
                You're receiving this because we thought our solution might be relevant.
                <a href="${unsubscribeUrl}" style="color:#6366f1;text-decoration:underline;">Unsubscribe</a>
                or reply "stop" to opt out.
                ${context.mailingAddress ? `<br>${escapeHtml(context.mailingAddress)}` : ""}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
