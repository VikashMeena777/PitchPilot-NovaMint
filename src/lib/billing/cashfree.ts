import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// ============================================
// Cashfree Configuration — Order (Payment) API
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
// Create Order (One-Time Payment)
// ============================================
export async function createOrder(params: {
  orderId: string;
  orderAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  planId: string;
}) {
  const body = {
    order_id: params.orderId,
    order_amount: params.orderAmount,
    order_currency: "INR",
    customer_details: {
      customer_id: params.customerEmail.replace(/[^a-zA-Z0-9]/g, "_"),
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
    },
    order_meta: {
      return_url: params.returnUrl + "&order_id={order_id}",
      notify_url: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + "/api/billing/webhook",
    },
    order_note: `PitchPilot ${params.planId} plan purchase`,
    order_tags: {
      plan_id: params.planId,
    },
  };

  console.log("[Cashfree] Creating order:", params.orderId, "amount:", params.orderAmount);
  console.log("[Cashfree] Base URL:", CASHFREE_BASE_URL);
  console.log("[Cashfree] API Version:", API_VERSION);
  console.log("[Cashfree] Return URL:", body.order_meta.return_url);

  const res = await fetch(`${CASHFREE_BASE_URL}/orders`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const responseText = await res.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    console.error("[Cashfree] Non-JSON response:", res.status, responseText.substring(0, 500));
    return { error: { message: `Cashfree returned non-JSON (${res.status}): ${responseText.substring(0, 200)}` } };
  }

  if (!res.ok) {
    console.error("[Cashfree] Order creation failed:", res.status, JSON.stringify(data));
    // Surface the actual error from Cashfree
    return {
      ...data,
      _httpStatus: res.status,
      _error: data.message || data.error?.message || `HTTP ${res.status}`,
    };
  }

  console.log("[Cashfree] Order created successfully:", data.order_id, "session:", data.payment_session_id ? "present" : "missing");
  return data;
}

// ============================================
// Get Order Status
// ============================================
export async function getOrderStatus(orderId: string) {
  const res = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  return res.json();
}

// ============================================
// Get Payments for an Order
// ============================================
export async function getOrderPayments(orderId: string) {
  const res = await fetch(
    `${CASHFREE_BASE_URL}/orders/${orderId}/payments`,
    {
      method: "GET",
      headers: getHeaders(),
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
  orderId: string | null,
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
      cashfree_subscription_id: orderId,
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
