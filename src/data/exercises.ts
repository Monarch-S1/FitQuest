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

export const workoutA: WorkoutDay = {
  id: "workout-a",
  name: "WORKOUT A",
  focus: "Anterior Chain & Horizontal Pulling",
  recommendedFrequency: "Perform on non-consecutive days, alternating with Workout B",
  exercises: [
    {
      id: "bulgarian-split-squat",
      name: "Bulgarian Split Squat",
      targetMuscles: ["quadriceps", "glutes"],
      category: "unilateral_lower_push",
      description:
        "Isolate one leg by elevating the rear foot on a chair or couch. Shift weight onto the working leg. Apply a slow tempo to ensure continuous mechanical tension on the quadriceps and glutes, simulating heavy barbell squats.",
      isUnilateral: true,
      defaultSets: 3,
      repRange: [8, 15],
      tempo: "3-1-1-0",
      restInterval: 90,
      progressionPathway:
        "Increase rear foot elevation → Add weight (dumbbell) → Bulgarian jump squats",
      biomechanicalNotes:
        "Keep front knee aligned with toes. Do not let knee cave inward. Maintain upright torso throughout.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Elevate rear foot on platform (12-18 inches). Place front foot 2-3 feet forward.",
            focusPoint: "Shoulder-hip alignment",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Lower hips vertically until front thigh is parallel to floor. Drive up through front heel.",
            focusPoint: "Front heel drive",
          },
          {
            phase: "SAFETY",
            instruction:
              "Do not let front knee cave inward. Keep torso vertical to maximize quad load.",
            focusPoint: "Knee-toe alignment",
          },
        ],
        visuals: [
          { type: "angle", primaryJoint: "Knee", targetAngle: 90 },
          { type: "vector", primaryJoint: "Hip", direction: "down" },
        ],
      },
    },
    {
      id: "doorway-row",
      name: "Doorway Row",
      targetMuscles: ["lats", "rhomboids", "biceps"],
      category: "horizontal_pull",
      description:
        "Stand sideways facing a stable door frame. Grip the outer edge at chest height. Lean back with straight arms, keeping torso rigid through glute and abdominal bracing. Drive elbows back and down, pulling chest toward the frame and squeezing shoulder blades together.",
      defaultSets: 3,
      repRange: [10, 20],
      tempo: "3-0-2-1",
      restInterval: 90,
      progressionPathway: "Walk feet further forward (decrease body angle) → One-arm doorway row",
      biomechanicalNotes:
        "Lower body angle relative to floor increases gravitational resistance. Keep body in a straight line from head to heels.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Grip door frame with hands at chest height. Walk feet forward and lean back with straight arms.",
            focusPoint: "Core & glute bracing",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Drive elbows backward and down, pulling chest toward the door frame. Squeeze shoulder blades.",
            focusPoint: "Scapular retraction",
          },
          {
            phase: "SAFETY",
            instruction:
              "Avoid shrugging shoulders. Keep neck relaxed and body in a perfect straight line.",
            focusPoint: "Neutral spine",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Elbow", direction: "pull" },
          { type: "angle", primaryJoint: "Spine", targetAngle: 180 },
        ],
      },
    },
    {
      id: "decline-push-up",
      name: "Decline Push-Up",
      targetMuscles: ["chest", "shoulders", "triceps"],
      category: "horizontal_push",
      description:
        "Elevate feet to shift center of gravity forward, placing up to 77% of body weight on the hands. Keep body rigid through core engagement. Lower chest to ground with elbows at 45 degrees to torso.",
      defaultSets: 3,
      repRange: [8, 15],
      tempo: "3-1-2-0",
      restInterval: 90,
      progressionPathway: "Increase foot elevation → Pseudo-planche push-up → Weighted vest",
      biomechanicalNotes:
        "Standard push-up loads ~64% body mass at top, 69% at bottom. Feet elevation increases hand load significantly.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Place feet on an elevated platform. Place hands slightly wider than shoulders on floor.",
            focusPoint: "Plank position",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Lower chest to the floor by bending elbows to 45 degrees. Push floor away aggressively.",
            focusPoint: "Horizontal push",
          },
          {
            phase: "SAFETY",
            instruction: "Prevent lower back sagging by bracing abs and glutes. Keep head neutral.",
            focusPoint: "Anti-extension core",
          },
        ],
        visuals: [
          { type: "angle", primaryJoint: "Elbow", targetAngle: 90 },
          { type: "vector", primaryJoint: "Shoulder", direction: "push" },
        ],
      },
    },
    {
      id: "sliding-hamstring-curl",
      name: "Sliding Hamstring Curl",
      targetMuscles: ["hamstrings", "glutes"],
      category: "closed_chain_lower_pull",
      description:
        "Lying supine with heels on towels (on slick floor), bridge hips up and slowly slide heels away. Concentric knee flexion is executed by pulling the heels back while keeping glutes engaged.",
      defaultSets: 3,
      repRange: [8, 12],
      tempo: "4-0-2-0",
      restInterval: 90,
      progressionPathway: "Bilateral → Unilateral sliding → Add hip lift at top",
      biomechanicalNotes:
        "Use a slick surface (hardwood/tile) with towels or paper plates under heels. Keep hips elevated throughout.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Lie supine on floor, heels on sliders/towels. Bend knees slightly and lift hips into bridge.",
            focusPoint: "Glute engagement",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Slowly slide heels away until legs are straight, then pull heels back flexing hamstrings.",
            focusPoint: "Hamstring contraction",
          },
          {
            phase: "SAFETY",
            instruction:
              "Keep hips elevated and do not let lower back arch excessively during extension.",
            focusPoint: "Hip height maintenance",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Heel", direction: "pull" },
          { type: "angle", primaryJoint: "Hip", targetAngle: 180 },
        ],
      },
    },
    {
      id: "floor-tricep-extension",
      name: "Floor Tricep Extension",
      targetMuscles: ["triceps"],
      category: "elbow_extension",
      description:
        "Lying in a forearm plank position, contract triceps to press through palms and straighten elbows, lifting forearms off the ground. Adjust hand position further forward to reduce load and allow scaling to failure.",
      defaultSets: 2,
      repRange: [10, 15],
      tempo: "3-0-2-0",
      restInterval: 60,
      progressionPathway: "Move hands further from shoulders → Single arm → Add pause at top",
      biomechanicalNotes:
        "Keep elbows pinned to sides. Focus on full extension at the top of each rep.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Start in forearm plank. Position hands forward to adjust bodyweight leverage.",
            focusPoint: "Plank structure",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Press through palms to extend elbows fully, lifting forearms. Lower slowly under control.",
            focusPoint: "Elbow extension",
          },
          {
            phase: "SAFETY",
            instruction:
              "Keep elbows pinned in parallel. Do not let them flare outward under high load.",
            focusPoint: "Parallel elbow alignment",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Forearm", direction: "up" },
          { type: "angle", primaryJoint: "Elbow", targetAngle: 180 },
        ],
      },
    },
    {
      id: "hollow-body-hold",
      name: "Hollow Body Hold",
      targetMuscles: ["core"],
      category: "core_isometric",
      description:
        "Lay supine and contract the abdominal wall to eliminate the lumbar arch. Raise shoulders and legs slightly off the floor. Hold position while breathing steadily.",
      defaultSets: 3,
      repRange: [20, 45],
      tempo: "isometric",
      restInterval: 60,
      progressionPathway:
        "Fully extend arms and legs → Add weight behind head → Rocking hollow body",
      biomechanicalNotes:
        "The foundation of all advanced calisthenic core control. Press lower back into the floor throughout.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Lie flat on back. Lift legs and shoulders 2-3 inches off floor. Press lower back into ground.",
            focusPoint: "Posterior pelvic tilt",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Maintain high isometric abdominal contraction while breathing regularly. Hold body like a banana.",
            focusPoint: "Abdominal hollow",
          },
          {
            phase: "SAFETY",
            instruction:
              "If lower back lifts or arches off floor, raise legs higher to scale down load instantly.",
            focusPoint: "Lumbar contact check",
          },
        ],
        visuals: [
          { type: "isometric", primaryJoint: "Core" },
          { type: "angle", primaryJoint: "LowerBack", targetAngle: 180 },
        ],
      },
    },
  ],
};

