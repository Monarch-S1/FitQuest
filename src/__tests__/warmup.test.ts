/**
 * @jest-environment node
 */
// Using node environment to avoid React Native / AsyncStorage mocking issues.

import {
  generateWarmUp,
  estimateWarmUpDuration,
  getWarmUpZoneSummary,
  WarmUpExercise,
} from "../utils/warmup";
import { WorkoutDay } from "../data/exercises";
import { getExercise96ById, getAllExercises96, Exercise96 } from "../data/exercises96";

// ─── Test fixtures: WorkoutDay objects built from 96-exercise database ───────────

const hp4 = getExercise96ById("HP4")!; // Standard Push-up: chest, shoulders, triceps, core
const hp7 = getExercise96ById("HP7")!; // Decline Push-up: upper_chest, shoulders, triceps
const vp4 = getExercise96ById("VP4")!; // Decline Pike Push-up: shoulders, triceps, upper_chest
const hpll9 = getExercise96ById("HPLL9")!; // Table Row: lats, mid_back, biceps
const vpll5 = getExercise96ById("VPLL5")!; // Sliding Floor Lat Pulldown: lats, core
const hpll4 = getExercise96ById("HPLL4")!; // One-Arm Doorway Row: lats, rhomboids, biceps, obliques
const aql3 = getExercise96ById("AQL3")!; // Full-Depth Air Squat: quadriceps, glutes, core
const hpl1 = getExercise96ById("HPL1")!; // Double-Leg Glute Bridge: glutes, hamstrings
const aql6 = getExercise96ById("AQL6")!; // Reverse Lunge: glutes, quadriceps
const ac5 = getExercise96ById("AC5")!; // Hollow Body Hold: rectus_abdominis, core, hip_flexors
const plc3 = getExercise96ById("PLC3")!; // Standard Forearm Plank: core, obliques, shoulders
const ac1 = getExercise96ById("AC1")!; // Lying Dead Bug: core, obliques

/** Push + legs + core focused workout (similar to old Workout A) */
const pushWorkout: WorkoutDay = {
  id: "push-day",
  name: "PUSH DAY",
  focus: "Horizontal Push + Lower Body + Core",
  exercises: [hp4, hp7, aql3, hpl1, ac5],
  recommendedFrequency: "Every 4 days",
};

/** Single-zone push focused (similar to old Workout B) */
const pushOnlyWorkout: WorkoutDay = {
  id: "push-only",
  name: "PUSH ONLY",
  focus: "Vertical Push Emphasis",
  exercises: [vp4, hp4],
  recommendedFrequency: "Every 4 days",
};

/** Pull + legs + core focused (similar to old Workout C) */
const pullWorkout: WorkoutDay = {
  id: "pull-day",
  name: "PULL DAY",
  focus: "Horizontal Pull + Lower Body + Core",
  exercises: [hpll9, vpll5, aql6, plc3],
  recommendedFrequency: "Every 4 days",
};

/** Mixed full-body (similar to old Workout D) */
const fullBodyWorkout: WorkoutDay = {
  id: "full-body",
  name: "FULL BODY",
  focus: "Full body mix",
  exercises: [hp7, hpll4, aql6, ac1],
  recommendedFrequency: "Every 4 days",
};

const allTestWorkouts = [pushWorkout, pushOnlyWorkout, pullWorkout, fullBodyWorkout];

// ─── Helpers ────────────────────────────────

function ids(warmUps: WarmUpExercise[]): string[] {
  return warmUps.map((wu) => wu.exercise.id);
}

// ════════════════════════════════════════════════════════════════
// generateWarmUp
// ════════════════════════════════════════════════════════════════

