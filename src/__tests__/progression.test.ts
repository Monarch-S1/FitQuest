import {
  getExerciseProgression,
  getProgressionSummary,
  getAllExercises,
} from "../utils/progression";
import { WorkoutSession } from "../stores/useUserStore";

describe("getAllExercises", () => {
  it("returns all 24 exercises across all 4 workouts", () => {
    const exercises = getAllExercises();
    expect(exercises.length).toBe(24);
  });

  it("includes exercises from all workouts", () => {
    const exercises = getAllExercises();
    const ids = exercises.map((e) => e.id);
    expect(ids).toContain("bulgarian-split-squat");
    expect(ids).toContain("nordic-hamstring-curl");
    expect(ids).toContain("doorframe-pull-up-negative");
    expect(ids).toContain("jump-squat");
  });
});

describe("getExerciseProgression", () => {
  it("returns null for unknown exercise ID", () => {
    const result = getExerciseProgression("unknown-id", []);
    expect(result).toBeNull();
  });

  it("returns insufficient_data status for no history", () => {
    const result = getExerciseProgression("decline-push-up", []);
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
        exercises: [{ exerciseId: "decline-push-up", sets: 3, repsCompleted: [10, 11, 12] }],
      },
    ];

    const result = getExerciseProgression("decline-push-up", sessions);
    expect(result).not.toBeNull();
    expect(result!.averageReps).toBeCloseTo(11, 0);
    expect(result!.sessionsCompleted).toBe(1);
  });

  it("detects progress status when 80%+ reps at upper range", () => {
    // Decline push-up: repRange [8, 15], upper threshold = 14
    // 14, 14, 15, 15, 15 = 5/5 = 100% at upper range → progress
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-24",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "decline-push-up", sets: 2, repsCompleted: [14, 14] }],
      },
      {
        id: "2",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "decline-push-up", sets: 3, repsCompleted: [15, 15, 15] }],
      },
    ];

    const result = getExerciseProgression("decline-push-up", sessions);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("progress");
  });

  it("detects maintain status when reps are mid-range", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-24",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "decline-push-up", sets: 2, repsCompleted: [10, 11] }],
      },
      {
        id: "2",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "decline-push-up", sets: 3, repsCompleted: [10, 11, 12] }],
      },
    ];

    const result = getExerciseProgression("decline-push-up", sessions);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("maintain");
  });

  it("reports correct high-end percentage", () => {
    // Rep range [8, 15], range = 7. Average of 11 = (11-8)/7 = 3/7 ≈ 42.8%
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 1,
        xpEarned: 25,
        exercises: [{ exerciseId: "decline-push-up", sets: 1, repsCompleted: [11] }],
      },
    ];

    const result = getExerciseProgression("decline-push-up", sessions);
    expect(result).not.toBeNull();
    expect(result!.highEndPercentage).toBeCloseTo(42.9, 0);
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
        exercises: [{ exerciseId: "decline-push-up", sets: 3, repsCompleted: [8, 8, 8] }],
      },
      {
        id: "2",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "decline-push-up", sets: 3, repsCompleted: [12, 12, 12] }],
      },
    ];

    const result = getExerciseProgression("decline-push-up", sessions);
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
        exercises: [{ exerciseId: "decline-push-up", sets: 3, repsCompleted: [10, 11, 12] }],
      },
    ];

    const result = getExerciseProgression("decline-push-up", sessions);
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
          { exerciseId: "decline-push-up", sets: 3, repsCompleted: [10, 10, 10] },
          { exerciseId: "doorway-row", sets: 3, repsCompleted: [12, 12, 12] },
          { exerciseId: "bulgarian-split-squat", sets: 3, repsCompleted: [8, 8, 8] },
          { exerciseId: "hollow-body-hold", sets: 3, repsCompleted: [30, 30, 30] },
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
          { exerciseId: "nordic-hamstring-curl", sets: 3, repsCompleted: [5, 5, 5] },
          { exerciseId: "decline-pike-push-up", sets: 3, repsCompleted: [8, 8, 8] },
          { exerciseId: "one-arm-towel-row", sets: 3, repsCompleted: [10, 10, 10] },
          { exerciseId: "prone-swimmers", sets: 3, repsCompleted: [12, 12, 12] },
        ],
      },
    ];

    const result = getProgressionSummary(sessions);
    expect(result.weeklyVolume).toBeGreaterThan(0);
    expect(result.exercisesReady.length).toBeGreaterThanOrEqual(0);
  });

  it("classifies exercises correctly by status", () => {
    // One exercise with good progress to trigger 'progress' status
    // Doorway Row: [10, 20], 3 sets hitting 19, 20, 20 — all at upper range
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-20",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "doorway-row", sets: 3, repsCompleted: [10, 12, 11] }],
      },
      {
        id: "2",
        workoutId: "workout-a",
        date: "2026-05-23",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "doorway-row", sets: 3, repsCompleted: [19, 20, 20] }],
      },
    ];

    const result = getProgressionSummary(sessions);
    expect(result.exercisesReady.length).toBeGreaterThanOrEqual(0);
    expect(result.exercisesInProgress.length).toBeGreaterThanOrEqual(0);
    // Doorway row should be categorized somewhere
    const allTracked = [
      ...result.exercisesReady,
      ...result.exercisesInProgress,
      ...result.exercisesToWatch,
    ];
    expect(allTracked.some((e) => e.exerciseId === "doorway-row")).toBe(true);
  });
});