export const workoutB: WorkoutDay = {
  id: "workout-b",
  name: "WORKOUT B",
  focus: "Posterior Chain & Vertical Pressing",
  recommendedFrequency: "Perform on non-consecutive days, alternating with Workout A",
  exercises: [
    {
      id: "nordic-hamstring-curl",
      name: "Nordic Hamstring Curl",
      targetMuscles: ["hamstrings"],
      category: "lower_body_pull",
      description:
        "Secure feet under a heavy couch or bed frame with padding under knees. Slowly lower torso toward the floor, using hamstrings eccentrically to resist gravity. Control descent as long as possible, then catch with hands and push back up.",
      defaultSets: 3,
      repRange: [5, 8],
      tempo: "5-0-1-0",
      restInterval: 120,
      progressionPathway: "Reduce hip flexion angle → Full eccentric → Add concentric at end",
      biomechanicalNotes:
        "Renowned for building eccentric strength and preventing hamstring strains. Use padding under knees.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Kneel with torso upright. Secure feet under anchor point with padding under knees.",
            focusPoint: "Ankle anchor stability",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Slowly fall forward by extending knees, resisting gravity with hamstrings. Catch with hands.",
            focusPoint: "Eccentric control",
          },
          {
            phase: "SAFETY",
            instruction:
              "Keep hips fully extended (straight line from knees to head). Avoid hinging at hips.",
            focusPoint: "Hip lockout",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Torso", direction: "down" },
          { type: "angle", primaryJoint: "Knee", targetAngle: 180 },
        ],
      },
    },
    {
      id: "decline-pike-push-up",
      name: "Decline Pike Push-Up",
      targetMuscles: ["shoulders", "chest", "triceps"],
      category: "vertical_push",
      description:
        "With feet elevated on an 18-inch platform, bend at the hips to form a 90-degree angle. Lower head toward floor by bending elbows. Project shoulders forward so head comes ahead of the fingers to form a tripod at the bottom.",
      defaultSets: 3,
      repRange: [6, 12],
      tempo: "3-1-1-0",
      restInterval: 120,
      progressionPathway:
        "Increase foot elevation → Wall bent-waist HSPU → Full wall handstand push-up",
      biomechanicalNotes:
        "Standard pike loads ~66% body weight on hands. Decline pike increases to ~77%. Keep vertical forearms throughout.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Elevate feet on bench/couch. Hinge at hips to form vertical torso (90-degree bend).",
            focusPoint: "Vertical handstand posture",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Lower head forward of fingers to form tripod at bottom, then press back and up.",
            focusPoint: "Tripod push pathway",
          },
          {
            phase: "SAFETY",
            instruction: "Keep forearms perfectly vertical. Avoid letting elbows flare wide.",
            focusPoint: "Scapular depression",
          },
        ],
        visuals: [
          { type: "angle", primaryJoint: "Hip", targetAngle: 90 },
          { type: "vector", primaryJoint: "Shoulder", direction: "push" },
        ],
      },
    },
    {
      id: "one-arm-towel-row",
      name: "One-Arm Towel Row",
      targetMuscles: ["lats", "rhomboids", "obliques"],
      category: "unilateral_horizontal_pull",
      description:
        "Place a heavy knot in a towel and wedge it securely over a closed door. Grip the towel end with one hand. Lean back, brace torso, and initiate pull from mid-back keeping elbow tucked. The anti-rotational torque engages obliques and deep spinal stabilizers intensely.",
      isUnilateral: true,
      defaultSets: 3,
      repRange: [8, 12],
      tempo: "2-1-2-1",
      restInterval: 90,
      progressionPathway: "Decrease lean angle relative to floor → Add pause at full contraction",
      biomechanicalNotes:
        "Requires high-intensity isometric contraction of obliques and multifidus to prevent torso rotation.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Grip towel securely with one hand. Stand sideways and lean back with braced core.",
            focusPoint: "Anti-rotation brace",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Pull chest toward hand, keeping elbow close to side and shoulder blade retracted.",
            focusPoint: "Unilateral pull strength",
          },
          {
            phase: "SAFETY",
            instruction:
              "Prevent torso rotation. Keep shoulders and hips square to the door/anchor.",
            focusPoint: "Anti-rotational control",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Elbow", direction: "pull" },
          { type: "angle", primaryJoint: "Shoulder", targetAngle: 45 },
        ],
      },
    },
    {
      id: "prone-swimmers",
      name: "Prone Swimmers",
      targetMuscles: ["traps", "rhomboids", "rotator_cuff", "lower_back"],
      category: "scapular_mobility",
      description:
        "Lying face down with arms overhead, circle the arms laterally to the sides. Rotate palms upward at the 90-degree mark and squeeze shoulder blades aggressively to lift hands toward the ceiling.",
      defaultSets: 3,
      repRange: [10, 15],
      tempo: "2-1-2-1",
      restInterval: 60,
      progressionPathway: "Maximize shoulder elevation height → Add slow eccentric phase",
      biomechanicalNotes:
        "Often triggers localized cramping in underused posterior fibers. Focus on scapular retraction at the top.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Lie face down with arms extended overhead, thumbs pointing up. Keep forehead hovering.",
            focusPoint: "Hovering start",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Sweep arms back in wide arc. Rotate shoulders to sweep hands behind back, squeezing scapula.",
            focusPoint: "Scapular rotation",
          },
          {
            phase: "SAFETY",
            instruction:
              "Keep chest and head steady. Do not hyper-extend lumbar spine to gain range.",
            focusPoint: "Scapular isolation",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Shoulder", direction: "lateral" },
          { type: "angle", primaryJoint: "Scapula", targetAngle: 90 },
        ],
      },
    },
    {
      id: "sliding-chest-fly",
      name: "Sliding Chest Fly",
      targetMuscles: ["chest", "shoulders"],
      category: "horizontal_adduction",
      description:
        "From a high plank position on a slick floor with towels under hands, open the arms in a wide horizontal arc. The floor acts as a structural stop preventing hyperextension. Drive hands together concentrically with explosive intent.",
      defaultSets: 3,
      repRange: [6, 10],
      tempo: "4-1-2-0",
      restInterval: 90,
      progressionPathway: "Increase lateral slide distance → Pause at full stretch → Single arm",
      biomechanicalNotes:
        "Safer than dumbbell flyes due to floor providing range-of-motion limit. Delivers intense mechanical tension.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Start in high plank on slick floor with towels under hands. Keep body rigid.",
            focusPoint: "Plank foundation",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Slide hands out laterally under control until chest is near floor. Squeeze hands together to return.",
            focusPoint: "Pectoral squeeze",
          },
          {
            phase: "SAFETY",
            instruction:
              "The floor acts as a structural stop. Never stretch beyond absolute shoulder control.",
            focusPoint: "Shoulder socket protection",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Chest", direction: "lateral" },
          { type: "angle", primaryJoint: "Shoulder", targetAngle: 180 },
        ],
      },
    },
    {
      id: "dragon-flag-progression",
      name: "Dragon Flag Progression",
      targetMuscles: ["core", "lats"],
      category: "dynamic_core",
      description:
        "Grip an anchor point behind the head (heavy couch leg or table leg). Lift body into a vertical line (tucked, then open) and lower it under control keeping hips and spine perfectly aligned.",
      defaultSets: 3,
      repRange: [5, 10],
      tempo: "4-1-2-0",
      restInterval: 90,
      progressionPathway: "Closed tuck → Open tuck → Half lay → Full straight-leg dragon flag",
      biomechanicalNotes:
        "Requires high-level coordination and isometric strength across the entire anterior chain and shoulder extensors.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Lie supine. Grip heavy anchor point behind head. Roll weight up onto upper shoulders.",
            focusPoint: "Upper back base",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Lift body in a straight line (or tucked). Lower under absolute control using core and lats.",
            focusPoint: "Anti-gravity descent",
          },
          {
            phase: "SAFETY",
            instruction:
              "Never load weight onto the cervical spine (neck). Ensure load is entirely on shoulder blades.",
            focusPoint: "Cervical spine safety",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Hips", direction: "down" },
          { type: "angle", primaryJoint: "Torso", targetAngle: 180 },
        ],
      },
    },
  ],
};

