/**
 * Date/time utility helpers for PitchMint
 */

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
 */
export function timeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format a date as "Jan 15, 2025"
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date as "Jan 15, 2025 at 2:30 PM"
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Get start of day in ISO format
 */
export function startOfDay(date?: Date): string {
  const d = date || new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Get end of day in ISO format
 */
export function endOfDay(date?: Date): string {
  const d = date || new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/**
 * Get date N days ago
 */
export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/**
 * Get date N days from now
 */
export function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * Calculate account age in days from a creation date
 */
export function accountAgeDays(createdAt: string | Date): number {
  const created = new Date(createdAt);
  return Math.floor(
    (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Get the warm-up sending limit based on account age
 * Week 1: 5/day, Week 2: 15/day, Week 3: 30/day, Week 4+: full limit
 */
export function getWarmUpLimit(
  accountCreatedAt: string | Date,
  maxLimit: number = 50
): number {
  const age = accountAgeDays(accountCreatedAt);
  if (age < 7) return Math.min(5, maxLimit);
  if (age < 14) return Math.min(15, maxLimit);
  if (age < 21) return Math.min(30, maxLimit);
  return maxLimit;
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

/**
 * Schedule a time with random jitter to avoid sending bursts
 * Returns a Date object offset by `delayMinutes` + random jitter
 */
export function scheduleWithJitter(
  delayMinutes: number,
  jitterMinutes: number = 5
): Date {
  const jitter = Math.floor(Math.random() * jitterMinutes * 60 * 1000);
  return new Date(Date.now() + delayMinutes * 60 * 1000 + jitter);
}
