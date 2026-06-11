import { WorkoutSession } from "../stores/useUserStore";
import { workoutA, workoutB, workoutC, workoutD, Exercise } from "../data/exercises";

// Build exercise lookup from all workouts
const allExercises = [
  ...workoutA.exercises,
  ...workoutB.exercises,
  ...workoutC.exercises,
  ...workoutD.exercises,
];
const exerciseMap = new Map(allExercises.map((ex) => [ex.id, ex]));

/** Get all exercises across both workouts */
export function getAllExercises(): Exercise[] {
  return allExercises;
}

export interface ExerciseProgression {
  exerciseId: string;
  exerciseName: string;
  targetMuscles: string[];
  lastReps: number[];
  repRange: [number, number];
  averageReps: number;
  highEndPercentage: number; // 0-100, how close to upper rep range
  status: "progress" | "maintain" | "regress" | "insufficient_data";
  nextProgression: string;
  sessionsCompleted: number;
  recentTrend: "up" | "stable" | "down" | "unknown";
}

export interface ProgressionSummary {
  exercisesReady: ExerciseProgression[];
  exercisesInProgress: ExerciseProgression[];
  exercisesToWatch: ExerciseProgression[];
  deloadRecommended: boolean;
  totalTrainingWeeks: number;
  weeklyVolume: number; // total sets across all exercises
}

/** Get the history for a specific exercise across all sessions, grouped by session */
function getExerciseHistory(
  exerciseId: string,
  workoutHistory: WorkoutSession[],
): { reps: number[]; sessionReps: number[][] } {
  const reps: number[] = [];
  const sessionReps: number[][] = [];

  for (const session of workoutHistory) {
    const exData = session.exercises?.find((e) => e.exerciseId === exerciseId);
    if (exData?.repsCompleted?.length) {
      reps.push(...exData.repsCompleted);
      sessionReps.push(exData.repsCompleted);
    }
  }

  return { reps, sessionReps };
}

/** Calculate the progression status for a single exercise */
export function getExerciseProgression(
  exerciseId: string,
  workoutHistory: WorkoutSession[],
): ExerciseProgression | null {
  const exercise = exerciseMap.get(exerciseId);
  if (!exercise) return null;

  const { reps, sessionReps } = getExerciseHistory(exerciseId, workoutHistory);

  if (reps.length === 0) {
    return {
      exerciseId,
      exerciseName: exercise.name,
      targetMuscles: exercise.targetMuscles,
      lastReps: [],
      repRange: exercise.repRange,
      averageReps: 0,
      highEndPercentage: 0,
      status: "insufficient_data",
      nextProgression: exercise.progressionPathway,
      sessionsCompleted: 0,
      recentTrend: "unknown",
    };
  }

  const allReps = sessionReps.flat();
  const avgReps = allReps.reduce((a, b) => a + b, 0) / allReps.length;

  // High-end percentage: how close average is to upper rep range
  const [low, high] = exercise.repRange;
  const range = high - low;
  const highEndPercentage =
    range > 0 ? Math.max(0, Math.min(1, (avgReps - low) / range)) : avgReps >= high ? 1 : 0;

  // Use last 3 sessions for trend analysis
  const recentSessions = sessionReps.slice(-3);

  // Trend: compare most recent session avg vs the one before
  let recentTrend: "up" | "stable" | "down" | "unknown" = "unknown";
  if (recentSessions.length >= 2) {
    const prevAvg =
      recentSessions[recentSessions.length - 2].reduce((a, b) => a + b, 0) /
      recentSessions[recentSessions.length - 2].length;
    const currAvg =
      recentSessions[recentSessions.length - 1].reduce((a, b) => a + b, 0) /
      recentSessions[recentSessions.length - 1].length;
    const diff = currAvg - prevAvg;
    if (diff > 0.5) recentTrend = "up";
    else if (diff < -0.5) recentTrend = "down";
    else recentTrend = "stable";
  }

  // Status determination using double progression logic
  let status: ExerciseProgression["status"] = "maintain";

  // Progression & regression detection using double progression logic
  // Regress uses else-if on the inner condition so it never overrides progress
  if (sessionReps.length >= 2) {
    const recentSets = recentSessions.flat();
    const highThreshold = high - 1;
    const setsAtUpperRange = recentSets.filter((r) => r >= highThreshold).length;
    const percentAtUpper = setsAtUpperRange / recentSets.length;

    if (percentAtUpper >= 0.8) {
      status = "progress";
    } else if (avgReps <= low && recentTrend === "down" && sessionReps.length >= 3) {
      status = "regress";
    }
  }

  const sessionsCompleted = sessionReps.length;

  return {
    exerciseId,
    exerciseName: exercise.name,
    targetMuscles: exercise.targetMuscles,
    lastReps: allReps.slice(-5),
    repRange: exercise.repRange,
    averageReps: Math.round(avgReps * 10) / 10,
    highEndPercentage: Math.round(highEndPercentage * 100),
    status,
    nextProgression: exercise.progressionPathway,
    sessionsCompleted,
    recentTrend,
  };
}

/** Get full progression summary across all exercises */
export function getProgressionSummary(workoutHistory: WorkoutSession[]): ProgressionSummary {
  if (workoutHistory.length === 0) {
    return {
      exercisesReady: [],
      exercisesInProgress: [],
      exercisesToWatch: [],
      deloadRecommended: false,
      totalTrainingWeeks: 0,
      weeklyVolume: 0,
    };
  }

  // Calculate training weeks
  const dates = workoutHistory.map((s) => s.date).sort();
  const firstDate = new Date(dates[0]);
  const lastDate = new Date(dates[dates.length - 1]);
  const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
  const totalTrainingWeeks = Math.max(1, Math.round(daysDiff / 7));

  // Calculate weekly volume (total sets / weeks)
  const totalSets = workoutHistory.reduce((sum, s) => sum + s.setsCompleted, 0);
  const weeklyVolume = Math.round(totalSets / totalTrainingWeeks);

  // Check each exercise that has been completed at least once
  const results: ExerciseProgression[] = [];
  for (const exercise of allExercises) {
    const prog = getExerciseProgression(exercise.id, workoutHistory);
    if (prog && prog.sessionsCompleted > 0) {
      results.push(prog);
    }
  }

  // Deload detection: 5+ training weeks of consistent training
  const deloadRecommended =
    totalTrainingWeeks >= 5 &&
    results.filter((r) => r.status === "maintain" || r.status === "progress").length >= 3 &&
    weeklyVolume >= 12;

  return {
    exercisesReady: results.filter((r) => r.status === "progress"),
    exercisesInProgress: results.filter((r) => r.status === "maintain"),
    exercisesToWatch: results.filter(
      (r) => r.status === "regress" || r.status === "insufficient_data",
    ),
    deloadRecommended,
    totalTrainingWeeks,
    weeklyVolume,
  };
}
