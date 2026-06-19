/**
 * Workout Class Unlock System
 *
 * When specific exercise node combinations are "mastered"
 * (upper rep range hit with proper form), themed workout
 * classes are unlocked as bonus content.
 *
 * This creates an RPG-style "Class" progression layer on top
 * of the exercise skill tree.
 */

import { ALL_EXERCISES_96, getExercise96ById } from "./exercises96";

// ─── Types ─────────────────────────────────────────

export interface WorkoutClass {
  id: string;
  name: string;
  description: string;
  icon: string;
  accent: string;
  /** Exercise IDs that must be mastered to unlock */
  requiredExercises: string[];
  /** Human-readable list of required exercise names */
  requiredNames: string[];
  /** Focus areas for the class */
  focus: string[];
  /** Estimated duration in minutes */
  estimatedMinutes: number;
  /** Number of exercises in the class workout */
  exerciseCount: number;
  /** Difficulty tier */
  difficulty: "beginner" | "intermediate" | "advanced";
}

// ─── Workout class definitions ─────────────────────

export const WORKOUT_CLASSES: WorkoutClass[] = [
  {
    id: "tricep-armor",
    name: "The Tricep Armor",
    description:
      "An isolation-heavy arm burner designed for tricep hypertrophy. Combines diamond push-ups with floor tricep extensions for a complete elbow-extension assault.",
    icon: "💪",
    accent: "#EF4444",
    requiredExercises: ["HP6", "VP6"],
    requiredNames: ["Diamond Push-up", "Floor Tricep Extension"],
    focus: ["Triceps", "Elbow Extension", "Arm Hypertrophy"],
    estimatedMinutes: 25,
    exerciseCount: 5,
    difficulty: "intermediate",
  },
  {
    id: "wings-of-steel",
    name: "The Wings of Steel",
    description:
      "A high-tension back routine focusing purely on mid-back and lat width. Floor rows and sliding pulldowns build scapular control and lat spread.",
    icon: "🦅",
    accent: "#3B82F6",
    requiredExercises: ["HPLL6", "VPLL6"],
    requiredNames: ["Floor Elbow Row (Back Widow)", "Sliding Floor Lat Pulldown (Full Plank)"],
    focus: ["Lats", "Rhomboids", "Mid-Back Width", "Scapular Control"],
    estimatedMinutes: 30,
    exerciseCount: 5,
    difficulty: "intermediate",
  },
  {
    id: "planche-prep-pro",
    name: "Planche Prep Pro",
    description:
      "A specialized routine targeting the core-to-shoulder tension needed for advanced calisthenics. Hollow body control meets pseudo-planche pressing.",
    icon: "🔥",
    accent: "#F59E0B",
    requiredExercises: ["AC5", "HP8"],
    requiredNames: ["Hollow Body Hold (Full)", "Pseudo-Planche Push-up"],
    focus: ["Core Tension", "Shoulder Girdle", "Scapular Protraction", "Planche Foundation"],
    estimatedMinutes: 35,
    exerciseCount: 6,
    difficulty: "advanced",
  },
  {
    id: "posterior-powerhouse",
    name: "Posterior Powerhouse",
    description:
      "A lower-body session utilizing unilateral balance and deep-hinge mechanics. Bulgarian split squats paired with hamstring curls build posterior chain dominance.",
    icon: "🦵",
    accent: "#10B981",
    requiredExercises: ["AQL8", "HPL6"],
    requiredNames: ["Bulgarian Split Squat", "Sliding Hamstring Curl (Bilateral)"],
    focus: ["Glutes", "Hamstrings", "Quadriceps", "Unilateral Strength"],
    estimatedMinutes: 30,
    exerciseCount: 5,
    difficulty: "intermediate",
  },
];

// ─── Utility functions ─────────────────────────────

/**
 * Check which workout classes are unlocked based on
 * mastered exercise IDs.
 */
export function getUnlockedClasses(masteredIds: Set<string>): WorkoutClass[] {
  return WORKOUT_CLASSES.filter((wc) =>
    wc.requiredExercises.every((reqId) => masteredIds.has(reqId)),
  );
}

/**
 * Check which classes were newly unlocked between
 * an old and new set of mastered IDs.
 */
export function getNewlyUnlockedClasses(
  oldMastered: Set<string>,
  newMastered: Set<string>,
): WorkoutClass[] {
  const oldUnlocked = getUnlockedClasses(oldMastered);
  const newUnlocked = getUnlockedClasses(newMastered);
  return newUnlocked.filter((wc) => !oldUnlocked.find((o) => o.id === wc.id));
}

/**
 * Get the progress toward unlocking a specific class.
 * Returns { required, unlocked, allMet } where `unlocked`
 * is the count of mastered exercises that count toward this class.
 */
export function getClassUnlockProgress(
  classDef: WorkoutClass,
  masteredIds: Set<string>,
): { required: number; unlocked: number; allMet: boolean } {
  const unlocked = classDef.requiredExercises.filter((id) => masteredIds.has(id)).length;
  return {
    required: classDef.requiredExercises.length,
    unlocked,
    allMet: unlocked >= classDef.requiredExercises.length,
  };
}
