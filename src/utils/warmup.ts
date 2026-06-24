import { Exercise, WorkoutDay, Tempo } from "../data/exercises";
import {
  getWarmupExerciseById,
  getWarmupExercisesByZone,
  WarmupZone,
} from "../data/warmupExercises";

type BodyZone = WarmupZone;

const MUSCLE_ZONE: Record<string, BodyZone> = {
  chest: "push",
  shoulders: "push",
  triceps: "push",
  upper_chest: "push",
  serratus_anterior: "push",
  lats: "pull",
  rhomboids: "pull",
  biceps: "pull",
  traps: "pull",
  rotator_cuff: "pull",
  mid_back: "pull",
  rear_deltoids: "pull",
  grip: "pull",
  scapular_stabilizers: "pull",
  quadriceps: "legs",
  glutes: "legs",
  hamstrings: "legs",
  calves: "legs",
  hip_flexors: "legs",
  hip_abductors: "legs",
  hip_adductors: "legs",
  core: "core",
  obliques: "core",
  lower_back: "core",
  upper_rectus_abdominis: "core",
  lower_rectus_abdominis: "core",
  rectus_abdominis: "core",
};

const ZONE_WARMUPS: Record<BodyZone, string[]> = {
  legs: ["WARM_LEG_SWINGS", "WARM_HIP_CIRCLES", "WARM_ANKLE_MOB", "WARM_GLUTE_BRIDGE"],
  push: ["WARM_ARM_CIRCLES", "WARM_WALL_ANGELS", "WARM_CAT_COW"],
  pull: ["WARM_THORACIC_ROTATION", "WARM_SCAP_RETRACTIONS", "WARM_BAND_PULL_APART"],
  core: ["WARM_DEAD_BUG", "WARM_CAT_COW", "WARM_WORLDS_GREATEST"],
};

const FULL_BODY_WARMUPS: string[] = [
  "WARM_ARM_CIRCLES",
  "WARM_LEG_SWINGS",
  "WARM_CAT_COW",
  "WARM_WORLDS_GREATEST",
];

export interface WarmUpExercise {
  exercise: Exercise;
  sets: number;
  repRange: [number, number];
  tempo: Tempo;
  restInterval: number;
}

export function generateWarmUp(workout: WorkoutDay): WarmUpExercise[] {
  const activeZones = new Set<BodyZone>();
  for (const ex of workout.exercises) {
    for (const muscle of ex.targetMuscles) {
      const zone = MUSCLE_ZONE[muscle];
      if (zone) activeZones.add(zone);
    }
  }

  const zoneOrder: BodyZone[] = ["legs", "push", "pull", "core"];
  const warmUps: WarmUpExercise[] = [];
  const usedIds = new Set<string>();

  function addWarmup(id: string): boolean {
    if (usedIds.has(id)) return false;
    const ex = getWarmupExerciseById(id);
    if (!ex) return false;
    usedIds.add(id);
    const isIsometric = ex.tempo === "isometric";
    warmUps.push({
      exercise: ex,
      sets: 1,
      repRange: isIsometric
        ? [ex.repRange[0], Math.min(ex.repRange[1], 30)]
        : [Math.max(6, ex.repRange[0]), Math.min(ex.repRange[1], 15)],
      tempo: isIsometric ? "isometric" : "2-0-1-0",
      restInterval: Math.min(10, ex.restInterval || 60),
    });
    return true;
  }

  for (const zone of zoneOrder) {
    if (activeZones.has(zone)) {
      const candidates = ZONE_WARMUPS[zone];
      for (const id of candidates) {
        if (addWarmup(id)) break;
      }
    }
  }

  if (warmUps.length < 3) {
    for (const id of FULL_BODY_WARMUPS) {
      if (warmUps.length >= 3) break;
      addWarmup(id);
    }
  }

  return warmUps.slice(0, 5);
}

export function estimateWarmUpDuration(warmUps: WarmUpExercise[]): number {
  return warmUps.reduce((sum, wu) => {
    const avgReps = (wu.repRange[0] + wu.repRange[1]) / 2;
    const repTime = wu.tempo === "isometric" ? avgReps : avgReps * 3;
    const setTime = repTime * wu.sets;
    const restTime = wu.restInterval;
    return sum + setTime + restTime;
  }, 0);
}

export function getWarmUpZoneSummary(warmUps: WarmUpExercise[]): string[] {
  const zones = new Set<string>();
  for (const wu of warmUps) {
    for (const muscle of wu.exercise.targetMuscles) {
      const zone = MUSCLE_ZONE[muscle];
      if (zone) zones.add(zone);
    }
  }
  const labels: Record<BodyZone, string> = {
    legs: "Legs",
    push: "Chest & Shoulders",
    pull: "Back & Arms",
    core: "Core",
  };
  return Array.from(zones).map((z) => labels[z as BodyZone] ?? z);
}
