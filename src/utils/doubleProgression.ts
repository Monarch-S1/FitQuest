/**
 * Double Progression Algorithm — FitQuest
 *
 * Bodyweight progression method:
 * 1️⃣ Rep progression: Hit the upper end of the rep range consistently
 * 2️⃣ Exercise progression: Advance to the next level in the same pathway
 *
 * When ≥80% of recent sets across ≥2 sessions reach the upper rep range
 * (within 1 rep of the high end), the exercise is "ready to level up."
 */

import { WorkoutSession, useUserStore } from "../stores/useUserStore";
import { Exercise } from "../data/exercises";
import {
  getExercise96ById,
  getAllExercises96,
  Exercise96,
  LEGACY_TO_PATHWAY,
} from "../data/exercises96";

/**
 * Get all exercises from the unified 96-exercise database.
 * Consistent with the same export in `progression.ts` for unified lookup.
 */
export function getAllExercises(): Exercise[] {
  return getAllExercises96();
}

// ─── Types ─────────────────────────────────────────

export interface DoubleProgressionResult {
  /** Exercise that is ready to level up */
  exerciseId: string;
  exerciseName: string;
  currentLevel: number;
  pathwayId: string;
  pathwayLabel: string;
  repRange: [number, number];
  /** Average reps across recent sets */
  averageReps: number;
  /** Percentage of recent sets at the upper rep range */
  highEndPercentage: number;
  /** Sessions where this exercise was performed */
  sessionsCompleted: number;
  /** Suggested next-level exercise (null if at max level) */
  nextExercise: {
    id: string;
    name: string;
    level: number;
    overloadMechanism: string;
  } | null;
  /** Status */
  canLevelUp: boolean;
}

export interface LevelUpSuggestion {
  exercise: DoubleProgressionResult;
  onConfirm: () => void;
}

// ─── Helpers ────────────────────────────────────────

/** Normalize legacy exercise IDs to pathway IDs */
function to96Id(exerciseId: string): string {
  return LEGACY_TO_PATHWAY[exerciseId] ?? exerciseId;
}

/** Get rep range for an exercise, looking it up from the 96-exercise DB */
function getRepRange(exerciseId: string): [number, number] | null {
  const id = to96Id(exerciseId);
  const ex = getExercise96ById(id);
  if (ex) return ex.repRange;
  return null;
}

/** Get the exercise name from the 96-exercise DB */
function getExerciseName(exerciseId: string): string | null {
  const id = to96Id(exerciseId);
  const ex = getExercise96ById(id);
  return ex?.name ?? null;
}

/** Get pathway info for an exercise */
function getPathwayInfo(exerciseId: string): { id: string; label: string; level: number } | null {
  const id = to96Id(exerciseId);
  const ex = getExercise96ById(id);
  if (!ex) return null;
  const pathwayLabels: Record<string, string> = {
    hp: "Horizontal Push",
    vp: "Vertical Push",
    hpll: "Horizontal Pull",
    vpll: "Vertical Pull",
    aql: "Anterior Chain Legs",
    hpl: "Posterior Chain Legs",
    ac: "Anterior Core",
    plc: "Posterior & Lateral Core",
  };
  return {
    id: ex.pathwayId,
    label: pathwayLabels[ex.pathwayId] ?? ex.pathwayId.toUpperCase(),
    level: ex.pathwayLevel,
  };
}

/** Find the next exercise in the same pathway */
function findNextLevel(
  pathwayId: string,
  currentLevel: number,
): { id: string; name: string; level: number; overloadMechanism: string } | null {
  if (currentLevel >= 12) return null;
  const nextId = `${pathwayId.toUpperCase()}${currentLevel + 1}`;
  const next = getExercise96ById(nextId);
  if (!next) return null;
  return {
    id: next.id,
    name: next.name,
    level: next.pathwayLevel,
    overloadMechanism: next.overloadMechanism,
  };
}

// ─── Core algorithm ────────────────────────────────

/**
 * Check a single exercise for double progression readiness.
 * Returns progression details including next-level suggestion.
 */
