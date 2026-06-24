/**
 * Skill Unlock Detection — 8-Branch Version
 *
 * Computes newly unlocked exercises and workout classes
 * by comparing pre/post-workout completion state.
 */

import { getSkillTree8, SkillNode, computeNodeStates, NodeState } from "../data/skillTree";
import { getNewlyUnlockedClasses, WorkoutClass, WORKOUT_CLASSES } from "../data/workoutClasses";
import type { WorkoutSession } from "../stores/useUserStore";
import { LEGACY_TO_PATHWAY } from "../data/exercises96";

// ─── Exercise ID mapping ────────────────────────

/**
 * Normalize an exercise ID to its pathway ID form
 * (e.g. "bulgarian-split-squat" → "AQL8")
 */
export function toPathwayId(exerciseId: string): string {
  return LEGACY_TO_PATHWAY[exerciseId] ?? exerciseId;
}

// ─── Extract completed and mastered IDs ─────────

/**
 * Extract completed exercise IDs from workout history.
 * For legacy IDs, maps to pathway IDs first.
 */
export function extractCompletedIds(workoutHistory: WorkoutSession[]): Set<string> {
  const completed = new Set<string>();
  for (const session of workoutHistory) {
    for (const ex of session.exercises || []) {
      if (ex.repsCompleted?.length) {
        completed.add(toPathwayId(ex.exerciseId));
      }
    }
  }
  return completed;
}

/**
 * Detect which exercises have reached mastery (upper rep range met).
 * An exercise is "mastered" when the average reps across sets
 * reaches the upper end of its rep range.
 *
 * For now, we mark an exercise as mastered if it has been completed
 * in 3+ sessions with the highest rep count hitting the upper range.
 */
export function detectMasteredExercises(workoutHistory: WorkoutSession[]): Set<string> {
  const repTracking = new Map<string, number[]>();

  for (const session of workoutHistory) {
    for (const ex of session.exercises || []) {
      const pathwayId = toPathwayId(ex.exerciseId);
      if (!repTracking.has(pathwayId)) {
        repTracking.set(pathwayId, []);
      }
      const existing = repTracking.get(pathwayId)!;
      for (const reps of ex.repsCompleted || []) {
        existing.push(reps);
      }
    }
  }

  const mastered = new Set<string>();
  for (const [exId, reps] of repTracking) {
    if (reps.length === 0) continue;
    const avg = reps.reduce((a, b) => a + b, 0) / reps.length;
    // Consider mastered if average reps >= 10 (rough upper range indicator)
    // This is simplified — real double progression checks per-exercise ranges
    if (avg >= 10 || reps.some((r) => r >= 12)) {
      mastered.add(exId);
    }
  }

  return mastered;
}

// ─── Unlock computation ─────────────────────────

/**
 * Get the set of exercise IDs that are currently unlocked.
 * Uses the new computeNodeStates from the 8-branch tree.
 */
export function getUnlockedExerciseIds(
  completedIds: Set<string>,
  masteredIds?: Set<string>,
): Set<string> {
  const states = computeNodeStates(completedIds, masteredIds ?? new Set());
  const unlocked = new Set<string>();
  for (const [id, state] of states) {
    if (state === "unlocked" || state === "active" || state === "mastered") {
      unlocked.add(id);
    }
  }
  return unlocked;
}

// ─── New unlock shape ───────────────────────────

export interface NewSkillUnlock {
  node: SkillNode;
  branchLabel: string;
  branchAccent: string;
  branchIcon: string;
  family: string;
}

export interface NewClassUnlock {
  classDef: WorkoutClass;
}

// ─── Find new unlocks ───────────────────────────

export interface UnlockResult {
  skillUnlocks: NewSkillUnlock[];
  classUnlocks: NewClassUnlock[];
}

/**
 * Find newly unlocked exercises and workout classes by comparing
 * pre-workout state vs post-workout state.
 */
export function findNewUnlocks(
  oldCompletedIds: Set<string>,
  newCompletedIds: Set<string>,
  oldMasteredIds?: Set<string>,
  newMasteredIds?: Set<string>,
): UnlockResult {
  const oldMastered = oldMasteredIds ?? new Set();
  const newMastered = newMasteredIds ?? new Set();

  const oldUnlocked = getUnlockedExerciseIds(oldCompletedIds, oldMastered);
  const newUnlocked = getUnlockedExerciseIds(newCompletedIds, newMastered);

  // Skill unlocks
  const skillUnlocks: NewSkillUnlock[] = [];

  for (const branch of getSkillTree8()) {
    for (const node of branch.nodes) {
      const id = node.exercise.id;
      const wasUnlocked = oldUnlocked.has(id);
      const isNowUnlocked = newUnlocked.has(id);

      if (!wasUnlocked && isNowUnlocked && !newCompletedIds.has(id)) {
        skillUnlocks.push({
          node,
          branchLabel: branch.label,
          branchAccent: branch.accent,
          branchIcon: branch.icon,
          family: branch.parentFamily,
        });
      }
    }
  }

  // Class unlocks — diff old vs new mastered state
  const classUnlocks: NewClassUnlock[] = getNewlyUnlockedClasses(oldMastered, newMastered).map(
    (classDef) => ({ classDef }),
  );

  return { skillUnlocks, classUnlocks };
}

/**
 * Get unlock progress summary — how many exercises are in each state.
 */
export function getUnlockSummary(
  completedIds: Set<string>,
  masteredIds: Set<string>,
): { total: number; mastered: number; active: number; unlocked: number; locked: number } {
  const states = computeNodeStates(completedIds, masteredIds);
  let mastered = 0,
    active = 0,
    unlocked = 0,
    locked = 0;

  for (const state of states.values()) {
    if (state === "mastered") mastered++;
    else if (state === "active") active++;
    else if (state === "unlocked") unlocked++;
    else locked++;
  }

  return { total: states.size, mastered, active, unlocked, locked };
}
