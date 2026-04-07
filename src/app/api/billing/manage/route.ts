import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscription, cancelSubscription } from "@/lib/billing/cashfree";

// GET — Get current subscription status
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

    let subscriptionDetails = null;
    if (profile.cashfree_subscription_id) {
      try {
        subscriptionDetails = await getSubscription(
          profile.cashfree_subscription_id
        );
      } catch {
        console.warn("[Billing] Could not fetch Cashfree subscription details");
      }
    }

    return NextResponse.json({
      plan: profile.plan || "free",
      subscriptionId: profile.cashfree_subscription_id,
      expiresAt: profile.plan_expires_at,
      cashfreeStatus: subscriptionDetails?.subscription_status || null,
    });
  } catch (error) {
    console.error("[Billing] Get subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST — Cancel subscription
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

    const { data: profile } = await supabase
      .from("users")
      .select("cashfree_subscription_id")
      .eq("id", user.id)
      .single();

    if (!profile?.cashfree_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    const result = await cancelSubscription(profile.cashfree_subscription_id);

    // Update user plan to free
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
      result,
    });
  } catch (error) {
    console.error("[Billing] Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
