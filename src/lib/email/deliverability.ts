/**
 * Email Deliverability Checker
 *
 * Pre-send validation to maximize inbox placement:
 * 1. Spam word detection in subject/body
 * 2. Link ratio check
 * 3. Image-to-text ratio
 * 4. Subject line quality scoring
 * 5. Domain reputation hints
 * 6. Personalization detection
 */

export type DeliverabilityCheck = {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  issues: Array<{
    severity: "critical" | "warning" | "info";
    category: string;
    message: string;
    fix?: string;
  }>;
  details: {
    spam_score: number;
    subject_quality: number;
    personalization_score: number;
    link_ratio: number;
    text_length: number;
  };
};

// Common spam trigger words
const SPAM_WORDS = [
  // Urgency
  "act now", "limited time", "hurry", "urgent", "last chance", "expires",
  "don't miss", "before it's too late", "deadline",
  // Money
  "free", "no cost", "save big", "cheap", "discount", "lowest price",
  "make money", "earn extra", "cash bonus", "double your",
  // Pressure
  "buy now", "order now", "click here", "sign up free", "subscribe now",
  "guaranteed", "no obligation", "risk free", "100% free",
  // Sketchy
  "congratulations", "you've been selected", "winner", "prize",
  "no credit check", "no questions asked", "apply now",
  // Caps patterns
  "FREE", "GUARANTEED", "WINNER", "URGENT", "ACT NOW",
];

// Personalization variables that improve deliverability
const PERSONALIZATION_VARS = [
  "{{first_name}}", "{{last_name}}", "{{company_name}}",
  "{{job_title}}", "{{industry}}", "{{city}}",
  "{first_name}", "{last_name}", "{company_name}",
];

/**
 * Check email deliverability before sending
 */
