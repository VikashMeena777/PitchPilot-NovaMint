import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const emailId = searchParams.get("eid");
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Record the click in the background
  if (emailId) {
    recordClick(emailId).catch((err) =>
      console.error("[Tracking] Click recording failed:", err)
    );
  }

  // Redirect to the actual URL
  return NextResponse.redirect(targetUrl);
}

async function recordClick(emailId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) return;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date().toISOString();

  const { data: email } = await supabase
    .from("emails")
    .select("id, prospect_id, click_count")
    .eq("id", emailId)
    .single();

  if (!email) return;

  await supabase
    .from("emails")
    .update({
      click_count: (email.click_count || 0) + 1,
      first_clicked_at: now,
    })
    .eq("id", email.id);

  // Update prospect status
  await supabase
    .from("prospects")
    .update({
      status: "opened", // clicked implies opened
    })
    .eq("id", email.prospect_id)
    .in("status", ["new", "contacted"]);

  // Increment prospect total_clicks
  const { error: rpcError } = await supabase.rpc("increment_prospect_clicks", {
    p_prospect_id: email.prospect_id,
  });
  if (rpcError) {
    console.log("[Tracking] RPC not available, skipping click increment");
  }

  console.log("[Tracking] Click recorded for email:", emailId);
}
