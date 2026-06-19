/**
 * @jest-environment node
 */
// Using node environment to avoid React Native native module issues.
// AsyncStorage is mocked for the confirmLevelUp tests which access useUserStore.

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

import {
  checkExerciseProgression,
  checkAllExerciseProgressions,
  detectNewMastery,
  getLevelUpReplacement,
  confirmLevelUp,
} from "../utils/doubleProgression";
import { getExercise96ById, ALL_EXERCISES_96 } from "../data/exercises96";
import type { WorkoutSession } from "../stores/useUserStore";

// ─── Helpers ────────────────────────────────

/** Get the upper threshold for an exercise (within 1 rep of the upper range) */
function upperThreshold(exerciseId: string): number {
  const ex = getExercise96ById(exerciseId);
  if (!ex) throw new Error(`Exercise "${exerciseId}" not found in the 96-exercise DB`);
  return ex.repRange[1] - 1;
}

/** Build a session with a single exercise repeated across sets */
function sessionWith(
  id: string,
  exerciseId: string,
  repsPerSet: number,
  setCount: number = 3,
): WorkoutSession {
  return {
    id,
    workoutId: "test",
    date: `2026-06-${String(Number(id.replace("s", ""))).padStart(2, "0")}`,
    duration: 1800,
    setsCompleted: setCount,
    xpEarned: 100,
    exercises: [
      { exerciseId, sets: setCount, repsCompleted: Array(setCount).fill(repsPerSet) },
    ],
  };
}

/** Build a session that contains multiple different exercises */
function mixedSession(
  id: string,
  entries: { exerciseId: string; repsPerSet: number; setCount?: number }[],
): WorkoutSession {
  const dateNum = String(Number(id.replace("s", ""))).padStart(2, "0");
  const totalSets = entries.reduce((s, e) => s + (e.setCount ?? 3), 0);
  return {
    id,
    workoutId: "test",
    date: `2026-06-${dateNum}`,
    duration: totalSets * 60,
    setsCompleted: totalSets,
    xpEarned: totalSets * 25,
    exercises: entries.map((e) => ({
      exerciseId: e.exerciseId,
      sets: e.setCount ?? 3,
      repsCompleted: Array(e.setCount ?? 3).fill(e.repsPerSet),
    })),
  };
}

// ════════════════════════════════════════════════════════════════
// checkExerciseProgression
// ════════════════════════════════════════════════════════════════

