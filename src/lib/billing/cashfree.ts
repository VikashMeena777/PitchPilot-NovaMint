import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// ============================================
// Cashfree Configuration
// ============================================
const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENVIRONMENT === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const API_VERSION = "2025-01-01";

function getHeaders() {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Cashfree credentials not configured");
  }

  return {
    "Content-Type": "application/json",
    "x-client-id": clientId,
    "x-client-secret": clientSecret,
    "x-api-version": API_VERSION,
  };
}

// ============================================
// Create Subscription Plan (one-time setup)
// ============================================
export async function createCashfreePlan(params: {
  planId: string;
  planName: string;
  amount: number;
  intervalType: "MONTH" | "YEAR";
  intervals: number;
  maxCycles?: number;
}) {
  const res = await fetch(`${CASHFREE_BASE_URL}/subscription-plans`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      plan_id: params.planId,
      plan_name: params.planName,
      plan_currency: "INR",
      plan_amount: params.amount,
      plan_interval_type: params.intervalType,
      plan_intervals: params.intervals,
      plan_max_cycles: params.maxCycles || 120,
    }),
  });

  return res.json();
}

// ============================================
// Create Subscription for User
// ============================================
export async function createSubscription(params: {
  subscriptionId: string;
  planId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  trialDays?: number;
}) {
  const body: Record<string, unknown> = {
    subscription_id: params.subscriptionId,
    plan_details: {
      plan_id: params.planId,
    },
    customer_details: {
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
    },
    subscription_meta: {
      return_url: params.returnUrl,
    },
  };

  if (params.trialDays && params.trialDays > 0) {
    body.subscription_expiry_time = new Date(
      Date.now() + params.trialDays * 24 * 60 * 60 * 1000
    ).toISOString();
  }

  const res = await fetch(`${CASHFREE_BASE_URL}/subscriptions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  return res.json();
}

// ============================================
// Get Subscription Status
// ============================================
export async function getSubscription(subscriptionId: string) {
  const res = await fetch(
    `${CASHFREE_BASE_URL}/subscriptions/${subscriptionId}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  return res.json();
}

// ============================================
// Cancel Subscription
// ============================================
export async function cancelSubscription(subscriptionId: string) {
  const res = await fetch(
    `${CASHFREE_BASE_URL}/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        subscription_id: subscriptionId,
        cancel_immediately: true,
      }),
    }
  );

  return res.json();
}

// ============================================
// Verify Webhook Signature
// ============================================
export function verifyWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string
): boolean {
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  if (!clientSecret) return false;

  const payload = timestamp + rawBody;
  const expectedSignature = crypto
    .createHmac("sha256", clientSecret)
    .update(payload)
    .digest("base64");

  return signature === expectedSignature;
}

// ============================================
// Supabase Helper — Update User Plan
// ============================================
export async function updateUserPlan(
  userId: string,
  plan: string,
  subscriptionId: string | null,
  expiresAt: string | null
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase not configured");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase
    .from("users")
    .update({
      plan,
      cashfree_subscription_id: subscriptionId,
      plan_expires_at: expiresAt,
    })
    .eq("id", userId);

  if (error) {
    console.error("[Billing] Failed to update user plan:", error);
    throw error;
  }
}

// ============================================
// Log Billing Event
// ============================================
export async function logBillingEvent(event: {
  userId?: string;
  eventType: string;
  subscriptionId: string;
  payload: Record<string, unknown>;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) return;

  const supabase = createClient(supabaseUrl, supabaseKey);

  await supabase.from("billing_events").insert({
    user_id: event.userId || null,
    event_type: event.eventType,
    subscription_id: event.subscriptionId,
    payload: event.payload,
  });
}
