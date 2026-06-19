import {
  getUnlockedExerciseIds,
  extractCompletedIds,
  findNewUnlocks,
} from "../utils/skillUnlocks";
import { SKILL_TREE } from "../data/skillTree";
import type { WorkoutSession } from "../stores/useUserStore";

describe("getUnlockedExerciseIds", () => {
  it("unlocks all beginner exercises when nothing is completed", () => {
    const unlocked = getUnlockedExerciseIds(new Set());
    expect(unlocked.size).toBeGreaterThan(0);

    // All beginner exercises should be unlocked
    for (const branch of SKILL_TREE) {
      for (const node of branch.nodes) {
        if (node.difficulty === "beginner") {
          expect(unlocked.has(node.exercise.id)).toBe(true);
        }
      }
    }
  });

  it("always unlocks the first exercise in each family", () => {
    const unlocked = getUnlockedExerciseIds(new Set());
    for (const branch of SKILL_TREE) {
      if (branch.nodes.length > 0) {
        expect(unlocked.has(branch.nodes[0].exercise.id)).toBe(true);
      }
    }
  });

  it("unlocks entire family when one exercise in that family is completed", () => {
    // Find a push exercise to mark as completed
    const pushBranch = SKILL_TREE.find((b) => b.family === "push")!;
    const completedId = pushBranch.nodes[0].exercise.id;

    const unlocked = getUnlockedExerciseIds(new Set([completedId]));

    // All push exercises should be unlocked
    for (const node of pushBranch.nodes) {
      expect(unlocked.has(node.exercise.id)).toBe(true);
    }

    // Non-push branches may still be partially locked (no completed in those families)
    const pullBranch = SKILL_TREE.find((b) => b.family === "pull")!;
    for (const node of pullBranch.nodes) {
      // At minimum, first exercise per family is always unlocked
      if (node !== pullBranch.nodes[0]) {
        expect(unlocked.has(node.exercise.id)).toBe(false);
      }
    }
  });

  it("unlocks all families when at least one exercise in each is completed", () => {
    const completedIds = new Set<string>();
    for (const branch of SKILL_TREE) {
      completedIds.add(branch.nodes[0].exercise.id);
    }

    const unlocked = getUnlockedExerciseIds(completedIds);

    // Every single exercise should now be unlocked
    for (const branch of SKILL_TREE) {
      for (const node of branch.nodes) {
        expect(unlocked.has(node.exercise.id)).toBe(true);
      }
    }

    expect(unlocked.size).toBe(24);
  });

  it("returns a Set even with empty input", () => {
    const result = getUnlockedExerciseIds(new Set());
    expect(result instanceof Set).toBe(true);
    // With empty completed set, beginners + first exercises should be unlocked
    expect(result.size).toBeGreaterThan(0);
  });

  it("contains only valid exercise IDs from SKILL_TREE", () => {
    const allIds = new Set<string>();
    for (const branch of SKILL_TREE) {
      for (const node of branch.nodes) {
        allIds.add(node.exercise.id);
      }
    }

    const unlocked = getUnlockedExerciseIds(new Set([...allIds]));
    for (const id of unlocked) {
      expect(allIds.has(id)).toBe(true);
    }
  });
});

describe("extractCompletedIds", () => {
  it("returns empty set for empty workout history", () => {
    const result = extractCompletedIds([]);
    expect(result.size).toBe(0);
  });

  it("extracts exercise IDs from sessions with completed reps", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-06-01",
        duration: 1800,
        setsCompleted: 3,
        xpEarned: 100,
        exercises: [
          { exerciseId: "decline-push-up", sets: 3, repsCompleted: [10, 10, 10] },
          { exerciseId: "doorway-row", sets: 3, repsCompleted: [8, 8, 8] },
        ],
      },
      {
        id: "2",
        workoutId: "workout-b",
        date: "2026-06-02",
        duration: 1800,
        setsCompleted: 3,
        xpEarned: 100,
        exercises: [
          { exerciseId: "bulgarian-split-squat", sets: 3, repsCompleted: [12, 12, 12] },
          { exerciseId: "hollow-body-hold", sets: 3, repsCompleted: [15, 15, 15] },
        ],
      },
    ];

    const result = extractCompletedIds(sessions);
    expect(result.size).toBe(4);
    expect(result.has("decline-push-up")).toBe(true);
    expect(result.has("doorway-row")).toBe(true);
    expect(result.has("bulgarian-split-squat")).toBe(true);
    expect(result.has("hollow-body-hold")).toBe(true);
  });

  it("skips exercises with empty repsCompleted", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-06-01",
        duration: 600,
        setsCompleted: 1,
        xpEarned: 25,
        exercises: [
          { exerciseId: "decline-push-up", sets: 1, repsCompleted: [] },
        ],
      },
    ];

    const result = extractCompletedIds(sessions);
    expect(result.size).toBe(0);
  });

  it("handles sessions with no exercises array", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-06-01",
        duration: 600,
        setsCompleted: 1,
        xpEarned: 25,
        exercises: [],
      },
    ];

    const result = extractCompletedIds(sessions);
    expect(result.size).toBe(0);
  });

  it("deduplicates exercise IDs across multiple sessions", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-06-01",
        duration: 1800,
        setsCompleted: 3,
        xpEarned: 100,
        exercises: [
          { exerciseId: "decline-push-up", sets: 3, repsCompleted: [10, 10, 10] },
        ],
      },
      {
        id: "2",
        workoutId: "workout-a",
        date: "2026-06-04",
        duration: 1800,
        setsCompleted: 3,
        xpEarned: 100,
        exercises: [
          { exerciseId: "decline-push-up", sets: 3, repsCompleted: [12, 12, 12] },
        ],
      },
    ];

    const result = extractCompletedIds(sessions);
    expect(result.size).toBe(1);
    expect(result.has("decline-push-up")).toBe(true);
  });
});