export function checkExerciseProgression(
  exerciseId: string,
  workoutHistory: WorkoutSession[],
): DoubleProgressionResult | null {
  const pathwayId = to96Id(exerciseId);
  const repRange = getRepRange(exerciseId);
  const name = getExerciseName(exerciseId);
  const pathwayInfo = getPathwayInfo(exerciseId);

  if (!repRange || !name || !pathwayInfo) return null;

  // Collect all sets for this exercise across sessions
  const sessionSets: number[][] = [];
  for (const session of workoutHistory) {
    for (const ex of session.exercises || []) {
      if (to96Id(ex.exerciseId) === pathwayId && ex.repsCompleted?.length) {
        sessionSets.push(ex.repsCompleted);
      }
    }
  }

  const allReps = sessionSets.flat();
  const sessionsCompleted = sessionSets.length;

  if (allReps.length === 0) {
    return {
      exerciseId,
      exerciseName: name,
      currentLevel: pathwayInfo.level,
      pathwayId: pathwayInfo.id,
      pathwayLabel: pathwayInfo.label,
      repRange,
      averageReps: 0,
      highEndPercentage: 0,
      sessionsCompleted: 0,
      nextExercise: findNextLevel(pathwayInfo.id, pathwayInfo.level),
      canLevelUp: false,
    };
  }

  const avgReps = allReps.reduce((a, b) => a + b, 0) / allReps.length;
  const [low, high] = repRange;
  const range = high - low;
  const highEndPercentage =
    range > 0 ? Math.max(0, Math.min(1, (avgReps - low) / range)) : avgReps >= high ? 1 : 0;

  // Double progression check: ≥80% of recent sets (across last 2+ sessions)
  // must be within 1 rep of the upper rep range
  const recentSessions = sessionSets.slice(-3);
  const recentSets = recentSessions.flat();
  const highThreshold = high - 1; // within 1 rep of upper range
  const setsAtUpper = recentSets.filter((r) => r >= highThreshold).length;
  const percentAtUpper = recentSets.length > 0 ? setsAtUpper / recentSets.length : 0;

  // Must have at least 2 sessions and 80% of recent sets at upper range
  const canLevelUp = sessionsCompleted >= 2 && percentAtUpper >= 0.8;

  return {
    exerciseId,
    exerciseName: name,
    currentLevel: pathwayInfo.level,
    pathwayId: pathwayInfo.id,
    pathwayLabel: pathwayInfo.label,
    repRange,
    averageReps: Math.round(avgReps * 10) / 10,
    highEndPercentage: Math.round(highEndPercentage * 100),
    sessionsCompleted,
    nextExercise: findNextLevel(pathwayInfo.id, pathwayInfo.level),
    canLevelUp,
  };
}

/**
 * Scan ALL exercises (96-exercise database with unique IDs) and return those
 * that have been trained, sorted by double progression readiness.
 */
export function checkAllExerciseProgressions(
  workoutHistory: WorkoutSession[],
): DoubleProgressionResult[] {
  const results: DoubleProgressionResult[] = [];
  const allExercises = getAllExercises();

  for (const exercise of allExercises) {
    const result = checkExerciseProgression(exercise.id, workoutHistory);
    if (result && result.sessionsCompleted > 0) {
      results.push(result);
    }
  }

  // Sort: ready-to-level-up first, then by high-end percentage descending
  return results.sort((a, b) => {
    if (a.canLevelUp !== b.canLevelUp) return a.canLevelUp ? -1 : 1;
    return b.highEndPercentage - a.highEndPercentage;
  });
}

// ─── Auto-mastery (runs after workouts) ───────────

/**
 * Check the just-completed workout for any exercises that have
 * reached mastery. Returns IDs that should be marked as mastered.
 */
export function detectNewMastery(
  workoutHistory: WorkoutSession[],
  justCompletedSession: WorkoutSession,
): string[] {
  const newlyMastered: string[] = [];

  for (const ex of justCompletedSession.exercises || []) {
    if (!ex.repsCompleted?.length) continue;

    const pathwayId = to96Id(ex.exerciseId);
    const repRange = getRepRange(ex.exerciseId);
    if (!repRange) continue;

    const [low, high] = repRange;

    // Check if ALL sets in this session hit the upper rep range
    const allAtUpper = ex.repsCompleted.every((r) => r >= high - 1);
    // Also check the full history for this exercise
    const result = checkExerciseProgression(ex.exerciseId, workoutHistory);

    if (allAtUpper && result?.canLevelUp) {
      newlyMastered.push(pathwayId);
    }
  }

  return newlyMastered;
}

/**
 * Confirm a level-up: mark the current exercise as mastered
 * so the skill tree advances to the next level.
 */
export function confirmLevelUp(exerciseId: string): void {
  const pathwayId = to96Id(exerciseId);
  const store = useUserStore.getState();
  store.markMastered([pathwayId]);
}

/**
 * Get the replacement exercise when a level-up is confirmed.
 * Returns the next-level exercise data for UI updates.
 */
export function getLevelUpReplacement(exerciseId: string): Exercise96 | null {
  const pathwayId = to96Id(exerciseId);
  const current = getExercise96ById(pathwayId);
  if (!current) return null;
  if (current.pathwayLevel >= 12) return null;
  const nextId = `${current.pathwayId.toUpperCase()}${current.pathwayLevel + 1}`;
  return getExercise96ById(nextId) ?? null;
}
