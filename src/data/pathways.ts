/**
 * 8-Branch Movement Pathway Configuration
 *
 * Maps the 96-exercise progression database into structured
 * movement families with level-to-difficulty mapping.
 *
 * Each pathway has 12 levels (1-12) that map to difficulty tiers:
 *   Levels 1-3:  Beginner
 *   Levels 4-6:  Intermediate
 *   Levels 7-9:  Advanced
 *   Levels 10-12: Elite
 */

import type { DifficultyTier } from "./exercises";

// ─── Pathway ID type ─────────────────────────────────────────

export type PathwayId = "hp" | "vp" | "hpll" | "vpll" | "aql" | "hpl" | "ac" | "plc";

// ─── Parent family (maps to the old 4-family system) ─────────

export type ParentFamily = "push" | "pull" | "legs" | "core";

// ─── Pathway level difficulty mapping ─────────────────────────

export function levelToDifficulty(level: number): DifficultyTier {
  if (level <= 3) return "beginner";
  if (level <= 6) return "intermediate";
  if (level <= 9) return "advanced";
  return "advanced"; // elite maps to advanced for UI consistency
}

export function levelToTierLabel(level: number): string {
  if (level <= 3) return "BEGINNER";
  if (level <= 6) return "INTERMEDIATE";
  if (level <= 9) return "ADVANCED";
  return "ELITE";
}

// ─── Pathway configuration ───────────────────────────────────

export interface PathwayConfig {
  id: PathwayId;
  label: string;
  fullLabel: string;
  icon: string;
  description: string;
  accent: string;
  parentFamily: ParentFamily;
  primaryTargets: string[];
  overloadPrinciples: string[];
  minLevel: number; // always 1
  maxLevel: number; // always 12
  exerciseCount: number; // always 12
}

export const PATHWAYS: Record<PathwayId, PathwayConfig> = {
  hp: {
    id: "hp",
    label: "HP",
    fullLabel: "Horizontal Push",
    icon: "⬆",
    description: "Horizontal pressing — pectorals, anterior deltoids, triceps",
    accent: "#EF4444", // red
    parentFamily: "push",
    primaryTargets: ["Pectorals", "Anterior Deltoids", "Triceps"],
    overloadPrinciples: [
      "Decrease incline angle",
      "Reduce contact points",
      "Increase lever length",
    ],
    minLevel: 1,
    maxLevel: 12,
    exerciseCount: 12,
  },
  vp: {
    id: "vp",
    label: "VP",
    fullLabel: "Vertical / Overhead Push",
    icon: "⬆",
    description: "Overhead pressing — deltoids, triceps, upper chest",
    accent: "#F97316", // orange
    parentFamily: "push",
    primaryTargets: ["Deltoids", "Triceps", "Upper Chest"],
    overloadPrinciples: [
      "Increase foot elevation",
      "Decrease wall assistance",
      "Reduce balance support",
    ],
    minLevel: 1,
    maxLevel: 12,
    exerciseCount: 12,
  },
  hpll: {
    id: "hpll",
    label: "HPLL",
    fullLabel: "Horizontal Pull",
    icon: "⬇",
    description: "Horizontal pulling — mid-back, rhomboids, lats, biceps",
    accent: "#3B82F6", // blue
    parentFamily: "pull",
    primaryTargets: ["Rhomboids", "Lats", "Biceps", "Mid Traps"],
    overloadPrinciples: ["Decrease body angle", "Unilateral loading", "Increase lever length"],
    minLevel: 1,
    maxLevel: 12,
    exerciseCount: 12,
  },
  vpll: {
    id: "vpll",
    label: "VPLL",
    fullLabel: "Vertical Pull / Pullover",
    icon: "⬇",
    description: "Vertical pulling — lats, teres major, biceps, grip",
    accent: "#8B5CF6", // violet
    parentFamily: "pull",
    primaryTargets: ["Latissimus Dorsi", "Teres Major", "Biceps"],
    overloadPrinciples: ["Increase sliding friction", "Unilateral drag", "Increase hang time"],
    minLevel: 1,
    maxLevel: 12,
    exerciseCount: 12,
  },
  aql: {
    id: "aql",
    label: "AQL",
    fullLabel: "Anterior Chain Legs",
    icon: "⬍",
    description: "Quad-dominant — quadriceps, glutes, calves",
    accent: "#10B981", // green
    parentFamily: "legs",
    primaryTargets: ["Quadriceps", "Gluteus Maximus", "Calves"],
    overloadPrinciples: ["Increase depth", "Unilateral loading", "Front foot elevation"],
    minLevel: 1,
    maxLevel: 12,
    exerciseCount: 12,
  },
  hpl: {
    id: "hpl",
    label: "HPL",
    fullLabel: "Posterior Chain Legs",
    icon: "⬍",
    description: "Hip-dominant — hamstrings, glutes, lower back",
    accent: "#059669", // emerald
    parentFamily: "legs",
    primaryTargets: ["Hamstrings", "Glutes", "Erector Spinae"],
    overloadPrinciples: [
      "Unilateral hinging",
      "Increase eccentric duration",
      "Decrease floor friction",
    ],
    minLevel: 1,
    maxLevel: 12,
    exerciseCount: 12,
  },
  ac: {
    id: "ac",
    label: "AC",
    fullLabel: "Anterior Core",
    icon: "◈",
    description: "Spinal flexion & anti-extension — rectus abdominis, psoas, obliques",
    accent: "#F59E0B", // amber
    parentFamily: "core",
    primaryTargets: ["Rectus Abdominis", "Iliopsoas", "Obliques"],
    overloadPrinciples: [
      "Increase lever length",
      "Reduce contact points",
      "Increase eccentric duration",
    ],
    minLevel: 1,
    maxLevel: 12,
    exerciseCount: 12,
  },
  plc: {
    id: "plc",
    label: "PLC",
    fullLabel: "Posterior & Lateral Core",
    icon: "◈",
    description:
      "Spinal extension & lateral stability — erector spinae, obliques, deep stabilizers",
    accent: "#D97706", // amber-dark
    parentFamily: "core",
    primaryTargets: ["Erector Spinae", "Obliques", "Transverse Abdominis", "Glutes"],
    overloadPrinciples: ["Increase lever length", "Dynamic movement", "Reduce base of support"],
    minLevel: 1,
    maxLevel: 12,
    exerciseCount: 12,
  },
};

export const PATHWAY_LIST = Object.values(PATHWAYS);

/** Parent family grouping for the Skill Tree filter tabs */
export const PARENT_FAMILIES: ParentFamily[] = ["push", "pull", "legs", "core"];

export function getPathwayByParent(parent: ParentFamily): PathwayConfig[] {
  return PATHWAY_LIST.filter((p) => p.parentFamily === parent);
}

export function getPathwayById(id: PathwayId): PathwayConfig {
  return PATHWAYS[id];
}
