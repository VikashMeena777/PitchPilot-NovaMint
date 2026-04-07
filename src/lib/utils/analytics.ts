/**
 * Product Analytics — PostHog-ready wrapper
 *
 * Unified analytics interface that works with or without PostHog.
 * When NEXT_PUBLIC_POSTHOG_KEY is configured, events go to PostHog.
 * Otherwise, falls back to structured console logging (dev mode).
 */

export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
};

export type UserProperties = {
  email?: string;
  name?: string;
  company?: string;
  plan?: string;
  createdAt?: string;
  [key: string]: unknown;
};

/**
 * Initialize analytics (call once on app mount)
 */
export function initAnalytics(): void {
  if (typeof window === "undefined") return;

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (posthogKey && !(window as any).posthog) {
    // PostHog auto-loads via script tag or npm package
    // This is a placeholder for the initialization
    console.log("[Analytics] PostHog would initialize with key:", posthogKey.slice(0, 8) + "...");
  }
}

/**
 * Track a custom event
 */
export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  // PostHog
  if ((window as any).posthog?.capture) {
    (window as any).posthog.capture(event, properties);
    return;
  }

  // Dev fallback
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${event}`, properties || "");
  }
}

/**
 * Identify a user (after login)
 */
export function identifyUser(userId: string, properties?: UserProperties): void {
  if (typeof window === "undefined") return;

  if ((window as any).posthog?.identify) {
    (window as any).posthog.identify(userId, properties);
    return;
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics] Identify:", userId, properties);
  }
}

/**
 * Reset analytics (on logout)
 */
export function resetAnalytics(): void {
  if (typeof window === "undefined") return;

  if ((window as any).posthog?.reset) {
    (window as any).posthog.reset();
    return;
  }
}

/**
 * Track page view
 */
export function trackPageView(path?: string): void {
  if (typeof window === "undefined") return;

  const pagePath = path || window.location.pathname;

  if ((window as any).posthog?.capture) {
    (window as any).posthog.capture("$pageview", { $current_url: pagePath });
    return;
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics] Page view:", pagePath);
  }
}

// ── Pre-defined event helpers ──

export const analytics = {
  // Auth events
  signUp: (method: "email" | "google") =>
    trackEvent("user_signed_up", { method }),
  login: (method: "email" | "google") =>
    trackEvent("user_logged_in", { method }),
  logout: () => trackEvent("user_logged_out"),

  // Onboarding
  onboardingStep: (step: number, stepName: string) =>
    trackEvent("onboarding_step_completed", { step, stepName }),
  onboardingCompleted: () => trackEvent("onboarding_completed"),

  // Prospect events
  prospectAdded: (source: "manual" | "csv" | "webhook") =>
    trackEvent("prospect_added", { source }),
  prospectResearched: (prospectId: string) =>
    trackEvent("prospect_researched", { prospectId }),
  prospectBulkAction: (action: string, count: number) =>
    trackEvent("prospect_bulk_action", { action, count }),

  // Sequence events
  sequenceCreated: (stepCount: number) =>
    trackEvent("sequence_created", { stepCount }),
  sequenceActivated: (sequenceId: string) =>
    trackEvent("sequence_activated", { sequenceId }),
  prospectEnrolled: (sequenceId: string) =>
    trackEvent("prospect_enrolled_in_sequence", { sequenceId }),

  // Email events
  emailSent: (type: "manual" | "sequence") =>
    trackEvent("email_sent", { type }),
  emailOpened: () => trackEvent("email_opened"),
  emailClicked: () => trackEvent("email_link_clicked"),
  emailReplied: (category: string) =>
    trackEvent("email_replied", { category }),
  testEmailSent: () => trackEvent("test_email_sent"),

  // AI events
  aiEmailGenerated: (prospectId: string) =>
    trackEvent("ai_email_generated", { prospectId }),
  aiResearchCompleted: (prospectId: string) =>
    trackEvent("ai_research_completed", { prospectId }),

  // Billing events
  planSelected: (plan: string) =>
    trackEvent("plan_selected", { plan }),
  subscriptionCreated: (plan: string, amount: number) =>
    trackEvent("subscription_created", { plan, amount }),

  // Template events
  templateCreated: () => trackEvent("template_created"),
  templateUsed: (templateId: string) =>
    trackEvent("template_used", { templateId }),

  // Settings events
  settingsUpdated: (section: string) =>
    trackEvent("settings_updated", { section }),
  apiKeyGenerated: () => trackEvent("api_key_generated"),
  smtpConfigured: () => trackEvent("smtp_configured"),

  // Feature usage
  featureUsed: (feature: string) =>
    trackEvent("feature_used", { feature }),
};
