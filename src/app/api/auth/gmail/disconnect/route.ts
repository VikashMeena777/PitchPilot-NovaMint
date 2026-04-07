import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/gmail/disconnect
 * Disconnects Gmail by clearing stored OAuth tokens.
 */
export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Revoke the token at Google (best-effort)
  const { data: profile } = await supabase
    .from("users")
    .select("gmail_access_token")
    .eq("id", user.id)
    .single();

  if (profile?.gmail_access_token) {
    try {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${profile.gmail_access_token}`,
        { method: "POST" }
      );
    } catch {
      // Best-effort revocation
    }
  }

  // Clear all Gmail fields
  const { error } = await supabase
    .from("users")
    .update({
      gmail_connected: false,
      gmail_email: null,
      gmail_access_token: null,
      gmail_refresh_token: null,
      gmail_token_expires_at: null,
      gmail_oauth_state: null,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
