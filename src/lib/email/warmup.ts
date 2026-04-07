/**
 * Email Warm-up System
 *
 * Gradually ramps sending limits for new accounts to protect domain reputation.
 * Default ramp: Day 1-3: 20/day → Day 4-7: 40/day → Day 8-14: 70/day → Day 15+: 100/day
 *
 * Plan-based max limits override warm-up caps when the warm-up period is complete.
 */

export type WarmupStage = {
  label: string;
  maxPerDay: number;
  daysFrom: number;
  daysTo: number;
};

export const WARMUP_STAGES: WarmupStage[] = [
  { label: "Warming Up (Phase 1)", maxPerDay: 20, daysFrom: 0, daysTo: 3 },
  { label: "Warming Up (Phase 2)", maxPerDay: 40, daysFrom: 4, daysTo: 7 },
  { label: "Warming Up (Phase 3)", maxPerDay: 70, daysFrom: 8, daysTo: 14 },
  { label: "Fully Warmed", maxPerDay: 100, daysFrom: 15, daysTo: Infinity },
];

/**
 * Get the current warm-up stage based on account age
 */
export function getWarmupStage(accountCreatedAt: string): WarmupStage {
  const created = new Date(accountCreatedAt);
  const now = new Date();
  const daysSinceCreation = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  );

  for (const stage of WARMUP_STAGES) {
    if (daysSinceCreation >= stage.daysFrom && daysSinceCreation <= stage.daysTo) {
      return stage;
    }
  }

  // Fallback: fully warmed
  return WARMUP_STAGES[WARMUP_STAGES.length - 1];
}

/**
 * Calculate the effective daily send limit considering both warm-up and plan limits
 */
export function getEffectiveDailyLimit(
  accountCreatedAt: string,
  planDailyLimit: number
): number {
  const stage = getWarmupStage(accountCreatedAt);
  // During warm-up, use the lower of warm-up cap or plan limit
  return Math.min(stage.maxPerDay, planDailyLimit);
}

/**
 * Check if the user can send more emails today
 */
export function canSendMore(
  sentToday: number,
  accountCreatedAt: string,
  planDailyLimit: number
): { allowed: boolean; remaining: number; limit: number; stage: string } {
  const limit = getEffectiveDailyLimit(accountCreatedAt, planDailyLimit);
  const remaining = Math.max(0, limit - sentToday);
  const stage = getWarmupStage(accountCreatedAt);

  return {
    allowed: sentToday < limit,
    remaining,
    limit,
    stage: stage.label,
  };
}

/**
 * Get warm-up progress as a percentage (0-100)
 */
export function getWarmupProgress(accountCreatedAt: string): number {
  const created = new Date(accountCreatedAt);
  const now = new Date();
  const daysSinceCreation = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceCreation >= 15) return 100;
  return Math.min(100, Math.round((daysSinceCreation / 15) * 100));
}

/**
 * Format warm-up status for display
 */
export function getWarmupStatus(
  accountCreatedAt: string,
  planDailyLimit: number,
  sentToday: number = 0
): {
  stage: string;
  progress: number;
  limit: number;
  sent: number;
  remaining: number;
  isWarmedUp: boolean;
  daysLeft: number;
} {
  const stage = getWarmupStage(accountCreatedAt);
  const progress = getWarmupProgress(accountCreatedAt);
  const limit = getEffectiveDailyLimit(accountCreatedAt, planDailyLimit);
  const remaining = Math.max(0, limit - sentToday);

  const created = new Date(accountCreatedAt);
  const now = new Date();
  const daysSinceCreation = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    stage: stage.label,
    progress,
    limit,
    sent: sentToday,
    remaining,
    isWarmedUp: daysSinceCreation >= 15,
    daysLeft: Math.max(0, 15 - daysSinceCreation),
  };
}
