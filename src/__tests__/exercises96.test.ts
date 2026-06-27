/**
 * @jest-environment node
 *
 * FitQuest 96-Exercise Database Integrity Tests
 *
 * Verifies all 8 pathways × 12 levels load correctly with valid data.
 * These tests catch structural issues early (typos, missing fields,
 * broken IDs, invalid ranges, etc.).
 */

import {
  getAllExercises96,
  getExercise96ById,
  getExercisesByPathway,
  getExercisesByParentFamily,
  LEGACY_TO_PATHWAY,
  PATHWAY_TO_LEGACY,
} from "../data/exercises96";
import { PathwayId } from "../data/pathways";

// ─── Constants ────────────────────────────────────

const PATHWAYS: PathwayId[] = ["hp", "vp", "hpll", "vpll", "aql", "hpl", "ac", "plc"];
const EXPECTED_TOTAL = 96;
const EXPECTED_PER_PATHWAY = 12;
const DIFFICULTY_MAP: Record<number, string> = {
  1: "beginner",
  2: "beginner",
  3: "beginner",
  4: "intermediate",
  5: "intermediate",
  6: "intermediate",
  7: "advanced",
  8: "advanced",
  9: "advanced",
  10: "advanced",
  11: "advanced",
  12: "advanced",
};

// Pathway prefix → expected ID prefix
const PATHWAY_PREFIX: Record<PathwayId, string> = {
  hp: "HP",
  vp: "VP",
  hpll: "HPLL",
  vpll: "VPLL",
  aql: "AQL",
  hpl: "HPL",
  ac: "AC",
  plc: "PLC",
};

// Families and their expected counts
const FAMILIES: Record<string, { pathways: PathwayId[]; count: number }> = {
  push: { pathways: ["hp", "vp"], count: 24 },
  pull: { pathways: ["hpll", "vpll"], count: 24 },
  legs: { pathways: ["aql", "hpl"], count: 24 },
  core: { pathways: ["ac", "plc"], count: 24 },
};

// ─── Helpers ──────────────────────────────────────

const allExercises = getAllExercises96();

// ═══════════════════════════════════════════════════
// Count & Load Integrity
// ═══════════════════════════════════════════════════

