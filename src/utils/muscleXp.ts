import { WorkoutSession } from "../stores/useUserStore";
import { workoutA, workoutB, workoutC, workoutD, MuscleGroup } from "../data/exercises";
import { XP_PER_SET } from "./xp";

const MUSCLE_XP_GROWTH = 50;

// Build a lookup map of all exercises by ID (across all 4 workouts)
const allExercises = [
  ...workoutA.exercises,
  ...workoutB.exercises,
  ...workoutC.exercises,
  ...workoutD.exercises,
];
const exerciseMap = new Map(allExercises.map((ex) => [ex.id, ex]));

export interface MuscleProgress {
  zone: string;
  name: string;
  level: number;
  xp: number;
  xpIntoLevel: number;
  nextLevelXp: number;
  color: string;
}

const MUSCLE_META: Record<string, { name: string; color: string }> = {
  chest: { name: "Chest", color: "#F59E0B" },
  shoulders: { name: "Shoulders", color: "#10B981" },
  biceps: { name: "Biceps", color: "#F59E0B" },
  forearms: { name: "Forearms", color: "#F59E0B" },
  abs: { name: "Abs", color: "#10B981" },
  calves: { name: "Calves", color: "#F59E0B" },
  traps: { name: "Traps", color: "#F59E0B" },
  lats: { name: "Lats", color: "#F59E0B" },
  triceps: { name: "Triceps", color: "#F59E0B" },
  glutes: { name: "Glutes", color: "#F59E0B" },
  hamstrings: { name: "Hamstrings", color: "#F59E0B" },
  core: { name: "Core", color: "#F59E0B" },
  rhomboids: { name: "Rhomboids", color: "#F59E0B" },
  lower_back: { name: "Lower Back", color: "#F59E0B" },
  obliques: { name: "Obliques", color: "#F59E0B" },
  rotator_cuff: { name: "Rotator Cuff", color: "#F59E0B" },
  quadriceps: { name: "Quadriceps", color: "#10B981" },
};

function getMuscleXpLevel(xp: number): number {
  if (xp < 0) return 0;
  return Math.floor(Math.sqrt(xp / MUSCLE_XP_GROWTH)) + 1;
}

function getNextLevelXp(xp: number): { xpIntoLevel: number; xpRequired: number } {
  const level = getMuscleXpLevel(xp);
  const currentLevelXp = MUSCLE_XP_GROWTH * Math.pow(level - 1, 2);
  const nextLevelXp = MUSCLE_XP_GROWTH * Math.pow(level, 2);
  const xpIntoLevel = xp - currentLevelXp;
  const xpRequired = nextLevelXp - currentLevelXp;
  return {
    xpIntoLevel: Math.round(xpIntoLevel),
    xpRequired: Math.max(xpRequired, 1),
  };
}

export function calculateMuscleProgress(workoutHistory: WorkoutSession[]): MuscleProgress[] {
  const muscleXp: Record<string, number> = {};

  for (const session of workoutHistory) {
    if (!session.exercises) continue;

    for (const exData of session.exercises) {
      const exercise = exerciseMap.get(exData.exerciseId);
      if (!exercise) continue;

      const setsCompleted = exData.sets || 0;
      const muscles = exercise.targetMuscles;
      const xpPerMuscle = (setsCompleted * XP_PER_SET) / muscles.length;

      for (const muscle of muscles) {
        muscleXp[muscle] = (muscleXp[muscle] || 0) + xpPerMuscle;
      }
    }
  }

  // Convert to array, sorted by level desc, then name
  return Object.entries(muscleXp)
    .filter(([zone]) => MUSCLE_META[zone])
    .map(([zone, xp]) => {
      const meta = MUSCLE_META[zone];
      const { xpIntoLevel, xpRequired } = getNextLevelXp(xp);
      return {
        zone,
        name: meta.name,
        level: getMuscleXpLevel(xp),
        xp: Math.round(xp),
        xpIntoLevel,
        nextLevelXp: xpRequired,
        color: getMuscleXpLevel(xp) >= 3 ? "#10B981" : meta.color,
      };
    })
    .sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
}

/** All known muscle groups with their metadata (for users with no workout history) */
export function getAllMuscleGroups(): MuscleProgress[] {
  return Object.entries(MUSCLE_META).map(([zone, meta]) => ({
    zone,
    name: meta.name,
    level: 0,
    xp: 0,
    xpIntoLevel: 0,
    nextLevelXp: 50,
    color: meta.color,
  }));
}

/** A single data point in a muscle's XP history */
export interface MuscleXpPoint {
  sessionId: string;
  date: string;
  xpGained: number; // XP earned this session
  totalXp: number;  // cumulative XP after this session
  level: number;    // level after this session
}

/** Per-muscle XP history for progress-over-time charts */
export interface MuscleXpHistory {
  zone: string;
  name: string;
  points: MuscleXpPoint[];
}

/**
 * Calculate per-session XP history for a specific muscle.
 * Returns an array of MuscleXpHistory, one per muscle that has been trained.
 */
export function getMuscleXpHistory(workoutHistory: WorkoutSession[]): MuscleXpHistory[] {
  const muscleXp: Record<string, number> = {};
  const historyByZone: Record<string, MuscleXpPoint[]> = {};

  for (const session of workoutHistory) {
    if (!session.exercises) continue;

    for (const exData of session.exercises) {
      const exercise = exerciseMap.get(exData.exerciseId);
      if (!exercise) continue;

      const setsCompleted = exData.sets || 0;
      const muscles = exercise.targetMuscles;
      const xpPerMuscle = (setsCompleted * XP_PER_SET) / muscles.length;

      for (const muscle of muscles) {
        const prevXp = muscleXp[muscle] || 0;
        muscleXp[muscle] = prevXp + xpPerMuscle;
        const newTotal = muscleXp[muscle];

        if (!historyByZone[muscle]) historyByZone[muscle] = [];
        historyByZone[muscle].push({
          sessionId: session.id,
          date: session.date,
          xpGained: Math.round(xpPerMuscle),
          totalXp: Math.round(newTotal),
          level: getMuscleXpLevel(newTotal),
        });
      }
    }
  }

  return Object.entries(historyByZone)
    .filter(([zone]) => MUSCLE_META[zone])
    .map(([zone, points]) => ({
      zone,
      name: MUSCLE_META[zone].name,
      points,
    }))
    .sort((a, b) => b.points[b.points.length - 1].totalXp - a.points[a.points.length - 1].totalXp);
}
