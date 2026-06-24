export type MuscleGroup =
  | "quadriceps"
  | "glutes"
  | "hamstrings"
  | "chest"
  | "shoulders"
  | "triceps"
  | "biceps"
  | "lats"
  | "rhomboids"
  | "traps"
  | "lower_back"
  | "core"
  | "obliques"
  | "rotator_cuff"
  | "forearms"
  | "calves"
  | "upper_chest"
  | "mid_back"
  | "rear_deltoids"
  | "grip"
  | "upper_rectus_abdominis"
  | "lower_rectus_abdominis"
  | "hip_flexors"
  | "hip_abductors"
  | "serratus_anterior"
  | "hip_adductors"
  | "scapular_stabilizers"
  | "rectus_abdominis";

export type MovementCategory =
  | "unilateral_lower_push"
  | "horizontal_pull"
  | "horizontal_push"
  | "closed_chain_lower_pull"
  | "elbow_extension"
  | "elbow_flexion"
  | "core_isometric"
  | "lower_body_pull"
  | "vertical_push"
  | "vertical_pull"
  | "unilateral_horizontal_pull"
  | "scapular_mobility"
  | "horizontal_adduction"
  | "lateral_mobility"
  | "dynamic_core";

export type DifficultyTier = "beginner" | "intermediate" | "advanced";

export type Tempo = `${number}-${number}-${number}-${number}` | "isometric";

export interface FormCheckpoint {
  phase: "SETUP" | "EXECUTION" | "SAFETY";
  instruction: string;
  focusPoint: string;
}

export interface BiomechanicalVisual {
  type: "vector" | "angle" | "isometric";
  primaryJoint: string;
  targetAngle?: number;
  direction?: "up" | "down" | "lateral" | "pull" | "push" | "hold";
}

export interface Exercise {
  id: string;
  name: string;
  targetMuscles: MuscleGroup[];
  category: MovementCategory;
  description: string;
  difficulty?: DifficultyTier;
  defaultSets: number;
  repRange: [number, number];
  tempo: Tempo;
  restInterval: number; // seconds
  progressionPathway: string;
  biomechanicalNotes?: string;
  /** True for single-side exercises (Bulgarian split squat, one-arm rows, etc.)
   *  Each set should be performed per side, doubling total volume. */
  isUnilateral?: boolean;
  visualGuide?: {
    checkpoints: FormCheckpoint[];
    visuals: BiomechanicalVisual[];
  };
}

export interface WorkoutDay {
  id: string;
  name: string;
  focus: string;
  exercises: Exercise[];
  recommendedFrequency: string;
}
