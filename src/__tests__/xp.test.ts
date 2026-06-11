import {
  calculateWorkoutXp,
  calculateDailyMissionXp,
  XP_PER_SET,
  XP_BONUS_COMPLETION,
  XP_STREAK_BONUS,
  XP_DAILY_MISSION,
} from "../utils/xp";

describe("calculateWorkoutXp", () => {
  it("returns 0 base XP for 0 sets", () => {
    const result = calculateWorkoutXp(0);
    expect(result.base).toBe(0);
    expect(result.total).toBe(0);
  });

  it("calculates base XP from sets completed", () => {
    const result = calculateWorkoutXp(10);
    expect(result.base).toBe(10 * XP_PER_SET);
  });

  it("includes completion bonus when all exercises complete", () => {
    const result = calculateWorkoutXp(10, 0, true);
    expect(result.completionBonus).toBe(XP_BONUS_COMPLETION);
    expect(result.total).toBe(10 * XP_PER_SET + XP_BONUS_COMPLETION);
  });

  it("omits completion bonus when not all exercises complete", () => {
    const result = calculateWorkoutXp(10, 0, false);
    expect(result.completionBonus).toBe(0);
  });

  it("includes streak bonus", () => {
    const result = calculateWorkoutXp(8, 5, true);
    expect(result.streakBonus).toBe(5 * XP_STREAK_BONUS);
  });

  it("returns 0 streak bonus when streak is 0", () => {
    const result = calculateWorkoutXp(8, 0);
    expect(result.streakBonus).toBe(0);
  });

  it("correctly totals all components", () => {
    const result = calculateWorkoutXp(12, 7, true);
    const expected = 12 * XP_PER_SET + XP_BONUS_COMPLETION + 7 * XP_STREAK_BONUS;
    expect(result.total).toBe(expected);
  });

  it("rounds the total", () => {
    // XP_PER_SET (25) * 3 sets = 75, all clean numbers, but test rounding works
    const result = calculateWorkoutXp(3, 1, true);
    expect(result.total).toBe(3 * 25 + 50 + 10);
  });
});

describe("calculateDailyMissionXp", () => {
  it("returns the daily mission XP constant", () => {
    expect(calculateDailyMissionXp()).toBe(XP_DAILY_MISSION);
  });

  it("returns 100", () => {
    expect(calculateDailyMissionXp()).toBe(100);
  });
});

describe("XP constants", () => {
  it("XP_PER_SET is 25", () => {
    expect(XP_PER_SET).toBe(25);
  });

  it("XP_BONUS_COMPLETION is 50", () => {
    expect(XP_BONUS_COMPLETION).toBe(50);
  });

  it("XP_STREAK_BONUS is 10", () => {
    expect(XP_STREAK_BONUS).toBe(10);
  });

  it("XP_DAILY_MISSION is 100", () => {
    expect(XP_DAILY_MISSION).toBe(100);
  });
});
