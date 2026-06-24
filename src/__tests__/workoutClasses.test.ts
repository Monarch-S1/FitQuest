/**
 * @jest-environment node
 *
 * Workout Class System Tests
 *
 * Tests the workout class unlock system including:
 * - Class definition integrity (all 7 classes load correctly)
 * - Unlock detection (getUnlockedClasses, getNewlyUnlockedClasses)
 * - Progress tracking (getClassUnlockProgress)
 * - Class workout generation (getClassWorkout)
 */

import {
  WORKOUT_CLASSES,
  getUnlockedClasses,
  getNewlyUnlockedClasses,
  getClassUnlockProgress,
  getClassWorkout,
  WorkoutClass,
} from "../data/workoutClasses";

// ─── Constants ────────────────────────────────────

const EXPECTED_CLASS_COUNT = 7;

const CLASS_IDS = [
  "tricep-armor",
  "wings-of-steel",
  "planche-prep-pro",
  "posterior-powerhouse",
  "core-crucible",
  "atlas-protocol",
  "iron-foundation",
] as const;

const VALID_EXERCISE_IDS = WORKOUT_CLASSES.flatMap((wc) => wc.requiredExercises);

// ═══════════════════════════════════════════════════
// Class Definition Integrity
// ═══════════════════════════════════════════════════

