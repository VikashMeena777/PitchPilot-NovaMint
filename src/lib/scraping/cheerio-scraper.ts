"use server";

export interface ScrapedPage {
  title: string;
  description: string;
  headings: string[];
  bodyText: string;
  links: { text: string; href: string }[];
  url: string;
}

/**
 * Simple HTML parser using regex (no external dependencies)
 * Avoids Turbopack compatibility issues with cheerio
 */
function parseHTML(html: string): {
  title: string;
  description: string;
  headings: string[];
  bodyText: string;
  links: { text: string; href: string }[];
} {
  // Remove scripts, styles
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

  // Extract title
  const titleMatch = cleaned.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Extract meta description
  const descMatch = cleaned.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i
  ) || cleaned.match(
    /<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i
  );
  const description = descMatch ? descMatch[1].trim() : "";

  // Extract headings
  const headings: string[] = [];
  const headingRegex = /<h[123][^>]*>([\s\S]*?)<\/h[123]>/gi;
  let match;
  while ((match = headingRegex.exec(cleaned)) !== null && headings.length < 10) {
    const text = match[1].replace(/<[^>]*>/g, "").trim();
    if (text && text.length < 200) {
      headings.push(text);
    }
  }

  // Extract body text
  const bodyText = cleaned
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);

  // Extract links
  const links: { text: string; href: string }[] = [];
  const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((match = linkRegex.exec(cleaned)) !== null && links.length < 20) {
    const href = match[1];
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    if (text && href && !href.startsWith("#") && !href.startsWith("javascript:")) {
      links.push({ text: text.slice(0, 100), href });
    }
  }

  return { title, description, headings, bodyText, links };
}

/**
 * Scrape a webpage and extract structured content
 */
export async function scrapePage(url: string): Promise<ScrapedPage | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[Scraping] Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const parsed = parseHTML(html);

    return { ...parsed, url };
  } catch (error) {
    console.error(`[Scraping] Error scraping ${url}:`, error);
    return null;
  }
}

/**
 * Scrape a company's about page — tries common URL patterns
 */
export async function scrapeCompanyAbout(baseUrl: string): Promise<string> {
  const aboutPaths = ["/about", "/about-us", "/company", "/about/"];

  const homepage = await scrapePage(baseUrl);
  let content = "";

  if (homepage) {
    content += `Homepage: ${homepage.title}\n${homepage.description}\n`;
    content += homepage.headings.slice(0, 5).join("\n") + "\n";
    content += homepage.bodyText.slice(0, 2000) + "\n\n";
  }

  for (const path of aboutPaths) {
    try {
      const url = new URL(path, baseUrl).toString();
      const aboutPage = await scrapePage(url);
      if (aboutPage && aboutPage.bodyText.length > 100) {
        content += `About Page: ${aboutPage.title}\n`;
        content += aboutPage.bodyText.slice(0, 2000) + "\n";
        break;
      }
    } catch {
      continue;
    }
  }

  return content.slice(0, 4000);
}

/**
 * Extract email-relevant info from scraped content
 */
export async function extractRelevantInfo(page: ScrapedPage): Promise<string> {
  const parts: string[] = [];

  if (page.title) parts.push(`Title: ${page.title}`);
  if (page.description) parts.push(`Description: ${page.description}`);
  if (page.headings.length > 0) {
    parts.push(`Key headings: ${page.headings.slice(0, 5).join(" | ")}`);
  }
  if (page.bodyText) {
    parts.push(`Content preview: ${page.bodyText.slice(0, 1500)}`);
  }

  return parts.join("\n");
}
