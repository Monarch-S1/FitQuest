/**
 * ARCH 96-Exercise Progression Database
 *
 * 8 movement pathways × 12 levels = 96 exercises
 * Structured from Level 1 (Absolute Beginner) to Level 12 (Elite).
 *
 * Each pathway lives in its own file for maintainability.
 * This index centralises all exports.
 */

// ─── Re-export helpers ─────────────────────────────
export { Exercise96, M, CK, E } from "./helpers";

// ─── Import all pathway arrays ─────────────────────
import { HP } from "./hp";
import { VP } from "./vp";
import { HPLL } from "./hpll";
import { VPLL } from "./vpll";
import { AQL } from "./aql";
import { HPL } from "./hpl";
import { AC } from "./ac";
import { PLC } from "./plc";

import { type Exercise } from "../exercises";
import { PathwayId } from "../pathways";
import { Exercise96 } from "./helpers";

// ═══════════════════════════════════════════════════
// MASTER EXPORT — all 96 exercises
// ═══════════════════════════════════════════════════

export const ALL_EXERCISES_96: Exercise96[] = [
  ...HP, ...VP, ...HPLL, ...VPLL,
  ...AQL, ...HPL, ...AC, ...PLC,
];

/** Lookup an exercise by its pathway ID (e.g. "HP6") */
export function getExercise96ById(id: string): Exercise96 | undefined {
  return ALL_EXERCISES_96.find((e) => e.id === id);
}

/** Get all exercises in a specific pathway */
export function getExercisesByPathway(pathway: PathwayId): Exercise96[] {
  return ALL_EXERCISES_96.filter((e) => e.pathwayId === pathway);
}

/** Get all exercises by parent family */
export function getExercisesByParentFamily(family: "push" | "pull" | "legs" | "core"): Exercise96[] {
  const families: Record<string, PathwayId[]> = {
    push: ["hp", "vp"],
    pull: ["hpll", "vpll"],
    legs: ["aql", "hpl"],
    core: ["ac", "plc"],
  };
  const ids = families[family] ?? [];
  return ALL_EXERCISES_96.filter((e) => ids.includes(e.pathwayId));
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
