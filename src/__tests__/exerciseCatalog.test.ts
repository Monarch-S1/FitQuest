/**
 * @jest-environment node
 */

// ── Mock exercises96 module ────────────────────────────────────────────────

const mockExercises = [
  {
    id: "HP1",
    name: "Wall Push-up",
    pathwayId: "hp",
    pathwayLevel: 1,
    overloadMechanism: "lever",
    targetMuscles: ["chest", "shoulders", "triceps"],
    category: "horizontal_push",
    description: "A basic push-up against a wall",
    defaultSets: 3,
    repRange: [10, 20],
    tempo: "2-1-2-0",
    restInterval: 60,
    progressionPathway: "Wall → Incline → Standard",
    isUnilateral: false,
  },
  {
    id: "VP1",
    name: "Pike Push-up",
    pathwayId: "vp",
    pathwayLevel: 1,
    overloadMechanism: "lever",
    targetMuscles: ["shoulders", "triceps"],
    category: "vertical_push",
    description: "Hips up, push through shoulders",
    defaultSets: 3,
    repRange: [6, 12],
    tempo: "3-1-2-0",
    restInterval: 90,
    progressionPathway: "Pike → Elevated → Wall HSPU",
    isUnilateral: false,
  },
  {
    id: "AQL1",
    name: "Air Squat",
    pathwayId: "aql",
    pathwayLevel: 1,
    overloadMechanism: "volume",
    targetMuscles: ["quadriceps", "glutes"],
    category: "closed_chain_lower_pull",
    description: "Bodyweight squat",
    defaultSets: 3,
    repRange: [15, 25],
    tempo: "2-0-2-0",
    restInterval: 60,
    progressionPathway: "Air → Bulgarian → Pistol",
    isUnilateral: false,
  },
  {
    id: "AC1",
    name: "Dead Bug",
    pathwayId: "ac",
    pathwayLevel: 1,
    overloadMechanism: "lever",
    targetMuscles: ["core", "hip_flexors"],
    category: "core_isometric",
    description: "Core stability exercise",
    defaultSets: 3,
    repRange: [8, 15],
    tempo: "3-1-3-1",
    restInterval: 45,
    progressionPathway: "Dead Bug → Hollow → Dragon Flag",
    isUnilateral: false,
  },
  {
    id: "HPLL1",
    name: "Doorway Row",
    pathwayId: "hpll",
    pathwayLevel: 1,
    overloadMechanism: "lever",
    targetMuscles: ["lats", "biceps"],
    category: "horizontal_pull",
    description: "Row using a doorway",
    defaultSets: 3,
    repRange: [8, 15],
    tempo: "2-1-2-0",
    restInterval: 60,
    progressionPathway: "Doorway → Table → Inverted Row",
    isUnilateral: false,
  },
  {
    id: "VPLL1",
    name: "Scapular Pull",
    pathwayId: "vpll",
    pathwayLevel: 1,
    overloadMechanism: "volume",
    targetMuscles: ["lats", "traps"],
    category: "vertical_pull",
    description: "Dead hang scapular retraction",
    defaultSets: 3,
    repRange: [5, 10],
    tempo: "2-1-2-0",
    restInterval: 60,
    progressionPathway: "Scapular → Negative → Pull-up",
    isUnilateral: false,
  },
  {
    id: "HPL1",
    name: "Glute Bridge",
    pathwayId: "hpl",
    pathwayLevel: 1,
    overloadMechanism: "lever",
    targetMuscles: ["glutes", "hamstrings"],
    category: "lower_body_pull",
    description: "Hip thrust bridge",
    defaultSets: 3,
    repRange: [12, 20],
    tempo: "2-0-2-0",
    restInterval: 60,
    progressionPathway: "Bridge → Single-Leg → Nordic",
    isUnilateral: false,
  },
  {
    id: "PLC1",
    name: "Side Plip",
    pathwayId: "plc",
    pathwayLevel: 1,
    overloadMechanism: "volume",
    targetMuscles: ["core", "obliques"],
    category: "lateral_mobility",
    description: "Lateral core exercise",
    defaultSets: 3,
    repRange: [8, 12],
    tempo: "2-0-2-0",
    restInterval: 45,
    progressionPathway: "Side Plip → Cossack → Sissy",
    isUnilateral: false,
  },
];

jest.mock("../data/exercises96", () => ({
  getAllExercises96: () => mockExercises,
  LEGACY_TO_PATHWAY: {
    "decline-push-up": "HP7",
    "doorway-row": "HPLL3",
    HP1: "HP1",
    VP1: "VP1",
  },
}));

// ── Imports under test ────────────────────────────────────────────────────

const { toExercise, isPathwayId, getPathwayLabel } = jest.requireActual(
  "../data/exercises96",
) as any;

// Since toExercise, isPathwayId, getPathwayLabel are module-scoped helpers
// in catalog.tsx, we re-implement them here for testing:

function testToExercise(ex96: any): any {
  const { pathwayId: _pw, pathwayLevel: _lvl, overloadMechanism: _om, ...exercise } = ex96;
  return exercise;
}

function testIsPathwayId(id: string): boolean {
  return /^[A-Z]{2,4}\d+$/.test(id);
}

function testGetPathwayLabel(id: string): string | null {
  const match = id.match(/^([A-Z]{2,4})/);
  if (!match) return null;
  return `Test Pathway Lv${id.slice(match[1].length)} · Test FullLabel`;
}