describe("findNewUnlocks", () => {
  it("returns empty when no new exercises are unlocked", () => {
    const oldCompleted = new Set<string>(["decline-push-up"]);
    const newCompleted = new Set<string>(["decline-push-up"]);

    const unlocks = findNewUnlocks(oldCompleted, newCompleted);
    expect(unlocks.length).toBe(0);
  });

  it("returns newly unlocked exercises within a family", () => {
    // Before: nothing completed
    const oldCompleted = new Set<string>();
    // After: first push exercise completed — unlocks the entire push branch
    const newCompleted = new Set<string>(["decline-push-up"]);

    const unlocks = findNewUnlocks(oldCompleted, newCompleted);

    // Should find newly unlocked push exercises (excluding the one just completed)
    expect(unlocks.length).toBeGreaterThan(0);

    // All unlocks should be from the push family
    for (const unlock of unlocks) {
      expect(unlock.family).toBe("push");
      // Should NOT include the exercise that was just completed
      expect(unlock.node.exercise.id).not.toBe("decline-push-up");
    }

    // Verify metadata is present
    for (const unlock of unlocks) {
      expect(unlock.branchLabel).toBe("PUSH");
      expect(unlock.branchAccent).toMatch(/^#/);
      expect(unlock.branchIcon).toBeTruthy();
      expect(unlock.node.exercise.name).toBeTruthy();
    }
  });

  it("returns unlocks across multiple families", () => {
    const oldCompleted = new Set<string>();
    const newCompleted = new Set<string>([
      "decline-push-up",
      "doorway-row",
    ]);

    const unlocks = findNewUnlocks(oldCompleted, newCompleted);

    // Should have unlocks in both push and pull families
    const families = new Set(unlocks.map((u) => u.family));
    expect(families.has("push")).toBe(true);
    expect(families.has("pull")).toBe(true);
  });

  it("does not return already-unlocked exercises", () => {
    const oldCompleted = new Set<string>(["decline-push-up"]);
    const newCompleted = new Set<string>([
      "decline-push-up",
      "doorway-row",
    ]);

    const unlocks = findNewUnlocks(oldCompleted, newCompleted);

    // Push exercises were already unlocked from the first workout
    const pushUnlocks = unlocks.filter((u) => u.family === "push");
    expect(pushUnlocks.length).toBe(0);

    // Only pull unlocks should be new
    const pullUnlocks = unlocks.filter((u) => u.family === "pull");
    expect(pullUnlocks.length).toBeGreaterThan(0);
  });

  it("detects new unlocks when intermediate exercises become available", () => {
    // Old: one pull exercise completed → entire pull family unlocked
    const oldCompleted = new Set<string>(["table-row"]);
    // New: added one push exercise → push family now also unlocks
    const newCompleted = new Set<string>(["table-row", "decline-push-up"]);

    const unlocks = findNewUnlocks(oldCompleted, newCompleted);

    // Should find push exercises (newly unlocked) but NOT pull (already unlocked)
    expect(unlocks.length).toBeGreaterThan(0);

    const pushUnlocks = unlocks.filter((u) => u.family === "push");
    const pullUnlocks = unlocks.filter((u) => u.family === "pull");

    expect(pushUnlocks.length).toBeGreaterThan(0);
    expect(pullUnlocks.length).toBe(0);

    // Verify unlock data is valid
    for (const unlock of unlocks) {
      expect(unlock.node.exercise.name).toBeTruthy();
      expect(unlock.branchLabel).toBeTruthy();
      expect(unlock.branchIcon).toBeTruthy();
      expect(unlock.branchAccent).toMatch(/^#/);
    }
  });

  it("handles completing all exercises from a partially-unlocked state", () => {
    // Start with nothing completed (beginners + first exercises are unlocked)
    // Then complete all exercises
    const oldCompleted = new Set<string>();
    const allIds = new Set<string>();
    for (const branch of SKILL_TREE) {
      for (const node of branch.nodes) {
        allIds.add(node.exercise.id);
      }
    }

    const unlocks = findNewUnlocks(oldCompleted, allIds);

    // When ALL are completed, nothing can be newly unlocked since everything
    // that wasn't already unlocked was just completed (excluded by filter)
    expect(unlocks.length).toBe(0);
  });

  it("returns NewSkillUnlock with correct shape", () => {
    const newCompleted = new Set<string>(["decline-push-up"]);
    const unlocks = findNewUnlocks(new Set(), newCompleted);

    if (unlocks.length > 0) {
      const first = unlocks[0];
      expect(first).toHaveProperty("node");
      expect(first).toHaveProperty("branchLabel");
      expect(first).toHaveProperty("branchAccent");
      expect(first).toHaveProperty("branchIcon");
      expect(first).toHaveProperty("family");
      expect(typeof first.branchLabel).toBe("string");
      expect(typeof first.branchAccent).toBe("string");
      expect(typeof first.branchIcon).toBe("string");
      expect(typeof first.family).toBe("string");
    }
  });

  it("excludes the just-completed exercise from notification", () => {
    const newCompleted = new Set<string>(["decline-push-up"]);

    const unlocks = findNewUnlocks(new Set(), newCompleted);

    // The completed exercise should NOT appear in unlocks
    const completedInUnlocks = unlocks.some(
      (u) => u.node.exercise.id === "decline-push-up",
    );
    expect(completedInUnlocks).toBe(false);
  });
});
