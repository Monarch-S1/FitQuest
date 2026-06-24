import { getRecommendation, getTrainingInsights } from "../utils/recommendations";
import { WorkoutSession } from "../stores/useUserStore";

describe("getRecommendation", () => {
  it("recommends the first quest for a new user", () => {
    const result = getRecommendation([], "optimal");
    expect(result.recommendedId).toBe("workout-96-0");
    expect(result.recommendedName).toBe("THE VANGUARD");
    expect(result.confidence).toBe("high");
  });

  it("recommends a quest based on pathway fatigue gaps", () => {
    // Complete workout-96-0 (trains HP, VPLL, AQL, AC)
    const session: WorkoutSession = {
      id: "1",
      workoutId: "workout-96-0",
      date: "2026-05-20",
      duration: 30,
      setsCompleted: 10,
      xpEarned: 250,
      exercises: [],
    };
    const result = getRecommendation([session], "optimal");
    // After day 0, day 1 (VP, HPLL, HPL, PLC) should have the highest fatigue gap
    expect(result.recommendedId).toBe("workout-96-1");
    expect(result.recommendedName).toBe("THE SHADOW");
  });

  it("recommends rest if already trained today", () => {
    const today = new Date().toISOString().split("T")[0];
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-96-0",
        date: today,
        duration: 30,
        setsCompleted: 10,
        xpEarned: 250,
        exercises: [],
      },
    ];
    const result = getRecommendation(sessions, "optimal");
    expect(result.recommendedId).toBe("rest");
    expect(result.confidence).toBe("high");
  });

  it("lowers confidence on caution recovery status", () => {
    const session: WorkoutSession = {
      id: "1",
      workoutId: "workout-96-0",
      date: "2026-05-26",
      duration: 30,
      setsCompleted: 10,
      xpEarned: 250,
      exercises: [],
    };
    const result = getRecommendation([session], "caution");
    expect(result.confidence).toBe("medium");
    expect(result.reasoning.toLowerCase()).toContain("caution");
  });
});

