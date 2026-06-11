import { create } from "zustand";
import { Exercise, Tempo } from "../data/exercises";

export type WorkoutPhase = "idle" | "exercise" | "rest" | "completed";

interface ExerciseProgress {
  exerciseId: string;
  currentSet: number;
  totalSets: number;
  repsCompleted: number[];
  isComplete: boolean;
  /** Whether this exercise is unilateral (each set must be done per side) */
  isUnilateral: boolean;
  /** Current side being performed: "left" | "right" for unilateral exercises */
  currentSide: "left" | "right";
}

export interface TempoPhase {
  label: string;
  duration: number;
  color: string;
}

export function parseTempo(tempo: Tempo | "isometric"): TempoPhase[] {
  if (tempo === "isometric") {
    return [{ label: "HOLD", duration: 0, color: "#F59E0B" }];
  }
  const [eccentric, pause1, concentric, pause2] = tempo.split("-").map(Number);
  return [
    { label: "LOWER", duration: eccentric, color: "#EF4444" },
    { label: "PAUSE", duration: pause1, color: "#F59E0B" },
    { label: "PRESS", duration: concentric, color: "#10B981" },
    { label: "SQUEEZE", duration: pause2, color: "#F59E0B" },
  ];
}

interface WorkoutState {
  phase: WorkoutPhase;
  currentExerciseIndex: number;
  currentExercise: Exercise | null;
  exercises: Exercise[]; // full exercise list for lookups
  exerciseProgress: ExerciseProgress[];
  phaseTimer: number;
  restTimer: number;
  workoutStartTime: number | null;
  totalDuration: number;

  // Persisted UI state (survives screen re-renders)
  currentRepInput: number;

  // Actions
  startWorkout: (exercises: Exercise[]) => void;
  completeSet: (reps: number) => void;
  navigateToExercise: (index: number) => void;
  startRest: () => void;
  tickTimer: () => void;
  completeWorkout: () => { totalSets: number; totalDuration: number; allComplete: boolean };
  setCurrentRepInput: (reps: number) => void;
  reset: () => void;
}

const initialState = {
  phase: "idle" as WorkoutPhase,
  currentExerciseIndex: 0,
  currentExercise: null as Exercise | null,
  exercises: [] as Exercise[],
  exerciseProgress: [],
  phaseTimer: 0,
  restTimer: 0,
  workoutStartTime: null,
  totalDuration: 0,
  currentRepInput: 8,
};

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  ...initialState,

  startWorkout: (exercises) => {
    const progress = exercises.map((ex) => ({
      exerciseId: ex.id,
      currentSet: 0,
      totalSets: ex.isUnilateral ? ex.defaultSets * 2 : ex.defaultSets,
      repsCompleted: [],
      isComplete: false,
      isUnilateral: !!ex.isUnilateral,
      currentSide: "left" as const,
    }));
    set({
      phase: "exercise",
      currentExerciseIndex: 0,
      currentExercise: exercises[0],
      exercises,
      exerciseProgress: progress,
      workoutStartTime: Date.now(),
      phaseTimer: 0,
    });

    // Initialize rep input to midpoint of first exercise's range
    if (exercises.length > 0) {
      const mid = Math.round((exercises[0].repRange[0] + exercises[0].repRange[1]) / 2);
      set({ currentRepInput: mid });
    }
  },

  completeSet: (reps) => {
    const state = get();
    const progress = [...state.exerciseProgress];
    const current = progress[state.currentExerciseIndex];

    // For unilateral exercises, alternate sides: left first, then right
    if (current.isUnilateral && current.currentSide === "left") {
      // Left side done — switch to right side, count as completed set
      const newSetNumber = current.currentSet + 1;
      progress[state.currentExerciseIndex] = {
        ...current,
        currentSet: newSetNumber,
        currentSide: "right",
        repsCompleted: [...current.repsCompleted, reps],
        isComplete: newSetNumber >= current.totalSets,
      };
      set({ exerciseProgress: progress });
      return;
    }

    // Right side done (or bilateral) — advance set
    const newSetNumber = current.currentSet + 1;
    const isComplete = newSetNumber >= current.totalSets;

    progress[state.currentExerciseIndex] = {
      ...current,
      currentSet: newSetNumber,
      repsCompleted: [...current.repsCompleted, reps],
      isComplete,
      currentSide: current.isUnilateral ? "left" : current.currentSide,
    };

    if (isComplete) {
      const nextIndex = state.currentExerciseIndex + 1;
      if (nextIndex >= progress.length) {
        // All exercises done — complete workout directly
        const totalDuration = Math.floor(
          (state.workoutStartTime ? Date.now() - state.workoutStartTime : 0) / 1000,
        );
        set({
          exerciseProgress: progress,
          phase: "completed",
          totalDuration,
          currentExercise: null,
        });
        return;
      }
      // Advance to next exercise
      const nextExercise = state.exercises[nextIndex];
      const mid = Math.round((nextExercise.repRange[0] + nextExercise.repRange[1]) / 2);
      set({
        exerciseProgress: progress,
        currentExerciseIndex: nextIndex,
        currentExercise: nextExercise,
        phase: "exercise",
        currentRepInput: mid,
      });
    } else {
      set({ exerciseProgress: progress });
    }
  },

  startRest: () => {
    const state = get();
    const restDuration = state.currentExercise?.restInterval ?? 90;
    set({ phase: "rest", restTimer: restDuration });
  },

  navigateToExercise: (index) => {
    const state = get();
    if (index < 0 || index >= state.exercises.length || index === state.currentExerciseIndex)
      return;
    const exercise = state.exercises[index];
    const mid = Math.round((exercise.repRange[0] + exercise.repRange[1]) / 2);
    set({
      currentExerciseIndex: index,
      currentExercise: exercise,
      phase: "exercise",
      phaseTimer: 0,
      restTimer: 0,
      currentRepInput: mid,
    });
  },

  tickTimer: () => {
    const state = get();
    if (state.phase === "rest") {
      const newRest = state.restTimer - 1;
      if (newRest <= 0) {
        set({ phase: "exercise", restTimer: 0 });
      } else {
        set({ restTimer: newRest });
      }
    }
    if (state.workoutStartTime) {
      set({ totalDuration: Math.floor((Date.now() - state.workoutStartTime) / 1000) });
    }
  },

  completeWorkout: () => {
    const state = get();
    const totalSets = state.exerciseProgress.reduce((sum, ep) => sum + ep.currentSet, 0);
    const totalDuration = Math.floor(
      (state.workoutStartTime ? Date.now() - state.workoutStartTime : 0) / 1000,
    );
    const allComplete = state.exerciseProgress.every((ep) => ep.isComplete);
    set({ phase: "completed", totalDuration, currentExercise: null });
    return { totalSets, totalDuration, allComplete };
  },

  setCurrentRepInput: (reps: number) => {
    set({ currentRepInput: Math.max(1, Math.min(99, reps)) });
  },

  reset: () => set(initialState),
}));
