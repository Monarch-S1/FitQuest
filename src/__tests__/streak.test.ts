import { calculateStreak, StreakData } from "../utils/streak";

describe("calculateStreak", () => {
  it("returns zeros for empty history", () => {
    const result = calculateStreak([]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.lastWorkoutDate).toBeNull();
    expect(result.isActiveToday).toBe(false);
  });

  it("detects active today", () => {
    const today = "2026-05-26";
    const result = calculateStreak([today], today);
    expect(result.isActiveToday).toBe(true);
    expect(result.currentStreak).toBe(1);
    expect(result.lastWorkoutDate).toBe(today);
  });

  it("counts a 3-day streak", () => {
    const dates = ["2026-05-26", "2026-05-25", "2026-05-24"];
    const result = calculateStreak(dates, "2026-05-26");
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it("counts streak when last workout was yesterday", () => {
    const dates = ["2026-05-25", "2026-05-24", "2026-05-23"];
    const result = calculateStreak(dates, "2026-05-26");
    expect(result.currentStreak).toBe(3);
  });

  it("breaks streak if last workout is 2+ days ago", () => {
    const dates = ["2026-05-24", "2026-05-23", "2026-05-22"];
    const result = calculateStreak(dates, "2026-05-26");
    expect(result.currentStreak).toBe(0);
    // Longest should still be 3
    expect(result.longestStreak).toBe(3);
  });

  it("handles duplicate dates (same-day sessions)", () => {
    const dates = ["2026-05-26", "2026-05-26", "2026-05-25", "2026-05-24"];
    const result = calculateStreak(dates, "2026-05-26");
    expect(result.currentStreak).toBe(3);
  });

  it("calculates longest streak correctly with gaps", () => {
    const dates = [
      "2026-05-26",
      "2026-05-25",
      "2026-05-20",
      "2026-05-19",
      "2026-05-18",
      "2026-05-17",
    ];
    const result = calculateStreak(dates, "2026-05-26");
    // Current: only today and yesterday = 2 (gap on 21st)
    expect(result.currentStreak).toBe(2);
    // Longest: 20-17 = 4 days
    expect(result.longestStreak).toBe(4);
  });

  it("handles single workout date", () => {
    const result = calculateStreak(["2026-05-20"], "2026-05-26");
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(1);
    expect(result.lastWorkoutDate).toBe("2026-05-20");
    expect(result.isActiveToday).toBe(false);
  });

  it("handles unsorted dates", () => {
    const dates = ["2026-05-24", "2026-05-26", "2026-05-25"];
    const result = calculateStreak(dates, "2026-05-26");
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });
});
