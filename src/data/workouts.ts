import { WorkoutDay } from "./exercises";
import { FitnessGoal } from "../stores/useUserStore";
import { XP_PER_SET, XP_BONUS_COMPLETION, XP_DAILY_MISSION, XP_STREAK_BONUS } from "../utils/xp";

// ─── 96-Exercise Generator ───────────────────────────────────────────────────
// The 96-exercise progression database workouts replace the old fixed A/B/C/D rotation.

export {
  getWorkout96,
  getWorkouts96,
  getWorkout96ById,
  getPathwayLevels,
  getPathwayExercise,
} from "./workoutGenerator96";

// Goal-aware exports — transformed workouts and configs
export { getWorkoutByIdForGoal, getGoalConfig, getGoalWorkoutDescription } from "./goalWorkouts";

// XP rewards — re-exported from xp.ts for convenience
export const WORKOUT_XP_REWARDS = {
  PER_SET: XP_PER_SET,
  WORKOUT_COMPLETION: XP_BONUS_COMPLETION,
  DAILY_MISSION: XP_DAILY_MISSION,
  STREAK_BONUS_PER_DAY: XP_STREAK_BONUS,
} as const;
