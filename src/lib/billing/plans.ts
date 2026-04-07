// ============================================
// PitchPilot Billing Plans
// ============================================

export type PlanId = "free" | "starter" | "growth" | "agency";

export interface PlanDetails {
  id: PlanId;
  name: string;
  description: string;
  price: number; // INR per month
  currency: "INR";
  features: string[];
  limits: {
    monthlyProspects: number;
    activeSequences: number; // -1 = unlimited
    dailySendLimit: number;
  };
  cashfreePlanId: string | null; // null for free plan
  trialDays: number;
  popular?: boolean;
}

export const PLANS: Record<PlanId, PlanDetails> = {
  free: {
    id: "free",
    name: "Free",
    description: "Perfect for getting started with cold outreach",
    price: 0,
    currency: "INR",
    features: [
      "25 prospects per month",
      "1 active sequence",
      "AI email generation",
      "Basic analytics",
      "Email tracking (opens & clicks)",
    ],
    limits: {
      monthlyProspects: 25,
      activeSequences: 1,
      dailySendLimit: 20,
    },
    cashfreePlanId: null,
    trialDays: 0,
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "For freelancers and small teams ramping up outreach",
    price: 349,
    currency: "INR",
    features: [
      "200 prospects per month",
      "3 active sequences",
      "100 emails per day",
      "Full analytics dashboard",
      "Priority AI models",
      "No PitchPilot branding",
    ],
    limits: {
      monthlyProspects: 200,
      activeSequences: 3,
      dailySendLimit: 100,
    },
    cashfreePlanId: "pitchpilot_starter_monthly",
    trialDays: 7,
    popular: true,
  },
  growth: {
    id: "growth",
    name: "Growth",
    description: "For growing businesses scaling their pipeline",
    price: 899,
    currency: "INR",
    features: [
      "500 prospects per month",
      "Unlimited sequences",
      "200 emails per day",
      "A/B testing",
      "Advanced analytics",
      "Priority AI models",
      "No PitchPilot branding",
    ],
    limits: {
      monthlyProspects: 500,
      activeSequences: -1,
      dailySendLimit: 200,
    },
    cashfreePlanId: "pitchpilot_growth_monthly",
    trialDays: 0,
  },
  agency: {
    id: "agency",
    name: "Agency",
    description: "For agencies managing multiple client campaigns",
    price: 1999,
    currency: "INR",
    features: [
      "2,000 prospects per month",
      "Unlimited sequences",
      "500 emails per day",
      "A/B testing",
      "Multi-user access",
      "White-label emails",
      "API access",
      "Priority support",
    ],
    limits: {
      monthlyProspects: 2000,
      activeSequences: -1,
      dailySendLimit: 500,
    },
    cashfreePlanId: "pitchpilot_agency_monthly",
    trialDays: 0,
  },
};

export function getPlanById(planId: string): PlanDetails {
  return PLANS[planId as PlanId] || PLANS.free;
}

export function getPlanLimits(planId: string) {
  return getPlanById(planId).limits;
}

export function canUserPerformAction(
  userPlan: string,
  action: "add_prospect" | "create_sequence" | "send_email",
  currentCount: number
): { allowed: boolean; message?: string } {
  const plan = getPlanById(userPlan);

  switch (action) {
    case "add_prospect":
      if (currentCount >= plan.limits.monthlyProspects) {
        return {
          allowed: false,
          message: `You've reached your ${plan.limits.monthlyProspects} prospect limit. Upgrade to ${getNextPlan(userPlan)?.name || "a higher plan"} for more.`,
        };
      }
      break;
    case "create_sequence":
      if (plan.limits.activeSequences !== -1 && currentCount >= plan.limits.activeSequences) {
        return {
          allowed: false,
          message: `You can only have ${plan.limits.activeSequences} active sequence${plan.limits.activeSequences > 1 ? "s" : ""}. Upgrade for unlimited sequences.`,
        };
      }
      break;
    case "send_email":
      if (currentCount >= plan.limits.dailySendLimit) {
        return {
          allowed: false,
          message: `You've hit your daily limit of ${plan.limits.dailySendLimit} emails. Try again tomorrow or upgrade.`,
        };
      }
      break;
  }

  return { allowed: true };
}

function getNextPlan(currentPlan: string): PlanDetails | null {
  const order: PlanId[] = ["free", "starter", "growth", "agency"];
  const idx = order.indexOf(currentPlan as PlanId);
  return idx < order.length - 1 ? PLANS[order[idx + 1]] : null;
}
