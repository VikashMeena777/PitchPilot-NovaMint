"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/utils/activity-logger";

export type ProspectFormData = {
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  job_title?: string;
  linkedin_url?: string;
  website_url?: string;
  phone?: string;
  location?: string;
  industry?: string;
  company_size?: string;
  notes?: string;
  tags?: string[];
};

export async function getProspects(filters?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  if (!supabase) return { data: [], count: 0, error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], count: 0, error: "Not authenticated" };

  let query = supabase
    .from("prospects")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.or(
      `email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`
    );
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, count, error } = await query;
  return { data: data || [], count: count || 0, error: error?.message };
}

export async function addProspect(formData: ProspectFormData) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("prospects")
    .insert({
      user_id: user.id,
      email: formData.email,
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      company_name: formData.company_name || null,
      job_title: formData.job_title || null,
      linkedin_url: formData.linkedin_url || null,
      website_url: formData.website_url || null,
      phone: formData.phone || null,
      location: formData.location || null,
      industry: formData.industry || null,
      company_size: formData.company_size || null,
      notes: formData.notes || null,
      tags: formData.tags || null,
      source: "manual",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Increment monthly count (best-effort, non-blocking)
  try {
    await supabase.rpc("increment_monthly_prospect_count", { uid: user.id });
  } catch {
    // Ignore — RPC may not exist yet
  }

  revalidatePath("/prospects");

  // Activity logging (fire-and-forget)
  logActivity({
    user_id: user.id,
    action: "prospect.created",
    resource_type: "prospect",
    resource_id: data.id,
    metadata: { email: formData.email, source: "manual" },
  });

  return { data };
}

export async function updateProspect(id: string, updates: Partial<ProspectFormData>) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("prospects")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/prospects");
  return { data };
}

export async function deleteProspect(id: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("prospects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/prospects");
  return { success: true };
}

export async function deleteProspects(ids: string[]) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("prospects")
    .delete()
    .in("id", ids)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/prospects");
  return { success: true };
}

export async function updateProspectNotes(id: string, notes: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("prospects")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/prospects/${id}`);
  return { success: true };
}

export async function updateProspectTags(id: string, tags: string[]) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("prospects")
    .update({ tags, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/prospects/${id}`);
  return { success: true };
}

export async function updateProspectStatus(id: string, status: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("prospects")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/prospects/${id}`);
  revalidatePath("/prospects");
  return { success: true };
}

export type CsvRow = Record<string, string>;

export async function importProspectsFromCsv(rows: CsvRow[], columnMapping: Record<string, string>) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Create CSV upload record
  const { data: upload, error: uploadError } = await supabase
    .from("csv_uploads")
    .insert({
      user_id: user.id,
      filename: "csv_import",
      total_rows: rows.length,
      status: "processing",
    })
    .select()
    .single();

  if (uploadError) return { error: uploadError.message };

  let successCount = 0;
  let failCount = 0;
  const errors: { row: number; message: string }[] = [];

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const prospect: Record<string, unknown> = {
      user_id: user.id,
      source: "csv_upload",
      csv_upload_id: upload.id,
    };

    // Map columns
    for (const [csvCol, dbField] of Object.entries(columnMapping)) {
      if (row[csvCol] && dbField) {
        prospect[dbField] = row[csvCol];
      }
    }

    if (!prospect.email) {
      failCount++;
      errors.push({ row: i + 1, message: "Missing email" });
      continue;
    }

    const { error: insertError } = await supabase.from("prospects").insert(prospect);
    if (insertError) {
      failCount++;
      errors.push({ row: i + 1, message: insertError.message });
    } else {
      successCount++;
    }
  }

  // Update upload record
  await supabase
    .from("csv_uploads")
    .update({
      processed_rows: rows.length,
      successful_rows: successCount,
      failed_rows: failCount,
      status: failCount === rows.length ? "failed" : "completed",
      error_log: errors,
    })
    .eq("id", upload.id);

  revalidatePath("/prospects");

  // Activity logging (fire-and-forget)
  logActivity({
    user_id: user.id,
    action: "prospect.imported",
    resource_type: "csv_upload",
    resource_id: upload.id,
    metadata: { total: rows.length, success: successCount, failed: failCount },
  });

  return { success: true, successCount, failCount, errors, uploadId: upload.id };
}
