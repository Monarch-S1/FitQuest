/**
 * FitQuest 96-Workout Generator
 *
 * Generates daily workout sessions DIRECTLY from the 96-exercise progression
 * database (exercises96/), replacing the old fixed A/B/C/D rotation.
 *
 * Key features:
 * - 4-class archetype rotation: each quest targets distinct movement families
 * - Auto-progression: advances to the next level as exercises are mastered
 * - Goal-aware rep/set/rest/tempo adjustments (reuses goalWorkouts logic)
 * - Each session = 4 exercises: biomechanically asymmetric quest identity
 *
 * Class Archetypes (0% overlap between opposite pairs):
 *   Quest 0: THE VANGUARD — HP + VP + AQL + AC       (pure anterior chain)
 *   Quest 1: THE SHADOW   — HPLL + VPLL + HPL + PLC    (pure posterior chain)
 *   Quest 2: THE TEMPEST  — HP + VP + HPLL + VPLL      (pure upper body)
 *   Quest 3: THE COLOSSUS — AQL + HPL + AC + PLC       (pure lower body + core)
 */

import { Exercise96, getAllExercises96 } from "./exercises96";
import { Exercise, WorkoutDay } from "./exercises";
import { FitnessGoal, useUserStore } from "../stores/useUserStore";
import { GOAL_CONFIGS, transformExercise96 } from "./goalWorkouts";
import { PATHWAYS, PathwayId, PathwayConfig } from "./pathways";

// ─── Days mapping ───────────────────────────────
// Each day = 4 exercises: biomechanically asymmetric class archetype
// Exercises ordered for balanced alternation within the class

const DAY_PATHWAYS: [PathwayId, PathwayId, PathwayId, PathwayId][] = [
  ["hp", "vp", "aql", "ac"], // Quest 0: THE VANGUARD — pure anterior chain
  ["hpll", "vpll", "hpl", "plc"], // Quest 1: THE SHADOW — pure posterior chain
  ["hp", "vp", "hpll", "vpll"], // Quest 2: THE TEMPEST — pure upper body
  ["aql", "hpl", "ac", "plc"], // Quest 3: THE COLOSSUS — pure lower body + core
];

const DAY_NAMES = ["THE VANGUARD", "THE SHADOW", "THE TEMPEST", "THE COLOSSUS"];

const DAY_FOCUS = [
  "HP · VP · AQL · AC",
  "HPLL · VPLL · HPL · PLC",
  "HP · VP · HPLL · VPLL",
  "AQL · HPL · AC · PLC",
];

// ─── Level resolution ───────────────────────────

/**
 * Determine the current working level for a pathway.
 * If the user has mastered up to level N, they should work on level N+1.
 * If no mastery data, start at level 1 (always unlocked).
 */
function getCurrentLevel(pathwayId: PathwayId, masteredIds: Set<string>): number {
  const prefix = pathwayId.toUpperCase();
  let highestMastered = 0;

  for (let l = 1; l <= 12; l++) {
    if (masteredIds.has(`${prefix}${l}`)) {
      highestMastered = l;
    }
  }

  // Next unmastered level, capped at 12
  return Math.min(highestMastered + 1, 12);
}

/**
 * Find the exercise in a pathway at a specific level.
 */
function getExerciseAtLevel(pathwayId: PathwayId, level: number): Exercise96 | undefined {
  const prefix = pathwayId.toUpperCase();
  const id = `${prefix}${level}`;
  return getAllExercises96().find((e) => e.id === id);
}

// ─── Stripper: Exercise96 → Exercise ──────────

/**
 * Strip Exercise96 fields to a plain Exercise for compatibility
 * with WorkoutDay, the workout player, and goal transformations.
 */
function toExercise(ex96: Exercise96): Exercise {
  const { pathwayId: _pw, pathwayLevel: _lvl, overloadMechanism: _om, ...exercise } = ex96;
  return exercise as Exercise;
}

// ─── Public API ─────────────────────────────────

/**
 * Generate a single WorkoutDay for the given day index in the 4-day rotation.
 *
 * @param dayIndex  0-3 (maps to the 4-day split)
 * @param goal      User's fitness goal
 * @param masteredIds  Set of mastered pathway IDs (e.g. "HP4", "AC3")
 */
