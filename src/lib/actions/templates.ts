"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type EmailTemplate = {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  is_ai_generated: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
};

export async function getTemplates(category?: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { data: [], error: "Supabase not configured" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "Not authenticated" };

    let query = supabase
      .from("email_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("use_count", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    return { data: data || [], error: error?.message };
  } catch (err) {
    console.error("[Templates] getTemplates exception:", err);
    return { data: [], error: err instanceof Error ? err.message : "Failed to load templates" };
  }
}

export async function createTemplate(template: {
  name: string;
  subject: string;
  body: string;
  category?: string;
  is_ai_generated?: boolean;
}) {
  try {
    console.log("[Templates] createTemplate called with:", template.name);
    
    const supabase = await createClient();
    if (!supabase) {
      console.error("[Templates] Supabase client is null — env vars missing?");
      return { error: "Supabase not configured" };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("[Templates] Auth check:", user ? `user=${user.id}` : "NO USER", authError ? `error=${authError.message}` : "");
    if (!user) return { error: "Not authenticated. Please refresh the page and try again." };

    const { data, error } = await supabase
      .from("email_templates")
      .insert({
        user_id: user.id,
        name: template.name,
        subject: template.subject,
        body: template.body,
        category: template.category || "general",
        is_ai_generated: template.is_ai_generated || false,
        use_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("[Templates] Insert error:", error.message, error.code, error.details);
      return { error: error.message };
    }

    console.log("[Templates] Template created successfully:", data?.id);
    try { revalidatePath("/templates"); } catch { /* safe to ignore */ }
    return { data };
  } catch (err) {
    console.error("[Templates] createTemplate exception:", err);
    return { error: err instanceof Error ? err.message : "Failed to create template" };
  }
}

export async function updateTemplate(
  id: string,
  updates: Partial<Pick<EmailTemplate, "name" | "subject" | "body" | "category">>
) {
  try {
    const supabase = await createClient();
    if (!supabase) return { error: "Supabase not configured" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("email_templates")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    try { revalidatePath("/templates"); } catch { /* safe to ignore */ }
    return { success: true };
  } catch (err) {
    console.error("[Templates] updateTemplate exception:", err);
    return { error: err instanceof Error ? err.message : "Failed to update template" };
  }
}

export async function deleteTemplate(id: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return { error: "Supabase not configured" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("email_templates")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    try { revalidatePath("/templates"); } catch { /* safe to ignore */ }
    return { success: true };
  } catch (err) {
    console.error("[Templates] deleteTemplate exception:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete template" };
  }
}

export async function incrementTemplateUsage(id: string) {
  try {
    const supabase = await createClient();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use RPC or manual increment
    const { data: template } = await supabase
      .from("email_templates")
      .select("use_count")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (template) {
      await supabase
        .from("email_templates")
        .update({ use_count: (template.use_count || 0) + 1 })
        .eq("id", id);
    }
  } catch (err) {
    console.error("[Templates] incrementTemplateUsage exception:", err);
    // Non-critical — don't throw
  }
}
