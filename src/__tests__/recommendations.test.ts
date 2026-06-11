import { getRecommendation, getTrainingInsights } from "../utils/recommendations";
import { WorkoutSession } from "../stores/useUserStore";

describe("getRecommendation", () => {
  it("recommends Workout A for a new user", () => {
    const result = getRecommendation([], "optimal");
    expect(result.recommendedId).toBe("workout-a");
    expect(result.confidence).toBe("high");
  });

  it("rotates A→B→C→D sequentially", () => {
    const sessionA: WorkoutSession = {
      id: "1",
      workoutId: "workout-a",
      date: "2026-05-20",
      duration: 30,
      setsCompleted: 10,
      xpEarned: 250,
      exercises: [],
    };
    expect(getRecommendation([sessionA], "optimal").recommendedId).toBe("workout-b");

    const sessionB: WorkoutSession = {
      id: "2",
      workoutId: "workout-b",
      date: "2026-05-21",
      duration: 30,
      setsCompleted: 10,
      xpEarned: 250,
      exercises: [],
    };
    expect(getRecommendation([sessionA, sessionB], "optimal").recommendedId).toBe("workout-c");

    const sessionC: WorkoutSession = {
      id: "3",
      workoutId: "workout-c",
      date: "2026-05-22",
      duration: 30,
      setsCompleted: 10,
      xpEarned: 250,
      exercises: [],
    };
    expect(getRecommendation([sessionA, sessionB, sessionC], "optimal").recommendedId).toBe(
      "workout-d",
    );
  });

  it("wraps around from D back to A", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-22",
        duration: 30,
        setsCompleted: 10,
        xpEarned: 250,
        exercises: [],
      },
      {
        id: "2",
        workoutId: "workout-b",
        date: "2026-05-23",
        duration: 30,
        setsCompleted: 10,
        xpEarned: 250,
        exercises: [],
      },
      {
        id: "3",
        workoutId: "workout-c",
        date: "2026-05-24",
        duration: 30,
        setsCompleted: 10,
        xpEarned: 250,
        exercises: [],
      },
      {
        id: "4",
        workoutId: "workout-d",
        date: "2026-05-25",
        duration: 30,
        setsCompleted: 10,
        xpEarned: 250,
        exercises: [],
      },
    ];
    expect(getRecommendation(sessions, "optimal").recommendedId).toBe("workout-a");
  });

  it("recommends rest if already trained today", () => {
    const today = new Date().toISOString().split("T")[0];
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
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
      workoutId: "workout-a",
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
      workoutId: "workout-a",
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
      workoutId: "workout-a",
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
      workoutId: "workout-a",
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
      workoutId: "workout-a",
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
      workoutId: `workout-${["a", "b", "c", "d"][i % 4]}`,
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

  it("insights are sorted by priority descending", () => {
    const sessions: WorkoutSession[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      workoutId: `workout-${["a", "b", "c", "d"][i % 4]}`,
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
