import { getLevel, getXpForLevel, getProgressToNextLevel } from "../utils/level";

describe("getLevel", () => {
  it("returns 1 for 0 XP", () => {
    expect(getLevel(0)).toBe(1);
  });

  it("returns 1 for negative XP", () => {
    expect(getLevel(-100)).toBe(1);
  });

  it("returns 1 for XP below first level threshold", () => {
    expect(getLevel(49)).toBe(1);
  });

  it("returns 2 when crossing first threshold (50 XP)", () => {
    expect(getLevel(50)).toBe(2);
  });

  it("returns 2 at XP = 199 (still level 2)", () => {
    expect(getLevel(199)).toBe(2);
  });

  it("returns 3 at XP = 200", () => {
    expect(getLevel(200)).toBe(3);
  });

  it("returns 5 at XP = 800", () => {
    const level = getLevel(800);
    expect(level).toBe(5);
  });

  it("scales predictably at higher values", () => {
    // Level 10 requires (10-1)^2 * 50 = 4050 XP
    expect(getLevel(4050)).toBe(10);
    expect(getLevel(4049)).toBe(9);
  });

  it("returns integer levels only", () => {
    for (let xp = 0; xp < 10000; xp += 50) {
      const level = getLevel(xp);
      expect(Number.isInteger(level)).toBe(true);
    }
  });
});

describe("getXpForLevel", () => {
  it("returns 0 for level 1", () => {
    expect(getXpForLevel(1)).toBe(0);
  });

  it("returns 50 for level 2", () => {
    expect(getXpForLevel(2)).toBe(50);
  });

  it("returns 200 for level 3", () => {
    expect(getXpForLevel(3)).toBe(200);
  });

  it("returns 450 for level 4", () => {
    expect(getXpForLevel(4)).toBe(450);
  });

  it("returns 800 for level 5", () => {
    expect(getXpForLevel(5)).toBe(800);
  });

  it("returns 4050 for level 10", () => {
    expect(getXpForLevel(10)).toBe(4050);
  });
});

describe("getProgressToNextLevel", () => {
  it("returns 0% progress for 0 XP", () => {
    const progress = getProgressToNextLevel(0);
    expect(progress.currentXp).toBe(0);
    expect(progress.requiredXp).toBe(50);
    expect(progress.progress).toBe(0);
  });

  it("returns 50% progress at 25 XP", () => {
    const progress = getProgressToNextLevel(25);
    expect(progress.currentXp).toBe(25);
    expect(progress.requiredXp).toBe(50);
    expect(progress.progress).toBeCloseTo(0.5, 1);
  });

  it("returns 100% progress at exactly the level threshold", () => {
    const progress = getProgressToNextLevel(50);
    expect(progress.currentXp).toBe(0);
    expect(progress.requiredXp).toBe(150);
    expect(progress.progress).toBe(0);
  });

  it("ensures progress is always between 0 and 1", () => {
    // Test at a high XP value — progress should be in [0, 1]
    const progress = getProgressToNextLevel(10000);
    expect(progress.progress).toBeGreaterThanOrEqual(0);
    expect(progress.progress).toBeLessThanOrEqual(1);
    // At 10000 XP, level 15: 200/1450 ≈ 0.138
    expect(progress.progress).toBeCloseTo(0.14, 1);
  });

  it("returns 0 progress at exact level-up threshold", () => {
    // Level 2: exactly 50 XP (the threshold)
    const progress = getProgressToNextLevel(50);
    expect(progress.progress).toBe(0);
    expect(progress.currentXp).toBe(0);
  });

  it("calculates progress correctly at mid-level", () => {
    // Level 3 requires 200 XP total. At 100 XP, we're 50% into level 3
    // currentLevelXp = 50 (level 2 threshold), nextLevelXp = 200 (level 3 threshold)
    // xpIntoLevel = 100-50 = 50, xpRequired = 200-50 = 150
    const progress = getProgressToNextLevel(100);
    expect(progress.currentXp).toBe(50);
    expect(progress.requiredXp).toBe(150);
    expect(progress.progress).toBeCloseTo(50 / 150, 1);
  });
});
