/**
 * @jest-environment node
 *
 * Goal Workouts Tests
 *
 * Tests the goal-aware workout transformation system including:
 * - Goal configuration integrity (rep/sets/rest multipliers)
 * - Exercise transformation for each fitness goal
 * - Workout lookup by ID (generator + class fallback)
 * - Edge cases (isometric exercises, clamping, general goal passthrough)
 */

import {
  GOAL_CONFIGS,
  transformExercise96,
  getWorkoutByIdForGoal,
  getGoalConfig,
  getGoalWorkoutDescription,
} from "../data/goalWorkouts";
import { getExercise96ById, getAllExercises96, Exercise96 } from "../data/exercises96";
import type { Exercise } from "../data/exercises";
import type { FitnessGoal } from "../stores/useUserStore";

// ─── Constants ────────────────────────────────────

const GOALS: FitnessGoal[] = ["strength", "muscle_gain", "endurance", "general"];

// Equivalent rep ranges for each goal tier based on GOAL_CONFIGS multipliers
const EXPECTED_GOAL_LABELS: Record<FitnessGoal, string> = {
  strength: "STRENGTH",
  muscle_gain: "MUSCLE GAIN",
  endurance: "ENDURANCE",
  general: "GENERAL FITNESS",
};

// ═══════════════════════════════════════════════════
// GOAL_CONFIGS Integrity
// ═══════════════════════════════════════════════════

describe("GOAL_CONFIGS", () => {
  it("has configs for all 4 fitness goals", () => {
    expect(Object.keys(GOAL_CONFIGS).length).toBe(4);
    for (const goal of GOALS) {
      expect(GOAL_CONFIGS[goal]).toBeDefined();
    }
  });

  it("each config has a valid label", () => {
    for (const goal of GOALS) {
      expect(GOAL_CONFIGS[goal].label).toBe(EXPECTED_GOAL_LABELS[goal]);
    }
  });

  it("each config has positive multipliers", () => {
    for (const goal of GOALS) {
      const config = GOAL_CONFIGS[goal];
      expect(config.repMultiplier).toBeGreaterThan(0);
      expect(config.setsMultiplier).toBeGreaterThan(0);
      expect(config.restMultiplier).toBeGreaterThan(0);
    }
  });

  it("strength has lower repMultiplier than endurance", () => {
    expect(GOAL_CONFIGS.strength.repMultiplier).toBeLessThan(GOAL_CONFIGS.endurance.repMultiplier);
  });

  it("general has all 1.0 multipliers (passthrough)", () => {
    expect(GOAL_CONFIGS.general.repMultiplier).toBe(1.0);
    expect(GOAL_CONFIGS.general.setsMultiplier).toBe(1.0);
    expect(GOAL_CONFIGS.general.restMultiplier).toBe(1.0);
  });
});

// ═══════════════════════════════════════════════════
// transformExercise96 — Rep Range Transformation
// ═══════════════════════════════════════════════════

