import { getWorkout96, getWorkouts96, getPathwayLevels } from "../data/workoutGenerator96";
import { getAllExercises96 } from "../data/exercises96";
import type { PathwayId } from "../data/pathways";

const DAY_PATHWAYS: [PathwayId, PathwayId, PathwayId, PathwayId][] = [
  ["hp", "vp", "aql", "ac"],
  ["hpll", "vpll", "hpl", "plc"],
  ["hp", "vp", "hpll", "vpll"],
  ["aql", "hpl", "ac", "plc"],
];

const DAY_NAMES = ["THE VANGUARD", "THE SHADOW", "THE TEMPEST", "THE COLOSSUS"];

type FitnessGoal = "general" | "strength" | "muscle_gain" | "endurance";

// ─── Simulation helpers ─────────────────────────

function simulateWorkoutCompletion(
  masteredIds: Set<string>,
  dayIndex: number,
  goal: FitnessGoal,
): Set<string> {
  const workout = getWorkout96(dayIndex, goal, masteredIds);
  if (!workout) return masteredIds;

  const pathways = DAY_PATHWAYS[dayIndex % DAY_PATHWAYS.length];
  const newMastered = new Set(masteredIds);

  for (let i = 0; i < pathways.length; i++) {
    const pw = pathways[i];
    const ex = workout.exercises[i];
    if (!ex) continue;

    const prefix = pw.toUpperCase();
    const currentLevel = getCurrentLevelForTest(pw, masteredIds);

    // Simulate hitting upper rep range → mastery
    const succeeded = Math.random() < 0.85;
    if (succeeded) {
      newMastered.add(`${prefix}${currentLevel}`);
    }
  }

  return newMastered;
}

function getCurrentLevelForTest(pathwayId: PathwayId, masteredIds: Set<string>): number {
  const prefix = pathwayId.toUpperCase();
  let highestMastered = 0;
  for (let l = 1; l <= 12; l++) {
    if (masteredIds.has(`${prefix}${l}`)) {
      highestMastered = l;
    }
  }
  return Math.min(highestMastered + 1, 12);
}

// ─── Tests ──────────────────────────────────────

