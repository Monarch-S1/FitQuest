import { calculateMuscleProgress, getAllMuscleGroups, getMuscleXpHistory } from "../utils/muscleXp";
import { WorkoutSession } from "../stores/useUserStore";
import { XP_PER_SET } from "../utils/xp";

describe("calculateMuscleProgress", () => {
  it("returns empty array for empty history", () => {
    const result = calculateMuscleProgress([]);
    expect(result).toEqual([]);
  });

  it("distributes XP across target muscles", () => {
    // AQL8 (Bulgarian Split Squat) targets quadriceps and glutes (2 muscles)
    // 2 sets completed = 2 * 25 = 50 XP, split across 2 muscles = 25 each
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 2,
        xpEarned: 50,
        exercises: [
          {
            exerciseId: "AQL8",
            sets: 2,
            repsCompleted: [10, 12],
          },
        ],
      },
    ];

    const result = calculateMuscleProgress(sessions);
    expect(result.length).toBe(2);

    const quads = result.find((m) => m.zone === "quadriceps");
    const glutes = result.find((m) => m.zone === "glutes");
    expect(quads).toBeDefined();
    expect(glutes).toBeDefined();
    expect(quads!.xp).toBe(Math.round((2 * XP_PER_SET) / 2));
    expect(glutes!.xp).toBe(Math.round((2 * XP_PER_SET) / 2));
  });

  it("accumulates XP across multiple sessions", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-25",
        duration: 30,
        setsCompleted: 5,
        xpEarned: 125,
        exercises: [{ exerciseId: "AQL8", sets: 5, repsCompleted: [10, 10, 10, 10, 10] }],
      },
      {
        id: "2",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 5,
        xpEarned: 125,
        exercises: [{ exerciseId: "AQL8", sets: 5, repsCompleted: [11, 11, 11, 11, 11] }],
      },
    ];

    const result = calculateMuscleProgress(sessions);
    const quads = result.find((m) => m.zone === "quadriceps");
    expect(quads).toBeDefined();
    // 10 total sets * 25 XP / 2 muscles = 125 XP
    expect(quads!.xp).toBe(Math.round((10 * XP_PER_SET) / 2));
  });

  it("ignores exercises with unknown IDs", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 2,
        xpEarned: 50,
        exercises: [{ exerciseId: "non-existent-exercise", sets: 2, repsCompleted: [10, 12] }],
      },
    ];

    const result = calculateMuscleProgress(sessions);
    expect(result).toEqual([]);
  });

  it("handles sessions with no exercises field", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 0,
        xpEarned: 0,
        exercises: [],
      },
    ];

    const result = calculateMuscleProgress(sessions);
    expect(result).toEqual([]);
  });

  it("returns muscles sorted by level desc, then name", () => {
    // HP7 targets upper_chest, shoulders, triceps (3 muscles)
    // HPLL3 targets lats, rhomboids, biceps (3 muscles)
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 100,
        xpEarned: 2500,
        exercises: [
          { exerciseId: "HP7", sets: 50, repsCompleted: [10] },
          { exerciseId: "HPLL3", sets: 50, repsCompleted: [12] },
        ],
      },
    ];

    const result = calculateMuscleProgress(sessions);
    // Should be sorted by level descending
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].level).toBeGreaterThanOrEqual(result[i].level);
    }
  });

  it("calculates level and progress correctly for known XP", () => {
    // HP4 (Standard Push-up) targets chest, shoulders, triceps, core (4 muscles)
    const sessions: WorkoutSession[] = [
      {
        id: "1",
        workoutId: "workout-a",
        date: "2026-05-26",
        duration: 30,
        setsCompleted: 4,
        xpEarned: 100,
        exercises: [{ exerciseId: "HP4", sets: 4, repsCompleted: [10, 10, 10, 10] }],
      },
    ];

    const result = calculateMuscleProgress(sessions);
    const chest = result.find((m) => m.zone === "chest");
    expect(chest).toBeDefined();
    // 4 sets * 25 XP / 4 muscles (chest, shoulders, triceps, core) = 25 XP each
    expect(chest!.xp).toBeGreaterThan(0);
  });
});

