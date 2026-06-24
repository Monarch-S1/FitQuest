/**
 * FitQuest 96-Exercise Database — Shared Helpers
 *
 * Types and helper functions used across all 8 pathway files.
 */

import { Exercise, Tempo, MuscleGroup, MovementCategory, FormCheckpoint } from "../exercises";
import { PathwayId } from "../pathways";

// ─── Extended exercise type ────────────────────────

export interface Exercise96 extends Exercise {
  pathwayId: PathwayId;
  pathwayLevel: number; // 1-12
  overloadMechanism: string;
}

// ─── Shortcut helpers ──────────────────────────────

export const M = (ids: MuscleGroup[]): MuscleGroup[] => ids;

export function CK(
  setup: [string, string],
  exec: [string, string],
  safety: [string, string],
): FormCheckpoint[] {
  return [
    { phase: "SETUP", instruction: setup[0], focusPoint: setup[1] },
    { phase: "EXECUTION", instruction: exec[0], focusPoint: exec[1] },
    { phase: "SAFETY", instruction: safety[0], focusPoint: safety[1] },
  ];
}

export function E(
  id: string,
  name: string,
  pw: PathwayId,
  lv: number,
  target: MuscleGroup[],
  cat: MovementCategory,
  desc: string,
  sets: number = 3,
  reps: [number, number] = [8, 15],
  tempo: Tempo = "3-1-2-0",
  rest: number = 90,
  overload: string = "",
  unilateral: boolean = false,
  notes?: string,
  checkpoints?: FormCheckpoint[],
): Exercise96 {
  const tiers: Record<number, "beginner" | "intermediate" | "advanced"> = {
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
  return {
    id,
    name,
    pathwayId: pw,
    pathwayLevel: lv,
    targetMuscles: target,
    category: cat,
    difficulty: tiers[lv] ?? "beginner",
    description: desc,
    defaultSets: sets,
    repRange: reps,
    tempo,
    restInterval: rest,
    progressionPathway: `${tiers[lv]?.toUpperCase() ?? "BEGINNER"} → Next level`,
    biomechanicalNotes: notes,
    isUnilateral: unilateral,
    overloadMechanism: overload || desc,
    ...(checkpoints ? { visualGuide: { checkpoints, visuals: [] } } : {}),
  };
}
