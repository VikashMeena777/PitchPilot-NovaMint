"use server";

import { searchProspect, searchCompany } from "./serper";
import { scrapeCompanyAbout } from "./cheerio-scraper";
import { researchProspect as aiResearch } from "@/lib/ai/engine";
import { createClient } from "@/lib/supabase/server";

export interface ResearchInput {
  prospectId: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  companyName?: string | null;
  jobTitle?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  notes?: string | null;
}

export interface ResearchResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * Full research pipeline for a single prospect:
 * 1. Google search for prospect + company
 * 2. Scrape company website
 * 3. Send all data to AI for summarization
 * 4. Store results in database
 */
export async function runResearchPipeline(
  input: ResearchInput,
  userContext: { value_proposition: string; target_audience: string }
): Promise<ResearchResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    // Mark prospect as researching
    await supabase
      .from("prospects")
      .update({ research_status: "researching" })
      .eq("id", input.prospectId);

    // Step 1: Data Collection (parallel)
    const name = [input.firstName, input.lastName]
      .filter(Boolean)
      .join(" ");

    const [searchResults, companySearchResults, websiteContent] =
      await Promise.allSettled([
        // Search for the person
        name ? searchProspect(name, input.companyName || undefined) : Promise.resolve(""),

        // Search for the company
        input.companyName
          ? searchCompany(input.companyName)
          : Promise.resolve(""),

        // Scrape company website
        input.websiteUrl
          ? scrapeCompanyAbout(input.websiteUrl)
          : Promise.resolve(""),
      ]);

    const personSearch =
      searchResults.status === "fulfilled" ? searchResults.value : "";
    const companySearch =
      companySearchResults.status === "fulfilled"
        ? companySearchResults.value
        : "";
    const website =
      websiteContent.status === "fulfilled" ? websiteContent.value : "";

    const combinedSearchResults = [personSearch, companySearch]
      .filter(Boolean)
      .join("\n\n---\n\n");

    // Step 2: AI Summarization
    const research = await aiResearch({
      prospect: {
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        company_name: input.companyName,
        job_title: input.jobTitle,
        linkedin_url: input.linkedinUrl,
        website_url: input.websiteUrl,
        notes: input.notes,
      },
      scrapedData: {
        websiteContent: website,
        searchResults: combinedSearchResults,
      },
      userContext,
    });

    if (!research) {
      // Update status to failed
      await supabase
        .from("prospects")
        .update({ research_status: "failed" })
        .eq("id", input.prospectId);

      return {
        success: false,
        error: "AI research returned no results. Check API keys.",
      };
    }

    // Step 3: Store results
    const { error: updateError } = await supabase
      .from("prospects")
      .update({
        research_data: research,
        research_status: "completed",
        research_completed_at: new Date().toISOString(),
      })
      .eq("id", input.prospectId);

    if (updateError) {
      console.error("[Research] DB update error:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, data: research as unknown as Record<string, unknown> };
  } catch (error) {
    console.error("[Research] Pipeline error:", error);

    // Mark as failed
    await supabase
      .from("prospects")
      .update({ research_status: "failed" })
      .eq("id", input.prospectId);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Batch research multiple prospects
 */
export async function runBatchResearch(
  prospects: ResearchInput[],
  userContext: { value_proposition: string; target_audience: string },
  maxConcurrent: number = 3
): Promise<Map<string, ResearchResult>> {
  const results = new Map<string, ResearchResult>();

  // Process in batches to respect rate limits
  for (let i = 0; i < prospects.length; i += maxConcurrent) {
    const batch = prospects.slice(i, i + maxConcurrent);
    const batchResults = await Promise.allSettled(
      batch.map((p) => runResearchPipeline(p, userContext))
    );

    batchResults.forEach((result, index) => {
      const prospect = batch[index];
      if (result.status === "fulfilled") {
        results.set(prospect.prospectId, result.value);
      } else {
        results.set(prospect.prospectId, {
          success: false,
          error: result.reason?.message || "Unknown error",
        });
      }
    });

    // Rate limit pause between batches
    if (i + maxConcurrent < prospects.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return results;
}
