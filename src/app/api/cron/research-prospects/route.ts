import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { researchProspect } from "@/lib/ai/engine";

/**
 * Cron Job: Auto-Research Prospects
 * Schedule: Every 15 minutes
 * Processes prospects that are queued for research
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find prospects that need research:
  // - Status is 'new' (never contacted)
  // - research_data is null (not researched yet)
  // - research_status is 'pending' or null
  // - Limit to 5 per run to avoid API rate limits
  const { data: prospects, error: fetchError } = await supabase
    .from("prospects")
    .select("*, users(company_name, value_proposition, target_audience)")
    .is("research_data", null)
    .in("research_status", ["pending", null] as any)
    .eq("status", "new")
    .order("created_at", { ascending: true })
    .limit(5);

  if (fetchError || !prospects) {
    return NextResponse.json(
      { error: fetchError?.message || "No prospects found" },
      { status: 500 }
    );
  }

  let researched = 0;
  let failed = 0;

  for (const prospect of prospects) {
    try {
      // Mark as researching
      await supabase
        .from("prospects")
        .update({ research_status: "researching" })
        .eq("id", prospect.id);

      // Run research pipeline
      const research = await researchProspect({
        prospect: {
          first_name: prospect.first_name,
          last_name: prospect.last_name,
          email: prospect.email,
          company_name: prospect.company_name,
          job_title: prospect.job_title,
          linkedin_url: prospect.linkedin_url,
          website_url: prospect.website_url || prospect.website,
          notes: prospect.notes,
        },
        userContext: {
          value_proposition: prospect.users?.value_proposition || "",
          target_audience: prospect.users?.target_audience || "",
        },
      });

      if (research) {
        // Store research results
        await supabase
          .from("prospects")
          .update({
            research_data: research,
            research_status: "completed",
            researched_at: new Date().toISOString(),
          })
          .eq("id", prospect.id);

        researched++;
      } else {
        await supabase
          .from("prospects")
          .update({ research_status: "failed" })
          .eq("id", prospect.id);

        failed++;
      }

      // Delay between research to respect API rate limits (2-5 seconds)
      const delay = Math.floor(Math.random() * 3000) + 2000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      console.error(
        `[Cron] Research failed for prospect ${prospect.id}:`,
        error
      );

      await supabase
        .from("prospects")
        .update({ research_status: "failed" })
        .eq("id", prospect.id);

      failed++;
    }
  }

  return NextResponse.json({
    total: prospects.length,
    researched,
    failed,
    timestamp: new Date().toISOString(),
  });
}