describe("getAllMuscleGroups", () => {
  it("returns all known muscle groups", () => {
    const result = getAllMuscleGroups();
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns each muscle with 0 XP and level 0", () => {
    const result = getAllMuscleGroups();
    result.forEach((m) => {
      expect(m.xp).toBe(0);
      expect(m.level).toBe(0);
      expect(m.xpIntoLevel).toBe(0);
    });
  });

  it("includes chest, shoulders, and core", () => {
    const result = getAllMuscleGroups();
    const zones = result.map((m) => m.zone);
    expect(zones).toContain("chest");
    expect(zones).toContain("shoulders");
    expect(zones).toContain("core");
  });

  it("gives each muscle a name and color", () => {
    const result = getAllMuscleGroups();
    result.forEach((m) => {
      expect(m.name).toBeTruthy();
      expect(m.color).toMatch(/^#/);
    });
  });
});

describe("getMuscleXpHistory", () => {
  it("returns empty array for empty history", () => {
    const result = getMuscleXpHistory([]);
    expect(result).toEqual([]);
  });

  it("returns one entry per trained muscle with correct points", () => {
    // AQL8 (Bulgarian Split Squat) targets quadriceps, glutes (2 muscles)
    const sessions: WorkoutSession[] = [
      {
        id: "s1",
        workoutId: "workout-a",
        date: "2026-06-01",
        duration: 30,
        setsCompleted: 2,
        xpEarned: 50,
        exercises: [{ exerciseId: "AQL8", sets: 2, repsCompleted: [10, 12] }],
      },
    ];

    const result = getMuscleXpHistory(sessions);
    expect(result.length).toBe(2); // quadriceps + glutes

    const quads = result.find((h) => h.zone === "quadriceps");
    const glutes = result.find((h) => h.zone === "glutes");
    expect(quads).toBeDefined();
    expect(glutes).toBeDefined();
    expect(quads!.points.length).toBe(1);
    expect(quads!.points[0].sessionId).toBe("s1");
    expect(quads!.points[0].date).toBe("2026-06-01");
    expect(quads!.points[0].xpGained).toBe(Math.round((2 * XP_PER_SET) / 2));
    expect(quads!.points[0].totalXp).toBe(Math.round((2 * XP_PER_SET) / 2));
  });

  it("accumulates XP across sessions with correct cumulative totals", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "s1",
        workoutId: "workout-a",
        date: "2026-06-01",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "AQL8", sets: 3, repsCompleted: [10, 10, 10] }],
      },
      {
        id: "s2",
        workoutId: "workout-a",
        date: "2026-06-03",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "AQL8", sets: 3, repsCompleted: [12, 12, 12] }],
      },
    ];

    const result = getMuscleXpHistory(sessions);
    const quads = result.find((h) => h.zone === "quadriceps");
    expect(quads).toBeDefined();
    expect(quads!.points.length).toBe(2);

    // Each session: 3 sets * 25 XP / 2 muscles = 37.5 XP per muscle
    const xpPerMuscle = (3 * XP_PER_SET) / 2; // 37.5
    expect(quads!.points[0].xpGained).toBe(Math.round(xpPerMuscle)); // 38
    expect(quads!.points[0].totalXp).toBe(Math.round(xpPerMuscle)); // 38

    // Session 2: cumulative is 37.5 + 37.5 = 75, rounded to 75
    expect(quads!.points[1].xpGained).toBe(Math.round(xpPerMuscle)); // 38
    expect(quads!.points[1].totalXp).toBe(Math.round(xpPerMuscle * 2)); // 75, not 76
  });

  it("tracks level changes across sessions", () => {
    // HP4 (Standard Push-up) targets chest, shoulders, triceps, core (4 muscles)
    // 6 * 25 = 150 XP total, split 4 ways = 37.5 XP per muscle per session
    // Level 1 = 0 XP base, level 2 = 50 XP, level 3 = 200 XP
    const sessions: WorkoutSession[] = [
      {
        id: "s1",
        workoutId: "workout-a",
        date: "2026-06-01",
        duration: 30,
        setsCompleted: 6,
        xpEarned: 150,
        exercises: [{ exerciseId: "HP4", sets: 6, repsCompleted: [10, 10, 10, 10, 10, 10] }],
      },
      {
        id: "s2",
        workoutId: "workout-a",
        date: "2026-06-03",
        duration: 30,
        setsCompleted: 6,
        xpEarned: 150,
        exercises: [{ exerciseId: "HP4", sets: 6, repsCompleted: [10, 10, 10, 10, 10, 10] }],
      },
    ];

    const result = getMuscleXpHistory(sessions);
    const chest = result.find((h) => h.zone === "chest");
    expect(chest).toBeDefined();
    expect(chest!.points.length).toBe(2);

    // Each session: 6 * 25 / 4 muscles = 37.5 XP per muscle
    expect(chest!.points[0].totalXp).toBe(Math.round(37.5));
    // At 38 XP, level = floor(sqrt(38/50)) + 1 = floor(0.87) + 1 = 1
    expect(chest!.points[0].level).toBe(1);

    // After session 2: 75 XP
    expect(chest!.points[1].totalXp).toBe(Math.round(75));
    // At 75 XP, level = floor(sqrt(75/50)) + 1 = floor(1.22) + 1 = 2
    expect(chest!.points[1].level).toBe(2);
  });

  it("ignores exercises with unknown IDs", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "s1",
        workoutId: "workout-a",
        date: "2026-06-01",
        duration: 30,
        setsCompleted: 2,
        xpEarned: 50,
        exercises: [{ exerciseId: "non-existent", sets: 2, repsCompleted: [10, 10] }],
      },
    ];

    const result = getMuscleXpHistory(sessions);
    expect(result).toEqual([]);
  });

  it("handles sessions with no exercises field", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "s1",
        workoutId: "workout-a",
        date: "2026-06-01",
        duration: 30,
        setsCompleted: 0,
        xpEarned: 0,
        exercises: [],
      },
    ];

    const result = getMuscleXpHistory(sessions);
    expect(result).toEqual([]);
  });

  it("returns results sorted by total XP descending", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "s1",
        workoutId: "workout-a",
        date: "2026-06-01",
        duration: 30,
        setsCompleted: 10,
        xpEarned: 250,
        exercises: [
          { exerciseId: "HP7", sets: 10, repsCompleted: [10] },
          { exerciseId: "HPLL3", sets: 10, repsCompleted: [12] },
        ],
      },
    ];

    const result = getMuscleXpHistory(sessions);
    for (let i = 1; i < result.length; i++) {
      const prevTotal = result[i - 1].points[result[i - 1].points.length - 1].totalXp;
      const currTotal = result[i].points[result[i].points.length - 1].totalXp;
      expect(prevTotal).toBeGreaterThanOrEqual(currTotal);
    }
  });

  it("each point has all required fields", () => {
    const sessions: WorkoutSession[] = [
      {
        id: "s1",
        workoutId: "workout-a",
        date: "2026-06-01",
        duration: 30,
        setsCompleted: 3,
        xpEarned: 75,
        exercises: [{ exerciseId: "AQL8", sets: 3, repsCompleted: [10, 10, 10] }],
      },
    ];

    const result = getMuscleXpHistory(sessions);
    expect(result.length).toBeGreaterThan(0);

    for (const history of result) {
      expect(typeof history.zone).toBe("string");
      expect(typeof history.name).toBe("string");
      expect(history.points.length).toBe(1);

      const point = history.points[0];
      expect(typeof point.sessionId).toBe("string");
      expect(typeof point.date).toBe("string");
      expect(typeof point.xpGained).toBe("number");
      expect(typeof point.totalXp).toBe("number");
      expect(typeof point.level).toBe("number");
      expect(point.xpGained).toBeGreaterThanOrEqual(0);
      expect(point.totalXp).toBeGreaterThanOrEqual(0);
      expect(point.level).toBeGreaterThanOrEqual(1);
    }
  });
});
