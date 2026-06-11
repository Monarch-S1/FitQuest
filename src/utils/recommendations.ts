import { WorkoutSession, FitnessGoal } from "../stores/useUserStore";
import { getAllExercises, getProgressionSummary } from "./progression";

export interface TrainingInsight {
  type: "progression" | "deload" | "recovery" | "imbalance" | "milestone" | "volume";
  icon: string;
  title: string;
  message: string;
  priority: number; // higher = more important
}

export interface WorkoutRecommendation {
  recommendedId: string;
  recommendedName: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

// 4-workout rotation order: A → B → C → D → repeat
const WORKOUT_ROTATION = ["workout-a", "workout-b", "workout-c", "workout-d"] as const;
const WORKOUT_LABELS: Record<string, string> = {
  "workout-a": "A",
  "workout-b": "B",
  "workout-c": "C",
  "workout-d": "D",
};

const WORKOUT_FOCUS: Record<string, string> = {
  "workout-a": "anterior chain & horizontal pulling",
  "workout-b": "posterior chain & vertical pressing",
  "workout-c": "pull & core — biceps, glutes, posterior core",
  "workout-d": "dynamic & mobility — explosive, lateral, shoulder health",
};

/**
 * Recommend which workout to do today based on:
 * 1. Rotate A→B→C→D (last workout done determines next)
 * 2. Recovery status (caution → recommend less demanding workout)
 * 3. Muscle imbalance (if a group is lagging, recommend workout targeting it)
 */
export function getRecommendation(
  workoutHistory: WorkoutSession[],
  recoveryStatus: "optimal" | "moderate" | "caution",
  fitnessGoal: FitnessGoal = "general",
): WorkoutRecommendation {
  const lastWorkoutId =
    workoutHistory.length > 0 ? workoutHistory[workoutHistory.length - 1].workoutId : null;
  const lastSessionDate =
    workoutHistory.length > 0 ? workoutHistory[workoutHistory.length - 1].date : null;

  // Check if already trained today
  const today = new Date().toISOString().split("T")[0];
  const trainedToday = lastSessionDate === today;

  if (trainedToday) {
    return {
      recommendedId: "rest",
      recommendedName: "REST DAY",
      confidence: "high",
      reasoning:
        "You've already trained today. Recovery is when your body builds muscle — take the rest.",
    };
  }

  // Base recommendation: rotate through A→B→C→D
  const lastIndex = lastWorkoutId
    ? WORKOUT_ROTATION.indexOf(lastWorkoutId as (typeof WORKOUT_ROTATION)[number])
    : -1;
  const nextIndex = lastIndex >= 0 ? (lastIndex + 1) % WORKOUT_ROTATION.length : 0;
  const base = WORKOUT_ROTATION[nextIndex];
  const baseName = WORKOUT_LABELS[base];
  const focus = WORKOUT_FOCUS[base];

  // If recovery is caution, deliver a warning but still rotate
  if (recoveryStatus === "caution") {
    return {
      recommendedId: base,
      recommendedName: `WORKOUT ${baseName}`,
      confidence: "medium",
      reasoning: `Your recovery is flagged as CAUTION. Workout ${baseName} (${focus}) is up next, but consider taking it easier — reduce intensity and leave more reps in reserve.`,
    };
  }

  const goalLabel = fitnessGoal === "general" ? "" : ` · ${fitnessGoal.replaceAll("_", " ").toUpperCase()} program`;

  return {
    recommendedId: base,
    recommendedName: `WORKOUT ${baseName}`,
    confidence: "high",
    reasoning: lastWorkoutId
      ? `Rotating from your last session. Workout ${baseName} targets ${focus} for balanced development${goalLabel}.`
      : `Starting fresh — Workout ${baseName} (${focus}) is a great first session to establish your baseline${goalLabel}.`,
  };
}

/**
 * Generate training insights based on workout history and current state.
 * These power the home screen intelligence cards.
 */
export function getTrainingInsights(
  workoutHistory: WorkoutSession[],
  recoveryStatus: "optimal" | "moderate" | "caution",
  streakDays: number,
): TrainingInsight[] {
  const insights: TrainingInsight[] = [];
  const summary = getProgressionSummary(workoutHistory);

  // --- Progression insights ---
  if (summary.exercisesReady.length >= 2) {
    insights.push({
      type: "progression",
      icon: "▲",
      title: "READY TO PROGRESS",
      message: `${summary.exercisesReady.length} exercises are hitting the upper rep range consistently. Time to advance the progression.`,
      priority: 90,
    });
  } else if (summary.exercisesReady.length === 1) {
    insights.push({
      type: "progression",
      icon: "▲",
      title: "PROGRESSION READY",
      message: `${summary.exercisesReady[0].exerciseName} is ready to progress. Next: ${summary.exercisesReady[0].nextProgression.split("→")[0].trim()}`,
      priority: 85,
    });
  }

  // --- Deload insight ---
  if (summary.deloadRecommended) {
    insights.push({
      type: "deload",
      icon: "◆",
      title: "DELOAD SUGGESTED",
      message: `${summary.totalTrainingWeeks} weeks of consistent training. Consider a deload week: reduce volume by 40-50% and leave 4-5 reps in reserve.`,
      priority: 80,
    });
  }

  // --- Recovery insight ---
  if (recoveryStatus === "caution") {
    insights.push({
      type: "recovery",
      icon: "●",
      title: "RECOVERY WARNING",
      message:
        "Your recent training frequency suggests you may be overreaching. A rest day or light mobility session is recommended.",
      priority: 95,
    });
  } else if (recoveryStatus === "optimal" && workoutHistory.length > 0) {
    insights.push({
      type: "recovery",
      icon: "●",
      title: "PRIME TO TRAIN",
      message: "You're fully recovered and ready for a high-quality session. Push hard today.",
      priority: 60,
    });
  }

  // --- Milestone insight ---
  if (workoutHistory.length === 1) {
    insights.push({
      type: "milestone",
      icon: "✦",
      title: "FIRST COMPLETED",
      message:
        "That's your first workout in the books. Consistency is the real game — aim for two more this week.",
      priority: 75,
    });
  }

  // --- Volume insight ---
  if (summary.totalTrainingWeeks >= 2) {
    const volume = summary.weeklyVolume;
    if (volume < 10) {
      insights.push({
        type: "volume",
        icon: "◇",
        title: "VOLUME LOW",
        message: `You're averaging ${volume} sets/week. For steady progress, aim for 12-20 quality sets across your sessions.`,
        priority: 50,
      });
    } else if (volume > 25) {
      insights.push({
        type: "volume",
        icon: "◇",
        title: "HIGH VOLUME",
        message: `You're averaging ${volume} sets/week. Keep form quality high — volume without control leads to injury.`,
        priority: 45,
      });
    }
  }

  // --- Streak insight ---
  if (streakDays >= 7 && streakDays < 14) {
    insights.push({
      type: "milestone",
      icon: "⚡",
      title: "WEEK STREAK",
      message: `${streakDays}-day streak! One week of consistency builds momentum. Keep showing up.`,
      priority: 70,
    });
  } else if (streakDays >= 14) {
    insights.push({
      type: "milestone",
      icon: "🔥",
      title: "UNSTOPPABLE",
      message: `${streakDays}-day streak! This level of consistency is rare — you're building real discipline.`,
      priority: 70,
    });
  }

  // --- Muscle imbalance insight ---
  if (workoutHistory.length >= 4) {
    const muscleVolume: Record<string, number> = {};
    const allEx = getAllExercises();

    for (const session of workoutHistory) {
      for (const exData of session.exercises || []) {
        const exercise = allEx.find((e) => e.id === exData.exerciseId);
        if (!exercise) continue;
        for (const muscle of exercise.targetMuscles) {
          muscleVolume[muscle] = (muscleVolume[muscle] || 0) + (exData.sets || 0);
        }
      }
    }

    const entries = Object.entries(muscleVolume);
    if (entries.length > 0) {
      entries.sort((a, b) => a[1] - b[1]);
      const [leastMuscle, volume] = entries[0];
      const mostVolume = entries[entries.length - 1][1];
      const ratio = volume / mostVolume;

      if (ratio < 0.5 && mostVolume >= 6) {
        const formattedName = leastMuscle.replaceAll("_", " ");
        insights.push({
          type: "imbalance",
          icon: "◇",
          title: "MUSCLE IMBALANCE",
          message: `${formattedName.charAt(0).toUpperCase() + formattedName.slice(1)} has received significantly less volume (${volume} sets) than other muscle groups. Consider adding targeted work.`,
          priority: 65,
        });
      }
    }
  }

  // Sort by priority (most important first) and return top 4
  return insights.sort((a, b) => b.priority - a.priority).slice(0, 4);
}