export const workoutC: WorkoutDay = {
  id: "workout-c",
  name: "WORKOUT C",
  focus: "Pull & Core — Vertical Pulling, Biceps, Glutes, Posterior Core",
  recommendedFrequency: "Perform on non-consecutive days, rotating with Workouts A, B, and D",
  exercises: [
    {
      id: "doorframe-pull-up-negative",
      name: "Doorframe Pull-Up Negative",
      targetMuscles: ["lats", "biceps", "rhomboids"],
      category: "vertical_pull",
      description:
        "Stand facing a sturdy doorframe. Jump up to grip the top of the frame with both hands (or use a chair to get into the top position). Lower yourself as slowly as possible — aim for 5+ seconds of eccentric control. This builds the foundational strength for a full pull-up.",
      defaultSets: 3,
      repRange: [3, 8],
      tempo: "5-0-0-0",
      restInterval: 90,
      progressionPathway:
        "Jump assist → Slow negative (5s+) → Add concentric at top → Full pull-up",
      biomechanicalNotes:
        "The eccentric phase creates more muscle damage and tension than concentric, making negatives the fastest path to your first pull-up. Keep shoulders packed down and back.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Jump or step to top position with chin above hands. Grip securely, engage lats by pulling shoulders down.",
            focusPoint: "Scapular depression",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Lower body under absolute control. Count 5 seconds on the descent. Keep core braced.",
            focusPoint: "Slow eccentric descent",
          },
          {
            phase: "SAFETY",
            instruction:
              "Ensure doorframe is sturdy and can support your weight. Land softly on feet at bottom.",
            focusPoint: "Secure anchor point",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Elbow", direction: "pull" },
          { type: "angle", primaryJoint: "Shoulder", targetAngle: 180 },
        ],
      },
    },
    {
      id: "towel-bicep-curl",
      name: "Towel Bicep Curl",
      targetMuscles: ["biceps"],
      category: "elbow_flexion",
      description:
        "Sit on the floor with legs extended. Loop a towel around your foot, gripping each end with hands in a supinated (palms-up) position. Keeping elbows pinned to your sides, curl the towel toward your shoulders by flexing the biceps. The towel tension provides variable resistance throughout the range of motion.",
      defaultSets: 3,
      repRange: [10, 20],
      tempo: "2-0-2-1",
      restInterval: 60,
      progressionPathway:
        "Increase towel tension by leaning back → One-arm curl → Slower tempo (3-0-3-1)",
      biomechanicalNotes:
        "The towel creates constant tension through the entire curl. Keep wrists neutral and avoid using body momentum. Squeeze biceps hard at the top.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Sit with legs extended. Loop towel around foot, grip ends with palms facing up. Sit up tall.",
            focusPoint: "Elbows pinned to sides",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Curl towel toward shoulders by flexing elbows. Squeeze biceps at top, lower under control.",
            focusPoint: "Supinated grip curl",
          },
          {
            phase: "SAFETY",
            instruction: "Do not rock torso to generate momentum. Keep wrists straight throughout.",
            focusPoint: "Strict form",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Forearm", direction: "up" },
          { type: "angle", primaryJoint: "Elbow", targetAngle: 45 },
        ],
      },
    },
    {
      id: "glute-bridge-march",
      name: "Glute Bridge March",
      targetMuscles: ["glutes", "core", "hamstrings"],
      category: "lower_body_pull",
      description:
        "Lie supine with knees bent, feet flat on floor. Drive hips up into a full glute bridge. While keeping hips elevated and stable, alternate lifting one foot slightly off the ground, marching in place. The core must work to prevent hip drop or rotation.",
      defaultSets: 3,
      repRange: [8, 14],
      tempo: "2-1-2-0",
      restInterval: 60,
      progressionPathway:
        "Bilateral bridge → Marching bridge (unstable) → Single-leg glute bridge → Weighted",
      biomechanicalNotes:
        "The marching component adds an anti-rotation challenge to the core while maintaining constant glute activation. Squeeze glutes at the top of each rep.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Lie supine, knees bent 90 degrees, feet hip-width apart. Arms at sides for stability.",
            focusPoint: "Neutral pelvis",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Drive hips up squeezing glutes. Lift one foot 2-3 inches, hold for one breath, lower and alternate.",
            focusPoint: "Hip stability during march",
          },
          {
            phase: "SAFETY",
            instruction:
              "Keep hips level — do not let them drop when lifting a foot. Brace core throughout.",
            focusPoint: "Anti-rotation control",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Hip", direction: "up" },
          { type: "isometric", primaryJoint: "Core" },
        ],
      },
    },
    {
      id: "reverse-plank",
      name: "Reverse Plank Hold",
      targetMuscles: ["core", "shoulders", "glutes", "hamstrings"],
      category: "core_isometric",
      description:
        "Sit with legs extended and hands planted behind hips, fingers pointing forward. Press through hands and heels to lift hips toward the ceiling, creating a straight line from shoulders to heels. Hold while breathing steadily. This targets the posterior chain and rear deltoids.",
      defaultSets: 3,
      repRange: [20, 45],
      tempo: "isometric",
      restInterval: 60,
      progressionPathway:
        "Bent knee → Full straight-leg → Single-leg lift → Reverse plank leg raise",
      biomechanicalNotes:
        "The reverse plank balances the anterior-chain dominance of the hollow body hold. Keep shoulders packed down and chest open. Squeeze glutes to maintain hip height.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Sit with legs extended, hands behind hips, fingers pointing forward. Engage shoulder blades.",
            focusPoint: "Shoulder packing",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Press hips up to form a straight line from shoulders to heels. Hold and breathe.",
            focusPoint: "Straight line alignment",
          },
          {
            phase: "SAFETY",
            instruction:
              "If wrists are uncomfortable, make fists or use palms. Keep neck neutral, eyes forward.",
            focusPoint: "Wrist and neck safety",
          },
        ],
        visuals: [
          { type: "isometric", primaryJoint: "Core" },
          { type: "angle", primaryJoint: "Hip", targetAngle: 180 },
        ],
      },
    },
    {
      id: "table-row",
      name: "Table Row",
      targetMuscles: ["lats", "rhomboids", "biceps"],
      category: "horizontal_pull",
      description:
        "Lie under a sturdy table (or low desk) and grip the edge at chest height. Keep body rigid in a straight line from head to heels. Pull your chest up toward the underside of the table, driving elbows back and squeezing shoulder blades together. The lower your body angle, the harder the exercise.",
      defaultSets: 3,
      repRange: [8, 15],
      tempo: "3-0-2-1",
      restInterval: 90,
      progressionPathway: "Walk feet forward (steeper angle) → One-arm table row → Feet elevated",
      biomechanicalNotes:
        "Body angle relative to floor determines resistance — flatter is harder. Keep neck neutral and gaze forward throughout.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Lie under a sturdy table. Grip the edge at chest height. Walk feet away until body is at an angle.",
            focusPoint: "Straight body line",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Pull chest toward the table by driving elbows back. Squeeze shoulder blades together at top.",
            focusPoint: "Scapular retraction",
          },
          {
            phase: "SAFETY",
            instruction:
              "Ensure table is stable and won't tip. Avoid shrugging shoulders during the pull.",
            focusPoint: "Stable anchor point",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Elbow", direction: "pull" },
          { type: "angle", primaryJoint: "Torso", targetAngle: 45 },
        ],
      },
    },
    {
      id: "dead-bug",
      name: "Dead Bug",
      targetMuscles: ["core", "obliques"],
      category: "dynamic_core",
      description:
        "Lie supine with arms extended toward the ceiling and legs in a tabletop position (knees at 90 degrees, shins parallel to floor). Press lower back into the floor. Slowly extend one leg and the opposite arm toward the floor, keeping the lower back pressed down. Return and alternate sides.",
      defaultSets: 3,
      repRange: [8, 14],
      tempo: "3-0-2-0",
      restInterval: 60,
      progressionPathway: "Leg-only dead bug → Opposite arm/leg → Slow tempo (4-0-3-0) → Weighted",
      biomechanicalNotes:
        "The dead bug trains anti-extension core stability in a dynamic pattern. The key is maintaining lumbar contact with the floor — if the back arches, reduce range of motion.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Lie supine with arms straight up and legs in tabletop. Press lower back firmly into floor.",
            focusPoint: "Lumbar floor contact",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Slowly extend right arm and left leg toward floor. Return to start. Alternate sides.",
            focusPoint: "Controlled extension",
          },
          {
            phase: "SAFETY",
            instruction:
              "If lower back lifts off floor, reduce extension range. Move slowly, never with momentum.",
            focusPoint: "Anti-extension",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Arm", direction: "down" },
          { type: "vector", primaryJoint: "Leg", direction: "down" },
        ],
      },
    },
  ],
};

