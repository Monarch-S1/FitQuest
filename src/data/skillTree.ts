import {
  Exercise,
  MovementCategory,
  DifficultyTier,
  workoutA,
  workoutB,
  workoutC,
  workoutD,
} from "./exercises";

export type { DifficultyTier } from "./exercises";

// ──────────────────────────────────────────────
// Skill Tree Data Model
// Organizes all 24 exercises into movement families
// with difficulty tiers and progression chains
// ──────────────────────────────────────────────

export type MovementFamily = "push" | "pull" | "legs" | "core";

export interface SkillNode {
  exercise: Exercise;
  difficulty: DifficultyTier;
  family: MovementFamily;
  /** Human-readable progression path from this exercise */
  progressionPath: string[];
  /** IDs of prerequisite exercises (must complete before this unlocks) */
  prerequisites: string[];
  /** Color accent for the family */
  accent: string;
}

export interface SkillBranch {
  family: MovementFamily;
  label: string;
  icon: string;
  description: string;
  accent: string;
  nodes: SkillNode[];
}

// ── Family config ──────────────────────────────

const FAMILY_CONFIG: Record<
  MovementFamily,
  { label: string; icon: string; description: string; accent: string }
> = {
  push: {
    label: "PUSH",
    icon: "⬆",
    description: "Horizontal & vertical pressing, elbow extension",
    accent: "#EF4444",
  },
  pull: {
    label: "PULL",
    icon: "⬇",
    description: "Horizontal & vertical pulling, elbow flexion",
    accent: "#3B82F6",
  },
  legs: {
    label: "LEGS",
    icon: "⬍",
    description: "Squatting, hinging, lunging & explosive power",
    accent: "#10B981",
  },
  core: {
    label: "CORE",
    icon: "◈",
    description: "Isometric holds, dynamic stability & scapular control",
    accent: "#F59E0B",
  },
};

// ── Category → Family mapping ──────────────────

function categoryToFamily(cat: MovementCategory): MovementFamily {
  if (
    cat === "horizontal_push" ||
    cat === "vertical_push" ||
    cat === "elbow_extension" ||
    cat === "horizontal_adduction"
  )
    return "push";
  if (
    cat === "horizontal_pull" ||
    cat === "vertical_pull" ||
    cat === "elbow_flexion" ||
    cat === "unilateral_horizontal_pull"
  )
    return "pull";
  if (
    cat === "unilateral_lower_push" ||
    cat === "closed_chain_lower_pull" ||
    cat === "lower_body_pull" ||
    cat === "lateral_mobility"
  )
    return "legs";
  if (cat === "core_isometric" || cat === "dynamic_core" || cat === "scapular_mobility")
    return "core";
  return "core"; // fallback
}

// ── Difficulty resolution: uses exercise.difficulty if set, falls back to heuristic ──

function resolveDifficulty(exercise: Exercise): DifficultyTier {
  if (exercise.difficulty) return exercise.difficulty;

  // Fallback heuristic for exercises without explicit difficulty
  const name = exercise.name.toLowerCase();
  const [low] = exercise.repRange;

  // Advanced moves
  if (
    name.includes("archer") ||
    name.includes("dragon flag") ||
    name.includes("l-sit") ||
    name.includes("pike")
  ) {
    return "advanced";
  }

  // Beginner-friendly indicators
  if (
    name.includes("dead bug") ||
    name.includes("prone") ||
    name.includes("glute bridge") ||
    name.includes("reverse plank") ||
    name.includes("hollow body") ||
    low <= 6
  ) {
    return "beginner";
  }

  // Intermediate
  return "intermediate";
}

// ── Parse progression pathway into steps ──────

function parsePathway(pathway: string): string[] {
  return pathway
    .split("→")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Build full skill tree ─────────────────────

const ALL_EXERCISES = [
  ...workoutA.exercises,
  ...workoutB.exercises,
  ...workoutC.exercises,
  ...workoutD.exercises,
];

export function buildSkillTree(): SkillBranch[] {
  const grouped: Record<MovementFamily, SkillNode[]> = {
    push: [],
    pull: [],
    legs: [],
    core: [],
  };

  // Prerequisite mapping: some exercises depend on easier versions
  const prereqMap: Record<string, string[]> = {
    "decline-pike-push-up": ["decline-push-up"],
    "archer-push-up-progression": ["decline-push-up"],
    "one-arm-towel-row": ["doorway-row"],
    "doorframe-pull-up-negative": ["table-row"],
    "dragon-flag-progression": ["hollow-body-hold"],
    "l-sit-progression": ["hollow-body-hold", "reverse-plank"],
    "single-leg-glute-bridge": ["glute-bridge-march"],
    "cossack-squat": ["bulgarian-split-squat"],
    "nordic-hamstring-curl": ["sliding-hamstring-curl"],
  };

  for (const exercise of ALL_EXERCISES) {
    const family = categoryToFamily(exercise.category);
    const difficulty = resolveDifficulty(exercise);

    grouped[family].push({
      exercise,
      difficulty,
      family,
      progressionPath: parsePathway(exercise.progressionPathway),
      prerequisites: prereqMap[exercise.id] || [],
      accent: FAMILY_CONFIG[family].accent,
    });
  }

  // Sort within each family: beginner → intermediate → advanced
  const tierOrder: Record<DifficultyTier, number> = {
    beginner: 0,
    intermediate: 1,
    advanced: 2,
  };

  for (const family of Object.keys(grouped) as MovementFamily[]) {
    grouped[family].sort((a, b) => tierOrder[a.difficulty] - tierOrder[b.difficulty]);
  }

  return (
    Object.entries(FAMILY_CONFIG) as [MovementFamily, (typeof FAMILY_CONFIG)[MovementFamily]][]
  ).map(([family, config]) => ({
    family,
    ...config,
    nodes: grouped[family],
  }));
}

export const SKILL_TREE = buildSkillTree();
