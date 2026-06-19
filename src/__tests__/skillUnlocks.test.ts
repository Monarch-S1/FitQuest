import {
  getUnlockedExerciseIds,
  extractCompletedIds,
  findNewUnlocks,
} from "../utils/skillUnlocks";
import { SKILL_TREE_8 } from "../data/skillTree";
import type { WorkoutSession } from "../stores/useUserStore";

describe("getUnlockedExerciseIds", () => {
  it("unlocks level 1 exercises in all 8 pathways when nothing is completed", () => {
    const unlocked = getUnlockedExerciseIds(new Set());
    expect(unlocked.size).toBeGreaterThan(0);

    // All level 1 exercises should be unlocked
    for (const branch of SKILL_TREE_8) {
      const firstNode = branch.nodes[0];
      expect(unlocked.has(firstNode.exercise.id)).toBe(true);
    }
  });

  it("always unlocks the first exercise in each pathway (level 1)", () => {
    const unlocked = getUnlockedExerciseIds(new Set());
    for (const branch of SKILL_TREE_8) {
      expect(unlocked.has(branch.nodes[0].exercise.id)).toBe(true);
    }
  });

  it("unlocks entire pathway when one exercise in that pathway is completed", () => {
    // Find an HP exercise to mark as completed
    const hpBranch = SKILL_TREE_8.find((b) => b.id === "hp")!;
    const completedId = hpBranch.nodes[3].exercise.id; // HP4 - Standard Push-up

    const unlocked = getUnlockedExerciseIds(new Set([completedId]));

    // All HP exercises should be unlocked
    for (const node of hpBranch.nodes) {
      expect(unlocked.has(node.exercise.id)).toBe(true);
    }

    // Non-HP pathways are locked (except level 1 auto-unlock)
    const pullBranch = SKILL_TREE_8.find((b) => b.id === "hpll")!;
    for (let i = 1; i < pullBranch.nodes.length; i++) {
      // Level 1 is always unlocked, but levels 2+ should be locked
      expect(unlocked.has(pullBranch.nodes[i].exercise.id)).toBe(false);
    }
  });

  it("unlocks all pathways when at least one exercise in each is completed", () => {
    const completedIds = new Set<string>();
    for (const branch of SKILL_TREE_8) {
      completedIds.add(branch.nodes[0].exercise.id);
    }

    const unlocked = getUnlockedExerciseIds(completedIds);

    // Every single exercise should now be unlocked
    for (const branch of SKILL_TREE_8) {
      for (const node of branch.nodes) {
        expect(unlocked.has(node.exercise.id)).toBe(true);
      }
    }

    expect(unlocked.size).toBe(96);
  });

  it("returns a Set with valid exercise IDs", () => {
    const allIds = new Set<string>();
    for (const branch of SKILL_TREE_8) {
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

  it("maps legacy IDs to pathway IDs", () => {
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
    ];

    const result = extractCompletedIds(sessions);
    expect(result.size).toBe(2);
    // Legacy IDs should be mapped to pathway IDs
    expect(result.has("HP7")).toBe(true); // decline-push-up → HP7
    expect(result.has("HPLL3")).toBe(true); // doorway-row → HPLL3
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
          { exerciseId: "HP4", sets: 1, repsCompleted: [] },
        ],
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
          { exerciseId: "HP4", sets: 3, repsCompleted: [10, 10, 10] },
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
          { exerciseId: "HP4", sets: 3, repsCompleted: [12, 12, 12] },
        ],
      },
    ];

    const result = extractCompletedIds(sessions);
    expect(result.size).toBe(1);
  });
});

describe("findNewUnlocks", () => {
  it("returns empty skill/class arrays when no new exercises are unlocked", () => {
    const oldCompleted = new Set<string>(["HP4"]);
    const newCompleted = new Set<string>(["HP4"]);

    const result = findNewUnlocks(oldCompleted, newCompleted);
    expect(result.skillUnlocks.length).toBe(0);
    expect(result.classUnlocks.length).toBe(0);
  });

  it("returns newly unlocked exercises within a pathway", () => {
    const oldCompleted = new Set<string>();
    const newCompleted = new Set<string>(["HP4"]); // Standard Push-up completed

    const result = findNewUnlocks(oldCompleted, newCompleted);

    // Should find newly unlocked HP exercises (excluding the one just completed)
    expect(result.skillUnlocks.length).toBeGreaterThan(0);

    // All skill unlocks should be from the HP pathway
    for (const unlock of result.skillUnlocks) {
      expect(unlock.family).toBe("push");
      expect(unlock.node.exercise.id).not.toBe("HP4");
    }

    // Verify metadata
    for (const unlock of result.skillUnlocks) {
      expect(unlock.branchLabel).toBeTruthy();
      expect(unlock.branchAccent).toMatch(/^#/);
      expect(unlock.branchIcon).toBeTruthy();
      expect(unlock.node.exercise.name).toBeTruthy();
    }
  });

  it("returns class unlocks when mastery conditions are met", () => {
    const oldMastered = new Set<string>();
    const newMastered = new Set<string>(["HP6", "VP6"]); // Tricep Armor requirements

    const result = findNewUnlocks(new Set(), new Set(), oldMastered, newMastered);

    // Should detect Tricep Armor class unlock
    expect(result.classUnlocks.length).toBeGreaterThan(0);
    expect(result.classUnlocks.some((c) => c.classDef.id === "tricep-armor")).toBe(true);
  });

  it("excludes the just-completed exercise from notifications", () => {
    const result = findNewUnlocks(new Set(), new Set(["HP4"]));
    const completedInUnlocks = result.skillUnlocks.some(
      (u) => u.node.exercise.id === "HP4",
    );
    expect(completedInUnlocks).toBe(false);
  });

  it("returns both skill and class unlock arrays", () => {
    const result = findNewUnlocks(new Set(), new Set());
    expect(Array.isArray(result.skillUnlocks)).toBe(true);
    expect(Array.isArray(result.classUnlocks)).toBe(true);
  });
});
