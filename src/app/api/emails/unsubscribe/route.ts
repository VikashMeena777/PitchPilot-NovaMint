import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/emails/unsubscribe
 * Handles email unsubscribe links — one-click CAN-SPAM compliance
 *
 * Query: ?id=<prospect_id>&u=<user_id>&token=<hmac>
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const prospectId = searchParams.get("id");
  const userId = searchParams.get("u");
  const token = searchParams.get("token");

  if (!prospectId || !userId) {
    return new NextResponse(unsubscribePage("Invalid unsubscribe link."), {
      headers: { "Content-Type": "text/html" },
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return new NextResponse(unsubscribePage("Server error. Contact support."), {
      headers: { "Content-Type": "text/html" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Update prospect status to opted_out
    const { error: updateError } = await supabase
      .from("prospects")
      .update({
        status: "opted_out",
        updated_at: new Date().toISOString(),
        notes: `Unsubscribed on ${new Date().toISOString().split("T")[0]}`,
      })
      .eq("id", prospectId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("[Unsubscribe] Error:", updateError);
    }

    // Stop all active sequence enrollments for this prospect
    await supabase
      .from("sequence_enrollments")
      .update({
        status: "stopped",
        stopped_at: new Date().toISOString(),
        stopped_reason: "unsubscribed",
      })
      .eq("prospect_id", prospectId)
      .eq("status", "active");

    // Log the unsubscribe
    await supabase.from("activity_log").insert({
      user_id: userId,
      action: "prospect.updated",
      resource_type: "prospect",
      resource_id: prospectId,
      metadata: { change: "opted_out", source: "unsubscribe_link" },
    });

    return new NextResponse(
      unsubscribePage("You have been successfully unsubscribed. You will no longer receive emails from us."),
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    console.error("[Unsubscribe] Error:", err);
    return new NextResponse(
      unsubscribePage("Something went wrong. Please try again or contact support."),
      { headers: { "Content-Type": "text/html" } }
    );
  }
}

function unsubscribePage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe — PitchMint</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0a0f;
      color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: #13131a;
      border: 1px solid #1f1f2e;
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      text-align: center;
    }
    .icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 24px;
      background: rgba(99, 102, 241, 0.1);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #f5f5f5;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📬</div>
    <h1>Unsubscribe</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
