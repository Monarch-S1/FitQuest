/**
 * Custom Exercise Presets — FitQuest
 *
 * Allows users to override default exercise parameters (sets, reps, tempo, rest)
 * with their own custom values. Presets are stored per-exercise in useUserStore
 * and applied when loading workouts in preview and player screens.
 *
 * Priority order:
 * 1. Custom preset (user-saved) → highest priority
 * 2. Goal transformation (strength/hypertrophy/endurance)
 * 3. Exercise default (from the database)
 */

import { Exercise, Tempo } from "../data/exercises";
import type { ExercisePreset, FitnessGoal } from "../stores/useUserStore";
import { useUserStore } from "../stores/useUserStore";

// ─── Types ─────────────────────────────────────────

export interface EffectiveExerciseParams {
  defaultSets: number;
  repRange: [number, number];
  tempo: Tempo;
  restInterval: number;
}

// ─── Core Logic ────────────────────────────────────

/**
 * Get the effective exercise parameters, applying custom presets
 * on top of default values.
 *
 * Priority: preset → default
 * (Goal transformation is applied elsewhere in goalWorkouts.ts)
 */
export function getEffectiveExerciseParams(exercise: Exercise): EffectiveExerciseParams {
  const state = useUserStore.getState();
  const preset: ExercisePreset | undefined = state.exercisePresets?.[exercise.id];

  if (preset) {
    return {
      defaultSets: preset.defaultSets,
      repRange: preset.repRange,
      tempo: preset.tempo,
      restInterval: preset.restInterval,
    };
  }

  // No preset — return defaults
  return {
    defaultSets: exercise.defaultSets,
    repRange: exercise.repRange,
    tempo: exercise.tempo,
    restInterval: exercise.restInterval,
  };
}

/**
 * Create a new preset from current exercise parameters.
 * Called when user taps "SAVE PRESET" from the catalog.
 */
export function createPresetFromExercise(
  exercise: Exercise,
  overrides?: Partial<Omit<ExercisePreset, "exerciseId" | "createdAt" | "updatedAt">>,
): ExercisePreset {
  return {
    exerciseId: exercise.id,
    label: overrides?.label,
    defaultSets: overrides?.defaultSets ?? exercise.defaultSets,
    repRange: overrides?.repRange ?? exercise.repRange,
    tempo: overrides?.tempo ?? exercise.tempo,
    restInterval: overrides?.restInterval ?? exercise.restInterval,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Check if an exercise has a custom preset saved.
 */
export function hasPreset(exerciseId: string): boolean {
  const state = useUserStore.getState();
  return !!state.exercisePresets?.[exerciseId];
}

/**
 * Get a preset by exercise ID, or null.
 */
export function getPreset(exerciseId: string): ExercisePreset | null {
  const state = useUserStore.getState();
  return state.exercisePresets?.[exerciseId] ?? null;
}

/**
 * Get all presets as an array sorted by exercise name.
 */
export function getAllPresets(): ExercisePreset[] {
  const state = useUserStore.getState();
  return Object.values(state.exercisePresets ?? {}).sort((a, b) =>
    (a.label || a.exerciseId).localeCompare(b.label || b.exerciseId),
  );
}

/**
 * Get the count of saved presets.
 */
export function getPresetCount(): number {
  const state = useUserStore.getState();
  return Object.keys(state.exercisePresets ?? {}).length;
}
