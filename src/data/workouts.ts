import { workoutA, workoutB, workoutC, workoutD, WorkoutDay } from "./exercises";
import { FitnessGoal } from "../stores/useUserStore";
import { XP_PER_SET, XP_BONUS_COMPLETION, XP_DAILY_MISSION, XP_STREAK_BONUS } from "../utils/xp";
import {
  getWorkoutsForGoal,
  getWorkoutByIdForGoal,
  getBaseWorkouts,
  getGoalConfig,
  getGoalWorkoutDescription,
} from "./goalWorkouts";

// ─── Base workouts (unmodified — use for exercise library, progression, etc.) ──

export const workouts: WorkoutDay[] = [workoutA, workoutB, workoutC, workoutD];

// 4-day rotation: A → B → C → D → repeat
const WORKOUT_ROTATION = [workoutA, workoutB, workoutC, workoutD];

export function getWorkoutById(id: string): WorkoutDay | undefined {
  return workouts.find((w) => w.id === id);
}

export function getWorkoutForDay(dayIndex: number): WorkoutDay {
  return WORKOUT_ROTATION[dayIndex % WORKOUT_ROTATION.length];
}

export const WORKOUT_SPLIT = {
  DAYS_PER_WEEK: 4,
  ROTATION: "A → B → C → D → repeat",
  RECOVERY_ADVICE:
    "Rotate through Workouts A, B, C, and D on non-consecutive days. Deload every 4-6 weeks by reducing volume by 40-50% (2 sets per exercise, leave 4-5 reps in reserve).",
  NUTRITION_NOTES:
    "Maintain 1.6-2.2g protein per kg bodyweight. Distribute evenly across meals. Prioritize 7-9 hours of sleep for recovery and CNS repair.",
} as const;

export function getWorkoutRotation(): WorkoutDay[] {
  return WORKOUT_ROTATION;
}

// ─── Goal-aware exports ──────────────────────────────────────────────────────
// Re-export from goalWorkouts for convenience

export { getWorkoutsForGoal, getWorkoutByIdForGoal, getBaseWorkouts, getGoalConfig, getGoalWorkoutDescription };

// XP rewards — re-exported from xp.ts for convenience
export const WORKOUT_XP_REWARDS = {
  PER_SET: XP_PER_SET,
  WORKOUT_COMPLETION: XP_BONUS_COMPLETION,
  DAILY_MISSION: XP_DAILY_MISSION,
  STREAK_BONUS_PER_DAY: XP_STREAK_BONUS,
} as const;
