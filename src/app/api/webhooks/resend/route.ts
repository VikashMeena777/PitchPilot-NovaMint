import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Resend Webhook Handler
 * Receives events: email.delivered, email.bounced, email.complained, email.opened
 * 
 * Configure in Resend Dashboard → Webhooks → Add Endpoint
 * URL: https://yourdomain.com/api/webhooks/resend
 */
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = body;
  const resendId = data?.email_id;

  if (!type || !resendId) {
    return NextResponse.json({ error: "Missing type or email_id" }, { status: 400 });
  }

  console.log(`[Webhook] Resend event: ${type} for ${resendId}`);

  try {
    switch (type) {
      case "email.bounced": {
        // Find email by resend_id
        const { data: email } = await supabase
          .from("emails")
          .select("id")
          .eq("resend_id", resendId)
          .single();

        if (email) {
          const bounceType = data.bounce?.type === "hard" ? "hard" : "soft";
          await supabase
            .from("emails")
            .update({
              bounce_type: bounceType,
              status: "bounced",
              error_message: `Bounce: ${data.bounce?.message || bounceType}`,
            })
            .eq("id", email.id);
        }
        break;
      }

      case "email.complained": {
        // Spam complaint — treat as hard bounce + unsubscribe
        const { data: email } = await supabase
          .from("emails")
          .select("id, prospect_id")
          .eq("resend_id", resendId)
          .single();

        if (email) {
          await supabase
            .from("emails")
            .update({
              bounce_type: "hard",
              status: "bounced",
              error_message: "Spam complaint",
            })
            .eq("id", email.id);

          // Mark prospect as unsubscribed
          if (email.prospect_id) {
            await supabase
              .from("prospects")
              .update({ status: "unsubscribed" })
              .eq("id", email.prospect_id);
          }
        }
        break;
      }

      case "email.delivered": {
        await supabase
          .from("emails")
          .update({ status: "delivered" })
          .eq("resend_id", resendId);
        break;
      }

      default:
        // Ignore other events (email.sent, email.opened, etc.)
        break;
    }
  } catch (error) {
    console.error(`[Webhook] Error processing ${type}:`, error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