export const workoutD: WorkoutDay = {
  id: "workout-d",
  name: "WORKOUT D",
  focus: "Dynamic & Mobility — Explosive Power, Lateral Movement, Shoulder Health",
  recommendedFrequency: "Perform on non-consecutive days, rotating with Workouts A, B, and C",
  exercises: [
    {
      id: "jump-squat",
      name: "Jump Squat",
      targetMuscles: ["quadriceps", "glutes", "hamstrings"],
      category: "unilateral_lower_push",
      description:
        "Stand with feet shoulder-width apart. Lower into a squat until thighs are parallel to the floor. Explode upward into a jump, extending fully at hips, knees, and ankles. Land softly with bent knees to absorb impact, immediately descending into the next rep.",
      defaultSets: 3,
      repRange: [6, 12],
      tempo: "2-0-1-0",
      restInterval: 90,
      progressionPathway:
        "Small jumps → Maximum vertical height → Tuck jumps (knees to chest in air)",
      biomechanicalNotes:
        "Plyometric movement that develops explosive lower body power. Land softly — the ability to absorb force is as important as producing it.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Stand with feet shoulder-width apart, chest up, core braced. Arms at sides ready to swing.",
            focusPoint: "Athletic stance",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Squat to parallel, then explode up. Swing arms overhead for momentum. Land softly, absorbing through legs.",
            focusPoint: "Explosive triple extension",
          },
          {
            phase: "SAFETY",
            instruction:
              "Land with soft knees — never locked. Keep knees tracking over toes on descent and landing.",
            focusPoint: "Soft landing mechanics",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Hip", direction: "up" },
          { type: "angle", primaryJoint: "Knee", targetAngle: 90 },
        ],
      },
    },
    {
      id: "archer-push-up-progression",
      name: "Archer Push-Up Progression",
      targetMuscles: ["chest", "shoulders", "triceps"],
      category: "horizontal_push",
      description:
        "Start in a wide push-up stance with hands placed well beyond shoulder width. Shift your weight to one side, bending that elbow while keeping the other arm fully extended. Lower your chest toward the bent hand, then press back up. This unilateral loading builds chest strength unevenly for the eventual full archer push-up.",
      defaultSets: 3,
      repRange: [4, 10],
      tempo: "3-0-2-0",
      restInterval: 90,
      progressionPathway:
        "Incline archer → Floor with partial ROM → Full archer (straight arm locked) → Archer on fists",
      biomechanicalNotes:
        "Archer push-ups load ~80% of body weight onto one arm. Keep the extended arm's shoulder packed down to protect the rotator cuff.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Hands wide (2x shoulder width), fingers pointing forward. Body in a rigid plank.",
            focusPoint: "Wide hand placement",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Shift weight to one side, bend that elbow. Keep opposite arm locked straight. Lower and press.",
            focusPoint: "Unilateral loading",
          },
          {
            phase: "SAFETY",
            instruction:
              "Keep shoulders packed down — don't let the extended arm's shoulder shrug up toward the ear.",
            focusPoint: "Scapular stability",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Chest", direction: "push" },
          { type: "angle", primaryJoint: "Elbow", targetAngle: 90 },
        ],
      },
    },
    {
      id: "cossack-squat",
      name: "Cossack Squat",
      targetMuscles: ["quadriceps", "glutes", "hamstrings"],
      category: "lateral_mobility",
      description:
        "Stand with feet set wide (2-3x shoulder width). Shift your weight onto one leg as you bend that knee, keeping the other leg straight with toes pointing forward or slightly out. Lower until the bent knee reaches 90 degrees, keeping the heel planted. Push through the bent leg to return to center, then alternate.",
      defaultSets: 3,
      repRange: [6, 10],
      tempo: "3-0-2-0",
      restInterval: 90,
      progressionPathway:
        "Shallow ROM → 90-degree depth → Full ROM with heel planted → Hands-free (no support)",
      biomechanicalNotes:
        "Cossack squats build hip mobility and adductor flexibility while loading the working leg. Keep the heel of the bent leg grounded throughout — if it lifts, reduce depth.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Stand with feet wide (2-3x shoulder width), toes pointing forward. Brace core.",
            focusPoint: "Wide, stable base",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Shift weight onto one leg, bend that knee, keeping other leg straight. Lower to 90 degrees.",
            focusPoint: "Heel planted",
          },
          {
            phase: "SAFETY",
            instruction:
              "Keep the straight leg's foot flat and knee slightly soft. Avoid locking out the straight knee.",
            focusPoint: "Knee safety",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Hip", direction: "lateral" },
          { type: "angle", primaryJoint: "Knee", targetAngle: 90 },
        ],
      },
    },
    {
      id: "scapular-push-up",
      name: "Scapular Push-Up",
      targetMuscles: ["traps", "core", "chest"],
      category: "scapular_mobility",
      description:
        "Start in a standard plank or push-up position with arms fully locked. Without bending your elbows, protract your shoulder blades (push your upper back toward the ceiling) by rounding the upper back. Then retract by pulling shoulder blades together, lowering your chest slightly. This isolates the scapular stabilizers.",
      defaultSets: 3,
      repRange: [10, 15],
      tempo: "2-1-2-1",
      restInterval: 60,
      progressionPathway: "Knee plank → Full plank → Plank with feet elevated → Push-up plus",
      biomechanicalNotes:
        "Scapular push-ups build the serratus anterior and lower traps — crucial for shoulder health and overhead stability. Do not allow any elbow bending.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Start in plank position, arms straight, shoulders over wrists. Body in a straight line.",
            focusPoint: "Plank alignment",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Without bending elbows, push upper back toward ceiling (protract). Then squeeze shoulder blades together (retract).",
            focusPoint: "Scapular protraction and retraction",
          },
          {
            phase: "SAFETY",
            instruction:
              "Keep arms locked throughout — only the shoulder blades should move. Maintain neutral spine.",
            focusPoint: "Arm lockout",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Scapula", direction: "up" },
          { type: "vector", primaryJoint: "Scapula", direction: "pull" },
        ],
      },
    },
    {
      id: "single-leg-glute-bridge",
      name: "Single-Leg Glute Bridge",
      targetMuscles: ["glutes", "hamstrings", "core"],
      category: "lower_body_pull",
      description:
        "Lie supine with one knee bent and foot flat on the floor, the other leg extended straight (hovering just above the ground). Drive through the planted heel to lift hips toward the ceiling, squeezing the glute at the top. Keep the extended leg raised throughout. This isolates each glute individually, correcting imbalances.",
      isUnilateral: true,
      defaultSets: 3,
      repRange: [8, 14],
      tempo: "3-1-2-0",
      restInterval: 60,
      progressionPathway:
        "Bilateral bridge → Single-leg bridge → Elevated foot single-leg → Add pause at top (3s)",
      biomechanicalNotes:
        "Unilateral glute work is essential for correcting hip imbalances. The extended leg acts as a lever, increasing demand on the working glute. Keep hips square and level.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Lie supine, one knee bent with foot flat, other leg extended straight hovering above ground.",
            focusPoint: "Neutral pelvis start",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Drive through the planted heel, lift hips high. Squeeze glute at top for 1 second. Lower under control.",
            focusPoint: "Glute squeeze at apex",
          },
          {
            phase: "SAFETY",
            instruction:
              "Keep hips level — do not rotate or drop one side. If cramping occurs, reduce range of motion.",
            focusPoint: "Hip squareness",
          },
        ],
        visuals: [
          { type: "vector", primaryJoint: "Hip", direction: "up" },
          { type: "angle", primaryJoint: "Knee", targetAngle: 90 },
        ],
      },
    },
    {
      id: "l-sit-progression",
      name: "L-Sit Progression",
      targetMuscles: ["core", "shoulders", "quadriceps"],
      category: "core_isometric",
      description:
        "Sit on the floor with legs extended. Place hands flat on the floor beside your hips, fingers pointing forward. Press through your palms to depress the shoulders and lift your entire body off the floor. Hold with legs extended forward (or tucked for the easier version). The straighter the legs, the harder the hold.",
      defaultSets: 3,
      repRange: [5, 20],
      tempo: "isometric",
      restInterval: 90,
      progressionPathway:
        "One foot on floor → Tuck L-sit (knees to chest) → Advanced tuck → Full L-sit → V-sit",
      biomechanicalNotes:
        "The L-sit is a fundamental calisthenics skill requiring extreme core compression and shoulder depression. Press the floor away actively — don't just support weight. Point toes.",
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction:
              "Sit on floor, legs extended. Place hands beside hips, fingers forward. Depress shoulders.",
            focusPoint: "Shoulder depression",
          },
          {
            phase: "EXECUTION",
            instruction:
              "Press through palms to lift body off floor. Keep legs extended (or tucked for progression). Hold.",
            focusPoint: "Active compression",
          },
          {
            phase: "SAFETY",
            instruction:
              "Keep shoulders packed down — never shrug up. If wrists hurt, lean slightly forward to change angle.",
            focusPoint: "Shoulder packing",
          },
        ],
        visuals: [
          { type: "isometric", primaryJoint: "Core" },
          { type: "angle", primaryJoint: "Hip", targetAngle: 90 },
        ],
      },
    },
  ],
};
