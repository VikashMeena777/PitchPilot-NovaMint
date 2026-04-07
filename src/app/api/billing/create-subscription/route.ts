import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSubscription } from "@/lib/billing/cashfree";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import crypto from "crypto";

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

    if (!plan.cashfreePlanId) {
      return NextResponse.json(
        { error: "Cannot create subscription for free plan" },
        { status: 400 }
      );
    }

    // Get user profile for customer details
    const { data: profile } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const subscriptionId = `pp_${planId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const result = await createSubscription({
      subscriptionId,
      planId: plan.cashfreePlanId,
      customerName: profile?.full_name || user.email?.split("@")[0] || "User",
      customerEmail: user.email || "",
      customerPhone: "9999999999", // Cashfree requires phone; user can update later
      returnUrl: `${appUrl}/billing?status=success&plan=${planId}`,
      trialDays: plan.trialDays > 0 ? plan.trialDays : undefined,
    });

    if (result.subscription_id) {
      // Store pending subscription
      await supabase
        .from("users")
        .update({
          cashfree_subscription_id: result.subscription_id,
        })
        .eq("id", user.id);

      return NextResponse.json({
        subscriptionId: result.subscription_id,
        authLink: result.data?.authorization?.authorization_link || result.data?.subscription_url,
        status: result.subscription_status,
      });
    }

    console.error("[Billing] Cashfree error:", result);
    return NextResponse.json(
      { error: result.message || "Failed to create subscription" },
      { status: 500 }
    );
  } catch (error) {
    console.error("[Billing] Create subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