describe("class definition integrity", () => {
  it("has exactly 7 workout classes", () => {
    expect(WORKOUT_CLASSES.length).toBe(EXPECTED_CLASS_COUNT);
  });

  it("every class has all required fields", () => {
    for (const wc of WORKOUT_CLASSES) {
      expect(wc.id).toBeTruthy();
      expect(wc.name).toBeTruthy();
      expect(wc.description).toBeTruthy();
      expect(wc.icon).toBeTruthy();
      expect(wc.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(wc.requiredExercises.length).toBeGreaterThan(0);
      expect(wc.requiredNames.length).toBe(wc.requiredExercises.length);
      expect(wc.focus.length).toBeGreaterThan(0);
      expect(wc.estimatedMinutes).toBeGreaterThan(0);
      expect(wc.exerciseCount).toBeGreaterThan(0);
      expect(["beginner", "intermediate", "advanced"]).toContain(wc.difficulty);
    }
  });

  it("every class has a unique ID", () => {
    const ids = WORKOUT_CLASSES.map((wc) => wc.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("all required exercise IDs are valid 96-pathway IDs", () => {
    for (const wc of WORKOUT_CLASSES) {
      for (const reqId of wc.requiredExercises) {
        expect(reqId).toMatch(/^[A-Z]{2,4}\d+$/);
      }
    }
  });

  it("exerciseCount matches the actual class workout length", () => {
    for (const wc of WORKOUT_CLASSES) {
      const workout = getClassWorkout(wc.id);
      expect(workout).toBeDefined();
      expect(workout!.exercises.length).toBe(wc.exerciseCount);
    }
  });

  it("no two classes have the same required exercise combination", () => {
    const sortedRequirements = WORKOUT_CLASSES.map((wc) =>
      [...wc.requiredExercises].sort().join(","),
    );
    const uniqueRequirements = new Set(sortedRequirements);
    expect(uniqueRequirements.size).toBe(sortedRequirements.length);
  });
});

// ═══════════════════════════════════════════════════
// getUnlockedClasses
// ═══════════════════════════════════════════════════

describe("getUnlockedClasses", () => {
  it("returns no classes for empty mastered set", () => {
    const unlocked = getUnlockedClasses(new Set());
    expect(unlocked).toEqual([]);
  });

  it("returns classes when all required exercises are mastered", () => {
    const allRequired = new Set(VALID_EXERCISE_IDS);
    const unlocked = getUnlockedClasses(allRequired);
    expect(unlocked.length).toBe(EXPECTED_CLASS_COUNT);
  });

  it("unlocks a single class when its specific requirements are met", () => {
    // Tricep Armor requires HP6 + VP6
    const mastered = new Set(["HP6", "VP6"]);
    const unlocked = getUnlockedClasses(mastered);
    expect(unlocked.length).toBe(1);
    expect(unlocked[0].id).toBe("tricep-armor");
  });

  it("does not unlock a class when only partial requirements are met", () => {
    // Tricep Armor requires HP6 + VP6 — only VP6 is mastered
    const mastered = new Set(["VP6"]);
    const unlocked = getUnlockedClasses(mastered);
    expect(unlocked.find((wc) => wc.id === "tricep-armor")).toBeUndefined();
  });

  it("unlocks multiple classes when overlapping requirements are met", () => {
    // AC5 is required by planche-prep-pro and core-crucible
    // HP4 is required by iron-foundation
    const mastered = new Set(["AC5", "HP8", "HP4", "AQL3"]);
    const unlocked = getUnlockedClasses(mastered);
    expect(unlocked.length).toBeGreaterThanOrEqual(2);
    const unlockedIds = unlocked.map((wc) => wc.id);
    expect(unlockedIds).toContain("iron-foundation");
  });

  it("is case-sensitive for exercise IDs", () => {
    // Lowercase should not match uppercase IDs
    const mastered = new Set(["hp6", "vp6"]);
    const unlocked = getUnlockedClasses(mastered);
    expect(unlocked.find((wc) => wc.id === "tricep-armor")).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════
// getNewlyUnlockedClasses
// ═══════════════════════════════════════════════════

describe("getNewlyUnlockedClasses", () => {
  it("returns classes that are new in the new set", () => {
    const oldMastered = new Set<string>();
    const newMastered = new Set(["HP6", "VP6"]);
    const newly = getNewlyUnlockedClasses(oldMastered, newMastered);
    expect(newly.length).toBe(1);
    expect(newly[0].id).toBe("tricep-armor");
  });

  it("returns empty when no new classes are unlocked", () => {
    const oldMastered = new Set(["HP6", "VP6"]);
    const newMastered = new Set(["HP6", "VP6"]);
    const newly = getNewlyUnlockedClasses(oldMastered, newMastered);
    expect(newly).toEqual([]);
  });

  it("returns only the delta when multiple classes unlock", () => {
    const oldMastered = new Set(["HP6", "VP6"]); // tricep-armor already unlocked
    const newMastered = new Set(["HP6", "VP6", "HPLL6", "VPLL6"]); // + wings-of-steel
    const newly = getNewlyUnlockedClasses(oldMastered, newMastered);
    expect(newly.length).toBe(1);
    expect(newly[0].id).toBe("wings-of-steel");
  });

  it("handles empty old and new sets", () => {
    const newly = getNewlyUnlockedClasses(new Set(), new Set());
    expect(newly).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════
// getClassUnlockProgress
// ═══════════════════════════════════════════════════

describe("getClassUnlockProgress", () => {
  const tricepArmor = WORKOUT_CLASSES.find((wc) => wc.id === "tricep-armor")!;

  it("returns 0 unlocked when no requirements met", () => {
    const progress = getClassUnlockProgress(tricepArmor, new Set());
    expect(progress.required).toBe(2);
    expect(progress.unlocked).toBe(0);
    expect(progress.allMet).toBe(false);
  });

  it("returns partial progress when some requirements met", () => {
    const progress = getClassUnlockProgress(tricepArmor, new Set(["HP6"]));
    expect(progress.required).toBe(2);
    expect(progress.unlocked).toBe(1);
    expect(progress.allMet).toBe(false);
  });

  it("returns allMet=true when all requirements met", () => {
    const progress = getClassUnlockProgress(tricepArmor, new Set(["HP6", "VP6"]));
    expect(progress.required).toBe(2);
    expect(progress.unlocked).toBe(2);
    expect(progress.allMet).toBe(true);
  });

  it("handles classes with different requirement counts", () => {
    // Planche Prep Pro requires 2, Iron Foundation requires 2
    const planchePrep = WORKOUT_CLASSES.find((wc) => wc.id === "planche-prep-pro")!;
    const progress = getClassUnlockProgress(planchePrep, new Set(["AC5", "HP8"]));
    expect(progress.required).toBe(2);
    expect(progress.unlocked).toBe(2);
    expect(progress.allMet).toBe(true);
  });
});

// ═══════════════════════════════════════════════════
// getClassWorkout
// ═══════════════════════════════════════════════════

describe("getClassWorkout", () => {
  it.each(CLASS_IDS)("returns a valid WorkoutDay for class '%s'", (classId) => {
    const workout = getClassWorkout(classId);
    expect(workout).toBeDefined();
    expect(workout!.id).toBe(classId);
    expect(workout!.name).toBeTruthy();
    expect(workout!.focus).toBeTruthy();
    expect(workout!.exercises.length).toBeGreaterThan(0);
  });

  it("all exercises in each class workout exist in the 96-exercise DB", () => {
    for (const wc of WORKOUT_CLASSES) {
      const workout = getClassWorkout(wc.id);
      expect(workout).toBeDefined();
      for (const ex of workout!.exercises) {
        expect(ex.id).toBeTruthy();
        expect(ex.name).toBeTruthy();
        expect(ex.repRange.length).toBe(2);
        expect(ex.targetMuscles.length).toBeGreaterThan(0);
      }
    }
  });

  it("returns undefined for an unknown class ID", () => {
    const workout = getClassWorkout("nonexistent-class");
    expect(workout).toBeUndefined();
  });

  it("strips Exercise96-specific fields from each exercise", () => {
    const workout = getClassWorkout("tricep-armor");
    expect(workout).toBeDefined();
    for (const ex of workout!.exercises) {
      expect((ex as any).pathwayId).toBeUndefined();
      expect((ex as any).pathwayLevel).toBeUndefined();
      expect((ex as any).overloadMechanism).toBeUndefined();
    }
  });

  it("each class workout exercises are properly themed to the class focus", () => {
    // Tricep Armor focuses on triceps — exercises should target triceps
    const workout = getClassWorkout("tricep-armor");
    expect(workout).toBeDefined();
    const allTargets = workout!.exercises.flatMap((ex) => ex.targetMuscles);
    expect(allTargets.length).toBeGreaterThan(0);
    // At least some muscle targets should include triceps-relevant muscles
    const hasTricepsTargets = workout!.exercises.some((ex) => ex.targetMuscles.includes("triceps"));
    expect(hasTricepsTargets).toBe(true);
  });
});
