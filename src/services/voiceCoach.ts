/**
 * Voice Coach — Text-to-Speech engine for hands-free workout guidance
 *
 * Queues voice cues and manages TTS lifecycle so cues never overlap.
 * All cues are interruptible — a new cue stops the current one.
 */

import * as Speech from "expo-speech";
import { Exercise } from "../data/exercises";
import { TempoPhase } from "../stores/useWorkoutStore";

// ── Types ──────────────────────────────────────

export type VoiceCuePriority = "high" | "normal" | "low";

export interface VoiceCue {
  text: string;
  priority: VoiceCuePriority;
  /** Optional callback when this cue finishes speaking */
  onDone?: () => void;
}

// ── Engine ─────────────────────────────────────

class VoiceCoachEngine {
  private queue: VoiceCue[] = [];
  private isSpeaking = false;
  private enabled = true;
  private rate: number = 0.85; // slightly slower than default for clarity

  /** Enable or disable the voice coach globally */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  getEnabled(): boolean {
    return this.enabled;
  }

  /** Set speech rate (0.0 to 1.0, default 0.85) */
  setRate(rate: number): void {
    this.rate = Math.max(0.1, Math.min(1.0, rate));
  }

  /** Speak a cue immediately — interrupts any current speech */
  speak(text: string, priority: VoiceCuePriority = "normal", onDone?: () => void): void {
    if (!this.enabled || !text) return;

    // High-priority cues always interrupt
    if (priority === "high") {
      this.queue = [{ text, priority, onDone }];
      if (this.isSpeaking) {
        Speech.stop();
      }
      this.isSpeaking = true;
      this._speakNext();
      return;
    }

    // For normal/low, add to queue or start speaking if idle
    this.queue.push({ text, priority, onDone });
    if (!this.isSpeaking) {
      this.isSpeaking = true;
      this._speakNext();
    }
  }

  /** Stop all speech immediately and clear the queue */
  stop(): void {
    this.queue = [];
    Speech.stop();
    this.isSpeaking = false;
  }

  /** Process the next item in the queue */
  private _speakNext(): void {
    if (this.queue.length === 0 || !this.enabled) {
      this.isSpeaking = false;
      return;
    }

    const cue = this.queue.shift()!;

    Speech.speak(cue.text, {
      rate: this.rate,
      pitch: 1.0,
      volume: 1.0,
      language: "en",
      onDone: () => {
        cue.onDone?.();
        this._speakNext();
      },
      onStopped: () => {
        // If stopped externally (interrupted), still try to process next
        this._speakNext();
      },
      onError: () => {
        // On error, skip this cue and try the next
        this._speakNext();
      },
    });
  }
}

// Singleton instance
export const voiceCoach = new VoiceCoachEngine();

// ── Cue Templates ──────────────────────────────

/**
 * Build voice cue text for the start of a workout
 */
export function getWorkoutStartCue(workoutName: string, exerciseCount: number): string {
  const cues = [
    `${exerciseCount} exercises — let's go.`,
    `Ready? ${exerciseCount} exercises ahead.`,
    `Let's get started. ${exerciseCount} exercises today.`,
  ];
  return cues[Math.floor(Math.random() * cues.length)];
}

/**
 * Build voice cue for the start of a new exercise
 */
export function getExerciseStartCue(
  exercise: Exercise,
  index: number,
  total: number,
  currentSet: number,
  totalSets: number,
): string {
  const isFirstSet = currentSet === 0;
  const parts: string[] = [];

  if (isFirstSet) {
    parts.push(`Now: ${exercise.name}.`);
    parts.push(`${totalSets} sets.`);
  } else {
    parts.push(`${exercise.name}. Set ${currentSet + 1}.`);
  }

  if (exercise.tempo === "isometric") {
    parts.push(`Hold for ${exercise.repRange[0]} to ${exercise.repRange[1]} seconds.`);
  } else {
    const mid = Math.round((exercise.repRange[0] + exercise.repRange[1]) / 2);
    parts.push(`Aim for ${mid}. Range ${exercise.repRange[0]} to ${exercise.repRange[1]}.`);
  }

  // Add form checkpoint on first set of new exercise
  if (isFirstSet && exercise.visualGuide?.checkpoints?.length) {
    const firstCheckpoint = exercise.visualGuide.checkpoints[0];
    parts.push(firstCheckpoint.instruction);
  }

  return parts.join(" ");
}

/**
 * Build voice cue when a set is completed
 */
export function getSetCompleteCue(
  reps: number,
  currentSet: number,
  totalSets: number,
  isTimeBased: boolean,
  restInterval: number,
  isLastSet: boolean,
): string {
  const restCues = ["Rest up.", "Take a breather.", "Good. Rest now."];
  const doneCues = ["Nice work.", "Good set.", "Well done."];
  const completeCues = ["Exercise done.", "Finished. Moving on."];

  if (isTimeBased) {
    const seconds = reps;
    if (isLastSet) {
      return `${completeCues[Math.floor(Math.random() * completeCues.length)]} ${seconds} seconds.`;
    }
    return `${doneCues[Math.floor(Math.random() * doneCues.length)]} ${seconds} seconds. ${restCues[Math.floor(Math.random() * restCues.length)]}`;
  }

  if (isLastSet) {
    return `${completeCues[Math.floor(Math.random() * completeCues.length)]} ${reps} reps.`;
  }
  return `${doneCues[Math.floor(Math.random() * doneCues.length)]} ${reps} reps. ${restCues[Math.floor(Math.random() * restCues.length)]}`;
}

/**
 * Build voice cue for workout completion
 */
export function getWorkoutCompleteCue(
  xpEarned: number,
  setsCompleted: number,
  durationMinutes: number,
): string {
  const cues = [
    `Done. ${setsCompleted} sets in ${durationMinutes} minutes. Solid session.`,
    `Workout complete. ${setsCompleted} sets, ${durationMinutes} minutes. You crushed it.`,
    `All done. ${setsCompleted} sets in ${durationMinutes} minutes. Great work.`,
  ];
  return cues[Math.floor(Math.random() * cues.length)];
}

/**
 * Build voice cue for rest countdown warnings
 */
export function getRestWarningCue(secondsRemaining: number): string {
  if (secondsRemaining <= 5 && secondsRemaining > 0) {
    const words = ["", "One", "Two", "Three", "Four", "Five"];
    return `${words[secondsRemaining]}...`;
  }
  if (secondsRemaining === 10) {
    return "Ten seconds.";
  }
  if (secondsRemaining === 30) {
    return "Thirty seconds left.";
  }
  return "";
}

/**
 * Build a form cue to read aloud during exercise
 */
export function getFormCue(exercise: Exercise): string {
  if (!exercise.visualGuide?.checkpoints?.length) return "";

  // Pick the execution phase checkpoint (most actionable mid-set)
  const executionCue = exercise.visualGuide.checkpoints.find((c) => c.phase === "EXECUTION");
  if (executionCue) return executionCue.focusPoint;

  // Fallback to first checkpoint
  return exercise.visualGuide.checkpoints[0].focusPoint;
}

/** Format seconds into a concise duration string */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} seconds`;
  if (secs === 0) return `${mins} minutes`;
  return `${mins} minutes ${secs} seconds`;
}
