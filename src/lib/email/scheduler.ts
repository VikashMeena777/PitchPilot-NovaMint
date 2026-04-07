/**
 * Email Scheduling Engine — Smart Send-Time Optimization
 *
 * Features:
 * - Timezone-aware sending windows
 * - Optimal send-time calculation
 * - Business hours enforcement
 * - Weekday/weekend preferences
 * - Rate-paced sending (warm-up aware)
 */

export type ScheduleConfig = {
  timezone: string;                    // IANA timezone (e.g., "America/New_York")
  send_window: {
    start_hour: number;                // 0-23, e.g., 8 (8 AM)
    end_hour: number;                  // 0-23, e.g., 18 (6 PM)
  };
  send_days: number[];                 // 0=Sun, 1=Mon, ..., 6=Sat
  daily_limit: number;                 // max emails per day
  min_gap_minutes: number;             // min minutes between emails
  warmup_day: number;                  // 0 = no warmup, >0 = current warmup day
};

// Default B2B send config
const DEFAULT_SCHEDULE: ScheduleConfig = {
  timezone: "Asia/Kolkata",
  send_window: { start_hour: 9, end_hour: 17 },
  send_days: [1, 2, 3, 4, 5], // Monday-Friday
  daily_limit: 50,
  min_gap_minutes: 3,
  warmup_day: 0,
};

/**
 * Get the next optimal send time from now
 */
export function getNextSendTime(
  config: Partial<ScheduleConfig> = {},
  currentTime?: Date
): Date {
  const cfg = { ...DEFAULT_SCHEDULE, ...config };
  const now = currentTime || new Date();

  // Convert to target timezone
  const tzNow = getTimeInTimezone(now, cfg.timezone);
  const hour = tzNow.getHours();
  const day = tzNow.getDay();

  // Check if current time is within send window
  if (
    cfg.send_days.includes(day) &&
    hour >= cfg.send_window.start_hour &&
    hour < cfg.send_window.end_hour
  ) {
    // Current time is valid — add small random jitter (1-5 min)
    const jitter = Math.floor(Math.random() * 4 + 1) * 60 * 1000;
    return new Date(now.getTime() + jitter);
  }

  // Find next valid window
  let targetDate = new Date(tzNow);

  // If past today's window, start from tomorrow
  if (hour >= cfg.send_window.end_hour) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  // Find next valid send day
  let attempts = 0;
  while (!cfg.send_days.includes(targetDate.getDay()) && attempts < 8) {
    targetDate.setDate(targetDate.getDate() + 1);
    attempts++;
  }

  // Set to start of send window with random offset (0-30 min)
  targetDate.setHours(cfg.send_window.start_hour, 0, 0, 0);
  const randomOffset = Math.floor(Math.random() * 30) * 60 * 1000;

  return new Date(targetDate.getTime() + randomOffset);
}

/**
 * Calculate optimal send times for a batch of emails
 * Distributes sends evenly across the window with warm-up awareness
 */
export function scheduleBatch(
  count: number,
  config: Partial<ScheduleConfig> = {},
  startFrom?: Date
): Date[] {
  const cfg = { ...DEFAULT_SCHEDULE, ...config };
  const start = startFrom || getNextSendTime(cfg);

  // Adjust limit based on warm-up
  let effectiveLimit = cfg.daily_limit;
  if (cfg.warmup_day > 0) {
    effectiveLimit = getWarmupDailyLimit(cfg.warmup_day);
  }

  const toSchedule = Math.min(count, effectiveLimit);
  const times: Date[] = [];

  // Calculate window duration in minutes
  const windowMinutes =
    (cfg.send_window.end_hour - cfg.send_window.start_hour) * 60;

  // Space emails evenly, with minimum gap
  const idealGap = Math.max(
    cfg.min_gap_minutes,
    Math.floor(windowMinutes / toSchedule)
  );

  let currentTime = new Date(start);

  for (let i = 0; i < toSchedule; i++) {
    // Add jitter (±30 seconds)
    const jitter = (Math.random() - 0.5) * 60 * 1000;
    times.push(new Date(currentTime.getTime() + jitter));

    // Advance by gap
    currentTime = new Date(
      currentTime.getTime() + idealGap * 60 * 1000
    );

    // If we've passed today's window, skip to next valid day
    const tzTime = getTimeInTimezone(currentTime, cfg.timezone);
    if (tzTime.getHours() >= cfg.send_window.end_hour) {
      currentTime = getNextSendTime(cfg, currentTime);
    }
  }

  return times;
}

/**
 * Check if a given time is within the send window
 */
export function isWithinSendWindow(
  time: Date,
  config: Partial<ScheduleConfig> = {}
): boolean {
  const cfg = { ...DEFAULT_SCHEDULE, ...config };
  const tzTime = getTimeInTimezone(time, cfg.timezone);
  const hour = tzTime.getHours();
  const day = tzTime.getDay();

  return (
    cfg.send_days.includes(day) &&
    hour >= cfg.send_window.start_hour &&
    hour < cfg.send_window.end_hour
  );
}

/**
 * Get warm-up daily limit based on day
 * Gradual ramp: Day 1=5, Day 5=25, Day 10=50, Day 14=100, Day 15+=full
 */
function getWarmupDailyLimit(day: number): number {
  if (day <= 0) return 50;
  if (day >= 15) return 200;

  const schedule: Record<number, number> = {
    1: 5, 2: 8, 3: 12, 4: 18, 5: 25,
    6: 30, 7: 35, 8: 40, 9: 45, 10: 50,
    11: 60, 12: 75, 13: 85, 14: 100,
  };

  return schedule[day] || 50;
}

/**
 * Get time in a specific timezone
 */
function getTimeInTimezone(date: Date, timezone: string): Date {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };

    const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(date);
    const values: Record<string, string> = {};
    for (const part of parts) {
      values[part.type] = part.value;
    }

    return new Date(
      `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`
    );
  } catch {
    return date;
  }
}

/**
 * Get recommended send times for a prospect's timezone
 * Based on industry research for cold email engagement
 */
export function getOptimalSendTimes(timezone: string): {
  best: string[];
  good: string[];
  avoid: string[];
} {
  return {
    best: [
      "Tuesday 10:00 AM",
      "Wednesday 9:00 AM",
      "Thursday 2:00 PM",
    ],
    good: [
      "Monday 11:00 AM",
      "Tuesday 2:00 PM",
      "Wednesday 11:00 AM",
      "Thursday 10:00 AM",
    ],
    avoid: [
      "Friday after 3:00 PM",
      "Saturday",
      "Sunday",
      "Monday before 9:00 AM",
    ],
  };
}

export { DEFAULT_SCHEDULE, getWarmupDailyLimit };
