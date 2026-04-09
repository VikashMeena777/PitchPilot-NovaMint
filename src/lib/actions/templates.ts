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
}

export async function createTemplate(template: {
  name: string;
  subject: string;
  body: string;
  category?: string;
  is_ai_generated?: boolean;
}) {
  const supabase = await createClient();
  if (!supabase) return { error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

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

  if (error) return { error: error.message };

  revalidatePath("/templates");
  return { data };
}

export async function updateTemplate(
  id: string,
  updates: Partial<Pick<EmailTemplate, "name" | "subject" | "body" | "category">>
) {
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

  revalidatePath("/templates");
  return { success: true };
}

export async function deleteTemplate(id: string) {
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

  revalidatePath("/emails");
  return { success: true };
}

export async function incrementTemplateUsage(id: string) {
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
}

// Starter templates seeded on first load
export const STARTER_TEMPLATES = [
  {
    name: "Cold Outreach — Value First",
    subject: "Quick thought on {{company_name}}'s {{pain_point}}",
    body: `Hi {{first_name}},

I noticed {{company_name}} is doing impressive work in {{industry}}. I had a thought about how you might {{benefit}}.

We've helped companies like {{social_proof}} achieve {{result}}.

Would you be open to a quick 15-minute chat this week?

Best,
{{sender_name}}`,
    category: "outreach",
  },
  {
    name: "Follow-Up — Gentle Nudge",
    subject: "Re: Quick thought on {{company_name}}",
    body: `Hi {{first_name}},

Just wanted to follow up on my previous email. I know you're busy — here's the key point:

{{one_line_value_prop}}

Happy to share a quick case study if that would be helpful. No pressure either way.

Cheers,
{{sender_name}}`,
    category: "follow_up",
  },
  {
    name: "Break-Up Email",
    subject: "Should I close your file?",
    body: `Hi {{first_name}},

I've reached out a few times and haven't heard back, which is totally fine. I don't want to be a pest.

I'll assume the timing isn't right and close your file for now. If things change down the road, feel free to reply to this thread.

Wishing you and the {{company_name}} team all the best!

{{sender_name}}`,
    category: "follow_up",
  },
  {
    name: "Referral Request",
    subject: "Who handles {{function}} at {{company_name}}?",
    body: `Hi {{first_name}},

I wasn't sure if you're the right person to speak with about {{topic}}. If not, could you point me in the right direction?

I'd really appreciate it. Thanks!

Best,
{{sender_name}}`,
    category: "outreach",
  },
  {
    name: "Meeting Confirmation",
    subject: "Confirmed: Our call on {{date}}",
    body: `Hi {{first_name}},

Looking forward to our chat on {{date}} at {{time}}.

Here's what I'd love to cover:
1. {{agenda_item_1}}
2. {{agenda_item_2}}
3. Your questions

Talk soon!

{{sender_name}}`,
    category: "meeting",
  },
];