describe("transformExercise96 — rep ranges", () => {
  // Use a standard exercise with known rep range: HP4 (Standard Push-up) = [8, 15]
  // Use VP1 (Wall Incline Push-up) = [12, 20] as a beginner variant
  let hp4: Exercise;

  beforeAll(() => {
    const ex96 = getExercise96ById("HP4");
    expect(ex96).toBeDefined();
    const { pathwayId: _pw, pathwayLevel: _lvl, overloadMechanism: _om, ...rest } = ex96!;
    hp4 = rest;
  });

  it("general goal preserves original rep range", () => {
    const result = transformExercise96(hp4, "general");
    expect(result.repRange).toEqual(hp4.repRange);
    expect(result.defaultSets).toBe(hp4.defaultSets);
    expect(result.restInterval).toBe(hp4.restInterval);
    expect(result.tempo).toBe(hp4.tempo);
  });

  it("strength goal reduces rep range", () => {
    const result = transformExercise96(hp4, "strength");
    // repMultiplier is 0.55 → 8*0.55=4.4, 15*0.55=8.25 → clamped [5, 9]
    expect(result.repRange[0]).toBeGreaterThanOrEqual(1);
    expect(result.repRange[1]).toBeGreaterThan(result.repRange[0]);
    // Both should be lower than original
    expect(result.repRange[0]).toBeLessThanOrEqual(hp4.repRange[0]);
    expect(result.repRange[1]).toBeLessThan(hp4.repRange[1]);
  });

  it("endurance goal increases rep range", () => {
    const result = transformExercise96(hp4, "endurance");
    // repMultiplier is 1.6 → 8*1.6=12.8, 15*1.6=24 → clamped [13, 25]
    expect(result.repRange[0]).toBeGreaterThan(hp4.repRange[0]);
    expect(result.repRange[1]).toBeGreaterThan(hp4.repRange[1]);
  });

  it("muscle gain goal moderately adjusts rep range", () => {
    const result = transformExercise96(hp4, "muscle_gain");
    // repMultiplier is 0.85 → 8*0.85=6.8, 15*0.85=12.75 → clamped [7, 13]
    expect(result.repRange[0]).toBeGreaterThanOrEqual(1);
    expect(result.repRange[1]).toBeGreaterThan(result.repRange[0]);
    // Should be between strength and endurance
    const strengthResult = transformExercise96(hp4, "strength");
    const enduranceResult = transformExercise96(hp4, "endurance");
    expect(result.repRange[0]).toBeGreaterThan(strengthResult.repRange[0]);
    expect(result.repRange[0]).toBeLessThan(enduranceResult.repRange[0]);
  });

  it("rep ranges always have low < high (clamped)", () => {
    // Use an exercise with a narrow rep range to test clamping
    const vp1 = getExercise96ById("VP1");
    expect(vp1).toBeDefined();
    const { pathwayId: _pw, pathwayLevel: _lvl, overloadMechanism: _om, ...vp1Exercise } = vp1!;

    for (const goal of GOALS) {
      const result = transformExercise96(vp1Exercise, goal);
      expect(result.repRange[0]).toBeLessThan(result.repRange[1]);
    }
  });
});

// ═══════════════════════════════════════════════════
// transformExercise96 — Sets/Rest/Tempo
// ═══════════════════════════════════════════════════

describe("transformExercise96 — sets, rest, tempo", () => {
  it("strength goal increases sets and rest", () => {
    const hp4 = getExercise96ById("HP4")!;
    const { pathwayId: _pw, pathwayLevel: _lvl, overloadMechanism: _om, ...exercise } = hp4;
    const result = transformExercise96(exercise, "strength");
    expect(result.defaultSets).toBeGreaterThanOrEqual(exercise.defaultSets);
    expect(result.restInterval).toBeGreaterThan(exercise.restInterval);
    // Tempo override: 4-1-1-0
    expect(result.tempo).toBe("4-1-1-0");
  });

  it("endurance goal decreases sets and rest", () => {
    const hp4 = getExercise96ById("HP4")!;
    const { pathwayId: _pw, pathwayLevel: _lvl, overloadMechanism: _om, ...exercise } = hp4;
    const result = transformExercise96(exercise, "endurance");
    expect(result.defaultSets).toBeLessThanOrEqual(exercise.defaultSets);
    expect(result.restInterval).toBeLessThan(exercise.restInterval);
    // Tempo override: 2-0-1-0
    expect(result.tempo).toBe("2-0-1-0");
  });

  it("muscle gain applies controlled tempo", () => {
    const hp4 = getExercise96ById("HP4")!;
    const { pathwayId: _pw, pathwayLevel: _lvl, overloadMechanism: _om, ...exercise } = hp4;
    const result = transformExercise96(exercise, "muscle_gain");
    expect(result.tempo).toBe("3-0-2-0");
  });
});

// ═══════════════════════════════════════════════════
// transformExercise96 — Isometric Exercises
// ═══════════════════════════════════════════════════

describe("transformExercise96 — isometric exercises", () => {
  it("preserves isometric tempo for all goals", () => {
    // AC5 = Hollow Body Hold (Full) — isometric
    const ac5 = getExercise96ById("AC5")!;
    const { pathwayId: _pw, pathwayLevel: _lvl, overloadMechanism: _om, ...exercise } = ac5;

    for (const goal of GOALS) {
      const result = transformExercise96(exercise, goal);
      expect(result.tempo).toBe("isometric");
    }
  });

  it("adjusts isometric hold duration based on goal", () => {
    const ac5 = getExercise96ById("AC5")!;
    const { pathwayId: _pw, pathwayLevel: _lvl, overloadMechanism: _om, ...exercise } = ac5;

    // Strength: 0.55 multiplier → shorter holds
    const strengthResult = transformExercise96(exercise, "strength");
    // Endurance: 1.6 multiplier → longer holds
    const enduranceResult = transformExercise96(exercise, "endurance");

    // Isometric holds should be adjusted
    expect(strengthResult.repRange[0]).toBeGreaterThanOrEqual(5);
    expect(enduranceResult.repRange[0]).toBeGreaterThan(strengthResult.repRange[0]);
  });
});