describe("checkExerciseProgression", () => {
  it("returns null for an unknown exercise ID", () => {
    expect(checkExerciseProgression("nonexistent-id", [])).toBeNull();
  });

  it("returns canLevelUp=false when there is no workout history", () => {
    const result = checkExerciseProgression("HP1", []);
    expect(result).not.toBeNull();
    expect(result!.canLevelUp).toBe(false);
    expect(result!.sessionsCompleted).toBe(0);
    expect(result!.averageReps).toBe(0);
  });

  it("returns correct pathway metadata for pathway IDs", () => {
    const result = checkExerciseProgression("AC1", []);
    expect(result!.pathwayId).toBe("ac");
    expect(result!.pathwayLabel).toBe("Anterior Core");
    expect(result!.currentLevel).toBe(1);
    expect(result!.exerciseName).toContain("Dead Bug");
  });

  it("returns correct metadata for each pathway", () => {
    const pathways = [
      { id: "HP1", expected: { label: "Horizontal Push", level: 1 } },
      { id: "VP1", expected: { label: "Vertical Push", level: 1 } },
      { id: "HPLL1", expected: { label: "Horizontal Pull", level: 1 } },
      { id: "VPLL1", expected: { label: "Vertical Pull", level: 1 } },
      { id: "AQL1", expected: { label: "Anterior Chain Legs", level: 1 } },
      { id: "HPL1", expected: { label: "Posterior Chain Legs", level: 1 } },
      { id: "AC1", expected: { label: "Anterior Core", level: 1 } },
      { id: "PLC1", expected: { label: "Posterior & Lateral Core", level: 1 } },
    ];
    for (const { id, expected } of pathways) {
      const result = checkExerciseProgression(id, []);
      expect(result!.pathwayLabel).toBe(expected.label);
      expect(result!.currentLevel).toBe(expected.level);
    }
  });

  it("returns canLevelUp=false with only 1 session (needs 2+)", () => {
    const th = upperThreshold("HP1");
    const result = checkExerciseProgression("HP1", [
      sessionWith("s1", "HP1", th),
    ]);
    expect(result!.sessionsCompleted).toBe(1);
    expect(result!.canLevelUp).toBe(false);
  });

  it("returns canLevelUp=true when 2+ sessions all hit the upper rep range", () => {
    const th = upperThreshold("HP1");
    const result = checkExerciseProgression("HP1", [
      sessionWith("s1", "HP1", th),
      sessionWith("s2", "HP1", th + 1),
    ]);
    // 6 sets across 2 sessions, all >= threshold → 100% ≥ 80%
    expect(result!.canLevelUp).toBe(true);
    expect(result!.nextExercise).not.toBeNull();
    expect(result!.nextExercise!.level).toBe(2);
    expect(result!.nextExercise!.name).toBeTruthy();
  });

  it("returns canLevelUp=false when reps are consistently well below the upper threshold", () => {
    const result = checkExerciseProgression("HP1", [
      sessionWith("s1", "HP1", 10),
      sessionWith("s2", "HP1", 10),
    ]);
    expect(result!.canLevelUp).toBe(false);
    expect(result!.highEndPercentage).toBe(0);
  });

  it("returns canLevelUp=false when only some sets hit the upper range", () => {
    // 2 sessions, each with 1 set each: one high, one low → 50% < 80%
    const th = upperThreshold("HP1");
    const result = checkExerciseProgression("HP1", [
      sessionWith("s1", "HP1", th, 1),
      sessionWith("s2", "HP1", 10, 1),
    ]);
    expect(result!.canLevelUp).toBe(false);
    expect(result!.sessionsCompleted).toBe(2);
  });

  it("returns nextExercise=null for max-level (level 12) exercises", () => {
    const lvl12 = ALL_EXERCISES_96.find((e) => e.pathwayLevel === 12);
    if (!lvl12) return; // guard
    const result = checkExerciseProgression(lvl12.id, []);
    expect(result!.nextExercise).toBeNull();
  });

  it("returns the correct next level exercise (same pathway, level + 1)", () => {
    const result = checkExerciseProgression("VP1", []);
    expect(result!.nextExercise).not.toBeNull();
    expect(result!.nextExercise!.level).toBe(2);
    expect(result!.nextExercise!.id).toBe("VP2");
  });

  it("handles legacy exercise IDs via LEGACY_TO_PATHWAY mapping", () => {
    // decline-push-up → HP7
    const th = upperThreshold("HP7");
    const result = checkExerciseProgression("decline-push-up", [
      sessionWith("s1", "decline-push-up", th),
      sessionWith("s2", "decline-push-up", th),
    ]);
    expect(result!.pathwayId).toBe("hp");
    expect(result!.currentLevel).toBe(7);
    expect(result!.canLevelUp).toBe(true);
    expect(result!.nextExercise!.id).toBe("HP8");
  });

  it("computes averageReps across all sets", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "s1", workoutId: "test", date: "2026-06-01",
        duration: 1800, setsCompleted: 2, xpEarned: 50,
        exercises: [{ exerciseId: "AC1", sets: 2, repsCompleted: [10, 12] }],
      },
    ];
    const result = checkExerciseProgression("AC1", sessions);
    expect(result!.averageReps).toBe(11);
  });

  it("slices recent sessions to the last 3 for the high-end check", () => {
    // 5 sessions: first 3 are low reps, last 2 are at threshold
    const th = upperThreshold("AC1");
    const sessions: WorkoutSession[] = [
      sessionWith("s1", "AC1", 5, 1),
      sessionWith("s2", "AC1", 5, 1),
      sessionWith("s3", "AC1", 5, 1),
      sessionWith("s4", "AC1", th, 1),
      sessionWith("s5", "AC1", th, 1),
    ];
    const result = checkExerciseProgression("AC1", sessions);
    // Recent sessions (last 3): s3=5, s4=th, s5=th → 2/3 ≈ 66% < 80%
    expect(result!.canLevelUp).toBe(false);
    expect(result!.sessionsCompleted).toBe(5);
  });

  it("preserves averageReps across legacy-to-pathway mapping", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "s1", workoutId: "test", date: "2026-06-01",
        duration: 600, setsCompleted: 2, xpEarned: 50,
        exercises: [{ exerciseId: "bulgarian-split-squat", sets: 2, repsCompleted: [12, 14] }],
      },
    ];
    const result = checkExerciseProgression("bulgarian-split-squat", sessions);
    expect(result!.averageReps).toBe(13);
    expect(result!.pathwayId).toBe("aql");
  });
});

