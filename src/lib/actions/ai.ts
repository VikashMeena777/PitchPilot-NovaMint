"use server";

import { createClient } from "@/lib/supabase/server";
import {
  researchProspect,
  generateEmail,
  generateEmailVariants,
  type ProspectResearch,
  type GeneratedEmail,
} from "@/lib/ai/engine";

/**
 * Research a prospect using AI and save findings to database
 */
export async function aiResearchProspect(
  prospectId: string
): Promise<{ data: ProspectResearch | null; error: string | null }> {
  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Database not configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  // Fetch prospect
  const { data: prospect, error: fetchError } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", prospectId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !prospect)
    return { data: null, error: "Prospect not found" };

  // Fetch user profile for context
  const { data: profile } = await supabase
    .from("users")
    .select("value_proposition, target_audience")
    .eq("id", user.id)
    .single();

  // Run AI research with the new engine signature
  const research = await researchProspect({
    prospect: {
      first_name: prospect.first_name,
      last_name: prospect.last_name,
      email: prospect.email,
      company_name: prospect.company_name,
      job_title: prospect.job_title,
      linkedin_url: prospect.linkedin_url,
      website_url: prospect.website_url,
      notes: prospect.notes,
    },
    userContext: {
      value_proposition: profile?.value_proposition || "We help businesses grow",
      target_audience: profile?.target_audience || "B2B companies",
    },
  });

  if (!research)
    return {
      data: null,
      error: "AI research failed — check GROQ_API_KEY or GOOGLE_GEMINI_API_KEY",
    };

  // Save research to database
  await supabase
    .from("prospects")
    .update({
      research_data: research,
      research_status: "completed",
      research_completed_at: new Date().toISOString(),
    })
    .eq("id", prospectId)
    .eq("user_id", user.id);

  return { data: research, error: null };
}

/**
 * Generate a personalized email for a prospect
 */
export async function aiGenerateEmail(params: {
  prospectId: string;
  tone?: "professional" | "casual" | "bold" | "consultative";
  sequenceStep?: number;
  customInstructions?: string;
}): Promise<{ data: GeneratedEmail | null; error: string | null }> {
  const supabase = await createClient();
  if (!supabase) return { data: null, error: "Database not configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  // Fetch prospect
  const { data: prospect } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", params.prospectId)
    .eq("user_id", user.id)
    .single();

  if (!prospect) return { data: null, error: "Prospect not found" };

  // Fetch user profile for sender info
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, company_name, value_proposition, target_audience")
    .eq("id", user.id)
    .single();

  const sender = {
    name: profile?.full_name || "Sales Team",
    company: profile?.company_name || "Our Company",
    value_proposition:
      profile?.value_proposition || "We help businesses grow",
    target_audience: profile?.target_audience || "B2B companies",
  };

  // Use existing research if available
  const research = prospect.research_data as ProspectResearch | null;

  const email = await generateEmail({
    prospect: {
      first_name: prospect.first_name,
      last_name: prospect.last_name,
      email: prospect.email,
      company_name: prospect.company_name,
      job_title: prospect.job_title,
    },
    sender,
    tone: params.tone || "professional",
    research,
    sequenceContext: params.sequenceStep
      ? { stepNumber: params.sequenceStep, totalSteps: 1 }
      : undefined,
    customInstructions: params.customInstructions,
  });

  if (!email)
    return {
      data: null,
      error: "Email generation failed — check GROQ_API_KEY or GOOGLE_GEMINI_API_KEY",
    };

  return { data: email, error: null };
}

/**
 * Generate multiple email variants for A/B testing
 */
export async function aiGenerateVariants(
  prospectId: string
): Promise<{ data: GeneratedEmail[]; error: string | null }> {
  const supabase = await createClient();
  if (!supabase) return { data: [], error: "Database not configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "Not authenticated" };

  const { data: prospect } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", prospectId)
    .eq("user_id", user.id)
    .single();

  if (!prospect) return { data: [], error: "Prospect not found" };

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, company_name, value_proposition")
    .eq("id", user.id)
    .single();

  const sender = {
    name: profile?.full_name || "Sales Team",
    company: profile?.company_name || "Our Company",
    value_proposition:
      profile?.value_proposition || "We help businesses grow",
  };

  const research = prospect.research_data as ProspectResearch | null;

  const variants = await generateEmailVariants({
    prospect: {
      first_name: prospect.first_name,
      last_name: prospect.last_name,
      email: prospect.email,
      company_name: prospect.company_name,
      job_title: prospect.job_title,
    },
    sender,
    research,
    count: 3,
  });

  if (variants.length === 0)
    return {
      data: [],
      error: "Variant generation failed — check API keys",
    };

  return { data: variants, error: null };
}
