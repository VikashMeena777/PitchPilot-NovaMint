/**
 * Error Tracking Service — Sentry-ready wrapper
 *
 * Provides a unified interface for error tracking that works with or without Sentry.
 * When NEXT_PUBLIC_SENTRY_DSN is configured, errors are sent to Sentry.
 * Otherwise, falls back to structured console logging.
 */

export type ErrorContext = {
  userId?: string;
  email?: string;
  action?: string;
  component?: string;
  extra?: Record<string, unknown>;
};

export type ErrorSeverity = "fatal" | "error" | "warning" | "info";

/**
 * Capture and report an error
 */
export function captureError(
  error: Error | string,
  context?: ErrorContext,
  severity: ErrorSeverity = "error"
): void {
  const err = typeof error === "string" ? new Error(error) : error;

  // Sentry integration (when configured)
  if (typeof window !== "undefined" && (window as any).__SENTRY__) {
    try {
      const Sentry = (window as any).__SENTRY__;
      Sentry.withScope((scope: any) => {
        if (context?.userId) scope.setUser({ id: context.userId, email: context.email });
        if (context?.action) scope.setTag("action", context.action);
        if (context?.component) scope.setTag("component", context.component);
        if (context?.extra) scope.setExtras(context.extra);
        scope.setLevel(severity);
        Sentry.captureException(err);
      });
      return;
    } catch {
      // Fall through to console
    }
  }

  // Structured console logging fallback
  const logData = {
    timestamp: new Date().toISOString(),
    severity,
    message: err.message,
    stack: err.stack?.split("\n").slice(0, 5).join("\n"),
    ...context,
  };

  switch (severity) {
    case "fatal":
    case "error":
      console.error("[PitchPilot Error]", JSON.stringify(logData, null, 2));
      break;
    case "warning":
      console.warn("[PitchPilot Warning]", JSON.stringify(logData, null, 2));
      break;
    case "info":
      console.info("[PitchPilot Info]", JSON.stringify(logData, null, 2));
      break;
  }
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  context?: ErrorContext,
  severity: ErrorSeverity = "info"
): void {
  if (typeof window !== "undefined" && (window as any).__SENTRY__) {
    try {
      const Sentry = (window as any).__SENTRY__;
      Sentry.captureMessage(message, severity);
      return;
    } catch {
      // Fall through
    }
  }

  console.log(`[PitchPilot ${severity}]`, message, context || "");
}

/**
 * Set user context for all future error reports
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  name?: string;
}): void {
  if (typeof window !== "undefined" && (window as any).__SENTRY__) {
    try {
      (window as any).__SENTRY__.setUser(user);
    } catch {
      // Ignore
    }
  }
}

/**
 * Wrap an async function with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Omit<ErrorContext, "extra">
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error instanceof Error ? error : new Error(String(error)), {
        ...context,
        extra: { args: args.length > 0 ? args : undefined },
      });
      throw error;
    }
  }) as T;
}

/**
 * Create a breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
): void {
  if (typeof window !== "undefined" && (window as any).__SENTRY__) {
    try {
      (window as any).__SENTRY__.addBreadcrumb({
        category,
        message,
        data,
        level: "info",
        timestamp: Date.now() / 1000,
      });
    } catch {
      // Ignore
    }
  }
}
