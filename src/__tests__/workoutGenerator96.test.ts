/**
 * @jest-environment node
 *
 * 96-Workout Generator Tests
 *
 * Tests the workout generation system that creates daily workout
 * sessions from the 96-exercise progression database, including:
 * - Day-to-pathway mapping (4-day rotation)
 * - Auto-progression based on mastered exercise IDs
 * - Goal-aware transformation
 * - Pathway level resolution
 * - Edge cases (unknown IDs, empty mastery, max level)
 */

import {
  getWorkout96,
  getWorkouts96,
  getWorkout96ById,
  getPathwayLevels,
  getPathwayExercise,
} from "../data/workoutGenerator96";
import { PATHWAYS, PathwayId } from "../data/pathways";
import type { FitnessGoal } from "../stores/useUserStore";

// ─── Constants ────────────────────────────────────

const GOALS: FitnessGoal[] = ["strength", "muscle_gain", "endurance", "general"];
const PATHWAY_IDS: PathwayId[] = ["hp", "vp", "hpll", "vpll", "aql", "hpl", "ac", "plc"];

// Realistic mastered sets for testing
const NO_MASTERY = new Set<string>();
const HALF_MASTERY = new Set(["HP4", "VP6", "HPLL3", "VPLL5", "AQL4", "HPL2", "AC6", "PLC3"]);
// ═══════════════════════════════════════════════════
// getWorkout96 — Single Workout Generation
// ═══════════════════════════════════════════════════

describe("getWorkout96", () => {
  it("returns a valid workout for day index 0 with no mastery", () => {
    const workout = getWorkout96(0, "general", NO_MASTERY);
    expect(workout).not.toBeNull();
    expect(workout!.id).toBe("workout-96-0");
    expect(workout!.name).toBeTruthy();
    expect(workout!.focus).toBeTruthy();
    expect(workout!.exercises.length).toBe(4);
  });

  it("each day has a unique name", () => {
    const names = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const workout = getWorkout96(i, "general", NO_MASTERY);
      expect(workout).not.toBeNull();
      names.add(workout!.name);
    }
    expect(names.size).toBe(4);
  });

  it("cycles through valid day names for any day index via modulo", () => {
    // Day indices are cycled via modulo, so any index returns a valid workout
    const day0 = getWorkout96(0, "general", NO_MASTERY);
    const day4 = getWorkout96(4, "general", NO_MASTERY);
    const day100 = getWorkout96(100, "general", NO_MASTERY);
    expect(day0).not.toBeNull();
    expect(day4).not.toBeNull();
    expect(day100).not.toBeNull();
    // Day 0 and day 4 should have the same name (same day in the 4-day cycle)
    expect(day0!.name).toBe(day4!.name);
    expect(day0!.focus).toBe(day4!.focus);
  });

  it("cycles day names for indices beyond 3", () => {
    const day0 = getWorkout96(0, "general", NO_MASTERY);
    const day4 = getWorkout96(4, "general", NO_MASTERY);
    expect(day0).not.toBeNull();
    expect(day4).not.toBeNull();
    expect(day0!.name).toBe(day4!.name);
    expect(day0!.focus).toBe(day4!.focus);
  });
});

// ═══════════════════════════════════════════════════
// getWorkout96 — Auto-Progression
// ═══════════════════════════════════════════════════

describe("getWorkout96 — auto-progression", () => {
  it("starts at level 1 for all pathways with no mastery", () => {
    const workout = getWorkout96(0, "general", NO_MASTERY);
    expect(workout).not.toBeNull();
    for (const ex of workout!.exercises) {
      const id = ex.id;
      const level = parseInt(id.match(/\d+$/)?.[0] || "0", 10);
      expect(level).toBe(1);
    }
  });

  it("advances to level 4+ for mastered exercises", () => {
    const workout = getWorkout96(0, "general", HALF_MASTERY);
    expect(workout).not.toBeNull();

    // Day 0 pathways: HP + HPLL + VP + VPLL + AQL + AC
    // HP mastered at HP4 → should start HP5
    const hpExercise = workout!.exercises.find((ex) => ex.id.startsWith("HP"));
    expect(hpExercise).toBeDefined();
    const hpLevel = parseInt(hpExercise!.id.replace("HP", ""), 10);
    expect(hpLevel).toBe(5); // HP4 mastered → HP5

    // AC mastered at AC6 → should start AC7
    const acExercise = workout!.exercises.find((ex) => ex.id.startsWith("AC"));
    expect(acExercise).toBeDefined();
    const acLevel = parseInt(acExercise!.id.replace("AC", ""), 10);
    expect(acLevel).toBe(7); // AC6 mastered → AC7
  });

  it("capped at level 12 even with full mastery", () => {
    // Master all 12 levels of every pathway
    const allMastered = new Set<string>();
    for (const pw of PATHWAY_IDS) {
      const prefix = pw.toUpperCase();
      for (let l = 1; l <= 12; l++) {
        allMastered.add(`${prefix}${l}`);
      }
    }
    const workout = getWorkout96(0, "general", allMastered);
    expect(workout).not.toBeNull();
    for (const ex of workout!.exercises) {
      const level = parseInt(ex.id.match(/\d+$/)?.[0] || "0", 10);
      expect(level).toBe(12);
    }
  });
});

