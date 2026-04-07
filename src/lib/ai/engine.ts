import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================
// AI PROVIDER MANAGEMENT (Groq primary → Gemini fallback)
// ============================================

let groqClient: Groq | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

function getGroqClient(): Groq | null {
  if (!process.env.GROQ_API_KEY) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

function getGeminiClient(): GoogleGenerativeAI | null {
  if (!process.env.GOOGLE_GEMINI_API_KEY) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
  }
  return geminiClient;
}

/**
 * Call AI with automatic failover: Groq → Gemini
 */
async function callAI(
  prompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {}
): Promise<string | null> {
  const { temperature = 0.7, maxTokens = 1024, systemPrompt } = options;

  // Try Groq first
  const groq = getGroqClient();
  if (groq) {
    try {
      const messages: Groq.Chat.ChatCompletionMessageParam[] = [];
      if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
      }
      messages.push({ role: "user", content: prompt });

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        console.log("[AI] Groq response received");
        return content;
      }
    } catch (error) {
      console.warn("[AI] Groq failed, trying Gemini fallback:", error);
    }
  }

  // Fallback to Gemini
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
        },
      });

      const fullPrompt = systemPrompt
        ? `${systemPrompt}\n\n${prompt}`
        : prompt;

      const result = await model.generateContent(fullPrompt);
      const content = result.response.text();
      if (content) {
        console.log("[AI] Gemini response received");
        return content;
      }
    } catch (error) {
      console.error("[AI] Gemini also failed:", error);
    }
  }

  console.error("[AI] All providers failed — no API keys configured?");
  return null;
}

// ============================================
// TYPES
// ============================================

export type ProspectResearch = {
  company_description: string;
  what_they_do: string;
  recent_news: string[];
  prospect_role: string;
  pain_points: string[];
  personalization_hooks: string[];
  recommended_angle: string;
  summary: string;
  icebreaker: string;
};

export type GeneratedEmail = {
  subject: string;
  body: string;
  body_html: string;
  tone: string;
};


// ============================================
// PROSPECT RESEARCH
// ============================================

export async function researchProspect(params: {
  prospect: {
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    company_name?: string | null;
    job_title?: string | null;
    linkedin_url?: string | null;
    website_url?: string | null;
    notes?: string | null;
  };
  scrapedData?: {
    websiteContent?: string;
    searchResults?: string;
  };
  userContext: {
    value_proposition: string;
    target_audience: string;
  };
}): Promise<ProspectResearch | null> {
  const { prospect, scrapedData, userContext } = params;
  const name =
    [prospect.first_name, prospect.last_name].filter(Boolean).join(" ") ||
    "the prospect";

  const systemPrompt = `You are a sales research analyst. Your job is to analyze information about a prospect and their company to find personalization hooks for a cold email outreach campaign.

You must extract:
1. Company description (2-3 sentences)
2. What the company sells/does
3. Recent company news or milestones
4. The prospect's role and likely responsibilities
5. Pain points they likely face based on their role and company stage
6. Personalization hooks — specific things to reference in an email that show genuine research
7. Recommended angle — the best way to position an outreach email to this person
8. A natural icebreaker opening line

Respond ONLY with valid JSON. No markdown, no extra text.`;

  const prompt = `Here is the information about the prospect:

Name: ${name}
Email: ${prospect.email}
Title: ${prospect.job_title || "Unknown"}
Company: ${prospect.company_name || "Unknown"}
${prospect.linkedin_url ? `LinkedIn: ${prospect.linkedin_url}` : ""}
${prospect.website_url ? `Website: ${prospect.website_url}` : ""}
${prospect.notes ? `Notes: ${prospect.notes}` : ""}

${scrapedData?.websiteContent ? `Company Website Content:\n${scrapedData.websiteContent.slice(0, 3000)}` : ""}
${scrapedData?.searchResults ? `Google Search Results:\n${scrapedData.searchResults.slice(0, 2000)}` : ""}

My product/service: ${userContext.value_proposition}
My target audience: ${userContext.target_audience}

Respond in this EXACT JSON format:
{
  "company_description": "...",
  "what_they_do": "...",
  "recent_news": ["news item 1", "news item 2"],
  "prospect_role": "...",
  "pain_points": ["pain 1", "pain 2", "pain 3"],
  "personalization_hooks": ["hook 1", "hook 2", "hook 3"],
  "recommended_angle": "...",
  "summary": "2-3 sentence summary",
  "icebreaker": "A natural opening line"
}`;

  try {
    const content = await callAI(prompt, {
      temperature: 0.7,
      maxTokens: 1200,
      systemPrompt,
    });
    if (!content) return null;
    return JSON.parse(content) as ProspectResearch;
  } catch (error) {
    console.error("[AI] Research parsing error:", error);
    return null;
  }
}

