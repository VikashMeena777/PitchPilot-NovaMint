import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhookSignature, logBillingEvent, getOrderStatus } from "@/lib/billing/cashfree";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const timestamp = request.headers.get("x-cashfree-timestamp") || "";
    const signature = request.headers.get("x-cashfree-signature") || "";

    // Verify webhook signature
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
    if (webhookSecret) {
      // In production: always verify signature
      if (!signature || !verifyWebhookSignature(rawBody, timestamp, signature)) {
        console.error("[Webhook] Invalid or missing signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn("[Webhook] CASHFREE_WEBHOOK_SECRET not set — skipping signature verification (sandbox only)");
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type || event.event;

    console.log(`[Webhook] Received event: ${eventType}`, JSON.stringify(event.data || {}).slice(0, 500));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("[Webhook] Supabase not configured");
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract order info from the webhook payload
    const orderId =
      event.data?.order?.order_id ||
      event.data?.order_id ||
      "";
    const orderNote = event.data?.order?.order_note || "";
    const orderTags = event.data?.order?.order_tags || {};
    const paymentStatus =
      event.data?.payment?.payment_status ||
      event.data?.order?.order_status ||
      "";

    // Extract plan from order tags or note
    let planId = orderTags.plan_id || "";
    if (!planId && orderNote) {
      // Parse from note like "PitchMint starter plan purchase"
      const match = orderNote.match(/PitchMint (\w+) plan/);
      if (match) planId = match[1];
    }
    // Also try extracting from order_id format: pp_starter_1234567890
    if (!planId && orderId) {
      const match = orderId.match(/^pp_(\w+)_/);
      if (match) planId = match[1];
    }

    // Find user by their stored order/subscription ID
    const { data: user } = await supabase
      .from("users")
      .select("id, plan")
      .eq("cashfree_subscription_id", orderId)
      .single();

    switch (eventType) {
      case "PAYMENT_SUCCESS_WEBHOOK":
      case "ORDER_PAID": {
        if (user && planId) {
          // Calculate expiry (30 days for monthly plans)
          const expiresAt = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString();

          await supabase
            .from("users")
            .update({
              plan: planId,
              plan_expires_at: expiresAt,
            })
            .eq("id", user.id);

          console.log(`[Webhook] User ${user.id} upgraded to ${planId} (expires: ${expiresAt})`);
        } else {
          console.warn(`[Webhook] Payment success but no user found for order: ${orderId}`);
        }
        break;
      }

      case "PAYMENT_FAILED_WEBHOOK":
      case "ORDER_FAILED": {
        if (user) {
          console.warn(`[Webhook] Payment failed for user ${user.id}, order: ${orderId}`);
          // Clear the pending order reference
          await supabase
            .from("users")
            .update({
              cashfree_subscription_id: null,
            })
            .eq("id", user.id);
        }
        break;
      }

      case "PAYMENT_USER_DROPPED_WEBHOOK": {
        if (user) {
          console.warn(`[Webhook] User ${user.id} dropped payment for order: ${orderId}`);
          await supabase
            .from("users")
            .update({
              cashfree_subscription_id: null,
            })
            .eq("id", user.id);
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${eventType}`);
    }

    // Log billing event
    await logBillingEvent({
      userId: user?.id,
      eventType,
      subscriptionId: orderId,
      payload: event.data || {},
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