// ═══════════════════════════════════════════════════
// getWorkout96 — Goal-Aware Transformation
// ═══════════════════════════════════════════════════

describe("getWorkout96 — goal-aware transformation", () => {
  it.each(GOALS)("transforms exercises correctly for goal '%s'", (goal) => {
    const workout = getWorkout96(0, goal, NO_MASTERY);
    expect(workout).not.toBeNull();
    for (const ex of workout!.exercises) {
      expect(ex.repRange[0]).toBeGreaterThanOrEqual(1);
      expect(ex.repRange[1]).toBeGreaterThan(ex.repRange[0]);
      expect(ex.defaultSets).toBeGreaterThanOrEqual(2);
      expect(ex.restInterval).toBeGreaterThanOrEqual(30);
    }
  });

  it("strength goal produces lower rep ranges than endurance", () => {
    const strengthWorkout = getWorkout96(0, "strength", NO_MASTERY);
    const enduranceWorkout = getWorkout96(0, "endurance", NO_MASTERY);
    expect(strengthWorkout).not.toBeNull();
    expect(enduranceWorkout).not.toBeNull();

    for (let i = 0; i < 4; i++) {
      const strengthReps = strengthWorkout!.exercises[i].repRange[0];
      const enduranceReps = enduranceWorkout!.exercises[i].repRange[0];
      expect(strengthReps).toBeLessThanOrEqual(enduranceReps);
    }
  });
});

// ═══════════════════════════════════════════════════
// getWorkouts96 — All 4 Workouts
// ═══════════════════════════════════════════════════

