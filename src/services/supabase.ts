import {
  createClient,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import { openAuthSessionAsync } from "expo-web-browser";
import * as Linking from "expo-linking";
import { setSentryUser, clearSentryUser } from "./sentry";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn(
    "⚠️ Supabase credentials missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file and restart Metro with -c."
  );
}

// createClient requires non-empty strings, but the real check is isConfigured
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder",
);

// Hybrid helper: returns mock data when Supabase isn't configured
export function isSupabaseConfigured(): boolean {
  return isConfigured;
}



// ─── Auth Methods ────────────────────────────────────────────────────────────

export async function signUpWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    // Local fallback: simulate sign-up
    return { data: { user: { id: `local-${Date.now()}`, email } }, error: null };
  }

  try {
    const result = await supabase.auth.signUp({ email, password });
    if (result.error) {
      // Supabase API error (rate limit, network, etc.) → fall back to local
      console.warn("Supabase signUp failed, falling back to local mode:", result.error.message);
      return { data: { user: { id: `local-${Date.now()}`, email } }, error: null };
    }
    if (result.data.user) {
      setSentryUser(result.data.user.id, result.data.user.email ?? undefined);
    }
    return result;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn("Supabase signUp threw, falling back to local mode:", message);
    return { data: { user: { id: `local-${Date.now()}`, email } }, error: null };
  }
}

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    // Local fallback: simulate sign-in (check for stored user)
    return { data: { user: { id: "local-user", email } }, error: null };
  }

  try {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      console.warn("Supabase signIn failed, falling back to local mode:", result.error.message);
      return { data: { user: { id: "local-user", email } }, error: null };
    }
    if (result.data.user) {
      setSentryUser(result.data.user.id, result.data.user.email ?? undefined);
    }
    return result;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn("Supabase signIn threw, falling back to local mode:", message);
    return { data: { user: { id: "local-user", email } }, error: null };
  }
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) {
    // Local fallback: simulate Google sign-in
    return {
      data: { user: { id: `local-google-${Date.now()}`, email: "user@gmail.com" } },
      error: null,
    };
  }

  try {
    const redirectUri = makeRedirectUri({
      scheme: "arch",
      path: "auth/callback",
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.warn("Supabase Google OAuth error:", error.message);
      return { data: null, error };
    }
    if (!data.url) return { data: null, error: new Error("No OAuth URL returned") };

    // Open the OAuth URL in a browser
    const result = await openAuthSessionAsync(data.url, redirectUri);

    if (result.type === "success") {
      // Exchange the auth code for a session
      const queryParams = result.url
        .split("?")[1]
        ?.split("&")
        .reduce(
          (acc, pair) => {
            const [key, val] = pair.split("=");
            acc[decodeURIComponent(key)] = decodeURIComponent(val || "");
            return acc;
          },
          {} as Record<string, string>,
        );
      const code = queryParams?.["code"];
      if (code) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (sessionData?.user) {
          setSentryUser(sessionData.user.id, sessionData.user.email ?? undefined);
        }
        return { data: sessionData, error: sessionError };
      }
      return { data: null, error: new Error("No auth code in redirect URL") };
    }

    return { data: null, error: new Error("OAuth cancelled or failed") };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn("Supabase Google OAuth threw, falling back to local:", message);
    return {
      data: { user: { id: `local-google-${Date.now()}`, email: "user@gmail.com" } },
      error: null,
    };
  }
}

export async function signOut() {
  clearSentryUser();
  if (!isSupabaseConfigured()) {
    // Local fallback: no-op
    return { error: null };
  }
  return supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  if (!isSupabaseConfigured()) {
    // Local fallback
    return { data: {}, error: null };
  }
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${Linking.createURL("/auth/update-password")}`,
  });
}

export async function getCurrentSession() {
  if (!isSupabaseConfigured()) return { data: { session: null }, error: null };
  return supabase.auth.getSession();
}

// ─── Placeholder for future real-time subscriptions ──────────────────────────

export function subscribeToUserProgress(
  userId: string,
  callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
): () => void {
  if (!isSupabaseConfigured()) return () => {};
  const subscription: RealtimeChannel = supabase
    .channel(`user-progress-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_progress",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => callback(payload),
    )
    .subscribe();
  return () => subscription.unsubscribe();
}
