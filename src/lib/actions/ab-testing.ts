"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── A/B Test Types ──
export type ABTestVariant = {
  id: string;
  label: string; // "A" | "B"
  subject: string;
  body?: string;
  send_count: number;
  open_count: number;
  reply_count: number;
};

// ── Create A/B test for a sequence step ──
export async function createABTest(
  sequenceStepId: string,
  variantA: { subject: string; body?: string },
  variantB: { subject: string; body?: string }
) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify ownership via sequence_steps → sequences → user_id
  const { data: step } = await supabase
    .from("sequence_steps")
    .select("id, sequence_id, sequences!inner(user_id)")
    .eq("id", sequenceStepId)
    .single();

  if (!step || (step as Record<string, unknown>).sequences === null) {
    return { error: "Step not found or unauthorized" };
  }

  // Store A/B test data in the step's metadata
  const abTest = {
    enabled: true,
    created_at: new Date().toISOString(),
    winner: null,
    split_ratio: 50, // 50/50 split
    variants: {
      A: { subject: variantA.subject, body: variantA.body || null, send_count: 0, open_count: 0, reply_count: 0 },
      B: { subject: variantB.subject, body: variantB.body || null, send_count: 0, open_count: 0, reply_count: 0 },
    },
  };

  const { error } = await supabase
    .from("sequence_steps")
    .update({ ab_test: abTest })
    .eq("id", sequenceStepId);

  if (error) return { error: error.message };

  revalidatePath("/sequences");
  return { success: true, abTest };
}

// ── Get variant for a prospect (deterministic assignment) ──
export function getABVariant(prospectId: string): "A" | "B" {
  // Simple hash-based assignment for deterministic split
  let hash = 0;
  for (let i = 0; i < prospectId.length; i++) {
    const char = prospectId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit int
  }
  return Math.abs(hash) % 2 === 0 ? "A" : "B";
}

// ── Record A/B test result ──
export async function recordABResult(
  sequenceStepId: string,
  variant: "A" | "B",
  event: "send" | "open" | "reply"
) {
  const supabase = await createClient();
  if (!supabase) return;

  const { data: step } = await supabase
    .from("sequence_steps")
    .select("ab_test")
    .eq("id", sequenceStepId)
    .single();

  if (!step?.ab_test) return;

  const abTest = step.ab_test as Record<string, unknown>;
  const variants = abTest.variants as Record<string, Record<string, number>>;

  if (variants[variant]) {
    const field = `${event}_count`;
    variants[variant][field] = (variants[variant][field] || 0) + 1;
  }

  await supabase
    .from("sequence_steps")
    .update({ ab_test: { ...abTest, variants } })
    .eq("id", sequenceStepId);
}

// ── Auto-pick winner after sufficient data ──
export async function evaluateABWinner(sequenceStepId: string) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: step } = await supabase
    .from("sequence_steps")
    .select("ab_test, subject_template, body_template")
    .eq("id", sequenceStepId)
    .single();

  if (!step?.ab_test) return null;

  const abTest = step.ab_test as Record<string, unknown>;
  const variants = abTest.variants as Record<string, Record<string, number>>;

  const a = variants.A;
  const b = variants.B;

  // Need at least 20 sends per variant to declare winner
  if ((a?.send_count || 0) < 20 || (b?.send_count || 0) < 20) {
    return null;
  }

  const aOpenRate = a.send_count > 0 ? a.open_count / a.send_count : 0;
  const bOpenRate = b.send_count > 0 ? b.open_count / b.send_count : 0;

  const winner = aOpenRate >= bOpenRate ? "A" : "B";
  const winnerData = variants[winner];

  // Apply winner as the main template
  await supabase
    .from("sequence_steps")
    .update({
      subject_template: winnerData.subject || step.subject_template,
      body_template: winnerData.body || step.body_template,
      ab_test: { ...abTest, winner, decided_at: new Date().toISOString() },
    })
    .eq("id", sequenceStepId);

  return winner;
}
