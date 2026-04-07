"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getUserProfile() {
  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return { data, error: error?.message };
}

export async function updateUserProfile(updates: {
  full_name?: string;
  company_name?: string;
  value_proposition?: string;
  target_audience?: string;
  tone_preset?: string;
  sending_email?: string;
  sending_name?: string;
  timezone?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  daily_send_limit?: number;
  mailing_address?: string;
  notify_replies?: boolean;
  notify_daily_digest?: boolean;
  notify_weekly_report?: boolean;
  api_key?: string;
}) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { data };
}

export async function getDashboardStats() {
  const supabase = await createClient();
  if (!supabase) {
    return {
      totalProspects: 0,
      emailsSent: 0,
      openRate: 0,
      replyRate: 0,
      activeSequences: 0,
      recentActivity: [],
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      totalProspects: 0,
      emailsSent: 0,
      openRate: 0,
      replyRate: 0,
      activeSequences: 0,
      recentActivity: [],
    };
  }

  // Get prospect count
  const { count: totalProspects } = await supabase
    .from("prospects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Get email stats
  const { data: emailStats } = await supabase
    .from("emails")
    .select("status, open_count, has_reply")
    .eq("user_id", user.id);

  const sent = emailStats?.filter((e) => e.status === "sent").length || 0;
  const opened = emailStats?.filter((e) => e.open_count > 0).length || 0;
  const replied = emailStats?.filter((e) => e.has_reply).length || 0;

  // Get active sequences
  const { count: activeSequences } = await supabase
    .from("sequences")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  // Get recent prospects
  const { data: recentActivity } = await supabase
    .from("prospects")
    .select("id, email, first_name, last_name, company_name, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    totalProspects: totalProspects || 0,
    emailsSent: sent,
    openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
    replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
    activeSequences: activeSequences || 0,
    recentActivity: recentActivity || [],
  };
}
