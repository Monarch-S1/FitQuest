/**
 * @jest-environment node
 */
// Using node environment to avoid React Native / AsyncStorage mocking issues
// We test the pure logic functions directly instead of the zustand store

import { calculateStreak } from "../utils/streak";

describe("useUserStore derived logic", () => {
  describe("streak calculation integration", () => {
    it("calculates streak from workout dates", () => {
      const dates = ["2026-05-26", "2026-05-25", "2026-05-24"];
      const streak = calculateStreak(dates, "2026-05-26");
      expect(streak.currentStreak).toBe(3);
    });

    it("empty history has 0 streak", () => {
      const streak = calculateStreak([], "2026-05-26");
      expect(streak.currentStreak).toBe(0);
      expect(streak.longestStreak).toBe(0);
      expect(streak.lastWorkoutDate).toBeNull();
    });
  });
});
