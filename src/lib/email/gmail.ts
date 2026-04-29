/**
 * Gmail Sender — Send emails via user's connected Gmail account
 *
 * Uses Gmail API with OAuth2 tokens stored in the users table.
 * Handles automatic token refresh when access tokens expire.
 */

import { createClient } from "@supabase/supabase-js";

type GmailSendParams = {
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  replyTo?: string;
  senderName?: string;
};

type GmailSendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

/**
 * Refresh expired Gmail access token using refresh token
 */
async function refreshGmailToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: string } | null> {
  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const data = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (data.error || !data.access_token) return null;

    return {
      accessToken: data.access_token,
      expiresAt: new Date(
        Date.now() + (data.expires_in || 3600) * 1000
      ).toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Get a valid Gmail access token, refreshing if needed
 */
async function getValidToken(userId: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: user } = await supabase
    .from("users")
    .select(
      "gmail_access_token, gmail_refresh_token, gmail_token_expires_at"
    )
    .eq("id", userId)
    .single();

  if (!user?.gmail_access_token) return null;

  // Check if token is still valid (with 5-minute buffer)
  const expiresAt = user.gmail_token_expires_at
    ? new Date(user.gmail_token_expires_at)
    : new Date(0);
  const isExpired = expiresAt.getTime() - 5 * 60 * 1000 < Date.now();

  if (!isExpired) return user.gmail_access_token;

  // Refresh the token
  if (!user.gmail_refresh_token) return null;

  const refreshed = await refreshGmailToken(user.gmail_refresh_token);
  if (!refreshed) return null;

  // Store the new token
  await supabase
    .from("users")
    .update({
      gmail_access_token: refreshed.accessToken,
      gmail_token_expires_at: refreshed.expiresAt,
    })
    .eq("id", userId);

  return refreshed.accessToken;
}

/**
 * Encode email in RFC 2822 format for Gmail API
 */
function buildRawEmail(
  from: string,
  to: string,
  subject: string,
  bodyHtml: string,
  senderName?: string,
  replyTo?: string
): string {
  const fromLine = senderName ? `${senderName} <${from}>` : from;
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const headers = [
    `From: ${fromLine}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    replyTo ? `Reply-To: ${replyTo}` : "",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    `X-Mailer: PitchMint`,
  ]
    .filter(Boolean)
    .join("\r\n");

  // Plain text version (strip HTML)
  const plainText = bodyHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

  const body = [
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    plainText,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    bodyHtml,
    `--${boundary}--`,
  ].join("\r\n");

  const rawEmail = `${headers}\r\n\r\n${body}`;

  // Base64url encode
  return Buffer.from(rawEmail)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Send an email via the user's connected Gmail account
 */
export async function sendViaGmail(
  userId: string,
  params: GmailSendParams
): Promise<GmailSendResult> {
  const accessToken = await getValidToken(userId);

  if (!accessToken) {
    return {
      success: false,
      error: "Gmail not connected or token expired. Please reconnect Gmail in Settings.",
    };
  }

  // Get the user's Gmail address
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { success: false, error: "Server not configured" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: user } = await supabase
    .from("users")
    .select("gmail_email")
    .eq("id", userId)
    .single();

  const fromEmail = user?.gmail_email || "";
  if (!fromEmail) {
    return { success: false, error: "Gmail email not found" };
  }

  const bodyHtml =
    params.bodyHtml ||
    `<div style="font-family:-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a">${params.body.replace(/\n/g, "<br>")}</div>`;

  const rawMessage = buildRawEmail(
    fromEmail,
    params.to,
    params.subject,
    bodyHtml,
    params.senderName,
    params.replyTo
  );

  try {
    const response = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: rawMessage }),
      }
    );

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      return {
        success: false,
        error:
          errorData.error?.message ||
          `Gmail API error (${response.status})`,
      };
    }

    const result = (await response.json()) as { id?: string };

    return {
      success: true,
      messageId: result.id,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Gmail send failed";
    console.error("[Gmail] Send error:", message);
    return { success: false, error: message };
  }
}

/**
 * Check Gmail inbox for replies to sent outreach emails
 * Uses gmail.readonly scope to search for inbound messages
 * that are replies to emails we previously sent.
 */
export async function checkGmailReplies(
  userId: string
): Promise<{ found: number; errors: number }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return { found: 0, errors: 0 };

  const supabase = createClient(supabaseUrl, supabaseKey);
  const accessToken = await getValidToken(userId);

  if (!accessToken) {
    console.warn(`[Gmail] No valid token for user ${userId}`);
    return { found: 0, errors: 0 };
  }

  // Get sent emails that haven't been replied to yet (last 30 days)
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: sentEmails, error: fetchErr } = await supabase
    .from("emails")
    .select("id, to_email, subject, message_id, prospect_id")
    .eq("user_id", userId)
    .eq("status", "sent")
    .eq("has_reply", false)
    .gte("sent_at", thirtyDaysAgo)
    .order("sent_at", { ascending: false })
    .limit(50);

  if (fetchErr || !sentEmails || sentEmails.length === 0) {
    return { found: 0, errors: 0 };
  }

  let found = 0;
  let errors = 0;

  for (const email of sentEmails) {
    try {
      // Search Gmail for replies from this prospect
      // Use "from:prospect@email.com" + "subject:re: original subject" query
      const searchQuery = encodeURIComponent(
        `from:${email.to_email} subject:Re: ${(email.subject || "").replace(/^Re:\s*/i, "")} newer_than:30d`
      );

      const searchResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${searchQuery}&maxResults=5`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!searchResponse.ok) {
        errors++;
        continue;
      }

      const searchData = (await searchResponse.json()) as {
        messages?: { id: string; threadId: string }[];
        resultSizeEstimate?: number;
      };

      if (
        !searchData.messages ||
        searchData.messages.length === 0
      ) {
        continue; // No replies found for this email
      }

      // Get the first reply message content
      const replyMsgId = searchData.messages[0].id;
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${replyMsgId}?format=full`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!msgResponse.ok) {
        errors++;
        continue;
      }

      const msgData = (await msgResponse.json()) as {
        id: string;
        snippet: string;
        internalDate: string;
        payload?: {
          headers?: { name: string; value: string }[];
          body?: { data?: string };
          parts?: { mimeType: string; body?: { data?: string } }[];
        };
      };

      // Extract reply body from the message
      let replyBody = msgData.snippet || "";

      // Try to get full text body
      if (msgData.payload?.parts) {
        const textPart = msgData.payload.parts.find(
          (p) => p.mimeType === "text/plain"
        );
        if (textPart?.body?.data) {
          replyBody = Buffer.from(textPart.body.data, "base64").toString(
            "utf-8"
          );
        }
      } else if (msgData.payload?.body?.data) {
        replyBody = Buffer.from(
          msgData.payload.body.data,
          "base64"
        ).toString("utf-8");
      }

      const replyDate = msgData.internalDate
        ? new Date(parseInt(msgData.internalDate)).toISOString()
        : new Date().toISOString();

      // Update the email record with reply info
      await supabase
        .from("emails")
        .update({
          has_reply: true,
          reply_received_at: replyDate,
          reply_body: replyBody.substring(0, 5000), // Cap at 5k chars
        })
        .eq("id", email.id);

      // Update prospect status to "replied"
      if (email.prospect_id) {
        await supabase
          .from("prospects")
          .update({
            status: "replied",
            last_replied_at: replyDate,
          })
          .eq("id", email.prospect_id);
      }

      found++;
      console.log(
        `[Gmail] Reply detected for email ${email.id} from ${email.to_email}`
      );
    } catch (err) {
      errors++;
      console.error(
        `[Gmail] Error checking reply for email ${email.id}:`,
        err
      );
    }
  }

  return { found, errors };
}

/**
 * Disconnect Gmail by clearing tokens
 */
export async function disconnectGmail(userId: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return false;

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase
    .from("users")
    .update({
      gmail_connected: false,
      gmail_email: null,
      gmail_access_token: null,
      gmail_refresh_token: null,
      gmail_token_expires_at: null,
    })
    .eq("id", userId);

  return !error;
}