// ════════════════════════════════════════════════════════════════
// checkAllExerciseProgressions
// ════════════════════════════════════════════════════════════════

describe("checkAllExerciseProgressions", () => {
  it("returns an empty array for an empty workout history", () => {
    expect(checkAllExerciseProgressions([])).toEqual([]);
  });

  it("returns results sorted with ready-to-level-up entries first", () => {
    const th = upperThreshold("HP1");
    const sessions = [
      sessionWith("s1", "HP1", th),
      sessionWith("s2", "HP1", th),
      sessionWith("s1", "AC1", 8),
      sessionWith("s2", "AC1", 8),
    ];
    const results = checkAllExerciseProgressions(sessions);
    // Both exercises appear in results
    expect(results.length).toBe(2);
    // HP1 should be ready, AC1 should not
    const hp1 = results.find((r) => r.exerciseId === "HP1")!;
    const ac1 = results.find((r) => r.exerciseId === "AC1")!;
    expect(hp1.canLevelUp).toBe(true);
    expect(ac1.canLevelUp).toBe(false);
    // Ready exercises come first
    expect(results.indexOf(hp1)).toBeLessThan(results.indexOf(ac1));
  });

  it("deduplicates exercises that appear across multiple sessions", () => {
    const results = checkAllExerciseProgressions([
      sessionWith("s1", "HP1", 10),
      sessionWith("s2", "HP1", 12),
    ]);
    expect(results.length).toBe(1);
    expect(results[0].exerciseId).toBe("HP1");
  });

  it("returns multiple results when sessions contain different exercises", () => {
    const sessions = [
      mixedSession("s1", [
        { exerciseId: "HP1", repsPerSet: 10 },
        { exerciseId: "VP1", repsPerSet: 10 },
      ]),
      mixedSession("s2", [
        { exerciseId: "HP1", repsPerSet: 12 },
        { exerciseId: "VP1", repsPerSet: 12 },
      ]),
    ];
    const results = checkAllExerciseProgressions(sessions);
    expect(results.length).toBe(2);
    const ids = results.map((r) => r.exerciseId).sort();
    expect(ids).toEqual(["HP1", "VP1"]);
  });
});

// ════════════════════════════════════════════════════════════════
// detectNewMastery
// ════════════════════════════════════════════════════════════════

