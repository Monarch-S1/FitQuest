/**
 * @jest-environment node
 */
// Using node environment to avoid React Native / AsyncStorage mocking issues.

import { generateWarmUp, estimateWarmUpDuration, getWarmUpZoneSummary, WarmUpExercise } from "../utils/warmup";
import { workoutA, workoutB, workoutC, workoutD, WorkoutDay } from "../data/exercises";

// ─── Helpers ────────────────────────────────

function ids(warmUps: WarmUpExercise[]): string[] {
  return warmUps.map((wu) => wu.exercise.id);
}

// ════════════════════════════════════════════════════════════════
// generateWarmUp
// ════════════════════════════════════════════════════════════════

describe("generateWarmUp", () => {
  it("returns between 3 and 5 warm-up exercises for Workout A", () => {
    const result = generateWarmUp(workoutA);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("returns between 3 and 5 warm-up exercises for Workout B", () => {
    const result = generateWarmUp(workoutB);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("returns between 3 and 5 warm-up exercises for Workout C", () => {
    const result = generateWarmUp(workoutC);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("returns between 3 and 5 warm-up exercises for Workout D", () => {
    const result = generateWarmUp(workoutD);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("never returns duplicate exercise IDs", () => {
    const allWorkouts = [workoutA, workoutB, workoutC, workoutD];
    for (const w of allWorkouts) {
      const result = generateWarmUp(w);
      const exerciseIds = ids(result);
      const uniqueIds = new Set(exerciseIds);
      expect(uniqueIds.size).toBe(exerciseIds.length);
    }
  });

  it("returns exercises from the 96-exercise DB with valid properties", () => {
    const result = generateWarmUp(workoutA);
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
    const result = generateWarmUp(workoutA);
    for (const wu of result) {
      expect(wu.sets).toBe(1);
    }
  });

  it("uses faster tempo (2-0-1-0) for non-isometric warm-ups", () => {
    const result = generateWarmUp(workoutA);
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
    const ids = new Set(result.map((wu) => wu.exercise.id));
    // Should include Bird-Dog (PLC1, the core primary) or one of its fallbacks
    const hasCoreWarmup = result.some((wu) =>
      wu.exercise.targetMuscles.includes("core"),
    );
    expect(hasCoreWarmup).toBe(true);
  });

  it("preserves isometric tempo for isometric exercises", () => {
    const result = generateWarmUp(workoutA);
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
    const warmUps = generateWarmUp(workoutA);
    const duration = estimateWarmUpDuration(warmUps);
    expect(duration).toBeGreaterThan(0);
    // Warm-up should be short (typically 3-8 minutes = 180-480 seconds)
    expect(duration).toBeLessThan(600);
  });

  it("returns reasonable per-exercise durations", () => {
    const warmUps = generateWarmUp(workoutA);
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
    const warmUps = generateWarmUp(workoutA);
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
    const warmUps = generateWarmUp(workoutA);
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
  it("detects push muscles from Workout A (chest, shoulders, triceps)", () => {
    const result = generateWarmUp(workoutA);
    const pushWarmup = result.find((wu) =>
      wu.exercise.targetMuscles.some((m) =>
        ["chest", "shoulders", "triceps"].includes(m),
      ),
    );
    expect(pushWarmup).toBeDefined();
  });

  it("detects pull muscles from Workout C (lats, biceps, rhomboids)", () => {
    const result = generateWarmUp(workoutC);
    const pullWarmup = result.find((wu) =>
      wu.exercise.targetMuscles.some((m) =>
        ["lats", "biceps", "rhomboids"].includes(m),
      ),
    );
    expect(pullWarmup).toBeDefined();
  });

  it("detects leg muscles from Workout A (quadriceps, glutes)", () => {
    const result = generateWarmUp(workoutA);
    const legWarmup = result.find((wu) =>
      wu.exercise.targetMuscles.includes("quadriceps") ||
      wu.exercise.targetMuscles.includes("glutes"),
    );
    expect(legWarmup).toBeDefined();
  });

  it("detects core muscles from Workout A (core in exercise list)", () => {
    const result = generateWarmUp(workoutA);
    const coreWarmup = result.find((wu) =>
      wu.exercise.targetMuscles.includes("core"),
    );
    expect(coreWarmup).toBeDefined();
  });
});
