/**
 * Skill Tree Data Model — 8-Branch Version
 *
 * Organizes all 96 exercises into 8 movement pathways
 * (HP, VP, HPLL, VPLL, AQL, HPL, AC, PLC) with
 * node states: LOCKED → UNLOCKED → ACTIVE → MASTERED
 *
 * The tree is built LAZILY on first access (via getSkillTree8())
 * to avoid freezing the app at module import time.
 */

import type { DifficultyTier } from "./exercises";
import { getAllExercises96, Exercise96, LEGACY_TO_PATHWAY } from "./exercises96";
import { PATHWAYS, PathwayId, PATHWAY_LIST, levelToDifficulty } from "./pathways";

export type { DifficultyTier };

// ─── Node state (RPG progression) ──────────────

export type NodeState = "locked" | "unlocked" | "active" | "mastered";

// ─── Skill node ─────────────────────────────────

export interface SkillNode {
  exercise: Exercise96;
  pathwayId: PathwayId;
  pathwayLevel: number; // 1-12
  difficulty: DifficultyTier;
  family: string; // parent family: "push" | "pull" | "legs" | "core"
  progressionPath: string[];
  /** Cross-pathway prerequisites (e.g., AC5 before HP8) */
  prerequisites: string[];
  /** Hard prerequisites that must be mastered, not just completed */
  hardPrerequisites: string[];
  accent: string;
  /** Default state before any user data is applied */
  defaultState: NodeState;
}

// ─── Skill branch (one pathway) ────────────────

export interface SkillBranch {
  id: PathwayId;
  label: string;
  icon: string;
  description: string;
  accent: string;
  parentFamily: string;
  nodes: SkillNode[];
}

// ─── Build 8-branch skill tree (lazy) ──────────
// The tree and all 8 pathway files are loaded on FIRST call
// to getSkillTree8(), not at module import time.

let _cachedTree: SkillBranch[] | null = null;

function buildEightBranchTree(): SkillBranch[] {
  const groups: Record<PathwayId, SkillNode[]> = {
    hp: [],
    vp: [],
    hpll: [],
    vpll: [],
    aql: [],
    hpl: [],
    ac: [],
    plc: [],
  };

  // Cross-pathway hard prerequisites (must be mastered to unlock)
  const hardPrereqs: Record<string, string[]> = {
    HP10: ["HP8"], // Archer needs Pseudo-Planche
    VP10: ["VP7", "AC5"], // Back-to-Wall HSPU needs Handstand Hold + Hollow Body
    VP11: ["VP10"], // Chest-to-Wall needs Back-to-Wall
    VP12: ["VP11"], // Freestanding needs Chest-to-Wall
    AC12: ["AC11"], // Full Dragon Flag needs Straight-Leg negative
    HPLL10: ["HPLL8"], // One-arm towel row needs double-arm towel row
    VPLL11: ["VPLL10"], // Strict pull-up needs negative
    VPLL12: ["VPLL11"], // L-sit pull-up needs strict pull-up
    AQL12: ["AQL9"], // Pistol squat needs assisted pistol
    HPL12: ["HPL11"], // Unassisted Nordic needs assisted
  };

  for (const exercise of getAllExercises96()) {
    const pathway = PATHWAYS[exercise.pathwayId];
    const level = exercise.pathwayLevel;
    const difficulty = levelToDifficulty(level);

    groups[exercise.pathwayId].push({
      exercise,
      pathwayId: exercise.pathwayId,
      pathwayLevel: level,
      difficulty,
      family: pathway.parentFamily,
      progressionPath: [`Level ${level} → Level ${Math.min(level + 1, 12)}`],
      prerequisites: [],
      hardPrerequisites: hardPrereqs[exercise.id] ?? [],
      accent: pathway.accent,
      defaultState: level <= 1 ? "unlocked" : "locked",
    });
  }

  // Sort each pathway by level
  for (const id of Object.keys(groups) as PathwayId[]) {
    groups[id].sort((a, b) => a.pathwayLevel - b.pathwayLevel);
  }

  return PATHWAY_LIST.map((config) => ({
    id: config.id,
    label: config.label,
    icon: config.icon,
    description: config.description,
    accent: config.accent,
    parentFamily: config.parentFamily,
    nodes: groups[config.id],
  }));
}