describe("detectNewMastery", () => {
  it("returns an empty array when the just-completed session has no exercises", () => {
    const empty: WorkoutSession = {
      id: "s1", workoutId: "test", date: "2026-06-01",
      duration: 600, setsCompleted: 0, xpEarned: 0, exercises: [],
    };
    expect(detectNewMastery([], empty)).toEqual([]);
  });

  it("returns empty when the just-completed session reps are well below threshold", () => {
    const th = upperThreshold("HP1");
    const sessions = [
      sessionWith("s1", "HP1", th),
      sessionWith("s2", "HP1", th),
    ];
    const lowSession = sessionWith("s3", "HP1", 10);
    expect(detectNewMastery(sessions, lowSession)).toEqual([]);
  });

  it("returns mastered IDs when all conditions are satisfied", () => {
    const th = upperThreshold("HP1");
    const sessions = [
      sessionWith("s1", "HP1", th),
      sessionWith("s2", "HP1", th),
      sessionWith("s3", "HP1", th),
    ];
    const mastered = detectNewMastery(sessions, sessions[2]);
    expect(mastered.length).toBeGreaterThan(0);
    expect(mastered).toContain("HP1");
  });

  it("skips exercises with empty repsCompleted", () => {
    const emptySets: WorkoutSession = {
      id: "s1", workoutId: "test", date: "2026-06-01",
      duration: 600, setsCompleted: 1, xpEarned: 25,
      exercises: [{ exerciseId: "HP1", sets: 1, repsCompleted: [] }],
    };
    expect(detectNewMastery([], emptySets)).toEqual([]);
  });

  it("detects mastery for multiple exercises in the same session", () => {
    const thHP = upperThreshold("HP1");
    const thVP = upperThreshold("VP1");
    const sessions = [
      mixedSession("s1", [
        { exerciseId: "HP1", repsPerSet: thHP },
        { exerciseId: "VP1", repsPerSet: thVP },
      ]),
      mixedSession("s2", [
        { exerciseId: "HP1", repsPerSet: thHP },
        { exerciseId: "VP1", repsPerSet: thVP },
      ]),
      mixedSession("s3", [
        { exerciseId: "HP1", repsPerSet: thHP },
        { exerciseId: "VP1", repsPerSet: thVP },
      ]),
    ];
    const mastered = detectNewMastery(sessions, sessions[2]);
    expect(mastered).toContain("HP1");
    expect(mastered).toContain("VP1");
    expect(mastered.length).toBeGreaterThanOrEqual(2);
  });

  it("returns pathway IDs (not legacy IDs) for legacy exercise mapping", () => {
    const th = upperThreshold("HP7");
    const sessions: WorkoutSession[] = [
      {
        id: "s1", workoutId: "test", date: "2026-06-01",
        duration: 1800, setsCompleted: 3, xpEarned: 100,
        exercises: [{ exerciseId: "decline-push-up", sets: 3, repsCompleted: [th, th, th] }],
      },
      {
        id: "s2", workoutId: "test", date: "2026-06-04",
        duration: 1800, setsCompleted: 3, xpEarned: 100,
        exercises: [{ exerciseId: "decline-push-up", sets: 3, repsCompleted: [th, th, th] }],
      },
    ];
    const justCompleted: WorkoutSession = {
      id: "s3", workoutId: "test", date: "2026-06-07",
      duration: 1800, setsCompleted: 3, xpEarned: 100,
      exercises: [{ exerciseId: "decline-push-up", sets: 3, repsCompleted: [th, th, th] }],
    };
    const mastered = detectNewMastery(sessions, justCompleted);
    expect(mastered).toContain("HP7");
    expect(mastered).not.toContain("decline-push-up");
  });

  it("returns empty when this session hits threshold but history is insufficient (< 2 sessions)", () => {
    const th = upperThreshold("HP1");
    // Only 1 prior session — canLevelUp requires ≥2 sessions total
    const result = detectNewMastery(
      [sessionWith("s1", "HP1", th)],
      sessionWith("s2", "HP1", th),
    );
    expect(result).toEqual([]);
  });

  it("returns empty when the exercise ID is not in the 96-exercise DB", () => {
    const sessions: WorkoutSession[] = [
      sessionWith("s1", "nonexistent", 10),
      sessionWith("s2", "nonexistent", 15),
    ];
    expect(detectNewMastery(sessions, sessions[1])).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════
// getLevelUpReplacement
// ════════════════════════════════════════════════════════════════

describe("getLevelUpReplacement", () => {
  it("returns null for an unknown exercise ID", () => {
    expect(getLevelUpReplacement("bogus")).toBeNull();
  });

  it("returns null for max-level (level 12) exercises", () => {
    const lvl12 = ALL_EXERCISES_96.find((e) => e.pathwayLevel === 12);
    if (!lvl12) return;
    expect(getLevelUpReplacement(lvl12.id)).toBeNull();
  });

  it("returns the next-level exercise for a mid-pathway exercise", () => {
    const next = getLevelUpReplacement("HP1");
    expect(next).not.toBeNull();
    expect(next!.pathwayLevel).toBe(2);
    expect(next!.pathwayId).toBe("hp");
    expect(next!.name).toBeTruthy();
  });

  it("maps legacy IDs and returns the correct next level", () => {
    // decline-push-up → HP7 → next is HP8
    const next = getLevelUpReplacement("decline-push-up");
    expect(next).not.toBeNull();
    expect(next!.id).toBe("HP8");
    expect(next!.pathwayLevel).toBe(8);
  });

  it("returns the next level for all 8 pathways", () => {
    const pathwayExercises = ["HP1", "VP1", "HPLL1", "VPLL1", "AQL1", "HPL1", "AC1", "PLC1"];
    for (const exId of pathwayExercises) {
      const next = getLevelUpReplacement(exId);
      expect(next).not.toBeNull();
      expect(next!.pathwayLevel).toBe(2);
    }
  });
});

// ════════════════════════════════════════════════════════════════
// confirmLevelUp (store action wrapper)
// ════════════════════════════════════════════════════════════════

describe("confirmLevelUp", () => {
  it("does not throw when called with a valid pathway exercise ID", () => {
    expect(() => confirmLevelUp("HP1")).not.toThrow();
  });

  it("does not throw when called with a legacy exercise ID", () => {
    expect(() => confirmLevelUp("decline-push-up")).not.toThrow();
  });

  it("does not throw when called with an unrecognised ID", () => {
    expect(() => confirmLevelUp("bogus")).not.toThrow();
  });
});