// ============================================
// EMAIL GENERATION
// ============================================

export async function generateEmail(params: {
  prospect: {
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    company_name?: string | null;
    job_title?: string | null;
  };
  sender: {
    name: string;
    company: string;
    value_proposition: string;
    target_audience?: string;
  };
  tone: "professional" | "casual" | "bold" | "consultative";
  research?: ProspectResearch | null;
  sequenceContext?: {
    stepNumber: number;
    totalSteps: number;
    previousSubject?: string;
    wasOpened?: boolean;
  };
  customInstructions?: string;
}): Promise<GeneratedEmail | null> {
  const { prospect, sender, tone, research, sequenceContext, customInstructions } = params;
  const prospectName = prospect.first_name || "there";

  const toneGuide: Record<string, string> = {
    professional:
      "polished but warm, business-appropriate. Use proper greetings.",
    casual:
      "friendly, conversational, like a colleague messaging. Use contractions.",
    bold: "confident, direct, pattern-interrupting. Lead with a strong claim.",
    consultative:
      "helpful, advisory, value-first. Position as an expert offering insight.",
  };

  let stepInstruction = "This is a standalone cold email.";
  if (sequenceContext) {
    if (sequenceContext.stepNumber === 1) {
      stepInstruction =
        "This is the FIRST cold email. Make a strong first impression.";
    } else if (sequenceContext.wasOpened === false) {
      stepInstruction = `This is follow-up #${sequenceContext.stepNumber}. The previous email was NOT opened. Write a completely different angle with a new subject line.`;
    } else {
      stepInstruction = `This is follow-up #${sequenceContext.stepNumber}. The previous email was opened but not replied to. Reference that you sent a previous note and provide additional value.`;
    }
  }

  const systemPrompt = `You are an expert cold email copywriter who writes short, personalized, high-converting outreach emails.

Rules you MUST follow:
- Keep emails under 150 words (shorter is better)
- First line must reference something specific about the prospect
- Never use phrases like "I hope this email finds you well" or "I came across your profile"
- Write like a human, not a marketer
- Include exactly ONE clear call-to-action
- Don't be salesy — be helpful and direct
- Use the prospect's first name only
- Match the tone: ${tone} — ${toneGuide[tone]}

Respond ONLY with valid JSON. No markdown, no extra text.`;

  const researchContext = research
    ? `
RESEARCH ON PROSPECT:
- Company: ${research.company_description}
- What they do: ${research.what_they_do}
- Pain Points: ${research.pain_points.join(", ")}
- Personalization Hooks: ${research.personalization_hooks.join(", ")}
- Recommended Angle: ${research.recommended_angle}
- Icebreaker Idea: ${research.icebreaker}`
    : "";

  const prompt = `Write a cold email for this prospect.

ABOUT ME:
Sender Name: ${sender.name}
What I offer: ${sender.value_proposition}
${sender.target_audience ? `My target audience: ${sender.target_audience}` : ""}

ABOUT THE PROSPECT:
Name: ${prospectName}
Title: ${prospect.job_title || "N/A"}
Company: ${prospect.company_name || "their company"}
${researchContext}

CONTEXT: ${stepInstruction}
${sequenceContext?.previousSubject ? `Previous email subject: "${sequenceContext.previousSubject}"` : ""}
${customInstructions ? `Additional instructions: ${customInstructions}` : ""}

Respond in this EXACT JSON format:
{
  "subject": "email subject line (3-7 words)",
  "body": "plain text email body",
  "body_html": "HTML version of the email with <p> tags and <br> for line breaks",
  "tone": "${tone}"
}`;

  try {
    const content = await callAI(prompt, {
      temperature: 0.8,
      maxTokens: 800,
      systemPrompt,
    });
    if (!content) return null;
    return JSON.parse(content) as GeneratedEmail;
  } catch (error) {
    console.error("[AI] Email generation error:", error);
    return null;
  }
}

// ============================================
// REPLY CATEGORIZATION
// ============================================