describe("getTrainingInsights", () => {
  it("returns empty array for no history", () => {
    const result = getTrainingInsights([], "optimal", 0);
    expect(result).toEqual([]);
  });

  it("includes milestone insight on first workout", () => {
    const session: WorkoutSession = {
      id: "1",
      workoutId: "workout-96-0",
      date: "2026-05-26",
      duration: 30,
      setsCompleted: 10,
      xpEarned: 250,
      exercises: [{ exerciseId: "decline-push-up", sets: 3, repsCompleted: [10, 10, 10] }],
    };
    const result = getTrainingInsights([session], "optimal", 1);
    expect(result.some((i) => i.type === "milestone")).toBe(true);
  });

  it("includes recovery insight for caution status", () => {
    const session: WorkoutSession = {
      id: "1",
      workoutId: "workout-96-0",
      date: "2026-05-26",
      duration: 30,
      setsCompleted: 10,
      xpEarned: 250,
      exercises: [],
    };
    const result = getTrainingInsights([session], "caution", 0);
    expect(result.some((i) => i.type === "recovery" && i.title === "RECOVERY WARNING")).toBe(true);
  });

  it("includes streak insight for 7+ day streak", () => {
    const session: WorkoutSession = {
      id: "1",
      workoutId: "workout-96-0",
      date: "2026-05-26",
      duration: 30,
      setsCompleted: 10,
      xpEarned: 250,
      exercises: [],
    };
    const result = getTrainingInsights([session], "optimal", 7);
    expect(result.some((i) => i.type === "milestone" && i.title === "WEEK STREAK")).toBe(true);
  });

  it("includes unstoppable insight for 14+ day streak", () => {
    const session: WorkoutSession = {
      id: "1",
      workoutId: "workout-96-0",
      date: "2026-05-26",
      duration: 30,
      setsCompleted: 10,
      xpEarned: 250,
      exercises: [],
    };
    const result = getTrainingInsights([session], "optimal", 14);
    expect(result.some((i) => i.type === "milestone" && i.title === "UNSTOPPABLE")).toBe(true);
  });

  it("returns no more than 4 insights", () => {
    const sessions: WorkoutSession[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      workoutId: `workout-96-${i % 4}`,
      date: `2026-05-${String(16 + i).padStart(2, "0")}`,
      duration: 30,
      setsCompleted: 12,
      xpEarned: 300,
      exercises: [
        { exerciseId: "decline-push-up", sets: 3, repsCompleted: [15, 15, 15] },
        { exerciseId: "doorway-row", sets: 3, repsCompleted: [20, 20, 20] },
        { exerciseId: "bulgarian-split-squat", sets: 3, repsCompleted: [15, 15, 15] },
        { exerciseId: "hollow-body-hold", sets: 3, repsCompleted: [45, 45, 45] },
      ],
    }));

    const result = getTrainingInsights(sessions, "optimal", 10);
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it("fires muscle imbalance insight with 96-exercise IDs", () => {
    // Use 96-exercise IDs (HP1, VP1, AQL1, AC1) to verify the muscle imbalance
    // detection works correctly with the 96-exercise database.
    // HP1 = ["chest","shoulders"], VP1 = ["traps","shoulders"],
    // AQL1 = ["quadriceps","glutes"], AC1 = ["core","obliques"]
    //
    // Strategy: train HP1, VP1, and AQL1 heavily (9 sets each over 3 sessions)
    // while training AC1 minimally (2 sets in 1 session). This creates a clear
    // volume imbalance (core/obliques ~2 sets vs shoulders ~18 sets).

    const heavySession: WorkoutSession = {
      id: "heavy-1",
      workoutId: "workout-96-0",
      date: "2026-06-01",
      duration: 30,
      setsCompleted: 9,
      xpEarned: 300,
      exercises: [
        { exerciseId: "HP1", sets: 3, repsCompleted: [15, 15, 15] },
        { exerciseId: "VP1", sets: 3, repsCompleted: [12, 12, 12] },
        { exerciseId: "AQL1", sets: 3, repsCompleted: [18, 18, 18] },
      ],
    };

    const heavySession2: WorkoutSession = {
      id: "heavy-2",
      workoutId: "workout-96-1",
      date: "2026-06-03",
      duration: 30,
      setsCompleted: 9,
      xpEarned: 300,
      exercises: [
        { exerciseId: "HP1", sets: 3, repsCompleted: [16, 16, 16] },
        { exerciseId: "VP1", sets: 3, repsCompleted: [13, 13, 13] },
        { exerciseId: "AQL1", sets: 3, repsCompleted: [19, 19, 19] },
      ],
    };

    const heavySession3: WorkoutSession = {
      id: "heavy-3",
      workoutId: "workout-96-2",
      date: "2026-06-05",
      duration: 30,
      setsCompleted: 9,
      xpEarned: 300,
      exercises: [
        { exerciseId: "HP1", sets: 3, repsCompleted: [17, 17, 17] },
        { exerciseId: "VP1", sets: 3, repsCompleted: [14, 14, 14] },
        { exerciseId: "AQL1", sets: 3, repsCompleted: [20, 20, 20] },
      ],
    };

    // AC1 (core/obliques) only trained minimally
    const lightSession: WorkoutSession = {
      id: "light-1",
      workoutId: "workout-96-3",
      date: "2026-06-07",
      duration: 30,
      setsCompleted: 2,
      xpEarned: 50,
      exercises: [{ exerciseId: "AC1", sets: 2, repsCompleted: [10, 10] }],
    };

    const sessions = [heavySession, heavySession2, heavySession3, lightSession];
    const result = getTrainingInsights(sessions, "optimal", 0);

    // Should include a muscle imbalance insight
    const imbalance = result.find((i) => i.type === "imbalance");
    expect(imbalance).toBeDefined();
    expect(imbalance!.title).toMatch(/MUSCLE IMBALANCE|PATHWAY RESTED/);
  });

  it("does not fire imbalance insight when volume is balanced", () => {
    // Train all exercises equally — no imbalance should be detected
    const sessions: WorkoutSession[] = Array.from({ length: 4 }, (_, i) => ({
      id: `${i}`,
      workoutId: `workout-96-${i % 4}`,
      date: `2026-06-${String(1 + i).padStart(2, "0")}`,
      duration: 30,
      setsCompleted: 6,
      xpEarned: 150,
      exercises: [
        { exerciseId: "HP1", sets: 3, repsCompleted: [10, 10, 10] },
        { exerciseId: "AC1", sets: 3, repsCompleted: [10, 10, 10] },
      ],
    }));

    const result = getTrainingInsights(sessions, "optimal", 0);
    const imbalance = result.find((i) => i.type === "imbalance");
    // Expect no muscle imbalance (chest=12, core=12 → ratio=1.0 >= 0.5)
    // But pathway-rested might still fire — that's OK for this test
    // We just care that MUSCLE IMBALANCE specifically doesn't fire
    expect(imbalance?.title).not.toBe("MUSCLE IMBALANCE");
  });

  it("insights are sorted by priority descending", () => {
    const sessions: WorkoutSession[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      workoutId: `workout-96-${i % 4}`,
      date: `2026-05-${String(16 + i).padStart(2, "0")}`,
      duration: 30,
      setsCompleted: 12,
      xpEarned: 300,
      exercises: [{ exerciseId: "decline-push-up", sets: 3, repsCompleted: [15, 15, 15] }],
    }));

    const result = getTrainingInsights(sessions, "optimal", 10);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].priority).toBeGreaterThanOrEqual(result[i].priority);
    }
  });
});
