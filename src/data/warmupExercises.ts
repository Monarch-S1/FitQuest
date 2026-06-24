import { Exercise, FormCheckpoint } from "./exercises";

export const WARMUP_ZONES = ["legs", "push", "pull", "core"] as const;
export type WarmupZone = (typeof WARMUP_ZONES)[number];

interface WarmupEntry {
  id: string;
  name: string;
  targetMuscles: Exercise["targetMuscles"];
  category: Exercise["category"];
  description: string;
  defaultSets: number;
  repRange: [number, number];
  tempo: Exercise["tempo"];
  restInterval: number;
  biomechanicalNotes: string;
  isUnilateral?: boolean;
  visualGuide?: { checkpoints: FormCheckpoint[]; visuals: [] };
}

const warmupDb: WarmupEntry[] = [
  // ── Legs ──────────────────────────────────────────────
  {
    id: "WARM_LEG_SWINGS",
    name: "Leg Swings (Front & Side)",
    targetMuscles: ["hip_flexors", "hamstrings", "hip_abductors", "hip_adductors", "glutes"],
    category: "lateral_mobility",
    description:
      "Stand tall, swing one leg forward/back and then side-to-side. Increases hip mobility and blood flow.",
    defaultSets: 1,
    repRange: [10, 12],
    tempo: "2-0-1-0",
    restInterval: 10,
    biomechanicalNotes: "Keep torso upright. Increase range gradually with each swing.",
  },
  {
    id: "WARM_HIP_CIRCLES",
    name: "Hip Circles",
    targetMuscles: ["hip_flexors", "glutes", "hip_abductors", "hip_adductors"],
    category: "lateral_mobility",
    description:
      "Hands on hips, trace large circles with your pelvis. Loosens the hip joint capsule.",
    defaultSets: 1,
    repRange: [8, 10],
    tempo: "2-0-1-0",
    restInterval: 10,
    biomechanicalNotes: "Make circles as large as comfortable. Reverse direction halfway.",
  },
  {
    id: "WARM_ANKLE_MOB",
    name: "Ankle Mobilizations",
    targetMuscles: ["calves", "quadriceps"],
    category: "lateral_mobility",
    description:
      "Knee over toe in a split stance, drive knee forward and back. Prepares ankles for squats and lunges.",
    defaultSets: 1,
    repRange: [8, 10],
    tempo: "2-0-2-0",
    restInterval: 10,
    biomechanicalNotes: "Keep heel planted. Drive knee straight over the foot.",
    isUnilateral: true,
  },

  // ── Push ──────────────────────────────────────────────
  {
    id: "WARM_ARM_CIRCLES",
    name: "Arm Circles",
    targetMuscles: ["shoulders", "traps", "chest"],
    category: "scapular_mobility",
    description:
      "Extend arms to sides and trace small-to-large circles. Mobilizes the glenohumeral joint.",
    defaultSets: 1,
    repRange: [10, 15],
    tempo: "2-0-1-0",
    restInterval: 10,
    biomechanicalNotes: "Start small, increase diameter each rep. Reverse direction halfway.",
  },
  {
    id: "WARM_WALL_ANGELS",
    name: "Wall Angels",
    targetMuscles: ["shoulders", "traps", "scapular_stabilizers", "mid_back"],
    category: "scapular_mobility",
    description:
      "Stand against a wall, press lower back flat. Slide arms up and down like making a snow angel.",
    defaultSets: 1,
    repRange: [8, 10],
    tempo: "3-0-2-0",
    restInterval: 10,
    biomechanicalNotes:
      "Keep elbows, wrists, and lower back in contact with the wall. Go only as far as you can without arching.",
  },
  {
    id: "WARM_CAT_COW",
    name: "Cat-Cow",
    targetMuscles: ["core", "lower_back", "shoulders", "rectus_abdominis"],
    category: "dynamic_core",
    description:
      "On all fours, alternate between rounding the spine (cat) and arching (cow). Mobilizes the entire spinal column.",
    defaultSets: 1,
    repRange: [8, 10],
    tempo: "3-0-2-0",
    restInterval: 10,
    biomechanicalNotes:
      "Initiate movement from the tailbone. Coordinate breath: inhale on cow, exhale on cat.",
  },

  // ── Pull ──────────────────────────────────────────────
  {
    id: "WARM_THORACIC_ROTATION",
    name: "Thoracic Spine Rotations",
    targetMuscles: ["mid_back", "rhomboids", "obliques", "scapular_stabilizers"],
    category: "scapular_mobility",
    description:
      "Side-lying or all-fours, rotate the upper spine open. Improves T-spine mobility for pulling exercises.",
    defaultSets: 1,
    repRange: [8, 10],
    tempo: "3-0-2-0",
    restInterval: 10,
    biomechanicalNotes: "Keep hips stable. Rotate through the ribcage, not the lower back.",
    isUnilateral: true,
  },
  {
    id: "WARM_SCAP_RETRACTIONS",
    name: "Scapular Retractions & Protractions",
    targetMuscles: ["rhomboids", "traps", "scapular_stabilizers", "mid_back"],
    category: "scapular_mobility",
    description:
      "Standing or prone, pinch shoulder blades together then spread them apart. Activates the scapular stabilizers.",
    defaultSets: 1,
    repRange: [10, 12],
    tempo: "2-0-1-0",
    restInterval: 10,
    biomechanicalNotes:
      "Focus on pure scapular movement — minimal arm involvement. Full range: pinch → protract.",
  },
  {
    id: "WARM_BAND_PULL_APART",
    name: "Band Pull-Aparts",
    targetMuscles: ["rear_deltoids", "rhomboids", "traps", "mid_back"],
    category: "horizontal_pull",
    description:
      "Hold a band or towel at chest height with straight arms, pull apart. Activates rear delts and upper back.",
    defaultSets: 1,
    repRange: [12, 15],
    tempo: "2-0-1-0",
    restInterval: 10,
    biomechanicalNotes:
      "Keep arms straight at shoulder height. Squeeze shoulder blades together at full extension.",
  },

  // ── Core ──────────────────────────────────────────────
  {
    id: "WARM_DEAD_BUG",
    name: "Dead Bug",
    targetMuscles: ["core", "rectus_abdominis", "lower_back", "obliques"],
    category: "dynamic_core",
    description:
      "Lie on back, arms extended up, legs in tabletop. Slowly extend opposite arm and leg. Core stability warm-up.",
    defaultSets: 1,
    repRange: [8, 10],
    tempo: "3-0-2-0",
    restInterval: 10,
    biomechanicalNotes:
      "Press lower back into the floor throughout. Extend only as far as you can without arching.",
    isUnilateral: true,
  },
  {
    id: "WARM_GLUTE_BRIDGE",
    name: "Glute Bridge",
    targetMuscles: ["glutes", "hamstrings", "lower_back"],
    category: "lower_body_pull",
    description:
      "Lie on back, knees bent, feet on floor. Drive hips up, squeezing glutes at the top. Activates posterior chain.",
    defaultSets: 1,
    repRange: [10, 12],
    tempo: "2-0-1-0",
    restInterval: 10,
    biomechanicalNotes: "Drive through the heels. Squeeze glutes hard at the top for 1-count hold.",
  },
  {
    id: "WARM_WORLDS_GREATEST",
    name: "World's Greatest Stretch",
    targetMuscles: ["hip_flexors", "mid_back", "shoulders", "glutes", "calves"],
    category: "lateral_mobility",
    description:
      "From a lunge position, rotate the torso toward the front leg, opening the hips and thoracic spine.",
    defaultSets: 1,
    repRange: [5, 6],
    tempo: "4-0-2-0",
    restInterval: 10,
    biomechanicalNotes:
      "Keep back knee off the ground. Rotate from the ribcage, not just the arms.",
    isUnilateral: true,
  },
];

function toExercise(e: WarmupEntry): Exercise {
  return {
    ...e,
    difficulty: "beginner",
    progressionPathway: "Mobility",
  };
}

const db: Exercise[] = warmupDb.map(toExercise);

export function getWarmupExerciseById(id: string): Exercise | undefined {
  return db.find((e) => e.id === id);
}

export function getAllWarmupExercises(): Exercise[] {
  return db;
}

export function getWarmupExercisesByZone(zone: WarmupZone): Exercise[] {
  const zoneMuscles: Record<WarmupZone, string[]> = {
    legs: ["hip_flexors", "hip_abductors", "hip_adductors", "calves", "glutes"],
    push: ["shoulders", "chest", "traps"],
    pull: ["rhomboids", "mid_back", "rear_deltoids", "scapular_stabilizers"],
    core: ["core", "rectus_abdominis", "obliques", "lower_back"],
  };
  const target = zoneMuscles[zone];
  return db.filter((e) => e.targetMuscles.some((m) => target.includes(m)));
}
