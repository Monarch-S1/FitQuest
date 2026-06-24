/**
 * FitQuest 96-Exercise Progression Database
 *
 * 8 movement pathways × 12 levels = 96 exercises
 * Structured from Level 1 (Absolute Beginner) to Level 12 (Elite).
 *
 * Each pathway lives in its own file for maintainability.
 * This index centralises all exports with **lazy loading** so
 * the 8 pathway files are NOT loaded on app startup — only
 * when exercise data is first accessed.
 */

// ─── Re-export helpers ─────────────────────────────
import { type Exercise96 } from "./helpers";
import { PathwayId } from "../pathways";

export { Exercise96, M, CK, E } from "./helpers";

// ═══════════════════════════════════════════════════
// LAZY LOADING — pathway files imported on first use
// ═══════════════════════════════════════════════════

let _allExercises: Exercise96[] | null = null;

/** Load and cache all 96 exercises on first call */
function loadAll(): Exercise96[] {
  if (_allExercises) return _allExercises;

  // Dynamic require() defers module loading until first access
  const { HP } = require("./hp") as { HP: Exercise96[] };
  const { VP } = require("./vp") as { VP: Exercise96[] };
  const { HPLL } = require("./hpll") as { HPLL: Exercise96[] };
  const { VPLL } = require("./vpll") as { VPLL: Exercise96[] };
  const { AQL } = require("./aql") as { AQL: Exercise96[] };
  const { HPL } = require("./hpl") as { HPL: Exercise96[] };
  const { AC } = require("./ac") as { AC: Exercise96[] };
  const { PLC } = require("./plc") as { PLC: Exercise96[] };

  _allExercises = [...HP, ...VP, ...HPLL, ...VPLL, ...AQL, ...HPL, ...AC, ...PLC];
  return _allExercises;
}

/** Get all 96 exercises (lazy-loaded on first call) */
export function getAllExercises96(): Exercise96[] {
  return loadAll();
}

/** Lookup an exercise by its pathway ID (e.g. "HP6") */
export function getExercise96ById(id: string): Exercise96 | undefined {
  return loadAll().find((e) => e.id === id);
}

/** Get all exercises in a specific pathway */
export function getExercisesByPathway(pathway: PathwayId): Exercise96[] {
  return loadAll().filter((e) => e.pathwayId === pathway);
}

/** Get all exercises by parent family */
export function getExercisesByParentFamily(
  family: "push" | "pull" | "legs" | "core",
): Exercise96[] {
  const families: Record<string, PathwayId[]> = {
    push: ["hp", "vp"],
    pull: ["hpll", "vpll"],
    legs: ["aql", "hpl"],
    core: ["ac", "plc"],
  };
  const ids = families[family] ?? [];
  return loadAll().filter((e) => ids.includes(e.pathwayId));
}

// ─── Legacy ID mappings ────────────────────────────

/** Legacy ID ↔ new pathway ID mapping */
export const LEGACY_TO_PATHWAY: Record<string, string> = {
  "bulgarian-split-squat": "AQL8",
  "doorway-row": "HPLL3",
  "decline-push-up": "HP7",
  "sliding-hamstring-curl": "HPL6",
  "floor-tricep-extension": "VP6",
  "hollow-body-hold": "AC5",
  "nordic-hamstring-curl": "HPL12",
  "decline-pike-push-up": "VP5",
  "one-arm-towel-row": "HPLL10",
  "prone-swimmers": "VPLL3",
  "sliding-chest-fly": "HP9",
  "dragon-flag-progression": "AC11",
  "doorframe-pull-up-negative": "VPLL10",
  "towel-bicep-curl": "supplementary",
  "glute-bridge-march": "HPL1",
  "reverse-plank": "PLC3",
  "table-row": "HPLL9",
  "dead-bug": "AC1",
  "jump-squat": "AQL6",
  "archer-push-up-progression": "HP10",
  "cossack-squat": "AQL5",
  "scapular-push-up": "PLC9",
  "single-leg-glute-bridge": "HPL2",
  "l-sit-progression": "PLC6",
};

/** Reverse mapping: new pathway ID → legacy ID */
export const PATHWAY_TO_LEGACY: Record<string, string> = Object.fromEntries(
  Object.entries(LEGACY_TO_PATHWAY).map(([k, v]) => [v, k]),
);
