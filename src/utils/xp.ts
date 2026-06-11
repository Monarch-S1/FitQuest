// XP constants — single source of truth
// Also re-exported from data/workouts.ts as WORKOUT_XP_REWARDS
export const XP_PER_SET = 25;
export const XP_BONUS_COMPLETION = 50;
export const XP_STREAK_BONUS = 10; // per streak day
export const XP_DAILY_MISSION = 100;

export interface XpBreakdown {
  base: number;
  completionBonus: number;
  streakBonus: number;
  total: number;
}

export function calculateWorkoutXp(
  setsCompleted: number,
  streakDays: number = 0,
  allExercisesComplete: boolean = false,
): XpBreakdown {
  const base = setsCompleted * XP_PER_SET;
  const completionBonus = allExercisesComplete ? XP_BONUS_COMPLETION : 0;
  const streakBonus = streakDays * XP_STREAK_BONUS;
  const total = Math.round(base + completionBonus + streakBonus);

  return {
    base,
    completionBonus,
    streakBonus,
    total,
  };
}

export function calculateDailyMissionXp(): number {
  return XP_DAILY_MISSION;
}
