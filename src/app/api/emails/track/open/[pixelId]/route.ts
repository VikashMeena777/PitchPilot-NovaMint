import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Transparent 1x1 pixel GIF
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pixelId: string }> }
) {
  const { pixelId } = await params;

  // Record the open event in the background (don't block the response)
  recordOpen(pixelId).catch((err) =>
    console.error("[Tracking] Open recording failed:", err)
  );

  // Return the tracking pixel immediately
  return new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": TRACKING_PIXEL.length.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

async function recordOpen(trackingPixelId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("[Tracking] Supabase not configured for tracking");
    return;
  }

  // Use service role to bypass RLS (tracking comes from email clients, not authenticated users)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const now = new Date().toISOString();

  // Find the email by tracking_pixel_id
  const { data: email, error: findError } = await supabase
    .from("emails")
    .select("id, prospect_id, user_id, open_count, first_opened_at")
    .eq("tracking_pixel_id", trackingPixelId)
    .single();

  if (findError || !email) {
    console.warn("[Tracking] Email not found for pixel:", trackingPixelId);
    return;
  }

  // Update email open tracking
  await supabase
    .from("emails")
    .update({
      open_count: (email.open_count || 0) + 1,
      first_opened_at: email.first_opened_at || now,
      last_opened_at: now,
    })
    .eq("id", email.id);

  // Update prospect engagement
  await supabase
    .from("prospects")
    .update({
      last_opened_at: now,
      status: "opened",
    })
    .eq("id", email.prospect_id)
    .in("status", ["new", "contacted"]); // Only update if not already in a later status

  // Increment total_opens via RPC
  const { error: rpcError } = await supabase.rpc("increment_prospect_opens", {
    p_prospect_id: email.prospect_id,
  });
  if (rpcError) {
    console.log("[Tracking] RPC not available, skipping open increment");
  }

  console.log("[Tracking] Open recorded for email:", email.id);
}
