/**
 * Prospect Enrichment Module
 *
 * Multi-provider enrichment pipeline:
 * 1. Proxycurl (LinkedIn data) — primary
 * 2. Clearbit-style lookup (domain-based) — fallback
 * 3. Web scraping (Serper + Cheerio) — existing fallback
 *
 * Configurable via environment variables:
 * - PROXYCURL_API_KEY: For LinkedIn enrichment
 * - FIRECRAWL_API_KEY: For deep web scraping
 */

export type EnrichmentResult = {
  success: boolean;
  source: "proxycurl" | "firecrawl" | "web_scrape" | "domain_lookup" | "none";
  data: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    job_title?: string;
    company_name?: string;
    company_domain?: string;
    company_industry?: string;
    company_size?: string;
    company_description?: string;
    linkedin_url?: string;
    twitter_url?: string;
    location?: string;
    bio?: string;
    profile_image_url?: string;
    technologies?: string[];
    recent_posts?: string[];
    funding_stage?: string;
    employee_count?: number;
  };
  confidence: number; // 0-100
};

/**
 * Enrich a prospect via Proxycurl (LinkedIn Profile API)
 */
async function enrichViaProxycurl(linkedinUrl: string): Promise<EnrichmentResult | null> {
  const apiKey = process.env.PROXYCURL_API_KEY;
  if (!apiKey || !linkedinUrl) return null;

  try {
    const response = await fetch(
      `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedinUrl)}&skills=skip&inferred_salary=skip&personal_email=skip&personal_contact_number=skip`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!response.ok) return null;

    const profile = (await response.json()) as Record<string, unknown>;

    return {
      success: true,
      source: "proxycurl",
      data: {
        first_name: profile.first_name as string,
        last_name: profile.last_name as string,
        full_name: profile.full_name as string,
        job_title: profile.occupation as string,
        company_name: (profile.experiences as any[])?.[0]?.company as string,
        linkedin_url: profile.public_identifier
          ? `https://linkedin.com/in/${profile.public_identifier}`
          : linkedinUrl,
        location: [profile.city, profile.state, profile.country_full_name]
          .filter(Boolean)
          .join(", "),
        bio: profile.summary as string,
        profile_image_url: profile.profile_pic_url as string,
      },
      confidence: 90,
    };
  } catch {
    return null;
  }
}

/**
 * Enrich via Firecrawl (deep web scraping)
 */
async function enrichViaFirecrawl(url: string): Promise<EnrichmentResult | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey || !url) return null;

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) return null;

    const result = (await response.json()) as {
      success: boolean;
      data?: { markdown?: string; metadata?: Record<string, string> };
    };

    if (!result.success || !result.data) return null;

    const metadata = result.data.metadata || {};
    const markdown = result.data.markdown || "";

    return {
      success: true,
      source: "firecrawl",
      data: {
        company_name: metadata.title || metadata.ogTitle,
        company_description:
          metadata.description || metadata.ogDescription || markdown.slice(0, 500),
        company_domain: new URL(url).hostname,
      },
      confidence: 70,
    };
  } catch {
    return null;
  }
}

/**
 * Enrich via domain lookup (extract company info from website)
 */
async function enrichViaDomain(email: string): Promise<EnrichmentResult | null> {
  const domain = email.split("@")[1];
  if (
    !domain ||
    ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com"].includes(domain)
  ) {
    return null;
  }

  try {
    const response = await fetch(`https://${domain}`, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PitchPilot/1.0; +https://pitchpilot.co)",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extract basic metadata
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    );

    return {
      success: true,
      source: "domain_lookup",
      data: {
        company_name: titleMatch?.[1]?.trim().split(/[|–—-]/)[0]?.trim(),
        company_description: descMatch?.[1]?.trim(),
        company_domain: domain,
      },
      confidence: 50,
    };
  } catch {
    return null;
  }
}

/**
 * Main enrichment pipeline — tries providers in order of quality
 */
export async function enrichProspect(params: {
  email: string;
  linkedinUrl?: string;
  companyDomain?: string;
}): Promise<EnrichmentResult> {
  const { email, linkedinUrl, companyDomain } = params;

  // 1. Try Proxycurl if LinkedIn URL provided
  if (linkedinUrl) {
    const result = await enrichViaProxycurl(linkedinUrl);
    if (result) return result;
  }

  // 2. Try Firecrawl for company website
  const domain = companyDomain || email.split("@")[1];
  if (
    domain &&
    !["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"].includes(domain)
  ) {
    const firecrawlResult = await enrichViaFirecrawl(`https://${domain}`);
    if (firecrawlResult) return firecrawlResult;
  }

  // 3. Try basic domain lookup
  const domainResult = await enrichViaDomain(email);
  if (domainResult) return domainResult;

  // 4. No enrichment available
  return {
    success: false,
    source: "none",
    data: {},
    confidence: 0,
  };
}

/**
 * Batch enrich multiple prospects
 */
export async function batchEnrich(
  prospects: Array<{
    id: string;
    email: string;
    linkedinUrl?: string;
    companyDomain?: string;
  }>,
  concurrency = 3
): Promise<Map<string, EnrichmentResult>> {
  const results = new Map<string, EnrichmentResult>();

  // Process in batches to respect rate limits
  for (let i = 0; i < prospects.length; i += concurrency) {
    const batch = prospects.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (p) => {
        const result = await enrichProspect(p);
        return { id: p.id, result };
      })
    );

    for (const res of batchResults) {
      if (res.status === "fulfilled") {
        results.set(res.value.id, res.value.result);
      }
    }

    // Rate limit delay between batches
    if (i + concurrency < prospects.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
