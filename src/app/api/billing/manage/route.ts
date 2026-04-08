import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrderStatus } from "@/lib/billing/cashfree";

// GET — Get current plan/billing status
export async function GET() {
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

    const { data: profile } = await supabase
      .from("users")
      .select("plan, cashfree_subscription_id, plan_expires_at")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if plan has expired
    const typedProfile = profile as {
      plan: string;
      cashfree_subscription_id: string | null;
      plan_expires_at: string | null;
    };

    let currentPlan = typedProfile.plan || "free";

    if (
      typedProfile.plan_expires_at &&
      new Date(typedProfile.plan_expires_at) < new Date() &&
      currentPlan !== "free"
    ) {
      // Plan expired — downgrade to free
      await supabase
        .from("users")
        .update({
          plan: "free",
          cashfree_subscription_id: null,
          plan_expires_at: null,
        })
        .eq("id", user.id);

      currentPlan = "free";
    }

    let orderInfo = null;
    if (typedProfile.cashfree_subscription_id) {
      try {
        orderInfo = await getOrderStatus(typedProfile.cashfree_subscription_id);
      } catch {
        // Silent fail — order lookup is optional
      }
    }

    return NextResponse.json({
      plan: currentPlan,
      subscriptionId: typedProfile.cashfree_subscription_id,
      expiresAt: typedProfile.plan_expires_at,
      orderStatus: orderInfo?.order_status || null,
    });
  } catch (error) {
    console.error("[Billing] Get plan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST — Downgrade to free (cancel current plan)
export async function POST() {
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

    // Downgrade to free plan immediately
    await supabase
      .from("users")
      .update({
        plan: "free",
        cashfree_subscription_id: null,
        plan_expires_at: null,
      })
      .eq("id", user.id);

    return NextResponse.json({
      cancelled: true,
      plan: "free",
    });
  } catch (error) {
    console.error("[Billing] Cancel plan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