/** Build and cache the full 8-branch skill tree (idempotent, lazy). */
export function getSkillTree8(): SkillBranch[] {
  if (!_cachedTree) {
    _cachedTree = buildEightBranchTree();
  }
  return _cachedTree;
}

// ─── Legacy compatibility ──────────────────────

/** @deprecated Use getSkillTree8() instead. Kept for test compatibility. */
export const SKILL_TREE_8: SkillBranch[] = new Proxy<SkillBranch[]>(
  {} as unknown as SkillBranch[],
  {
    get(_, prop: string | symbol) {
      const tree = getSkillTree8();
      const value = (tree as any)[prop];
      return typeof value === "function" ? value.bind(tree) : value;
    },
    has(_, prop) {
      return prop in getSkillTree8();
    },
    ownKeys() {
      return Reflect.ownKeys(getSkillTree8());
    },
    getOwnPropertyDescriptor(_, prop) {
      return Object.getOwnPropertyDescriptor(getSkillTree8(), prop);
    },
  },
);

/** @deprecated Use getSkillTree8() instead. */
export const SKILL_TREE = SKILL_TREE_8;

/** Map a legacy exercise ID to its SkillNode in the new tree */
export function findNodeByLegacyId(legacyId: string): SkillNode | undefined {
  const pathwayId = LEGACY_TO_PATHWAY[legacyId];
  if (!pathwayId || pathwayId === "supplementary") return undefined;
  for (const branch of getSkillTree8()) {
    const found = branch.nodes.find((n) => n.exercise.id === pathwayId);
    if (found) return found;
  }
  return undefined;
}

/** Map a pathway exercise ID (e.g. "HP6") to its node */
export function findNodeById(id: string): SkillNode | undefined {
  for (const branch of getSkillTree8()) {
    const found = branch.nodes.find((n) => n.exercise.id === id);
    if (found) return found;
  }
  return undefined;
}

// ─── Node state computation ────────────────────

/**
 * Compute the state of every node in the tree based on:
 * - completedIds: exercises that have been done at least once
 * - masteredIds: exercises that have met the upper rep range target
 */
export function computeNodeStates(
  completedIds: Set<string>,
  masteredIds: Set<string>,
): Map<string, NodeState> {
  const states = new Map<string, NodeState>();
  const tree = getSkillTree8();

  for (const branch of tree) {
    for (const node of branch.nodes) {
      const id = node.exercise.id;
      const masterId = id; // use pathway ID (e.g. "HP6")

      if (masteredIds.has(masterId)) {
        states.set(id, "mastered");
      } else if (completedIds.has(masterId)) {
        states.set(id, "active");
      } else {
        states.set(id, "locked");
      }
    }
  }

  // Auto-unlock: Level 1 of every pathway is always unlocked
  for (const branch of tree) {
    const firstNode = branch.nodes[0];
    if (firstNode && states.get(firstNode.exercise.id) === "locked") {
      states.set(firstNode.exercise.id, "unlocked");
    }
  }

  // Pathway-level unlock: show exercises one level ahead of the user's
  // current max completed level in each pathway. This prevents the entire
  // tree from being visible too early.
  for (const branch of tree) {
    let maxCompletedOrMasteredLevel = 0;
    for (const node of branch.nodes) {
      const id = node.exercise.id;
      if (completedIds.has(id) || masteredIds.has(id)) {
        maxCompletedOrMasteredLevel = Math.max(maxCompletedOrMasteredLevel, node.pathwayLevel);
      }
    }
    // Show nodes up to maxCompletedOrMasteredLevel + 1 (preview next exercise)
    const unlockThreshold = maxCompletedOrMasteredLevel + 1;
    for (const node of branch.nodes) {
      if (node.pathwayLevel <= unlockThreshold && states.get(node.exercise.id) === "locked") {
        states.set(node.exercise.id, "unlocked");
      }
    }
  }

  // Cross-pathway hard prerequisites: if a node requires mastering
  // certain exercises, check those and unlock the node
  for (const branch of tree) {
    for (const node of branch.nodes) {
      if (states.get(node.exercise.id) !== "locked") continue;
      if (node.hardPrerequisites.length === 0) continue;

      const allMet = node.hardPrerequisites.every(
        (prereqId) => masteredIds.has(prereqId) || states.get(prereqId) === "mastered",
      );
      if (allMet) {
        states.set(node.exercise.id, "unlocked");
      }
    }
  }

  return states;
}