export function getWorkout96(
  dayIndex: number,
  goal: FitnessGoal,
  masteredIds: Set<string>,
): WorkoutDay | null {
  const pathways = DAY_PATHWAYS[dayIndex % DAY_PATHWAYS.length];
  if (!pathways) return null;

  const exercises: Exercise[] = [];

  for (const pw of pathways) {
    const level = getCurrentLevel(pw, masteredIds);
    const ex96 = getExerciseAtLevel(pw, level);

    if (!ex96) continue;

    // Strip to plain Exercise, then apply goal transformation
    const plainExercise = toExercise(ex96);
    const goalExercise = transformExercise96(plainExercise, goal);
    exercises.push(goalExercise);
  }

  // Fallback: if no exercises found (shouldn't happen), return null
  if (exercises.length === 0) return null;

  const dayIndexKey = dayIndex % DAY_PATHWAYS.length;

  return {
    id: `workout-96-${dayIndex}`,
    name: DAY_NAMES[dayIndexKey],
    focus: DAY_FOCUS[dayIndexKey],
    exercises,
    recommendedFrequency: "Perform on non-consecutive days, rotating through the 4 quest cycle",
  };
}

/**
 * Get all 4 workouts in the 96-exercise rotation.
 */
export function getWorkouts96(goal: FitnessGoal, masteredIds: Set<string>): WorkoutDay[] {
  const workouts: WorkoutDay[] = [];

  for (let i = 0; i < 4; i++) {
    const w = getWorkout96(i, goal, masteredIds);
    if (w) workouts.push(w);
  }

  return workouts;
}

/**
 * Get a specific workout by its 96-generated ID (e.g. "workout-96-0").
 */
export function getWorkout96ById(
  id: string,
  goal: FitnessGoal,
  masteredIds: Set<string>,
): WorkoutDay | undefined {
  // Parse the day index from the ID
  const match = id.match(/^workout-96-(\d)$/);
  if (!match) return undefined;

  const dayIndex = parseInt(match[1], 10);
  const workout = getWorkout96(dayIndex, goal, masteredIds);
  return workout ?? undefined;
}

/**
 * Preview the current level for each pathway — useful for the UI.
 */
export function getPathwayLevels(
  masteredIds: Set<string>,
): Record<PathwayId, { level: number; nextId: string }> {
  const result = {} as Record<PathwayId, { level: number; nextId: string }>;

  for (const pw of Object.keys(PATHWAYS) as PathwayId[]) {
    const level = getCurrentLevel(pw, masteredIds);
    const prefix = pw.toUpperCase();
    const nextId = `${prefix}${level}`;
    result[pw] = { level, nextId };
  }

  return result;
}

/**
 * Result of a pathway exercise lookup.
 */
export interface PathwayExerciseResult {
  /** Goal-transformed exercise at the current working level */
  exercise: Exercise;
  /** The pathway configuration (label, icon, accent, etc.) */
  pathwayConfig: PathwayConfig;
  /** Current working level */
  level: number;
  /** Whether the user has mastered all 12 levels */
  isMaxLevel: boolean;
  /** Total levels in this pathway (always 12) */
  maxLevel: number;
}

/**
 * Get the next unmastered exercise in a specific pathway, transformed for the
 * user's fitness goal. This extracts the per-pathway logic from `getWorkout96`
 * into a standalone lookup, useful for previews, skill tree details, or any
 * UI that needs to show what exercise the user should work on for a pathway.
 *
 * @param pathwayId - The pathway to look up (e.g. "hp", "vp", "hpll")
 * @param goal      - User's fitness goal (adjusts reps/sets/rest/tempo)
 * @param masteredIds - Set of mastered exercise IDs (e.g. "HP4", "AC3")
 * @returns The goal-transformed exercise with pathway metadata, or null if
 *          the pathway exercise data cannot be resolved (shouldn't happen
 *          under normal circumstances).
 */
export function getPathwayExercise(
  pathwayId: PathwayId,
  goal: FitnessGoal,
  masteredIds: Set<string>,
): PathwayExerciseResult | null {
  const config = PATHWAYS[pathwayId];
  if (!config) return null;

  const level = getCurrentLevel(pathwayId, masteredIds);
  const ex96 = getExerciseAtLevel(pathwayId, level);
  if (!ex96) return null;

  const plainExercise = toExercise(ex96);
  const goalExercise = transformExercise96(plainExercise, goal);

  return {
    exercise: goalExercise,
    pathwayConfig: config,
    level,
    isMaxLevel: level >= config.maxLevel,
    maxLevel: config.maxLevel,
  };
}
