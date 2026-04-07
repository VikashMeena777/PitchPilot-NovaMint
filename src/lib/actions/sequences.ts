"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SequenceFormData = {
  name: string;
  description?: string;
};

export type StepFormData = {
  step_number: number;
  subject_template: string;
  body_template: string;
  delay_days: number;
};

export async function getSequences() {
  const supabase = await createClient();
  if (!supabase) return { data: [], error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("sequences")
    .select(`
      *,
      sequence_steps ( count ),
      sequence_enrollments ( count )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { data: data || [], error: error?.message };
}

export async function getSequenceById(id: string) {
  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("sequences")
    .select(`
      *,
      sequence_steps (*)
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  return { data, error: error?.message };
}

export async function createSequence(form: SequenceFormData) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("sequences")
    .insert({
      user_id: user.id,
      name: form.name,
      description: form.description || null,
      status: "draft",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/sequences");
  return { data };
}

export async function updateSequence(id: string, updates: Partial<SequenceFormData> & { status?: string }) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("sequences")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/sequences");
  return { data };
}

export async function deleteSequence(id: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("sequences")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/sequences");
  return { success: true };
}

export async function addSequenceStep(sequenceId: string, step: StepFormData) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify ownership
  const { data: seq } = await supabase
    .from("sequences")
    .select("id")
    .eq("id", sequenceId)
    .eq("user_id", user.id)
    .single();

  if (!seq) return { error: "Sequence not found" };

  const { data, error } = await supabase
    .from("sequence_steps")
    .insert({
      sequence_id: sequenceId,
      step_number: step.step_number,
      subject_template: step.subject_template,
      body_template: step.body_template,
      delay_days: step.delay_days,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/sequences");
  return { data };
}

export async function getEmails(filters?: { status?: string; limit?: number; offset?: number }) {
  const supabase = await createClient();
  if (!supabase) return { data: [], count: 0, error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], count: 0, error: "Not authenticated" };

  let query = supabase
    .from("emails")
    .select("*, prospects(email, first_name, last_name, company_name)", { count: "exact" })
    .eq("user_id", user.id);

  if (filters?.status) query = query.eq("status", filters.status);
  query = query.order("created_at", { ascending: false });
  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters?.limit || 20) - 1);

  const { data, count, error } = await query;
  return { data: data || [], count: count || 0, error: error?.message };
}