// ═══════════════════════════════════════════════════
// transformExercise96 — Clamping & Boundaries
// ═══════════════════════════════════════════════════

describe("transformExercise96 — clamping and boundaries", () => {
  it("clamps defaultSets to minimum of 2", () => {
    // Endurance: setsMultiplier 0.75. If defaultSets = 3, 3*0.75=2.25 → Math.round = 2 → Math.max(2, 2) = 2
    const hp4 = getExercise96ById("HP4")!;
    const { pathwayId: _pw, pathwayLevel: _lvl, overloadMechanism: _om, ...exercise } = hp4;
    const result = transformExercise96(exercise, "endurance");
    expect(result.defaultSets).toBeGreaterThanOrEqual(2);
  });

  it("clamps restInterval to minimum of 30", () => {
    const hp4 = getExercise96ById("HP4")!;
    const { pathwayId: _pw, pathwayLevel: _lvl, overloadMechanism: _om, ...exercise } = hp4;
    // endurance: restMultiplier 0.5. If restInterval = 90, 90*0.5=45 → Math.max(30, 45) = 45
    const result = transformExercise96(exercise, "endurance");
    expect(result.restInterval).toBeGreaterThanOrEqual(30);
  });

  it("produces valid results for all 96 exercises across all goals", () => {
    const allExercises = getAllExercises96();

    for (const ex96 of allExercises) {
      const { pathwayId: _pw, pathwayLevel: _lvl, overloadMechanism: _om, ...exercise } = ex96;
      for (const goal of GOALS) {
        const result = transformExercise96(exercise, goal);
        expect(result.repRange[0]).toBeGreaterThanOrEqual(1);
        expect(result.repRange[1]).toBeGreaterThan(result.repRange[0]);
        expect(result.defaultSets).toBeGreaterThanOrEqual(2);
        expect(result.restInterval).toBeGreaterThanOrEqual(30);
        expect(result.name).toBe(exercise.name);
        expect(result.targetMuscles).toEqual(exercise.targetMuscles);
      }
    }
  });
});

// ═══════════════════════════════════════════════════
// getWorkoutByIdForGoal
// ═══════════════════════════════════════════════════

describe("getWorkoutByIdForGoal", () => {
  it("returns a valid workout for a known 96-workout ID", () => {
    const workout = getWorkoutByIdForGoal("workout-96-0", "general");
    expect(workout).toBeDefined();
    expect(workout!.id).toBe("workout-96-0");
    expect(workout!.exercises.length).toBe(4);
  });

  it("applies goal transformation to the returned workout", () => {
    const strengthWorkout = getWorkoutByIdForGoal("workout-96-0", "strength");
    const enduranceWorkout = getWorkoutByIdForGoal("workout-96-0", "endurance");
    expect(strengthWorkout).toBeDefined();
    expect(enduranceWorkout).toBeDefined();

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
// getGoalConfig
// ═══════════════════════════════════════════════════

describe("getGoalConfig", () => {
  it("returns the correct config for each goal", () => {
    for (const goal of GOALS) {
      const config = getGoalConfig(goal);
      expect(config.label).toBe(EXPECTED_GOAL_LABELS[goal]);
      expect(config.tagline).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════
// getGoalWorkoutDescription
// ═══════════════════════════════════════════════════

describe("getGoalWorkoutDescription", () => {
  it("returns a non-empty description for each goal", () => {
    for (const goal of GOALS) {
      const desc = getGoalWorkoutDescription(goal);
      expect(desc.length).toBeGreaterThan(0);
    }
  });

  it("each description mentions rep ranges", () => {
    for (const goal of GOALS) {
      const desc = getGoalWorkoutDescription(goal);
      expect(desc).toMatch(/\d+/); // Contains numbers (rep ranges)
    }
  });
});