describe("Progression Simulation — 12 weeks", () => {
  const goals: FitnessGoal[] = ["general", "strength", "muscle_gain", "endurance"];

  for (const goal of goals) {
    it(`simulates 12 weeks (48 workouts) with goal=${goal}`, () => {
      const masteredIds = new Set<string>();
      const allExercisesSeen = new Set<string>();
      const levelsRecorded: Record<string, number[]> = {};

      for (let week = 0; week < 12; week++) {
        for (let day = 0; day < 4; day++) {
          const dayIndex = (week * 4 + day) % 4;

          // Track level before workout
          const pathways = DAY_PATHWAYS[dayIndex];
          for (const pw of pathways) {
            const prefix = pw.toUpperCase();
            const level = getCurrentLevelForTest(pw, masteredIds);
            if (!levelsRecorded[prefix]) levelsRecorded[prefix] = [];
            levelsRecorded[prefix].push(level);
          }

          // Get workout
          const workout = getWorkout96(dayIndex, goal, masteredIds);
          expect(workout).not.toBeNull();
          if (!workout) continue;

          // Validate structure
          expect(workout.id).toBe(`workout-96-${dayIndex}`);
          expect(DAY_NAMES).toContain(workout.name);
          expect(workout.exercises.length).toBe(4);

          // Validate no duplicate exercises within a single workout
          const exIds = workout.exercises.map((e) => e.id);
          expect(new Set(exIds).size).toBe(exIds.length);

          // Track all exercises seen
          for (const ex of workout.exercises) {
            allExercisesSeen.add(ex.id);
          }

          // Validate exercise IDs match expected pathway prefixes
          for (let i = 0; i < pathways.length; i++) {
            const expectedPrefix = pathways[i].toUpperCase();
            expect(workout.exercises[i].id).toMatch(new RegExp(`^${expectedPrefix}\\d+$`));
          }

          // Validate goal transformation
          for (const ex of workout.exercises) {
            expect(ex.defaultSets).toBeGreaterThan(0);
            expect(ex.restInterval).toBeGreaterThan(0);
            expect(ex.repRange.length).toBe(2);
            expect(ex.repRange[0]).toBeLessThanOrEqual(ex.repRange[1]);
          }

          // Simulate completing the workout
          const updated = simulateWorkoutCompletion(masteredIds, dayIndex, goal);
          for (const id of updated) masteredIds.add(id);
        }
      }

      // ─── Assertions ────────────────────────

      // 1. All 8 pathways should have progressed beyond level 1
      for (const pw of ["HP", "VP", "HPLL", "VPLL", "AQL", "HPL", "AC", "PLC"] as const) {
        const levels = levelsRecorded[pw];
        expect(levels).toBeDefined();
        const maxLevel = Math.max(...levels);
        expect(maxLevel).toBeGreaterThan(1);
      }

      // 2. At least some exercises should reach higher levels (7+)
      const allLevels = Object.values(levelsRecorded).flat();
      const maxOverallLevel = Math.max(...allLevels);
      expect(maxOverallLevel).toBeGreaterThanOrEqual(7);

      // 3. Should have seen a good variety of exercises
      expect(allExercisesSeen.size).toBeGreaterThanOrEqual(30);

      // 4. Pathway levels should be monotonically non-decreasing per pathway
      for (const [pathway, levels] of Object.entries(levelsRecorded)) {
        for (let i = 1; i < levels.length; i++) {
          expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
        }
      }

      // 5. Final mastered count should show real progression
      expect(masteredIds.size).toBeGreaterThanOrEqual(20);
    });
  }

  it("validates 4 class archetypes have 0% overlap between opposite pairs", () => {
    for (const goal of goals) {
      masteredIds = new Set<string>();

      // Opposite pairs: VANGUARD(0) vs SHADOW(1), TEMPEST(2) vs COLOSSUS(3)
      // Each pair should share zero pathways
      const pair1Day0 = new Set(DAY_PATHWAYS[0]);
      const pair1Day1 = new Set(DAY_PATHWAYS[1]);
      const overlap1 = [...pair1Day0].filter((p) => pair1Day1.has(p));
      expect(overlap1.length).toBe(0);

      const pair2Day2 = new Set(DAY_PATHWAYS[2]);
      const pair2Day3 = new Set(DAY_PATHWAYS[3]);
      const overlap2 = [...pair2Day2].filter((p) => pair2Day3.has(p));
      expect(overlap2.length).toBe(0);

      // Adjacent days should share exactly 2 pathways (diagonal pairing)
      const adj0 = [...DAY_PATHWAYS[0]].filter((p) => new Set(DAY_PATHWAYS[2]).has(p));
      expect(adj0.length).toBe(2); // hp + vp shared between VANGUARD and TEMPEST

      const adj1 = [...DAY_PATHWAYS[1]].filter((p) => new Set(DAY_PATHWAYS[3]).has(p));
      expect(adj1.length).toBe(2); // hpl + plc shared between SHADOW and COLOSSUS
    }
  });

  it("wraps day index with modulo (99 -> 3 = COLOSSUS)", () => {
    const workout = getWorkout96(99, "general", new Set());
    expect(workout).not.toBeNull();
    expect(workout!.name).toBe("THE COLOSSUS");
    expect(workout!.id).toBe("workout-96-99");
  });

  it("getPathwayLevels returns correct structure", () => {
    const mastered = new Set(["HP1", "HP2", "VP1", "AQL1"]);
    const levels = getPathwayLevels(mastered);
    expect(levels.hp.level).toBe(3);
    expect(levels.vp.level).toBe(2);
    expect(levels.hpll.level).toBe(1);
  });

  it("exercises96 database has all expected exercises", () => {
    const all = getAllExercises96();
    expect(all.length).toBe(96);

    const byPathway: Record<string, number> = {};
    for (const ex of all) {
      byPathway[ex.pathwayId] = (byPathway[ex.pathwayId] || 0) + 1;
    }

    expect(byPathway["hp"]).toBe(12);
    expect(byPathway["vp"]).toBe(12);
    expect(byPathway["hpll"]).toBe(12);
    expect(byPathway["vpll"]).toBe(12);
    expect(byPathway["aql"]).toBe(12);
    expect(byPathway["hpl"]).toBe(12);
    expect(byPathway["ac"]).toBe(12);
    expect(byPathway["plc"]).toBe(12);
  });
});

let masteredIds = new Set<string>();

function getParentFamily(pathway: string): string {
  const map: Record<string, string> = {
    hp: "push",
    vp: "push",
    hpll: "pull",
    vpll: "pull",
    aql: "legs",
    hpl: "legs",
    ac: "core",
    plc: "core",
  };
  return map[pathway] || "unknown";
}
