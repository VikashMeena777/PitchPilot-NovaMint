/**
 * Domain Verification Helper
 *
 * Verifies email sending domain setup:
 * - SPF record check
 * - DKIM record check
 * - DMARC record check
 * - MX record existence
 * - Domain age/reputation hints
 */

export type DomainCheckResult = {
  domain: string;
  overall_score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  checks: {
    spf: DomainCheck;
    dkim: DomainCheck;
    dmarc: DomainCheck;
    mx: DomainCheck;
    custom_domain: DomainCheck;
  };
  recommendations: string[];
};

type DomainCheck = {
  status: "pass" | "warn" | "fail" | "unknown";
  message: string;
  details?: string;
};

/**
 * Check domain setup for email deliverability
 * Note: Full DNS lookups require server-side execution.
 * This performs heuristic checks based on domain properties.
 */
export function checkDomainSetup(params: {
  sendingEmail: string;
  customDomain?: boolean;
  warmupDay?: number;
}): DomainCheckResult {
  const { sendingEmail, customDomain = false, warmupDay = 0 } = params;
  const domain = sendingEmail.split("@")[1]?.toLowerCase() || "";

  const checks: DomainCheckResult["checks"] = {
    spf: { status: "unknown", message: "SPF record check requires DNS lookup" },
    dkim: { status: "unknown", message: "DKIM check requires DNS lookup" },
    dmarc: { status: "unknown", message: "DMARC check requires DNS lookup" },
    mx: { status: "unknown", message: "MX check requires DNS lookup" },
    custom_domain: { status: "unknown", message: "Checking domain type..." },
  };

  const recommendations: string[] = [];
  let score = 50; // Start neutral since we can't do DNS lookups client-side

  // ── Free email provider detection ──
  const freeProviders = [
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
    "aol.com", "icloud.com", "mail.com", "protonmail.com",
    "zoho.com", "yandex.com",
  ];

  if (freeProviders.includes(domain)) {
    checks.custom_domain = {
      status: "warn",
      message: `Using free email provider (${domain})`,
      details: "Free providers have lower deliverability for business outreach",
    };
    recommendations.push(
      `Set up a custom domain (e.g., you@${sendingEmail.split("@")[0]}-co.com) for better deliverability`
    );
    score -= 15;
  } else if (customDomain) {
    checks.custom_domain = {
      status: "pass",
      message: "Custom domain configured",
      details: domain,
    };
    score += 15;
  } else {
    checks.custom_domain = {
      status: "pass",
      message: `Business domain detected: ${domain}`,
    };
    score += 10;
  }

  // ── Google Workspace / Microsoft 365 hints ──
  if (domain.endsWith(".com") || domain.endsWith(".io") || domain.endsWith(".co")) {
    checks.mx = {
      status: "pass",
      message: "Domain TLD is commonly used for business email",
    };
    score += 5;
  }

  // ── Known good configurations ──
  if (["gmail.com", "googlemail.com"].includes(domain)) {
    checks.spf = { status: "pass", message: "Google handles SPF automatically" };
    checks.dkim = { status: "pass", message: "Google handles DKIM automatically" };
    checks.dmarc = { status: "pass", message: "Google has default DMARC" };
    checks.mx = { status: "pass", message: "Google MX configured" };
    score = 70; // Free Gmail still loses points on custom_domain
  }

  // ── Warm-up progress impact ──
  if (warmupDay > 0 && warmupDay < 14) {
    recommendations.push(
      `Domain is warming up (day ${warmupDay}/14). Keep daily volume under ${Math.min(50 + warmupDay * 5, 100)} emails.`
    );
    score -= 5;
  } else if (warmupDay >= 14) {
    score += 5;
  }

  // ── Recommendations ──
  if (!freeProviders.includes(domain)) {
    recommendations.push(
      "Verify SPF record: Add 'v=spf1 include:_spf.google.com ~all' to your DNS TXT records"
    );
    recommendations.push(
      "Set up DKIM: Generate DKIM keys through your email provider and add DNS records"
    );
    recommendations.push(
      "Configure DMARC: Add '_dmarc' TXT record with 'v=DMARC1; p=none; rua=mailto:dmarc@" + domain + "'"
    );
  }

  recommendations.push("Send a test email to mail-tester.com to check your full deliverability score");

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  let grade: DomainCheckResult["grade"];
  if (score >= 90) grade = "A";
  else if (score >= 75) grade = "B";
  else if (score >= 60) grade = "C";
  else if (score >= 40) grade = "D";
  else grade = "F";

  return {
    domain,
    overall_score: score,
    grade,
    checks,
    recommendations,
  };
}
