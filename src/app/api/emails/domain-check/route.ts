import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkDomainSetup } from "@/lib/email/domain-check";

/**
 * GET /api/emails/domain-check
 * Check sending domain setup for deliverability
 */
export async function GET(_request: NextRequest) {
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

  // Get user's sending email
  const { data: profile } = await supabase
    .from("users")
    .select("sending_email, warmup_started_at, warmup_completed")
    .eq("id", user.id)
    .single();

  const sendingEmail = profile?.sending_email || user.email || "";

  if (!sendingEmail) {
    return NextResponse.json({
      error: "No sending email configured. Set one in Settings.",
    }, { status: 400 });
  }

  // Calculate warmup day
  let warmupDay = 0;
  if (profile?.warmup_started_at && !profile?.warmup_completed) {
    warmupDay = Math.floor(
      (Date.now() - new Date(profile.warmup_started_at).getTime()) /
        (24 * 60 * 60 * 1000)
    );
  }

  const result = checkDomainSetup({
    sendingEmail,
    warmupDay,
  });

  return NextResponse.json(result);
}
