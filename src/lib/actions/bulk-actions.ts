"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Bulk update status ──
export async function bulkUpdateProspectStatus(ids: string[], status: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("prospects")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", ids)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/prospects");
  return { success: true, count: ids.length };
}

// ── Bulk add tag ──
export async function bulkAddTag(ids: string[], tag: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch current tags for all prospects
  const { data: prospects, error: fetchError } = await supabase
    .from("prospects")
    .select("id, tags")
    .in("id", ids)
    .eq("user_id", user.id);

  if (fetchError) return { error: fetchError.message };

  // Update each prospect's tags (avoid duplicates)
  let updated = 0;
  for (const prospect of prospects || []) {
    const currentTags: string[] = prospect.tags || [];
    if (!currentTags.includes(tag)) {
      const { error } = await supabase
        .from("prospects")
        .update({
          tags: [...currentTags, tag],
          updated_at: new Date().toISOString(),
        })
        .eq("id", prospect.id);

      if (!error) updated++;
    }
  }

  revalidatePath("/prospects");
  return { success: true, count: updated };
}

// ── Bulk delete prospects ──
export async function bulkDeleteProspects(ids: string[]) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Delete related emails first (FK constraint)
  await supabase
    .from("emails")
    .delete()
    .in("prospect_id", ids);

  // Delete sequence enrollments
  await supabase
    .from("sequence_enrollments")
    .delete()
    .in("prospect_id", ids);

  // Delete the prospects
  const { error } = await supabase
    .from("prospects")
    .delete()
    .in("id", ids)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/prospects");
  return { success: true, count: ids.length };
}

// ── Bulk enroll in sequence ──
export async function bulkEnrollInSequence(prospectIds: string[], sequenceId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify sequence ownership
  const { data: sequence } = await supabase
    .from("sequences")
    .select("id")
    .eq("id", sequenceId)
    .eq("user_id", user.id)
    .single();

  if (!sequence) return { error: "Sequence not found" };

  // Check for existing enrollments to avoid duplicates
  const { data: existing } = await supabase
    .from("sequence_enrollments")
    .select("prospect_id")
    .eq("sequence_id", sequenceId)
    .in("prospect_id", prospectIds);

  const existingIds = new Set((existing || []).map((e) => e.prospect_id));
  const newIds = prospectIds.filter((id) => !existingIds.has(id));

  if (newIds.length === 0) {
    return { success: true, count: 0, message: "All prospects already enrolled" };
  }

  const enrollments = newIds.map((pid) => ({
    prospect_id: pid,
    sequence_id: sequenceId,
    user_id: user.id,
    current_step: 1,
    status: "active",
  }));

  const { error } = await supabase
    .from("sequence_enrollments")
    .insert(enrollments);

  if (error) return { error: error.message };

  // Update enrolled count
  await supabase
    .from("sequences")
    .update({ enrolled_count: (existing?.length || 0) + newIds.length })
    .eq("id", sequenceId);

  revalidatePath("/prospects");
  revalidatePath("/sequences");
  return { success: true, count: newIds.length };
}

// ── Export prospects to CSV ──
export async function exportProspectsToCsv(ids?: string[]) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  let query = supabase
    .from("prospects")
    .select("email, first_name, last_name, company_name, job_title, linkedin_url, phone, status, tags, notes, created_at")
    .eq("user_id", user.id);

  if (ids && ids.length > 0) {
    query = query.in("id", ids);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return { error: error.message };

  // Build CSV
  const headers = ["Email", "First Name", "Last Name", "Company", "Job Title", "LinkedIn", "Phone", "Status", "Tags", "Notes", "Added"];
  const rows = (data || []).map((p) => [
    p.email,
    p.first_name || "",
    p.last_name || "",
    p.company_name || "",
    p.job_title || "",
    p.linkedin_url || "",
    p.phone || "",
    p.status || "",
    (p.tags || []).join("; "),
    (p.notes || "").replace(/"/g, '""'),
    p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell}"`).join(",")
    ),
  ].join("\n");

  return { data: csv, count: rows.length };
}
