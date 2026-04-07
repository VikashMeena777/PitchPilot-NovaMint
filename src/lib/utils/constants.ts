// ============================================
// PLAN LIMITS
// ============================================
export const PLAN_LIMITS = {
  free: {
    monthlyProspects: 25,
    activeSequences: 1,
    dailySendLimit: 20,
    price: 0,
    features: ["ai_email_generation", "basic_analytics", "email_tracking"],
  },
  starter: {
    monthlyProspects: 200,
    activeSequences: 3,
    dailySendLimit: 100,
    price: 349,
    features: ["full_analytics", "no_branding", "priority_ai"],
  },
  growth: {
    monthlyProspects: 500,
    activeSequences: -1, // unlimited
    dailySendLimit: 200,
    price: 899,
    features: ["full_analytics", "no_branding", "priority_ai", "ab_testing"],
  },
  agency: {
    monthlyProspects: 2000,
    activeSequences: -1,
    dailySendLimit: 500,
    price: 1999,
    features: [
      "full_analytics",
      "no_branding",
      "priority_ai",
      "ab_testing",
      "multi_user",
      "white_label",
      "api_access",
    ],
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

// ============================================
// WARM-UP SCHEDULE
// ============================================
export const WARMUP_SCHEDULE: Record<string, number> = {
  "1-3": 20,
  "4-7": 35,
  "8-14": 50,
};

export function getWarmupLimit(accountAgeDays: number): number {
  if (accountAgeDays <= 3) return 20;
  if (accountAgeDays <= 7) return 35;
  if (accountAgeDays <= 14) return 50;
  return -1; // use plan limit
}

// ============================================
// PROSPECT STATUSES
// ============================================
export const PROSPECT_STATUSES = [
  "new",
  "contacted",
  "opened",
  "replied",
  "interested",
  "not_interested",
  "meeting_booked",
  "unsubscribed",
] as const;

export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

// ============================================
// EMAIL STATUSES
// ============================================
export const EMAIL_STATUSES = [
  "draft",
  "queued",
  "sending",
  "sent",
  "failed",
  "bounced",
] as const;

export type EmailStatus = (typeof EMAIL_STATUSES)[number];

// ============================================
// REPLY CATEGORIES
// ============================================
export const REPLY_CATEGORIES = [
  "interested",
  "not_interested",
  "out_of_office",
  "wrong_person",
  "ask_later",
] as const;

export type ReplyCategory = (typeof REPLY_CATEGORIES)[number];

// ============================================
// TONE PRESETS
// ============================================
export const TONE_PRESETS = [
  "professional",
  "casual",
  "bold",
  "consultative",
] as const;

export type TonePreset = (typeof TONE_PRESETS)[number];

// ============================================
// SENDING SCHEDULE
// ============================================
export const SENDING_CONFIG = {
  defaultStartHour: 9,
  defaultEndHour: 17,
  defaultWorkDays: [1, 2, 3, 4, 5], // Mon-Fri
  minDelayBetweenEmails: 45, // seconds
  maxDelayBetweenEmails: 180, // seconds
  maxRetriesOnFail: 3,
  bounceRateThreshold: 0.05, // 5%
};

// ============================================
// AI CONFIG
// ============================================
export const AI_CONFIG = {
  maxEmailWords: 150,
  researchCacheDays: 7,
  maxResearchPerBatch: 10,
  maxEmailsPerCronRun: 10,
};

// ============================================
// APP URLs
// ============================================
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
