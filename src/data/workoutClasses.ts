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

import { getExercise96ById } from "./exercises96";
import { WorkoutDay, Exercise } from "./exercises";

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

// ─── Class Workouts (playable WorkoutDay) ───────────

/**
 * Build a playable WorkoutDay from a WorkoutClass definition.
 * Each class has a curated set of exercises pulled from the
 * 96-exercise database, themed around the class's focus area.
 */
export function getClassWorkout(classId: string): WorkoutDay | undefined {
  const classDef = WORKOUT_CLASSES.find((wc) => wc.id === classId);
  if (!classDef) return undefined;

  const classWorkouts: Record<string, { exercises: string[] }> = {
    "tricep-armor": {
      exercises: ["HP6", "VP6", "HP4", "HP3", "AC1"],
    },
    "wings-of-steel": {
      exercises: ["HPLL6", "VPLL6", "HPLL8", "VPLL3", "AC5"],
    },
    "planche-prep-pro": {
      exercises: ["AC5", "HP8", "PLC3", "VP3", "PLC9", "VP1"],
    },
    "posterior-powerhouse": {
      exercises: ["AQL8", "HPL6", "HPL4", "HPL3", "PLC1"],
    },
  };

  const classConfig = classWorkouts[classId];
  if (!classConfig) return undefined;

  const exercises: Exercise[] = [];
  for (const exId of classConfig.exercises) {
    const ex = getExercise96ById(exId);
    if (ex) {
      // Strip Exercise96 fields that WorkoutDay doesn't need
      // but keep all Exercise interface fields
      const { pathwayId, pathwayLevel, overloadMechanism, ...rest } = ex;
      exercises.push(rest);
    }
  }

  return {
    id: classId,
    name: classDef.name,
    focus: classDef.focus.join(" · "),
    exercises,
    recommendedFrequency: `Unlocked class workout. Repeat 1-2 times per week on non-consecutive days.`,
  };
}

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
