import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN || "";

/**
 * Initialize Sentry for crash reporting.
 * Call this once at app startup (in _layout.tsx) before any other code.
 *
 * To enable:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a React Native project and get your DSN
 * 3. Add EXPO_PUBLIC_SENTRY_DSN=<your-dsn> to your .env file
 */
export function initSentry() {
  if (!dsn) {
    if (__DEV__) {
      console.log("[Sentry] No DSN configured — crash reporting disabled");
    }
    return;
  }

  Sentry.init({
    dsn,
    // Only enabled in production builds — no noise during development
    enabled: !__DEV__,
    // Adjust sample rate as needed (1.0 = 100% of errors)
    tracesSampleRate: __DEV__ ? 0 : 0.2,
    // Don't send PII
    sendDefaultPii: false,
    // Enable auto-session tracking for crash-free rate metrics
    enableAutoSessionTracking: true,
    // Session tracking interval (in ms)
    sessionTrackingIntervalMillis: 30000,
  });
}

/**
 * Capture an exception manually.
 * Use this for non-fatal errors you want to track.
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (!dsn) return;
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Set the current user context for error reports.
 * Call this after authentication.
 */
export function setSentryUser(userId: string, email?: string) {
  if (!dsn) return;
  Sentry.setUser({ id: userId, email });
}

/**
 * Clear user context on sign out.
 */
export function clearSentryUser() {
  if (!dsn) return;
  Sentry.setUser(null);
}

export { Sentry };