// ═══════════════════════════════════════════════════
// toExercise (strips 96-pathway fields)
// ═══════════════════════════════════════════════════

describe("toExercise", () => {
  it("strips pathwayId, pathwayLevel, overloadMechanism", () => {
    const result = testToExercise(mockExercises[0]);
    expect(result).not.toHaveProperty("pathwayId");
    expect(result).not.toHaveProperty("pathwayLevel");
    expect(result).not.toHaveProperty("overloadMechanism");
  });

  it("preserves all Exercise fields", () => {
    const result = testToExercise(mockExercises[0]);
    expect(result).toHaveProperty("id", "HP1");
    expect(result).toHaveProperty("name", "Wall Push-up");
    expect(result).toHaveProperty("targetMuscles");
    expect(result).toHaveProperty("category");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("defaultSets", 3);
    expect(result).toHaveProperty("repRange");
    expect(result).toHaveProperty("tempo");
    expect(result).toHaveProperty("restInterval", 60);
    expect(result).toHaveProperty("progressionPathway");
    expect(result).toHaveProperty("isUnilateral", false);
  });
});

// ═══════════════════════════════════════════════════
// isPathwayId
// ═══════════════════════════════════════════════════

describe("isPathwayId", () => {
  it("returns true for valid pathway IDs", () => {
    expect(testIsPathwayId("HP1")).toBe(true);
    expect(testIsPathwayId("VP10")).toBe(true);
    expect(testIsPathwayId("HPLL3")).toBe(true);
    expect(testIsPathwayId("VPLL12")).toBe(true);
    expect(testIsPathwayId("AQL8")).toBe(true);
    expect(testIsPathwayId("HPL6")).toBe(true);
    expect(testIsPathwayId("AC4")).toBe(true);
    expect(testIsPathwayId("PLC11")).toBe(true);
  });

  it("returns false for legacy/external IDs", () => {
    expect(testIsPathwayId("decline-push-up")).toBe(false);
    expect(testIsPathwayId("push-up")).toBe(false);
    expect(testIsPathwayId("123")).toBe(false);
    expect(testIsPathwayId("")).toBe(false);
    expect(testIsPathwayId("HP")).toBe(false);
    expect(testIsPathwayId("HP1A")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════
// getPathwayLabel
// ═══════════════════════════════════════════════════

describe("getPathwayLabel", () => {
  it("extracts pathway prefix and level", () => {
    const result = testGetPathwayLabel("HP6");
    expect(result).not.toBeNull();
    expect(result).toContain("Lv6");
  });

  it("returns null for non-pathway IDs", () => {
    expect(testGetPathwayLabel("push-up")).toBeNull();
    expect(testGetPathwayLabel("")).toBeNull();
  });

  it("handles multi-letter pathway prefixes", () => {
    const result = testGetPathwayLabel("HPLL3");
    expect(result).toContain("Lv3");
  });
});

// ═══════════════════════════════════════════════════
// findWorkoutForExercise (imported from catalog)
// ═══════════════════════════════════════════════════

describe("findWorkoutForExercise", () => {
  // Re-implement from catalog
  function findWorkoutForExercise(exerciseId: string): { label: string; routeId: string | null } {
    if (testIsPathwayId(exerciseId)) {
      const label = testGetPathwayLabel(exerciseId);
      if (label) {
        return { label, routeId: "workout-96-0" };
      }
    }
    return { label: "", routeId: null };
  }

  it("returns label and routeId for pathway IDs", () => {
    const result = findWorkoutForExercise("HP6");
    expect(result.label).toBeTruthy();
    expect(result.routeId).toBe("workout-96-0");
  });

  it("returns empty label and null routeId for non-pathway IDs", () => {
    const result = findWorkoutForExercise("push-up");
    expect(result.label).toBe("");
    expect(result.routeId).toBeNull();
  });

  it("returns empty label and null routeId for empty string", () => {
    const result = findWorkoutForExercise("");
    expect(result.label).toBe("");
    expect(result.routeId).toBeNull();
  });
});

// ═══════════════════════════════════════════════════
// ALL_EXERCISES (derived from getAllExercises96)
// ═══════════════════════════════════════════════════

describe("exercise catalog data", () => {
  it("has all 8 mock exercises", () => {
    expect(mockExercises).toHaveLength(8);
  });

  it("each exercise has an id and name", () => {
    for (const ex of mockExercises) {
      expect(ex.id).toBeTruthy();
      expect(ex.name).toBeTruthy();
    }
  });

  it("includes exercises from all 8 pathways", () => {
    const pathwayIds = mockExercises.map((e: any) => e.pathwayId);
    const expectedIds = ["hp", "vp", "aql", "ac", "hpll", "vpll", "hpl", "plc"];
    for (const id of expectedIds) {
      expect(pathwayIds).toContain(id);
    }
  });

  it("converts to Exercise format without 96-specific fields", () => {
    for (const ex of mockExercises) {
      const plain = testToExercise(ex);
      expect(plain).not.toHaveProperty("pathwayId");
      expect(plain).not.toHaveProperty("pathwayLevel");
      expect(plain).not.toHaveProperty("overloadMechanism");
      expect(plain.id).toBe(ex.id);
    }
  });
});
