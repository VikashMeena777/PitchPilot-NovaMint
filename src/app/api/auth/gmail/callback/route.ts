import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/auth/gmail/callback
 * Handles the OAuth2 callback from Google.
 * Exchanges the authorization code for tokens and stores them.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Handle user denial
  if (error) {
    return NextResponse.redirect(
      `${appUrl}/settings?gmail=error&reason=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/settings?gmail=error&reason=missing_params`
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(
      `${appUrl}/settings?gmail=error&reason=server_error`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  // Verify CSRF state
  const { data: profile } = await supabase
    .from("users")
    .select("gmail_oauth_state")
    .eq("id", user.id)
    .single();

  if (!profile || profile.gmail_oauth_state !== state) {
    return NextResponse.redirect(
      `${appUrl}/settings?gmail=error&reason=invalid_state`
    );
  }

  // Exchange code for tokens
  const clientId = process.env.GMAIL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GMAIL_OAUTH_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/gmail/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}/settings?gmail=error&reason=oauth_not_configured`
    );
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json() as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (tokenData.error || !tokenData.access_token) {
      console.error("[Gmail OAuth] Token exchange failed:", tokenData.error_description);
      return NextResponse.redirect(
        `${appUrl}/settings?gmail=error&reason=token_exchange_failed`
      );
    }

    // Get the Gmail email address
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const userInfo = await userInfoResponse.json() as { email?: string };
    const gmailAddress = userInfo.email || user.email;

    // Store tokens securely (encrypted in production)
    await supabase.from("users").update({
      gmail_connected: true,
      gmail_email: gmailAddress,
      gmail_access_token: tokenData.access_token,
      gmail_refresh_token: tokenData.refresh_token || null,
      gmail_token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      gmail_oauth_state: null, // Clear state after use
      sending_email: gmailAddress, // Auto-set as sending email
    }).eq("id", user.id);

    return NextResponse.redirect(`${appUrl}/settings?gmail=success`);
  } catch (err) {
    console.error("[Gmail OAuth] Callback error:", err);
    return NextResponse.redirect(
      `${appUrl}/settings?gmail=error&reason=server_error`
    );
  }
}
