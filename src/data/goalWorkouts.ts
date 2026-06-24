import { FitnessGoal, useUserStore } from "../stores/useUserStore";
import { Exercise, Tempo, WorkoutDay } from "./exercises";
import { getClassWorkout } from "./workoutClasses";

// ─── Goal-Specific Training Parameters ──────────────────────────────────────

interface GoalConfig {
  label: string;
  tagline: string;
  /** Multiplier for repRange endpoints (e.g., 0.5 = half the reps for strength) */
  repMultiplier: number;
  /** Multiplier for defaultSets */
  setsMultiplier: number;
  /** Multiplier for restInterval (seconds) */
  restMultiplier: number;
  /** Optional tempo override per goal */
  tempoOverride?: (original: Tempo) => Tempo;
}

export const GOAL_CONFIGS: Record<FitnessGoal, GoalConfig> = {
  strength: {
    label: "STRENGTH",
    tagline: "Low reps, heavy tension — build raw force production",
    repMultiplier: 0.55, // ~5 reps for an 8-15 exercise
    setsMultiplier: 1.33, // 4 sets instead of 3
    restMultiplier: 2.0, // 180s instead of 90s
    tempoOverride: (original) => {
      if (original === "isometric") return original;
      // Slow eccentric, explosive concentric
      return "4-1-1-0";
    },
  },
  muscle_gain: {
    label: "MUSCLE GAIN",
    tagline: "Moderate reps, controlled tension — maximize hypertrophy",
    repMultiplier: 0.85, // ~10 reps for an 8-15 exercise
    setsMultiplier: 1.15, // ~3.5 → 3-4 sets
    restMultiplier: 1.0, // 90s (keep original)
    tempoOverride: (original) => {
      if (original === "isometric") return original;
      // Controlled tempo for time under tension
      return "3-0-2-0";
    },
  },
  endurance: {
    label: "ENDURANCE",
    tagline: "High reps, minimal rest — build muscular stamina",
    repMultiplier: 1.6, // ~18 reps for an 8-15 exercise
    setsMultiplier: 0.75, // 2-3 sets
    restMultiplier: 0.5, // 45s instead of 90s
    tempoOverride: (original) => {
      if (original === "isometric") return original;
      // Faster tempo for rhythm
      return "2-0-1-0";
    },
  },
  general: {
    label: "GENERAL FITNESS",
    tagline: "Balanced approach — build overall capability",
    repMultiplier: 1.0,
    setsMultiplier: 1.0,
    restMultiplier: 1.0,
    // No tempo override — use original
  },
};

// ─── Exercise Transformation ────────────────────────────────────────────────

export function transformExercise96(exercise: Exercise, goal: FitnessGoal): Exercise {
  return transformExercise(exercise, goal);
}

function clampRepRange(low: number, high: number): [number, number] {
  const clampedLow = Math.max(1, Math.round(low));
  const clampedHigh = Math.max(clampedLow + 1, Math.round(high));
  return [clampedLow, clampedHigh];
}

function transformExercise(exercise: Exercise, goal: FitnessGoal): Exercise {
  const config = GOAL_CONFIGS[goal];

  if (goal === "general") {
    return applyUserPreset(exercise);
  }

  const [low, high] = exercise.repRange;
  const newRepRange = clampRepRange(low * config.repMultiplier, high * config.repMultiplier);

  if (exercise.tempo === "isometric") {
    const newLow = Math.max(5, Math.round(low * config.repMultiplier));
    const newHigh = Math.max(newLow + 5, Math.round(high * config.repMultiplier));
    return {
      ...exercise,
      repRange: [newLow, newHigh],
      defaultSets: Math.max(2, Math.round(exercise.defaultSets * config.setsMultiplier)),
      restInterval: Math.max(30, Math.round(exercise.restInterval * config.restMultiplier)),
    };
  }

  const newTempo = config.tempoOverride ? config.tempoOverride(exercise.tempo) : exercise.tempo;

  const postGoal = {
    ...exercise,
    repRange: newRepRange,
    defaultSets: Math.max(2, Math.round(exercise.defaultSets * config.setsMultiplier)),
    tempo: newTempo,
    restInterval: Math.max(30, Math.round(exercise.restInterval * config.restMultiplier)),
  };

  return applyUserPreset(postGoal);
}

/**
 * Override exercise parameters with a user's custom preset if one exists.
 * This runs after goal transformation so custom presets take highest priority.
 */
function applyUserPreset(exercise: Exercise): Exercise {
  const state = useUserStore.getState();
  const preset = state.exercisePresets?.[exercise.id];

  if (!preset) return exercise;

  return {
    ...exercise,
    defaultSets: preset.defaultSets,
    repRange: preset.repRange,
    tempo: preset.tempo,
    restInterval: preset.restInterval,
  };
}

// ─── Workut by ID (legacy → 96-generator fallback) ──────────────────────────

/**
 * Get a specific workout by ID, transformed for the user's fitness goal.
 * Tries the 96-exercise generator first, then falls back to Workout Classes.
 */
export function getWorkoutByIdForGoal(id: string, goal: FitnessGoal): WorkoutDay | undefined {
  // Try 96-exercise generator first
  const { getWorkout96ById } = require("./workoutGenerator96") as {
    getWorkout96ById: (
      id: string,
      goal: FitnessGoal,
      masteredIds: Set<string>,
    ) => WorkoutDay | undefined;
  };
  const masteredIds = new Set(useUserStore.getState().masteredExerciseIds ?? []);
  const generatedWorkout = getWorkout96ById(id, goal, masteredIds);
  if (generatedWorkout) return generatedWorkout;

  // Fall back to Workout Class (unlockable themed workout)
  const classWorkout = getClassWorkout(id);
  if (!classWorkout) return undefined;

  return {
    ...classWorkout,
    name: `${classWorkout.name} · ${GOAL_CONFIGS[goal].label}`,
    exercises: classWorkout.exercises.map((ex) => transformExercise(ex, goal)),
  };
}

/**
 * Get goal configuration info for display purposes.
 */
export function getGoalConfig(goal: FitnessGoal): GoalConfig {
  return GOAL_CONFIGS[goal];
}

/**
 * Get the training focus description for a workout under a specific goal.
 */
export function getGoalWorkoutDescription(goal: FitnessGoal): string {
  const configs: Record<FitnessGoal, string> = {
    strength:
      "Low reps (3-6), high sets (4-5), long rest (2-3 min). Explosive concentric, controlled eccentric. Focus on maximal force production.",
    muscle_gain:
      "Moderate reps (8-12), moderate sets (3-4), standard rest (90s). Controlled tempo for time under tension. Focus on mechanical tension.",
    endurance:
      "High reps (15-25), lower sets (2-3), short rest (30-45s). Fast, rhythmic tempo. Focus on muscular stamina and work capacity.",
    general:
      "Balanced rep ranges (8-15), moderate sets (3), standard rest (90s). Well-rounded approach for overall fitness.",
  };
  return configs[goal];
}
