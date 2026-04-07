import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrichProspect } from "@/lib/enrichment/enricher";
import { withRateLimit } from "@/lib/utils/rate-limiter";

/**
 * POST /api/prospects/enrich
 * Enrich a single prospect with company + person data
 *
 * Body: { prospect_id: string }
 * Returns enrichment results that were applied
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit AI enrichment
  const rl = withRateLimit(user.id, "ai_generate");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: rl.headers }
    );
  }

  try {
    const { prospect_id } = (await request.json()) as { prospect_id: string };

    if (!prospect_id) {
      return NextResponse.json({ error: "prospect_id is required" }, { status: 400 });
    }

    // Fetch prospect
    const { data: prospect, error: fetchError } = await supabase
      .from("prospects")
      .select("*")
      .eq("id", prospect_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !prospect) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    // Run enrichment
    const result = await enrichProspect({
      email: prospect.email,
      linkedinUrl: prospect.linkedin_url || undefined,
      companyDomain: prospect.company_domain || undefined,
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: "No enrichment data found for this prospect",
        source: result.source,
      });
    }

    // Merge enrichment data into prospect (only fill empty fields)
    const updates: Record<string, unknown> = {
      research_status: "enriched",
      researched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (result.data.first_name && !prospect.first_name) updates.first_name = result.data.first_name;
    if (result.data.last_name && !prospect.last_name) updates.last_name = result.data.last_name;
    if (result.data.job_title && !prospect.job_title) updates.job_title = result.data.job_title;
    if (result.data.company_name && !prospect.company_name) updates.company_name = result.data.company_name;
    if (result.data.linkedin_url && !prospect.linkedin_url) updates.linkedin_url = result.data.linkedin_url;
    if (result.data.location && !prospect.location) updates.location = result.data.location;
    if (result.data.bio) updates.notes = prospect.notes
      ? `${prospect.notes}\n\n--- Enrichment ---\n${result.data.bio}`
      : result.data.bio;

    // Store enrichment metadata as JSONB
    updates.enrichment_data = {
      source: result.source,
      confidence: result.confidence,
      enriched_at: new Date().toISOString(),
      raw: result.data,
    };

    const { error: updateError } = await supabase
      .from("prospects")
      .update(updates)
      .eq("id", prospect_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      source: result.source,
      confidence: result.confidence,
      fields_updated: Object.keys(updates).filter(
        (k) => !["research_status", "researched_at", "updated_at", "enrichment_data"].includes(k)
      ),
      data: result.data,
    });
  } catch (err) {
    console.error("[Enrich] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
