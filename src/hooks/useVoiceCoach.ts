/**
 * useVoiceCoach — React hook that integrates the Voice Coach TTS engine
 * with the workout store. Automatically speaks cues at phase transitions:
 *  - Workout start → exercise overview
 *  - New exercise → name, sets, target reps, form cue
 *  - Set complete → reps achieved, rest duration
 *  - Rest timer → countdown warnings at 30s, 10s, countdown from 5
 *  - Workout complete → summary with XP, sets, duration
 */

import { useEffect, useRef, useCallback } from "react";
import { useWorkoutStore, WorkoutPhase } from "../stores/useWorkoutStore";
import {
  voiceCoach,
  getWorkoutStartCue,
  getExerciseStartCue,
  getSetCompleteCue,
  getWorkoutCompleteCue,
  getRestWarningCue,
} from "../services/voiceCoach";

interface UseVoiceCoachOptions {
  /** Enable/disable voice coach. Default true */
  enabled?: boolean;
  /** Speech rate (0.1 to 1.0). Default 0.85 */
  rate?: number;
}

export function useVoiceCoach(options: UseVoiceCoachOptions = {}) {
  const enabled = options.enabled ?? true;
  const rate = options.rate ?? 0.85;

  // Track previous phase to detect transitions
  const prevPhaseRef = useRef<WorkoutPhase>("idle");
  const prevExerciseIndexRef = useRef(-1);
  const prevSetRef = useRef(-1);
  const prevRestRef = useRef(-1);
  const prevWorkoutCompleteRef = useRef(false);
  const workoutStartedRef = useRef(false);

  // Update rate when changed
  useEffect(() => {
    voiceCoach.setRate(rate);
  }, [rate]);

  // Enable/disable
  useEffect(() => {
    voiceCoach.setEnabled(enabled);
  }, [enabled]);

  // Watch the workout store for phase transitions
  useEffect(() => {
    const unsub = useWorkoutStore.subscribe((state) => {
      if (!voiceCoach.getEnabled()) return;

      const {
        phase,
        currentExerciseIndex,
        currentExercise,
        exerciseProgress,
        restTimer,
        totalDuration,
      } = state;
      const prevPhase = prevPhaseRef.current;
      const prevExerciseIdx = prevExerciseIndexRef.current;

      // ── Workout started: idle → exercise ──
      if (prevPhase === "idle" && phase === "exercise" && !workoutStartedRef.current) {
        workoutStartedRef.current = true;
        const workoutName = currentExercise ? "FitQuest Training" : "Workout";
        const cue = getWorkoutStartCue(workoutName, exerciseProgress.length);
        voiceCoach.speak(cue, "high");

        // Also speak first exercise details
        if (currentExercise && exerciseProgress[currentExerciseIndex]) {
          const prog = exerciseProgress[currentExerciseIndex];
          const setupCue = getExerciseStartCue(
            currentExercise,
            currentExerciseIndex,
            exerciseProgress.length,
            prog.currentSet,
            prog.totalSets,
          );
          voiceCoach.speak(setupCue, "normal");
        }
      }

      // ── Exercise changed ──
      if (
        currentExercise &&
        currentExerciseIndex !== prevExerciseIdx &&
        phase === "exercise" &&
        prevPhase !== "idle"
      ) {
        const prog = exerciseProgress[currentExerciseIndex];
        const cue = getExerciseStartCue(
          currentExercise,
          currentExerciseIndex,
          exerciseProgress.length,
          prog.currentSet,
          prog.totalSets,
        );
        voiceCoach.speak(cue, "high");
      }

      // ── Set completed (track via currentSet changes in exercise progress) ──
      const currentProg = exerciseProgress[currentExerciseIndex];
      if (currentProg && currentProg.currentSet !== prevSetRef.current && prevSetRef.current >= 0) {
        // Set was just completed (currentSet incremented)
        const lastReps = currentProg.repsCompleted;
        const reps = lastReps.length > 0 ? lastReps[lastReps.length - 1] : 0;
        const isTimeBased = currentExercise?.tempo === "isometric";
        const restInterval = currentExercise?.restInterval ?? 90;
        const isLastSet = currentProg.currentSet >= currentProg.totalSets;

        const cue = getSetCompleteCue(
          reps,
          currentProg.currentSet,
          currentProg.totalSets,
          isTimeBased,
          restInterval,
          isLastSet,
        );
        voiceCoach.speak(cue, "normal");
      }
      prevSetRef.current = currentProg?.currentSet ?? -1;

      // ── Rest countdown warnings ──
      if (phase === "rest" && restTimer !== prevRestRef.current) {
        const warning = getRestWarningCue(restTimer);
        if (warning) {
          voiceCoach.speak(warning, "low");
        }
      }
      prevRestRef.current = restTimer;

      // ── Workout complete ──
      if (phase === "completed" && !prevWorkoutCompleteRef.current) {
        // Calculate from store state
        const totalSets = exerciseProgress.reduce((sum, ep) => sum + ep.currentSet, 0);
        const durationMinutes = Math.max(1, Math.round(totalDuration / 60));
        // XP is not yet updated at this point, but we still announce completion
        const cue = getWorkoutCompleteCue(0, totalSets, durationMinutes);
        voiceCoach.speak(cue, "high");
      }

      prevPhaseRef.current = phase;
      prevExerciseIndexRef.current = currentExerciseIndex;
    });

    return () => {
      unsub();
      voiceCoach.stop();
    };
  }, []);
}