describe("generateWarmUp", () => {
  it.each([
    ["push workout", pushWorkout],
    ["push-only workout", pushOnlyWorkout],
    ["pull workout", pullWorkout],
    ["full body workout", fullBodyWorkout],
  ])("returns between 3 and 5 warm-up exercises for %s", (_, workout) => {
    const result = generateWarmUp(workout);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("never returns duplicate exercise IDs", () => {
    for (const w of allTestWorkouts) {
      const result = generateWarmUp(w);
      const exerciseIds = ids(result);
      const uniqueIds = new Set(exerciseIds);
      expect(uniqueIds.size).toBe(exerciseIds.length);
    }
  });

  it("returns exercises from the 96-exercise DB with valid properties", () => {
    const result = generateWarmUp(pushWorkout);
    for (const wu of result) {
      expect(wu.exercise.id).toBeTruthy();
      expect(wu.exercise.name).toBeTruthy();
      expect(wu.exercise.targetMuscles.length).toBeGreaterThan(0);
      expect(wu.sets).toBeGreaterThanOrEqual(1);
      expect(wu.sets).toBeLessThanOrEqual(2);
      expect(wu.repRange[0]).toBeGreaterThanOrEqual(1);
      expect(wu.repRange[1]).toBeGreaterThan(wu.repRange[0]);
      expect(wu.restInterval).toBeGreaterThanOrEqual(0);
    }
  });

  it("scales warm-ups to 1 set (activation volume)", () => {
    const result = generateWarmUp(pushWorkout);
    for (const wu of result) {
      expect(wu.sets).toBe(1);
    }
  });

  it("uses faster tempo (2-0-1-0) for non-isometric warm-ups", () => {
    const result = generateWarmUp(pushWorkout);
    for (const wu of result) {
      if (wu.tempo !== "isometric") {
        expect(wu.tempo).toBe("2-0-1-0");
      }
    }
  });

  it("handles an empty workout (no exercises)", () => {
    const emptyWorkout: WorkoutDay = {
      id: "empty",
      name: "EMPTY",
      focus: "Nothing",
      exercises: [],
      recommendedFrequency: "N/A",
    };
    const result = generateWarmUp(emptyWorkout);
    // Should still return pad exercises (minimum 3)
    expect(result.length).toBe(3);
    for (const wu of result) {
      expect(wu.exercise.id).toBeTruthy();
    }
  });

  it("handles a single-zone workout (e.g., core-only)", () => {
    const coreOnly: WorkoutDay = {
      id: "core-only",
      name: "CORE",
      focus: "Core only",
      exercises: [
        {
          id: "test-core",
          name: "Test Crunch",
          targetMuscles: ["core"],
          category: "core_isometric",
          description: "Test",
          defaultSets: 3,
          repRange: [10, 20],
          tempo: "2-0-2-0",
          restInterval: 60,
          progressionPathway: "Test",
        },
      ],
      recommendedFrequency: "N/A",
    };
    const result = generateWarmUp(coreOnly);
    // Should have 1 zone-specific warm-up padded to 3 with full-body
    expect(result.length).toBe(3);
    // Should include Bird-Dog (PLC1, the core primary) or one of its fallbacks
    const hasCoreWarmup = result.some((wu) => wu.exercise.targetMuscles.includes("core"));
    expect(hasCoreWarmup).toBe(true);
  });

  it("preserves isometric tempo for isometric exercises", () => {
    const result = generateWarmUp(pushWorkout);
    const isometricWarmups = result.filter((wu) => wu.tempo === "isometric");
    // Some warm-ups might be isometric (e.g., holds)
    for (const wu of isometricWarmups) {
      expect(wu.exercise.tempo).toBe("isometric");
    }
  });
});

// ════════════════════════════════════════════════════════════════
// estimateWarmUpDuration
// ════════════════════════════════════════════════════════════════

describe("estimateWarmUpDuration", () => {
  it("returns 0 for an empty warm-up array", () => {
    expect(estimateWarmUpDuration([])).toBe(0);
  });

  it("returns a positive number for a generated warm-up", () => {
    const warmUps = generateWarmUp(pushWorkout);
    const duration = estimateWarmUpDuration(warmUps);
    expect(duration).toBeGreaterThan(0);
    // Warm-up should be short (typically 3-8 minutes = 180-480 seconds)
    expect(duration).toBeLessThan(600);
  });

  it("returns reasonable per-exercise durations", () => {
    const warmUps = generateWarmUp(pushWorkout);
    for (const wu of warmUps) {
      // Single set duration should be reasonable
      const avgReps = (wu.repRange[0] + wu.repRange[1]) / 2;
      const repTime = wu.tempo === "isometric" ? avgReps : avgReps * 4;
      const setTime = repTime * wu.sets;
      expect(setTime).toBeGreaterThan(0);
      expect(setTime).toBeLessThan(120); // < 2 min per warm-up
    }
  });
});

// ════════════════════════════════════════════════════════════════
// getWarmUpZoneSummary
// ════════════════════════════════════════════════════════════════

describe("getWarmUpZoneSummary", () => {
  it("returns zone labels for a generated warm-up", () => {
    const warmUps = generateWarmUp(pushWorkout);
    const summary = getWarmUpZoneSummary(warmUps);
    expect(summary.length).toBeGreaterThan(0);
    for (const label of summary) {
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("returns empty array for empty warm-up", () => {
    expect(getWarmUpZoneSummary([])).toEqual([]);
  });

  it("returns expected labels for known zones", () => {
    const warmUps = generateWarmUp(pushWorkout);
    const summary = getWarmUpZoneSummary(warmUps);
    // Each label should be human-readable
    for (const label of summary) {
      expect(["Legs", "Chest & Shoulders", "Back & Arms", "Core"]).toContain(label);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// Integration: Zone Detection from Workout Focus
// ════════════════════════════════════════════════════════════════

describe("Zone detection per workout", () => {
  it("detects push muscles from a push workout (chest, shoulders, triceps)", () => {
    const result = generateWarmUp(pushWorkout);
    const pushWarmup = result.find((wu) =>
      wu.exercise.targetMuscles.some((m) => ["chest", "shoulders", "triceps"].includes(m)),
    );
    expect(pushWarmup).toBeDefined();
  });

  it("detects pull muscles from a pull workout (lats, biceps, rhomboids)", () => {
    const result = generateWarmUp(pullWorkout);
    const pullWarmup = result.find((wu) =>
      wu.exercise.targetMuscles.some((m) => ["lats", "biceps", "rhomboids"].includes(m)),
    );
    expect(pullWarmup).toBeDefined();
  });

  it("detects leg muscles from a mixed workout (quadriceps, glutes)", () => {
    const result = generateWarmUp(pushWorkout);
    const legWarmup = result.find(
      (wu) =>
        wu.exercise.targetMuscles.includes("quadriceps") ||
        wu.exercise.targetMuscles.includes("glutes"),
    );
    expect(legWarmup).toBeDefined();
  });

  it("detects core muscles from a full body workout (core in exercise list)", () => {
    const result = generateWarmUp(fullBodyWorkout);
    const coreWarmup = result.find((wu) => wu.exercise.targetMuscles.includes("core"));
    expect(coreWarmup).toBeDefined();
  });
});

it("all test fixture exercises were found in the 96-exercise database", () => {
  // Verify all our test fixtures loaded correctly
  const all96 = getAllExercises96();
  const fixtureIds = [
    "HP4",
    "HP7",
    "VP4",
    "HPLL9",
    "VPLL5",
    "HPLL4",
    "AQL3",
    "HPL1",
    "AQL6",
    "AC5",
    "PLC3",
    "AC1",
  ];
  for (const id of fixtureIds) {
    expect(all96.find((e) => e.id === id)).toBeDefined();
  }
});
