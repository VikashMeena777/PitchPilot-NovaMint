"use server";

/**
 * Google Search via Serper.dev API
 * Free tier: 2,500 searches/month
 */
export interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

export interface SerperResponse {
  results: SerperResult[];
  query: string;
  totalResults: number;
}

export async function searchGoogle(
  query: string,
  numResults: number = 5
): Promise<SerperResponse> {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    console.warn("[Scraping] SERPER_API_KEY not configured, returning empty results");
    return { results: [], query, totalResults: 0 };
  }

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: numResults,
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`);
    }

    const data = await response.json();
    const organic = data.organic || [];

    return {
      results: organic.map(
        (
          item: { title: string; link: string; snippet: string },
          index: number
        ) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          position: index + 1,
        })
      ),
      query,
      totalResults: organic.length,
    };
  } catch (error) {
    console.error("[Scraping] Serper search error:", error);
    return { results: [], query, totalResults: 0 };
  }
}

/**
 * Search for a prospect — combines name + company for best results
 */
export async function searchProspect(
  name: string,
  company?: string
): Promise<string> {
  const query = company ? `${name} ${company}` : name;
  const result = await searchGoogle(query, 5);

  if (result.results.length === 0) return "";

  return result.results
    .map(
      (r) =>
        `[${r.position}] ${r.title}\n${r.snippet}\nSource: ${r.link}`
    )
    .join("\n\n");
}

/**
 * Search for a company — gets company info, news, and recent activity
 */
export async function searchCompany(company: string): Promise<string> {
  const result = await searchGoogle(`${company} company`, 5);

  if (result.results.length === 0) return "";

  return result.results
    .map(
      (r) =>
        `[${r.position}] ${r.title}\n${r.snippet}\nSource: ${r.link}`
    )
    .join("\n\n");
}