export function checkDeliverability(params: {
  subject: string;
  body: string;
  fromEmail?: string;
}): DeliverabilityCheck {
  const { subject, body, fromEmail } = params;
  const issues: DeliverabilityCheck["issues"] = [];

  let score = 100;

  // ── 1. Subject Line Quality ──
  let subjectQuality = 100;

  if (!subject || subject.trim().length === 0) {
    issues.push({
      severity: "critical",
      category: "subject",
      message: "Missing subject line",
      fix: "Add a compelling subject line",
    });
    subjectQuality = 0;
    score -= 30;
  } else {
    // Too short
    if (subject.length < 10) {
      issues.push({
        severity: "warning",
        category: "subject",
        message: "Subject line is very short",
        fix: "Aim for 30-60 characters for best open rates",
      });
      subjectQuality -= 20;
      score -= 5;
    }

    // Too long
    if (subject.length > 80) {
      issues.push({
        severity: "warning",
        category: "subject",
        message: "Subject line may be truncated on mobile (>80 chars)",
        fix: "Keep under 60 characters for mobile compatibility",
      });
      subjectQuality -= 15;
      score -= 5;
    }

    // All caps
    if (subject === subject.toUpperCase() && subject.length > 5) {
      issues.push({
        severity: "critical",
        category: "subject",
        message: "ALL CAPS subject lines trigger spam filters",
        fix: "Use normal capitalization",
      });
      subjectQuality -= 40;
      score -= 20;
    }

    // Excessive punctuation
    const exclamationCount = (subject.match(/!/g) || []).length;
    if (exclamationCount > 1) {
      issues.push({
        severity: "warning",
        category: "subject",
        message: "Multiple exclamation marks look spammy",
        fix: "Use at most one exclamation mark",
      });
      subjectQuality -= 15;
      score -= 10;
    }

    // Re: or Fwd: fake threading
    if (/^(re|fwd):/i.test(subject.trim())) {
      issues.push({
        severity: "warning",
        category: "subject",
        message: "Fake Re:/Fwd: prefixes can hurt trust",
        fix: "Only use Re: for actual replies",
      });
      subjectQuality -= 20;
      score -= 10;
    }
  }

  // ── 2. Spam Word Detection ──
  const fullText = `${subject} ${body}`.toLowerCase();
  let spamScore = 0;
  const foundSpamWords: string[] = [];

  for (const word of SPAM_WORDS) {
    if (fullText.includes(word.toLowerCase())) {
      foundSpamWords.push(word);
      spamScore += 5;
    }
  }

  if (foundSpamWords.length > 0) {
    const severity = foundSpamWords.length > 3 ? "critical" : "warning";
    issues.push({
      severity,
      category: "spam",
      message: `Found ${foundSpamWords.length} spam trigger word(s): ${foundSpamWords.slice(0, 5).join(", ")}`,
      fix: "Replace with natural language alternatives",
    });
    score -= Math.min(spamScore, 30);
  }

  // ── 3. Body Quality ──
  const plainBody = body
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .trim();

  const textLength = plainBody.length;

  if (textLength < 50) {
    issues.push({
      severity: "warning",
      category: "content",
      message: "Email body is very short",
      fix: "Add more context. Aim for 100-300 words for cold outreach",
    });
    score -= 10;
  }

  if (textLength > 3000) {
    issues.push({
      severity: "info",
      category: "content",
      message: "Long emails have lower response rates in cold outreach",
      fix: "Keep cold emails under 150 words for best results",
    });
    score -= 5;
  }

  // ── 4. Link Ratio ──
  const linkMatches = body.match(/https?:\/\/[^\s<"']+/gi) || [];
  const linkCount = linkMatches.length;
  const linkRatio = textLength > 0 ? linkCount / (textLength / 100) : 0;

  if (linkCount > 3) {
    issues.push({
      severity: "warning",
      category: "links",
      message: `${linkCount} links detected — too many links trigger spam filters`,
      fix: "Use 1-2 links maximum in cold outreach",
    });
    score -= 10;
  }

  if (linkRatio > 0.5) {
    issues.push({
      severity: "warning",
      category: "links",
      message: "High link-to-text ratio",
      fix: "Add more text content relative to links",
    });
    score -= 5;
  }

  // ── 5. Personalization ──
  let personalizationScore = 0;
  let personalizedFields = 0;

  for (const v of PERSONALIZATION_VARS) {
    if (fullText.includes(v.toLowerCase())) {
      personalizedFields++;
    }
  }

  if (personalizedFields === 0) {
    issues.push({
      severity: "warning",
      category: "personalization",
      message: "No personalization variables detected",
      fix: "Use {{first_name}} or {{company_name}} for better engagement",
    });
    personalizationScore = 20;
    score -= 10;
  } else if (personalizedFields === 1) {
    personalizationScore = 60;
  } else {
    personalizationScore = Math.min(100, personalizedFields * 30);
  }

  // ── 6. From Email Quality ──
  if (fromEmail) {
    if (fromEmail.includes("noreply") || fromEmail.includes("no-reply")) {
      issues.push({
        severity: "warning",
        category: "sender",
        message: "No-reply addresses reduce trust and deliverability",
        fix: "Use a real email address prospects can reply to",
      });
      score -= 10;
    }

    const domain = fromEmail.split("@")[1];
    if (["gmail.com", "yahoo.com", "hotmail.com"].includes(domain)) {
      issues.push({
        severity: "info",
        category: "sender",
        message: "Free email domains have lower deliverability for business outreach",
        fix: "Use a custom domain (e.g., you@company.com)",
      });
      score -= 5;
    }
  }

  // ── 7. HTML Quality ──
  if (body.includes("<img")) {
    const imgCount = (body.match(/<img/gi) || []).length;
    if (imgCount > 2) {
      issues.push({
        severity: "warning",
        category: "content",
        message: `${imgCount} images detected — image-heavy emails hit spam`,
        fix: "Use 0-1 images in cold outreach for best deliverability",
      });
      score -= 10;
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine grade
  let grade: DeliverabilityCheck["grade"];
  if (score >= 90) grade = "A";
  else if (score >= 75) grade = "B";
  else if (score >= 60) grade = "C";
  else if (score >= 40) grade = "D";
  else grade = "F";

  // Sort issues by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    score,
    grade,
    issues,
    details: {
      spam_score: Math.min(100, spamScore),
      subject_quality: Math.max(0, subjectQuality),
      personalization_score: personalizationScore,
      link_ratio: Math.round(linkRatio * 100) / 100,
      text_length: textLength,
    },
  };
}