export type ReplyCategory =
  | "interested"
  | "not_interested"
  | "ooo"
  | "wrong_person"
  | "unsubscribe"
  | "ask_later"
  | "unknown";

export type ReplyCategorization = {
  category: ReplyCategory;
  confidence: number;
  reasoning: string;
  suggested_action: string;
  should_stop_sequence: boolean;
};

export async function categorizeReply(params: {
  replyBody: string;
  originalSubject: string;
  originalBody: string;
  prospectName: string;
}): Promise<ReplyCategorization | null> {
  const prompt = `You are an expert at analyzing cold email replies. Categorize the following reply into one of these categories:

1. "interested" - The person shows genuine interest, wants to learn more, or asks for a call/meeting.
2. "not_interested" - The person explicitly declines, says no, or indicates they don't need the service.
3. "ooo" - Out of office / vacation auto-reply.
4. "wrong_person" - The person says they're not the right contact.
5. "unsubscribe" - The person asks to be removed from the list, says stop emailing, or replies with "unsubscribe".
6. "ask_later" - The person says it's not a good time but might be open later.
7. "unknown" - Cannot determine the intent.

**Original email subject:** ${params.originalSubject}
**Original email body (first 500 chars):** ${params.originalBody.substring(0, 500)}
**Prospect name:** ${params.prospectName}

**Reply:**
${params.replyBody}

Respond in this EXACT JSON format:
{
  "category": "interested|not_interested|ooo|wrong_person|unsubscribe|ask_later|unknown",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation of why this category was chosen",
  "suggested_action": "What the user should do next",
  "should_stop_sequence": true or false
}`;

  try {
    const content = await callAI(prompt, {
      temperature: 0.2,
      maxTokens: 500,
      systemPrompt:
        "You are an email reply analyst. Be precise and accurate in categorization. When in doubt, lean towards the most protective category.",
    });
    if (!content) return null;
    return JSON.parse(content) as ReplyCategorization;
  } catch (error) {
    console.error("[AI] Reply categorization error:", error);
    return null;
  }
}

// ============================================
// EMAIL VARIANTS (A/B Testing)
// ============================================

export async function generateEmailVariants(params: {
  prospect: {
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    company_name?: string | null;
    job_title?: string | null;
  };
  sender: {
    name: string;
    company: string;
    value_proposition: string;
  };
  research?: ProspectResearch | null;
  count?: number;
}): Promise<GeneratedEmail[]> {
  const tones = [
    "professional",
    "casual",
    "bold",
    "consultative",
  ] as const;
  const count = Math.min(params.count || 3, 4);

  const promises = tones.slice(0, count).map((tone) =>
    generateEmail({ ...params, tone })
  );

  const results = await Promise.allSettled(promises);
  return results
    .filter(
      (r): r is PromiseFulfilledResult<GeneratedEmail | null> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value!);
}

// ============================================
// SEQUENCE EMAIL SUGGESTION
// ============================================

export async function suggestSequenceEmails(params: {
  totalSteps: number;
  value_proposition: string;
  target_audience: string;
  tone: string;
}): Promise<
  Array<{
    step: number;
    subject_template: string;
    body_template: string;
    delay_days: number;
  }> | null
> {
  const prompt = `Create a ${params.totalSteps}-step cold email sequence.

My offer: ${params.value_proposition}
Target audience: ${params.target_audience}
Tone: ${params.tone}

For each step, provide:
- Subject line template (use {{first_name}}, {{company}} variables)
- Email body template (use same variables)
- Delay in days before this step (0 for step 1)

RULES:
- Each email should be under 120 words
- Each follow-up should add NEW value, not just "checking in"
- Subject lines should be different angles, not "Re:"
- Include one clear CTA per email

Respond in this EXACT JSON format:
{
  "steps": [
    {
      "step": 1,
      "subject_template": "...",
      "body_template": "...",
      "delay_days": 0
    }
  ]
}`;

  try {
    const content = await callAI(prompt, {
      temperature: 0.7,
      maxTokens: 2000,
    });
    if (!content) return null;
    const parsed = JSON.parse(content) as {
      steps: Array<{
        step: number;
        subject_template: string;
        body_template: string;
        delay_days: number;
      }>;
    };
    return parsed.steps;
  } catch (error) {
    console.error("[AI] Sequence suggestion error:", error);
    return null;
  }
}


