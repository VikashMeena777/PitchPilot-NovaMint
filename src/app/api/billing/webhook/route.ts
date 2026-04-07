import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhookSignature, logBillingEvent } from "@/lib/billing/cashfree";

// Map Cashfree plan IDs back to our internal plan names
const CASHFREE_TO_PLAN: Record<string, string> = {
  pitchpilot_starter_monthly: "starter",
  pitchpilot_growth_monthly: "growth",
  pitchpilot_agency_monthly: "agency",
};

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const timestamp = request.headers.get("x-cashfree-timestamp") || "";
    const signature = request.headers.get("x-cashfree-signature") || "";

    // Verify webhook signature
    if (signature && !verifyWebhookSignature(rawBody, timestamp, signature)) {
      console.error("[Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type || event.event;
    const subscriptionId =
      event.data?.subscription?.subscription_id ||
      event.data?.subscription_id ||
      "";
    const planId =
      event.data?.subscription?.plan_details?.plan_id ||
      event.data?.plan_id ||
      "";

    console.log(`[Webhook] Received: ${eventType} for ${subscriptionId}`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("[Webhook] Supabase not configured");
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find user by subscription ID
    const { data: user } = await supabase
      .from("users")
      .select("id, plan")
      .eq("cashfree_subscription_id", subscriptionId)
      .single();

    switch (eventType) {
      case "SUBSCRIPTION_ACTIVATED":
      case "SUBSCRIPTION_STATUS_CHANGE": {
        const status = event.data?.subscription?.subscription_status;
        if (status === "ACTIVE" && user) {
          const internalPlan = CASHFREE_TO_PLAN[planId] || "starter";
          const expiresAt = event.data?.subscription?.subscription_expiry_time;

          await supabase
            .from("users")
            .update({
              plan: internalPlan,
              plan_expires_at: expiresAt || null,
            })
            .eq("id", user.id);

          console.log(`[Webhook] User ${user.id} upgraded to ${internalPlan}`);
        }
        break;
      }

      case "SUBSCRIPTION_PAYMENT_SUCCESS": {
        if (user) {
          const internalPlan = CASHFREE_TO_PLAN[planId] || user.plan;
          const expiresAt = event.data?.subscription?.subscription_expiry_time;

          await supabase
            .from("users")
            .update({
              plan: internalPlan,
              plan_expires_at: expiresAt || null,
            })
            .eq("id", user.id);

          console.log(`[Webhook] Payment success for user ${user.id}`);
        }
        break;
      }

      case "SUBSCRIPTION_CANCELLED":
      case "SUBSCRIPTION_COMPLETED": {
        if (user) {
          await supabase
            .from("users")
            .update({
              plan: "free",
              cashfree_subscription_id: null,
              plan_expires_at: null,
            })
            .eq("id", user.id);

          console.log(`[Webhook] User ${user.id} downgraded to free`);
        }
        break;
      }

      case "PAYMENT_FAILURE": {
        if (user) {
          console.warn(`[Webhook] Payment failed for user ${user.id}`);
          // Don't immediately downgrade — give a grace period
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${eventType}`);
    }

    // Log event
    await logBillingEvent({
      userId: user?.id,
      eventType,
      subscriptionId,
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