describe("load integrity", () => {
  it("loads exactly 96 exercises", () => {
    expect(allExercises.length).toBe(EXPECTED_TOTAL);
  });

  it("every exercise has a unique ID", () => {
    const ids = allExercises.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("every exercise loads with all required fields", () => {
    for (const ex of allExercises) {
      expect(ex.id).toBeTruthy();
      expect(ex.name).toBeTruthy();
      expect(ex.pathwayId).toBeTruthy();
      expect(typeof ex.pathwayLevel).toBe("number");
      expect(ex.description).toBeTruthy();
      expect(ex.targetMuscles.length).toBeGreaterThan(0);
      expect(ex.defaultSets).toBeGreaterThan(0);
      expect(ex.repRange.length).toBe(2);
      expect(ex.restInterval).toBeGreaterThanOrEqual(0);
      expect(ex.tempo).toBeTruthy();
      expect(ex.category).toBeTruthy();
      expect(ex.difficulty).toBeTruthy();
      expect(ex.overloadMechanism).toBeTruthy();
    }
  });

  it("no exercise has a null or undefined name", () => {
    const unnamed = allExercises.filter((e) => !e.name);
    expect(unnamed).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════
// Pathway Distribution
// ═══════════════════════════════════════════════════

describe("pathway distribution", () => {
  it.each(PATHWAYS)("pathway %s has exactly 12 exercises", (pathway) => {
    const exercises = getExercisesByPathway(pathway);
    expect(exercises.length).toBe(EXPECTED_PER_PATHWAY);
  });

  it("all pathway IDs are valid (no typos)", () => {
    const pathwayIds = new Set(allExercises.map((e) => e.pathwayId));
    for (const pw of PATHWAYS) {
      expect(pathwayIds.has(pw)).toBe(true);
    }
    // No extra pathways
    for (const pw of pathwayIds) {
      expect(PATHWAYS.includes(pw as PathwayId)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════
// Level Sequence
// ═══════════════════════════════════════════════════

describe("level sequence", () => {
  it.each(PATHWAYS)("pathway %s contains sequential levels 1 through 12", (pathway) => {
    const exercises = getExercisesByPathway(pathway);
    const levels = exercises.map((e) => e.pathwayLevel).sort((a, b) => a - b);
    expect(levels).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("no level 0 or negative levels exist", () => {
    const invalid = allExercises.filter((e) => e.pathwayLevel < 1 || e.pathwayLevel > 12);
    expect(invalid).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════
// ID Format Consistency
// ═══════════════════════════════════════════════════

describe("ID format consistency", () => {
  it.each(PATHWAYS)("pathway %s IDs follow the pattern (e.g. HP1, HP2…)", (pathway) => {
    const prefix = PATHWAY_PREFIX[pathway];
    const exercises = getExercisesByPathway(pathway);
    for (const ex of exercises) {
      expect(ex.id.startsWith(prefix)).toBe(true);
      // ID = prefix + level
      expect(ex.id).toBe(`${prefix}${ex.pathwayLevel}`);
    }
  });

  it("no exercises have mismatched pathwayId from their ID prefix", () => {
    // Sort by prefix length descending so longer prefixes (e.g. "HPLL") are
    // checked before shorter ones (e.g. "HP") to avoid false matches.
    const sortedPathways = [...PATHWAYS].sort(
      (a, b) => PATHWAY_PREFIX[b].length - PATHWAY_PREFIX[a].length,
    );
    for (const ex of allExercises) {
      const expectedPathway = sortedPathways.find((pw) => ex.id.startsWith(PATHWAY_PREFIX[pw]));
      expect(expectedPathway).toBeTruthy();
      expect(ex.pathwayId).toBe(expectedPathway);
    }
  });
});

// ═══════════════════════════════════════════════════
// Difficulty Tier Mapping
// ═══════════════════════════════════════════════════

describe("difficulty tier mapping", () => {
  it.each(allExercises)("$id (level $pathwayLevel) has correct difficulty tier", (ex) => {
    expect(ex.difficulty).toBe(DIFFICULTY_MAP[ex.pathwayLevel] ?? "beginner");
  });
});

// ═══════════════════════════════════════════════════
// Valid Rep Ranges
// ═══════════════════════════════════════════════════

describe("rep range validity", () => {
  it("all exercises have low < high in repRange", () => {
    for (const ex of allExercises) {
      expect(ex.repRange[0]).toBeLessThan(ex.repRange[1]);
    }
  });

  it("all exercises have positive rep ranges", () => {
    for (const ex of allExercises) {
      expect(ex.repRange[0]).toBeGreaterThanOrEqual(1);
    }
  });
});

// ═══════════════════════════════════════════════════
// Tempo Validation
// ═══════════════════════════════════════════════════

describe("tempo validation", () => {
  it("all tempos are either isometric or valid X-X-X-X format", () => {
    const tempoRegex = /^\d+-\d+-\d+-\d+$/;
    for (const ex of allExercises) {
      if (ex.tempo === "isometric") continue;
      expect(tempoRegex.test(ex.tempo)).toBe(true);
    }
  });

  it("isometric exercises have reasonable hold durations", () => {
    const isometric = allExercises.filter((e) => e.tempo === "isometric");
    for (const ex of isometric) {
      // Isometric holds should be in seconds, not reps
      expect(ex.repRange[0]).toBeGreaterThanOrEqual(10);
      expect(ex.repRange[1]).toBeLessThanOrEqual(90);
    }
  });
});

// ═══════════════════════════════════════════════════
// Unilateral Flag
// ═══════════════════════════════════════════════════

describe("unilateral flag", () => {
  it("only a subset of exercises are marked unilateral", () => {
    const unilateral = allExercises.filter((e) => e.isUnilateral);
    // Some exercises should be unilateral, but not all
    expect(unilateral.length).toBeGreaterThan(0);
    expect(unilateral.length).toBeLessThan(allExercises.length);
  });

  it("no unilateral exercise has 0 or negative sets", () => {
    const unilateral = allExercises.filter((e) => e.isUnilateral);
    for (const ex of unilateral) {
      expect(ex.defaultSets).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════
// Lookup Functions
// ═══════════════════════════════════════════════════

describe("lookup by ID", () => {
  it("getExercise96ById returns the correct exercise for a known ID", () => {
    const ex = getExercise96ById("HP4");
    expect(ex).toBeDefined();
    expect(ex!.id).toBe("HP4");
    expect(ex!.name).toBe("Standard Push-up");
  });

  it("getExercise96ById returns undefined for an unknown ID", () => {
    expect(getExercise96ById("NONEXISTENT")).toBeUndefined();
  });

  it("every exercise can be looked up by its own ID", () => {
    for (const ex of allExercises) {
      const lookup = getExercise96ById(ex.id);
      expect(lookup).toBeDefined();
      expect(lookup!.id).toBe(ex.id);
      expect(lookup!.name).toBe(ex.name);
    }
  });
});

describe("lookup by pathway", () => {
  it("getExercisesByPathway returns empty array for unknown pathway", () => {
    const unknown = getExercisesByPathway("unknown" as PathwayId);
    expect(unknown).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════
// Family Grouping
// ═══════════════════════════════════════════════════

describe("family grouping", () => {
  it.each(["push", "pull", "legs", "core"] as const)(
    "%s family has exactly 24 exercises",
    (family) => {
      const exercises = getExercisesByParentFamily(family);
      expect(exercises.length).toBe(FAMILIES[family].count);
    },
  );

  it("exercises in a family include both constituent pathways", () => {
    const pushExercises = getExercisesByParentFamily("push");
    const pushPathwayIds = new Set(pushExercises.map((e) => e.pathwayId));
    expect(pushPathwayIds.has("hp")).toBe(true);
    expect(pushPathwayIds.has("vp")).toBe(true);
  });

  it("unknown family returns empty array", () => {
    const unknown = getExercisesByParentFamily("unknown" as any);
    expect(unknown).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════
// Legacy ID Mapping
// ═══════════════════════════════════════════════════

describe("legacy ID mapping", () => {
  it("all LEGACY_TO_PATHWAY values are valid exercise IDs", () => {
    for (const [, pathwayId] of Object.entries(LEGACY_TO_PATHWAY)) {
      if (pathwayId === "supplementary") continue; // not part of 96 system
      const ex = getExercise96ById(pathwayId);
      expect(ex).toBeDefined();
    }
  });

  it("PATHWAY_TO_LEGACY is the exact inverse of LEGACY_TO_PATHWAY", () => {
    for (const [legacy, pathway] of Object.entries(LEGACY_TO_PATHWAY)) {
      expect(PATHWAY_TO_LEGACY[pathway]).toBe(legacy);
    }
  });

  it("all pathway-level exercises referenced by legacy mappings exist", () => {
    const referencedIds = Object.values(LEGACY_TO_PATHWAY).filter((id) => id !== "supplementary");
    for (const id of referencedIds) {
      const ex = getExercise96ById(id);
      expect(ex).toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════════════
// Caching Invariant
// ═══════════════════════════════════════════════════

describe("caching invariant", () => {
  it("calling getAllExercises96 twice returns the same array reference", () => {
    const first = getAllExercises96();
    const second = getAllExercises96();
    // Should be the same cached array
    expect(first).toBe(second);
  });
});

// ═══════════════════════════════════════════════════
// Edge Cases: Level Boundaries
// ═══════════════════════════════════════════════════

describe("level boundaries", () => {
  it("level 1 exercises exist in every pathway", () => {
    for (const pw of PATHWAYS) {
      const ex = getExercise96ById(`${PATHWAY_PREFIX[pw]}1`);
      expect(ex).toBeDefined();
      expect(ex!.pathwayLevel).toBe(1);
    }
  });

  it("level 12 exercises exist in every pathway", () => {
    for (const pw of PATHWAYS) {
      const ex = getExercise96ById(`${PATHWAY_PREFIX[pw]}12`);
      expect(ex).toBeDefined();
      expect(ex!.pathwayLevel).toBe(12);
    }
  });

  it("level 0 or 13+ IDs do not exist", () => {
    for (const pw of PATHWAYS) {
      expect(getExercise96ById(`${PATHWAY_PREFIX[pw]}0`)).toBeUndefined();
      expect(getExercise96ById(`${PATHWAY_PREFIX[pw]}13`)).toBeUndefined();
    }
  });
});
