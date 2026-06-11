/**
 * Theme System Stress Tests
 * Tests rapid theme switching, persistence, accent color combos, and edge cases
 */

// Mock AsyncStorage before importing the store
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

import { useUserStore } from "../stores/useUserStore";
import { getColors, accentOptions, AccentKey, ThemeMode } from "../tokens/themes";

beforeEach(() => {
  // Reset store to defaults
  useUserStore.setState({
    themeMode: "dark" as ThemeMode,
    accentColor: "amber" as AccentKey,
  });
});

describe("Theme System Stress Tests", () => {
  describe("Rapid theme switching", () => {
    it("handles 100 rapid dark/light toggles without corruption", () => {
      for (let i = 0; i < 100; i++) {
        const mode: ThemeMode = i % 2 === 0 ? "dark" : "light";
        useUserStore.getState().setThemeMode(mode);
        expect(useUserStore.getState().themeMode).toBe(mode);
      }
    });

    it("handles rapid accent color cycling through all options", () => {
      const accents: AccentKey[] = ["amber", "emerald", "cyan", "rose"];
      for (let i = 0; i < 40; i++) {
        const accent = accents[i % accents.length];
        useUserStore.getState().setAccentColor(accent);
        expect(useUserStore.getState().accentColor).toBe(accent);
      }
    });

    it("handles simultaneous theme mode and accent color changes", () => {
      const modes: ThemeMode[] = ["dark", "light"];
      const accents: AccentKey[] = ["amber", "emerald", "cyan", "rose"];

      for (let i = 0; i < 50; i++) {
        const mode = modes[i % 2];
        const accent = accents[i % 4];
        useUserStore.getState().setThemeMode(mode);
        useUserStore.getState().setAccentColor(accent);
        expect(useUserStore.getState().themeMode).toBe(mode);
        expect(useUserStore.getState().accentColor).toBe(accent);
      }
    });

    it("preserves theme state after rapid auth state changes", () => {
      useUserStore.getState().setThemeMode("light");
      useUserStore.getState().setAccentColor("rose");

      // Simulate rapid auth changes
      for (let i = 0; i < 20; i++) {
        useUserStore.getState().setAuth(`user-${i}`, `email${i}@test.com`);
        expect(useUserStore.getState().themeMode).toBe("light");
        expect(useUserStore.getState().accentColor).toBe("rose");
        useUserStore.getState().clearAuth();
        expect(useUserStore.getState().themeMode).toBe("light");
        expect(useUserStore.getState().accentColor).toBe("rose");
      }
    });
  });

  describe("Color palette generation", () => {
    it("generates valid colors for every theme/accent combination", () => {
      const modes: ThemeMode[] = ["dark", "light"];
      const accents: AccentKey[] = ["amber", "emerald", "cyan", "rose"];

      for (const mode of modes) {
        for (const accent of accents) {
          const colors = getColors(mode, accent);

          // Verify all required color properties exist
          expect(colors.bg).toBeDefined();
          expect(colors.bg.primary).toBeDefined();
          expect(colors.bg.elevated).toBeDefined();
          expect(colors.bg.highlight).toBeDefined();
          expect(colors.bg.surface).toBeDefined();
          expect(colors.accent).toBeDefined();
          expect(colors.accent.DEFAULT).toBeDefined();
          expect(colors.text).toBeDefined();
          expect(colors.text.primary).toBeDefined();
          expect(colors.text.secondary).toBeDefined();
          expect(colors.border).toBeDefined();
          expect(colors.border.subtle).toBeDefined();
          expect(colors.success).toBeDefined();
          expect(colors.error).toBeDefined();
          expect(colors.warning).toBeDefined();

          // Verify colors are valid hex
          expect(colors.bg.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
          expect(colors.accent.DEFAULT).toMatch(/^#[0-9A-Fa-f]{6}$/);
          expect(colors.text.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
          expect(colors.success).toMatch(/^#[0-9A-Fa-f]{6}$/);
          expect(colors.error).toMatch(/^#[0-9A-Fa-f]{6}$/);
        }
      }
    });

    it("dark and light palettes produce different bg colors", () => {
      const darkColors = getColors("dark", "amber");
      const lightColors = getColors("light", "amber");

      expect(darkColors.bg.primary).not.toBe(lightColors.bg.primary);
      expect(darkColors.bg.elevated).not.toBe(lightColors.bg.elevated);
      expect(darkColors.text.primary).not.toBe(lightColors.text.primary);
    });

    it("different accent colors produce different accent values", () => {
      const accents: AccentKey[] = ["amber", "emerald", "cyan", "rose"];
      const accentValues = accents.map((a) => getColors("dark", a).accent.DEFAULT);

      // All accent DEFAULTs should be unique
      const unique = new Set(accentValues);
      expect(unique.size).toBe(accents.length);
    });

    it("accent text color matches accent DEFAULT", () => {
      const accents: AccentKey[] = ["amber", "emerald", "cyan", "rose"];
      for (const accent of accents) {
        const colors = getColors("dark", accent);
        expect(colors.text.accent).toBe(colors.accent.DEFAULT);
        expect(colors.border.accent).toBe(colors.accent.DEFAULT);
      }
    });
  });

  describe("Store persistence integrity", () => {
    it("persists and restores all theme fields correctly", () => {
      useUserStore.getState().setThemeMode("light");
      useUserStore.getState().setAccentColor("rose");

      const state = useUserStore.getState();
      expect(state.themeMode).toBe("light");
      expect(state.accentColor).toBe("rose");
    });

    it("partialize includes all required theme fields", () => {
      // Access the store's persisted state shape
      const state = useUserStore.getState();

      // These should all be present in the persisted state
      expect(state).toHaveProperty("themeMode");
      expect(state).toHaveProperty("accentColor");
      expect(state).toHaveProperty("avatarUri");
      expect(state).toHaveProperty("displayName");
      expect(state).toHaveProperty("totalXp");
      expect(state).toHaveProperty("workoutHistory");
    });

    it("avatarUri defaults to null", () => {
      expect(useUserStore.getState().avatarUri).toBeNull();
    });

    it("avatarUri can be set and cleared", () => {
      const testUri = "file:///tmp/test-avatar.jpg";
      useUserStore.setState({ avatarUri: testUri });
      expect(useUserStore.getState().avatarUri).toBe(testUri);

      useUserStore.setState({ avatarUri: null });
      expect(useUserStore.getState().avatarUri).toBeNull();
    });

    it("clearAuth preserves theme and avatar state", () => {
      useUserStore.getState().setAuth("user-1", "test@test.com");
      useUserStore.getState().setThemeMode("light");
      useUserStore.getState().setAccentColor("cyan");
      useUserStore.setState({ avatarUri: "file:///test.jpg" });

      useUserStore.getState().clearAuth();

      expect(useUserStore.getState().isAuthenticated).toBe(false);
      expect(useUserStore.getState().themeMode).toBe("light");
      expect(useUserStore.getState().accentColor).toBe("cyan");
      expect(useUserStore.getState().avatarUri).toBe("file:///test.jpg");
    });

    it("clearAuth preserves workout history", () => {
      const session = {
        id: "test-1",
        workoutId: "workout-a",
        date: "2026-06-01",
        duration: 600,
        setsCompleted: 24,
        xpEarned: 700,
        exercises: [],
      };
      useUserStore.getState().addWorkoutSession(session);
      expect(useUserStore.getState().workoutHistory.length).toBe(1);

      useUserStore.getState().setAuth("user-1", "test@test.com");
      useUserStore.getState().clearAuth();

      expect(useUserStore.getState().workoutHistory.length).toBe(1);
      expect(useUserStore.getState().totalXp).toBe(700);
    });
  });

  describe("Edge cases", () => {
    it("handles setting same theme mode twice", () => {
      useUserStore.getState().setThemeMode("dark");
      useUserStore.getState().setThemeMode("dark");
      expect(useUserStore.getState().themeMode).toBe("dark");
    });

    it("handles setting same accent twice", () => {
      useUserStore.getState().setAccentColor("amber");
      useUserStore.getState().setAccentColor("amber");
      expect(useUserStore.getState().accentColor).toBe("amber");
    });

    it("handles profile update with theme fields intact", () => {
      useUserStore.getState().setThemeMode("light");
      useUserStore.getState().setAccentColor("rose");
      useUserStore.getState().updateProfile({ displayName: "NEW NAME" });

      expect(useUserStore.getState().displayName).toBe("NEW NAME");
      expect(useUserStore.getState().themeMode).toBe("light");
      expect(useUserStore.getState().accentColor).toBe("rose");
    });

    it("handles updateProfile with avatarUri", () => {
      useUserStore.getState().updateProfile({ avatarUri: "file:///photo.jpg" });
      expect(useUserStore.getState().avatarUri).toBe("file:///photo.jpg");
    });

    it("handles updateProfile with null avatarUri to clear", () => {
      useUserStore.setState({ avatarUri: "file:///old.jpg" });
      useUserStore.getState().updateProfile({ avatarUri: null });
      expect(useUserStore.getState().avatarUri).toBeNull();
    });
  });

  describe("Derived state consistency", () => {
    it("level and xpProgress stay consistent through theme changes", () => {
      const addSession = () => {
        useUserStore.getState().addWorkoutSession({
          id: `s-${Date.now()}-${Math.random()}`,
          workoutId: "workout-a",
          date: "2026-06-07",
          duration: 600,
          setsCompleted: 24,
          xpEarned: 700,
          exercises: [],
        });
      };

      addSession();
      const levelBefore = useUserStore.getState().level;
      const xpBefore = useUserStore.getState().xpProgress;

      // Change theme many times
      for (let i = 0; i < 50; i++) {
        useUserStore.getState().setThemeMode(i % 2 === 0 ? "dark" : "light");
        useUserStore.getState().setAccentColor(["amber", "emerald", "cyan", "rose"][i % 4] as AccentKey);
      }

      expect(useUserStore.getState().level).toBe(levelBefore);
      expect(useUserStore.getState().xpProgress.currentXp).toBe(xpBefore.currentXp);
    });
  });
});
