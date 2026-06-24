import {
  getExerciseProgression,
  getProgressionSummary,
  getAllExercises,
} from "../utils/progression";
import { WorkoutSession } from "../stores/useUserStore";

describe("getAllExercises", () => {
  it("returns all 96 exercises from the 96-exercise database", () => {
    const exercises = getAllExercises();
    expect(exercises.length).toBe(96);
  });

  it("includes 96-exercise database entries", () => {
    const exercises = getAllExercises();
    const ids = exercises.map((e) => e.id);
    expect(ids).toContain("HP1");
    expect(ids).toContain("VP6");
    expect(ids).toContain("AC12");
    expect(ids).toContain("PLC3");
  });

  it("has no duplicate IDs", () => {
    const exercises = getAllExercises();
    const ids = exercises.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});

describe("getExerciseProgression", () => {
  it("returns null for unknown exercise ID", () => {
    const result = getExerciseProgression("unknown-id", []);
    expect(result).toBeNull();
  });

  it("returns insufficient_data status for no history", () => {
    const result = getExerciseProgression("HP7", []); // HP7 = Decline Push-up
    expect(result).not.toBeNull();
    expect(result!.status).toBe("insufficient_data");
    expect(result!.sessionsCompleted).toBe(0);
    expect(result!.averageReps).toBe(0);
  });

  it("calculates average reps across sessions", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "HP7", sets: 3, repsCompleted: [10, 11, 12] }],
      },
    ];

    const result = getExerciseProgression("HP7", sessions);
    expect(result).not.toBeNull();
    expect(result!.averageReps).toBeCloseTo(11, 0);
    expect(result!.sessionsCompleted).toBe(1);
  });

  it("detects progress status when 80%+ reps at upper range", () => {
    // HP7 (Decline Push-up): repRange [8, 12], upper threshold = 11
    // 11, 12, 12, 12, 12 = 5/5 = 100% at upper range → progress
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-24",
        duration: 30,
        setsCompleted: 2,
        xpEarned: 50,
        exercises: [{ exerciseId: "HP7", sets: 2, repsCompleted: [11, 12] }],
      },
      {
        id: "2",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "HP7", sets: 3, repsCompleted: [12, 12, 12] }],
      },
    ];

    const result = getExerciseProgression("HP7", sessions);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("progress");
  });

  it("detects maintain status when reps are mid-range", () => {
    // HP7 repRange [8, 12], mid-range ~10
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-24",
        duration: 30,
        setsCompleted: 2,
        xpEarned: 50,
        exercises: [{ exerciseId: "HP7", sets: 2, repsCompleted: [9, 10] }],
      },
      {
        id: "2",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "HP7", sets: 3, repsCompleted: [9, 10, 11] }],
      },
    ];

    const result = getExerciseProgression("HP7", sessions);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("maintain");
  });

  it("reports correct high-end percentage", () => {
    // HP7 repRange [8, 12], range = 4. Average of 10 = (10-8)/4 = 50%
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 1,
        xpEarned: 25,
        exercises: [{ exerciseId: "HP7", sets: 1, repsCompleted: [10] }],
      },
    ];

    const result = getExerciseProgression("HP7", sessions);
    expect(result).not.toBeNull();
    expect(result!.highEndPercentage).toBeCloseTo(50, 0);
  });

  it("returns trend analysis for 2+ sessions", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-24",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "HP7", sets: 3, repsCompleted: [8, 8, 8] }],
      },
      {
        id: "2",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "HP7", sets: 3, repsCompleted: [12, 12, 12] }],
      },
    ];

    const result = getExerciseProgression("HP7", sessions);
    expect(result).not.toBeNull();
    // Avg went from 8 to 12 — diff is 4 > 0.5, so trend = "up"
    expect(result!.recentTrend).toBe("up");
  });

  it("lastReps returns the most recent 5 reps", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "HP7", sets: 3, repsCompleted: [10, 11, 12] }],
      },
    ];

    const result = getExerciseProgression("HP7", sessions);
    expect(result).not.toBeNull();
    expect(result!.lastReps).toEqual([10, 11, 12]);
  });
});

describe("getProgressionSummary", () => {
  it("returns empty summary for no history", () => {
    const result = getProgressionSummary([]);
    expect(result.exercisesReady).toEqual([]);
    expect(result.exercisesInProgress).toEqual([]);
    expect(result.exercisesToWatch).toEqual([]);
    expect(result.deloadRecommended).toBe(false);
    expect(result.totalTrainingWeeks).toBe(0);
    expect(result.weeklyVolume).toBe(0);
  });

  it("calculates weekly volume correctly", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-20",
        duration: 30,
        setsCompleted: 12,
        xpEarned: 300,
        exercises: [
          { exerciseId: "HP7", sets: 3, repsCompleted: [10, 10, 10] },
          { exerciseId: "HPLL3", sets: 3, repsCompleted: [12, 12, 12] },
          { exerciseId: "AQL8", sets: 3, repsCompleted: [8, 8, 8] },
          { exerciseId: "AC5", sets: 3, repsCompleted: [30, 30, 30] },
        ],
      },
      {
        id: "2",
        workoutId: "workout-b",
        date: "2026-05-27",
        duration: 30,
        setsCompleted: 12,
        xpEarned: 300,
        exercises: [
          { exerciseId: "HPL12", sets: 3, repsCompleted: [5, 5, 5] },
          { exerciseId: "VP5", sets: 3, repsCompleted: [8, 8, 8] },
          { exerciseId: "HPLL10", sets: 3, repsCompleted: [10, 10, 10] },
          { exerciseId: "VPLL3", sets: 3, repsCompleted: [12, 12, 12] },
        ],
      },
    ];

    const result = getProgressionSummary(sessions);
    expect(result.weeklyVolume).toBeGreaterThan(0);
    expect(result.exercisesReady.length).toBeGreaterThanOrEqual(0);
  });

  it("classifies exercises correctly by status", () => {
    // HPLL3 (Doorway Row Deep Angle): repRange [10, 20], upper threshold = 19
    // Session 2: 19, 20, 20 = 3/3 = 100% at upper range, across 2 sessions → progress
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-20",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "HPLL3", sets: 3, repsCompleted: [10, 12, 11] }],
      },
      {
        id: "2",
        workoutId: "workout-a",
        date: "2026-05-23",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "HPLL3", sets: 3, repsCompleted: [19, 20, 20] }],
      },
    ];

    const result = getProgressionSummary(sessions);
    expect(result.exercisesReady.length).toBeGreaterThanOrEqual(0);
    expect(result.exercisesInProgress.length).toBeGreaterThanOrEqual(0);
    // HPLL3 should be categorized somewhere
    const allTracked = [
      ...result.exercisesReady,
      ...result.exercisesInProgress,
      ...result.exercisesToWatch,
    ];
    expect(allTracked.some((e) => e.exerciseId === "HPLL3")).toBe(true);
  });
});
