/**
 * Supabase Fallback Logic Stress Tests
 * Tests that the app gracefully handles missing credentials and API failures
 */

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock Supabase module
const mockSignUp = jest.fn();
const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
const mockResetPassword = jest.fn();
const mockGetSession = jest.fn();
const mockExchangeCode = jest.fn();
const mockSignInOAuth = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignIn,
      signOut: mockSignOut,
      resetPasswordForEmail: mockResetPassword,
      getSession: mockGetSession,
      exchangeCodeForSession: mockExchangeCode,
      signInWithOAuth: mockSignInOAuth,
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
  })),
}));

// Mock expo modules
jest.mock("expo-auth-session", () => ({
  makeRedirectUri: jest.fn(() => "arch://auth/callback"),
}));

jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: jest.fn(),
}));

jest.mock("expo-linking", () => ({
  createURL: jest.fn(() => "arch://"),
}));

// Clear env vars to simulate missing credentials
const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  // Force empty env vars to test fallback mode
  process.env = { ...originalEnv };
  process.env.EXPO_PUBLIC_SUPABASE_URL = "";
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "";

  // Reset modules to re-import with empty env vars
  jest.resetModules();
});

afterAll(() => {
  process.env = originalEnv;
});

describe("Supabase Fallback Stress Tests", () => {
  it("isSupabaseConfigured returns false when env vars are empty", () => {
    const { isSupabaseConfigured } = require("../services/supabase");
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("signUp returns local fallback when not configured", async () => {
    const { signUpWithEmail } = require("../services/supabase");
    const result = await signUpWithEmail("test@test.com", "password123");

    expect(result.error).toBeNull();
    expect(result.data.user).toBeDefined();
    expect(result.data.user.id).toMatch(/^local-/);
    expect(result.data.user.email).toBe("test@test.com");
  });

  it("signIn returns local fallback when not configured", async () => {
    const { signInWithEmail } = require("../services/supabase");
    const result = await signInWithEmail("test@test.com", "password123");

    expect(result.error).toBeNull();
    expect(result.data.user).toBeDefined();
    expect(result.data.user.id).toBe("local-user");
  });

  it("signOut succeeds without error when not configured", async () => {
    const { signOut } = require("../services/supabase");
    const result = await signOut();
    expect(result.error).toBeNull();
  });

  it("resetPassword succeeds without error when not configured", async () => {
    const { resetPassword } = require("../services/supabase");
    const result = await resetPassword("test@test.com");
    expect(result.error).toBeNull();
  });

  it("getCurrentSession returns null session when not configured", async () => {
    const { getCurrentSession } = require("../services/supabase");
    const result = await getCurrentSession();
    expect(result.data.session).toBeNull();
    expect(result.error).toBeNull();
  });

  it("subscribeToUserProgress returns cleanup function when not configured", () => {
    const { subscribeToUserProgress } = require("../services/supabase");
    const unsubscribe = subscribeToUserProgress("user-1", jest.fn());
    expect(typeof unsubscribe).toBe("function");
    // Should not throw when called
    unsubscribe();
  });

  it("handles rapid sign-up/sign-in/sign-out cycles in fallback mode", async () => {
    const { signUpWithEmail, signInWithEmail, signOut } = require("../services/supabase");

    for (let i = 0; i < 20; i++) {
      const signUpResult = await signUpWithEmail(`user${i}@test.com`, "pass");
      expect(signUpResult.error).toBeNull();

      const signInResult = await signInWithEmail(`user${i}@test.com`, "pass");
      expect(signInResult.error).toBeNull();

      const signOutResult = await signOut();
      expect(signOutResult.error).toBeNull();
    }
  });

  it("handles concurrent sign-up calls without crashing", async () => {
    const { signUpWithEmail } = require("../services/supabase");

    const promises = Array.from({ length: 10 }, (_, i) =>
      signUpWithEmail(`user${i}@test.com`, "pass"),
    );

    const results = await Promise.all(promises);
    results.forEach((result) => {
      expect(result.error).toBeNull();
      expect(result.data.user).toBeDefined();
    });
  });

  it("createClient does not throw with empty strings", () => {
    expect(() => {
      require("../services/supabase");
    }).not.toThrow();
  });
});
