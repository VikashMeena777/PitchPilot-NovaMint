import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/billing/cashfree";
import { PLANS, type PlanId } from "@/lib/billing/plans";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await request.json();

    if (!planId || !PLANS[planId as PlanId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const plan = PLANS[planId as PlanId];

    if (plan.price === 0) {
      return NextResponse.json(
        { error: "Cannot purchase free plan" },
        { status: 400 }
      );
    }

    // Get user profile for customer details
    const { data: profile } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const orderId = `pp_${planId}_${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    console.log(`[Billing] Creating order for user ${user.id}, plan: ${planId}, amount: ${plan.price}`);

    const result = await createOrder({
      orderId,
      orderAmount: plan.price,
      customerName: (profile as { full_name?: string })?.full_name || user.email?.split("@")[0] || "User",
      customerEmail: user.email || "",
      customerPhone: "9999999999",
      returnUrl: `${appUrl}/billing?status=success&plan=${planId}`,
      planId,
    });

    // Cashfree returns payment_session_id for the checkout
    if (result.payment_session_id) {
      // Store pending order reference
      await supabase
        .from("users")
        .update({
          cashfree_subscription_id: orderId,
        })
        .eq("id", user.id);

      return NextResponse.json({
        orderId: result.order_id || orderId,
        paymentSessionId: result.payment_session_id,
        orderStatus: result.order_status,
        // Cashfree creates a payment link automatically
        paymentLink: result.payment_link,
        // Environment for frontend SDK
        environment: process.env.CASHFREE_ENVIRONMENT || "sandbox",
      });
    }

    // If there's an order_id but no session (sometimes Cashfree returns differently)
    if (result.order_id) {
      await supabase
        .from("users")
        .update({
          cashfree_subscription_id: result.order_id,
        })
        .eq("id", user.id);

      return NextResponse.json({
        orderId: result.order_id,
        paymentSessionId: result.payment_session_id,
        orderStatus: result.order_status,
        paymentLink: result.payment_link,
        environment: process.env.CASHFREE_ENVIRONMENT || "sandbox",
      });
    }

    console.error("[Billing] Cashfree order error:", JSON.stringify(result));
    return NextResponse.json(
      {
        error:
          result.message ||
          result.error?.message ||
          "Failed to create order. Please try again.",
        debug: process.env.NODE_ENV === "development" ? result : undefined,
      },
      { status: 500 }
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[Billing] Create order error:", errMsg, error);
    return NextResponse.json(
      { error: `Payment error: ${errMsg}` },
      { status: 500 }
    );
  }
}