describe("getWorkouts96", () => {
  it("returns 4 workouts", () => {
    const workouts = getWorkouts96("general", NO_MASTERY);
    expect(workouts.length).toBe(4);
  });

  it("each workout has a unique ID", () => {
    const workouts = getWorkouts96("general", NO_MASTERY);
    const ids = workouts.map((w) => w.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(4);
  });

  it("each workout has 4 exercises", () => {
    const workouts = getWorkouts96("general", NO_MASTERY);
    for (const w of workouts) {
      expect(w.exercises.length).toBe(4);
    }
  });

  it("works for all 4 fitness goals", () => {
    for (const goal of GOALS) {
      const workouts = getWorkouts96(goal, NO_MASTERY);
      expect(workouts.length).toBe(4);
    }
  });
});

// ═══════════════════════════════════════════════════
// getWorkout96ById
// ═══════════════════════════════════════════════════

describe("getWorkout96ById", () => {
  it("returns a valid workout for a known ID", () => {
    const workout = getWorkout96ById("workout-96-0", "general", NO_MASTERY);
    expect(workout).toBeDefined();
    expect(workout!.id).toBe("workout-96-0");
  });

  it("returns undefined for an unknown ID", () => {
    const workout = getWorkout96ById("workout-96-99", "general", NO_MASTERY);
    expect(workout).toBeUndefined();
  });

  it("returns undefined for a malformed ID", () => {
    const workout = getWorkout96ById("invalid-id", "general", NO_MASTERY);
    expect(workout).toBeUndefined();
  });

  it("respects the fitness goal parameter", () => {
    const strengthWorkout = getWorkout96ById("workout-96-0", "strength", NO_MASTERY);
    const enduranceWorkout = getWorkout96ById("workout-96-0", "endurance", NO_MASTERY);
    expect(strengthWorkout).toBeDefined();
    expect(enduranceWorkout).toBeDefined();

    // Strength should have lower rep ranges than endurance
    const strengthAvg =
      strengthWorkout!.exercises.reduce((sum, ex) => sum + ex.repRange[0], 0) /
      strengthWorkout!.exercises.length;
    const enduranceAvg =
      enduranceWorkout!.exercises.reduce((sum, ex) => sum + ex.repRange[0], 0) /
      enduranceWorkout!.exercises.length;
    expect(strengthAvg).toBeLessThan(enduranceAvg);
  });
});

// ═══════════════════════════════════════════════════
// getPathwayLevels
// ═══════════════════════════════════════════════════

describe("getPathwayLevels", () => {
  it("returns levels for all 8 pathways", () => {
    const levels = getPathwayLevels(NO_MASTERY);
    const pathwayCount = Object.keys(PATHWAYS).length;
    expect(Object.keys(levels).length).toBe(pathwayCount);
  });

  it("starts at level 1 for all pathways with no mastery", () => {
    const levels = getPathwayLevels(NO_MASTERY);
    for (const pw of PATHWAY_IDS) {
      expect(levels[pw].level).toBe(1);
      expect(levels[pw].nextId).toBe(`${pw.toUpperCase()}1`);
    }
  });

  it("advances levels based on mastered IDs", () => {
    const levels = getPathwayLevels(HALF_MASTERY);
    // HP4 mastered → level 5
    expect(levels.hp.level).toBe(5);
    expect(levels.hp.nextId).toBe("HP5");

    // VP6 mastered → level 7
    expect(levels.vp.level).toBe(7);
    expect(levels.vp.nextId).toBe("VP7");
  });

  it("caps at level 12 with full mastery", () => {
    const allMastered = new Set<string>();
    for (const pw of PATHWAY_IDS) {
      const prefix = pw.toUpperCase();
      for (let l = 1; l <= 12; l++) {
        allMastered.add(`${prefix}${l}`);
      }
    }
    const levels = getPathwayLevels(allMastered);
    for (const pw of PATHWAY_IDS) {
      expect(levels[pw].level).toBe(12);
      expect(levels[pw].nextId).toBe(`${pw.toUpperCase()}12`);
    }
  });
});

// ═══════════════════════════════════════════════════
// getPathwayExercise
// ═══════════════════════════════════════════════════

describe("getPathwayExercise", () => {
  it("returns a valid result for a known pathway", () => {
    const result = getPathwayExercise("hp", "general", NO_MASTERY);
    expect(result).not.toBeNull();
    expect(result!.level).toBe(1);
    expect(result!.isMaxLevel).toBe(false);
    expect(result!.maxLevel).toBe(12);
    expect(result!.exercise.id).toBe("HP1");
    expect(result!.pathwayConfig.id).toBe("hp");
  });

  it("returns null for an unknown pathway", () => {
    const result = getPathwayExercise("unknown" as PathwayId, "general", NO_MASTERY);
    expect(result).toBeNull();
  });

  it("reports isMaxLevel=true when at level 12", () => {
    const allMastered = new Set<string>();
    for (let l = 1; l <= 12; l++) {
      allMastered.add(`HP${l}`);
    }
    const result = getPathwayExercise("hp", "general", allMastered);
    expect(result).not.toBeNull();
    expect(result!.level).toBe(12);
    expect(result!.isMaxLevel).toBe(true);
  });

  it("applies goal transformation to the exercise", () => {
    const strengthResult = getPathwayExercise("hp", "strength", NO_MASTERY);
    const enduranceResult = getPathwayExercise("hp", "endurance", NO_MASTERY);
    expect(strengthResult).not.toBeNull();
    expect(enduranceResult).not.toBeNull();

    // Strength should have fewer reps
    expect(strengthResult!.exercise.repRange[0]).toBeLessThan(
      enduranceResult!.exercise.repRange[0],
    );
  });

  it("advances level based on mastery", () => {
    const result = getPathwayExercise("hp", "general", HALF_MASTERY);
    expect(result).not.toBeNull();
    // HP4 mastered → level 5
    expect(result!.level).toBe(5);
    expect(result!.exercise.id).toBe("HP5");
  });

  it("returns pathway metadata for all 8 pathways", () => {
    for (const pw of PATHWAY_IDS) {
      const result = getPathwayExercise(pw, "general", NO_MASTERY);
      expect(result).not.toBeNull();
      expect(result!.pathwayConfig).toBeDefined();
      expect(result!.exercise).toBeDefined();
      expect(result!.exercise.targetMuscles.length).toBeGreaterThan(0);
    }
  });
});
