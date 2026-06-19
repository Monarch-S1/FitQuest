/**
 * Warm-Up Routine Generator — ARCH
 *
 * Analyses a WorkoutDay's exercises to determine which muscle groups
 * are being trained, then selects 3-5 appropriate warm-up/mobility
 * exercises (level 1-3) from the 96-exercise DB.
 *
 * Each warm-up is scaled for activation: 1-2 sets, moderate reps,
 * faster tempo, minimal rest.
 */

import { Exercise, WorkoutDay, Tempo } from "../data/exercises";
import { getExercise96ById } from "../data/exercises96";

// ─── Muscle → Body Zone Mapping ───────────────────────

type BodyZone = "push" | "pull" | "legs" | "core";

const MUSCLE_ZONE: Record<string, BodyZone> = {
  chest: "push",
  shoulders: "push",
  triceps: "push",
  upper_chest: "push",
  serratus_anterior: "push",

  lats: "pull",
  rhomboids: "pull",
  biceps: "pull",
  traps: "pull",
  rotator_cuff: "pull",
  mid_back: "pull",
  rear_deltoids: "pull",
  grip: "pull",
  scapular_stabilizers: "pull",

  quadriceps: "legs",
  glutes: "legs",
  hamstrings: "legs",
  calves: "legs",
  hip_flexors: "legs",
  hip_abductors: "legs",
  hip_adductors: "legs",

  core: "core",
  obliques: "core",
  lower_back: "core",
  upper_rectus_abdominis: "core",
  lower_rectus_abdominis: "core",
  rectus_abdominis: "core",
};

// ─── Warm-Up Exercise Selections ──────────────────────
//
// Each zone has 2-3 curated level 1-3 exercises from the 96-exercise DB.
// The first entry is the primary recommendation; fallbacks are used
// when the primary is already selected by another zone.

interface ZoneSelection {
  primary: string; // 96-exercise ID
  fallbacks: string[];
}

const ZONE_EXERCISES: Record<BodyZone, ZoneSelection> = {
  push: {
    primary: "HP1", // Wall Push-up
    fallbacks: ["HP2", "VP1", "PLC9"],
  },
  pull: {
    primary: "HPLL1", // Doorway Row
    fallbacks: ["VPLL1", "HPLL3"],
  },
  legs: {
    primary: "HPL1", // Double-Leg Glute Bridge
    fallbacks: ["AQL1", "AQL2"],
  },
  core: {
    primary: "PLC1", // Bird-Dog
    fallbacks: ["AC1", "AC2"],
  },
};

// ─── Full-zone warm-up when 3+ zones are active ──────
// These are general mobility/activation exercises that work
// as a full-body warm-up regardless of the workout focus.
const FULL_BODY_WARMUPS: string[] = ["HP1", "PLC1", "HPL1", "AC1"];

// ─── Warm-up scaling ──────────────────────────────────
// Warm-ups get reduced volume, shorter rest, and slightly faster tempo.

export interface WarmUpExercise {
  /** The warm-up exercise data */
  exercise: Exercise;
  /** Reduced sets (1-2 instead of 3) */
  sets: number;
  /** Moderate rep range suitable for activation */
  repRange: [number, number];
  /** Slightly faster tempo for warm-up (or isometric) */
  tempo: Tempo;
  /** Shorter rest (15-30s) */
  restInterval: number;
}

// ─── Core algorithm ────────────────────────────────────

/**
 * Generate a warm-up routine for a given workout.
 * Returns 3-5 warm-up exercises scaled for activation,
 * ordered by body zone (legs → push → pull → core).
 */
export function generateWarmUp(workout: WorkoutDay): WarmUpExercise[] {
  // 1. Detect which body zones the workout targets
  const activeZones = new Set<BodyZone>();
  for (const ex of workout.exercises) {
    for (const muscle of ex.targetMuscles) {
      const zone = MUSCLE_ZONE[muscle];
      if (zone) activeZones.add(zone);
    }
  }

  // 2. Select warm-up exercises — one per active zone, in priority order
  const zoneOrder: BodyZone[] = ["legs", "push", "pull", "core"];
  const warmUps: WarmUpExercise[] = [];
  const usedIds = new Set<string>();

  // Helper: add a warm-up from a zone
  function addFromZone(zone: BodyZone): boolean {
    const selection = ZONE_EXERCISES[zone];
    const candidates = [selection.primary, ...selection.fallbacks];
    for (const id of candidates) {
      if (usedIds.has(id)) continue;
      const ex = getExercise96ById(id);
      if (!ex) continue;
      usedIds.add(id);

      const isIsometric = ex.tempo === "isometric";
      warmUps.push({
        exercise: ex,
        sets: 1, // 1 activation set per warm-up
        repRange: isIsometric
          ? [ex.repRange[0], Math.min(ex.repRange[1], 30)]
          : [Math.max(8, ex.repRange[0]), Math.min(ex.repRange[1], 15)],
        tempo: isIsometric ? "isometric" : "2-0-1-0",
        restInterval: Math.min(15, ex.restInterval || 60),
      });
      return true;
    }
    return false;
  }

  // Priority queue: process zones in order
  for (const zone of zoneOrder) {
    if (activeZones.has(zone)) {
      addFromZone(zone);
    }
  }

  // 3. If fewer than 3 warm-ups selected, pad with full-body
  if (warmUps.length < 3) {
    for (const id of FULL_BODY_WARMUPS) {
      if (usedIds.has(id)) continue;
      if (warmUps.length >= 3) break;
      const ex = getExercise96ById(id);
      if (!ex) continue;
      usedIds.add(id);
      warmUps.push({
        exercise: ex,
        sets: 1,
        repRange: [8, 12],
        tempo: "2-0-1-0",
        restInterval: 10,
      });
    }
  }

  // 4. Cap at 5 exercises, limit to 4 if already at 5
  return warmUps.slice(0, 5);
}

/**
 * Get the estimated duration (seconds) for a warm-up routine.
 */
export function estimateWarmUpDuration(warmUps: WarmUpExercise[]): number {
  return warmUps.reduce((sum, wu) => {
    const avgReps = (wu.repRange[0] + wu.repRange[1]) / 2;
    const repTime = wu.tempo === "isometric" ? avgReps : avgReps * 4;
    const setTime = repTime * wu.sets;
    const restTime = wu.restInterval;
    return sum + setTime + restTime;
  }, 0);
}

/**
 * Get a human-readable summary of the warm-up body zones.
 */
export function getWarmUpZoneSummary(warmUps: WarmUpExercise[]): string[] {
  const zones = new Set<string>();
  for (const wu of warmUps) {
    for (const muscle of wu.exercise.targetMuscles) {
      const zone = MUSCLE_ZONE[muscle];
      if (zone) zones.add(zone);
    }
  }
  const labels: Record<BodyZone, string> = {
    legs: "Legs",
    push: "Chest & Shoulders",
    pull: "Back & Arms",
    core: "Core",
  };
  return Array.from(zones).map((z) => labels[z as BodyZone] ?? z);
}
