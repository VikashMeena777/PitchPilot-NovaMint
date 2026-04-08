import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrderStatus } from "@/lib/billing/cashfree";
import { PLANS, type PlanId } from "@/lib/billing/plans";

// GET — Verify order status after Cashfree redirect
export async function GET(request: NextRequest) {
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

    const orderId = request.nextUrl.searchParams.get("orderId");
    const planId = request.nextUrl.searchParams.get("planId");

    if (!orderId || !planId) {
      return NextResponse.json({ error: "Missing orderId or planId" }, { status: 400 });
    }

    // Verify the plan is valid
    if (!PLANS[planId as PlanId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Check order status with Cashfree
    const orderStatus = await getOrderStatus(orderId);

    console.log(`[Billing] Verify order ${orderId}:`, JSON.stringify(orderStatus).slice(0, 300));

    if (orderStatus.order_status === "PAID") {
      // Calculate expiry (30 days from now)
      const expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      // Activate the plan immediately
      await supabase
        .from("users")
        .update({
          plan: planId,
          cashfree_subscription_id: orderId,
          plan_expires_at: expiresAt,
        })
        .eq("id", user.id);

      return NextResponse.json({
        activated: true,
        plan: planId,
        expiresAt,
        orderId,
      });
    }

    // Order not yet paid
    return NextResponse.json({
      activated: false,
      orderStatus: orderStatus.order_status,
      message: "Payment not yet confirmed. It may take a moment.",
    });
  } catch (error) {
    console.error("[Billing] Verify order error:", error);
    return NextResponse.json(
      { error: "Failed to verify order" },
      { status: 500 }
    );
  }
}
