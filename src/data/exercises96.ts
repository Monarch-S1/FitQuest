/**
 * ARCH 96-Exercise Progression Database
 *
 * 8 movement pathways × 12 levels = 96 exercises
 * Structured from Level 1 (Absolute Beginner) to Level 12 (Elite).
 *
 * Extends the Exercise interface with pathway metadata (pathwayId,
 * pathwayLevel, overloadMechanism) for the Skill Tree system.
 */

import { Exercise, Tempo, MuscleGroup, MovementCategory } from "./exercises";
import { PathwayId } from "./pathways";

// ─── Extended exercise type ────────────────────────

export interface Exercise96 extends Exercise {
  pathwayId: PathwayId;
  pathwayLevel: number; // 1-12
  overloadMechanism: string;
}

// ─── Shortcut helpers ──────────────────────────────

const M = (ids: MuscleGroup[]): MuscleGroup[] => ids;

function E(
  id: string,
  name: string,
  pw: PathwayId,
  lv: number,
  target: MuscleGroup[],
  cat: MovementCategory,
  desc: string,
  sets: number = 3,
  reps: [number, number] = [8, 15],
  tempo: Tempo = "3-1-2-0",
  rest: number = 90,
  overload: string = "",
  unilateral: boolean = false,
  notes?: string,
): Exercise96 {
  const tiers: Record<number, "beginner" | "intermediate" | "advanced"> = {
    1: "beginner", 2: "beginner", 3: "beginner",
    4: "intermediate", 5: "intermediate", 6: "intermediate",
    7: "advanced", 8: "advanced", 9: "advanced",
    10: "advanced", 11: "advanced", 12: "advanced",
  };
  return {
    id, name, pathwayId: pw, pathwayLevel: lv,
    targetMuscles: target, category: cat,
    difficulty: tiers[lv] ?? "beginner",
    description: desc,
    defaultSets: sets,
    repRange: reps,
    tempo,
    restInterval: rest,
    progressionPathway: `${tiers[lv]?.toUpperCase() ?? "BEGINNER"} → Next level`,
    biomechanicalNotes: notes,
    isUnilateral: unilateral,
    overloadMechanism: overload || desc,
  };
}

// ═══════════════════════════════════════════════════
// PATHWAY 1: Horizontal Push (HP) — Lv 1-12
// ═══════════════════════════════════════════════════

const HP: Exercise96[] = [
  E("HP1","Wall Push-up","hp",1,M(["chest","shoulders"]),"horizontal_push",
    "Stand arm's length from wall, hands at shoulder height. Lean in, lower chest to wall. High incline = lowest load.",
    3,[10,20],"3-0-2-0",60,"High incline angle; lowest relative load"),
  E("HP2","Incline Push-up (Hands Elevated)","hp",2,M(["chest","shoulders","triceps"]),"horizontal_push",
    "Hands on couch/bench/stairs. Lower chest to hands. Medium incline increases lower pec load.",
    3,[10,20],"3-0-2-0",60,"Medium incline; increases load on lower chest"),
  E("HP3","Knee Push-up","hp",3,M(["chest","shoulders","triceps"]),"horizontal_push",
    "Plank on knees (ankles crossed). Lower chest to floor. Short lever = ~50% bodyweight.",
    3,[8,15],"3-1-2-0",60,"Shortened lever length (pivot at knees)"),
  E("HP4","Standard Push-up","hp",4,M(["chest","shoulders","triceps","core"]),"horizontal_push",
    "Full plank, hands shoulder-width. Lower chest nearly to floor. ~66% bodyweight resistance.",
    3,[8,15],"3-1-2-0",90,"Full body length lever; ~66% bodyweight"),
  E("HP5","Wide-Grip Push-up","hp",5,M(["chest","shoulders"]),"horizontal_push",
    "Hands 2x shoulder width. Lower with elbows flared. Maximizes outer chest stretch.",
    3,[8,12],"3-1-2-0",90,"Increased lateral lever; max chest stretch"),
  E("HP6","Diamond Push-up","hp",6,M(["triceps","chest"]),"horizontal_push",
    "Hands together under chest forming diamond. Triceps-targeting narrow base.",
    3,[8,12],"3-1-2-0",90,"Narrow base; increases elbow extension demand"),
  E("HP7","Decline Push-up (Feet Elevated)","hp",7,M(["upper_chest","shoulders","triceps"]),"horizontal_push",
    "Feet elevated on platform. ~77% bodyweight on hands. Targets upper pecs.",
    3,[8,12],"3-1-2-0",90,"Decreased angle; ~77% bodyweight"),
  E("HP8","Pseudo-Planche Push-up","hp",8,M(["shoulders","chest","triceps"]),"horizontal_push",
    "Forward lean with hands near hips. Extreme mechanical disadvantage for anterior delts.",
    3,[6,10],"3-1-2-0",120,"Forward shoulder lean; mechanical disadvantage"),
  E("HP9","Sliding Chest Fly (Towels)","hp",9,M(["chest","shoulders"]),"horizontal_adduction",
    "High plank with towels under hands. Open arms wide, squeeze hands together. Floor limits ROM safely.",
    3,[6,10],"4-1-2-0",90,"Horizontal shoulder adduction; eccentric stretch"),
  E("HP10","Archer Push-up","hp",10,M(["chest","shoulders","triceps"]),"horizontal_push",
    "Wide hands, shift weight to one side. One arm bends, other stays locked. ~80% BW on one arm.",
    3,[4,8],"3-0-2-0",120,"Bilaterally asymmetric; side-to-side transition"),
  E("HP11","One-Arm Incline Push-up","hp",11,M(["chest","shoulders","core"]),"horizontal_push",
    "Single-arm push-up on elevated surface. Core must resist rotation. Direct unilateral loading.",
    3,[4,8],"3-0-2-0",120,"Direct single-arm load on incline"),
  E("HP12","One-Arm Floor Push-up","hp",12,M(["chest","shoulders","core"]),"horizontal_push",
    "Full one-arm push-up on floor. Maximum unilateral chest load with massive core stabilization.",
    3,[3,6],"3-1-2-0",120,"Absolute maximum load; core stabilization"),
];

// ═══════════════════════════════════════════════════
// PATHWAY 2: Vertical Push (VP) — Lv 1-12
// ═══════════════════════════════════════════════════

const VP: Exercise96[] = [
  E("VP1","Pike Shrugs (Hands Elevated)","vp",1,M(["traps","shoulders"]),"vertical_push",
    "Hands elevated on surface, pike position. Scapular elevation focus. Low angle overhead load.",
    3,[10,15],"2-1-2-1",60,"Low angle overhead load; scapular elevation"),
  E("VP2","Incline Pike Push-up","vp",2,M(["shoulders","triceps"]),"vertical_push",
    "Hands on elevated surface, hips high. Partial bodyweight overhead press. High angle.",
    3,[8,15],"3-1-1-0",60,"High angle; partial bodyweight overhead press"),
  E("VP3","Flat-Ground Pike Push-up","vp",3,M(["shoulders","triceps"]),"vertical_push",
    "Hands on floor, hips bent 90 degrees. Head travels forward of hands. Proper pike mechanics.",
    3,[8,12],"3-1-1-0",90,"90-degree hip bend; head past hands"),
  E("VP4","Decline Pike Push-up (Feet 12\")","vp",4,M(["shoulders","triceps","upper_chest"]),"vertical_push",
    "Feet elevated 12 inches. More mass shifts to shoulders. ~70% BW on hands.",
    3,[6,12],"3-1-1-0",90,"Elevated feet transfer mass to shoulders"),
  E("VP5","High-Decline Pike Push-up (Feet 18\")","vp",5,M(["shoulders","triceps"]),"vertical_push",
    "Feet elevated 18 inches. Mimics ~77% of full handstand press. High shoulder demand.",
    3,[6,10],"3-1-1-0",90,"High elevation; ~77% of handstand press"),
  E("VP6","Floor Triceps Extension (Tiger Bend)","vp",6,M(["triceps","shoulders"]),"elbow_extension",
    "From forearm plank, press through palms to straighten elbows. Triceps isolation.",
    3,[8,15],"3-0-2-0",60,"Elbow isolation; pressing forearms to high plank"),
  E("VP7","Wall-Assisted Handstand Hold","vp",7,M(["shoulders","core","traps"]),"vertical_push",
    "Chest-to-wall handstand hold. Isometric shoulder endurance. Aligns body vertically.",
    3,[15,45],"isometric",60,"Isometric endurance; vertical body alignment"),
  E("VP8","Wall Handstand Shrugs","vp",8,M(["traps","shoulders"]),"vertical_push",
    "In handstand against wall, perform scapular elevation/depression. Active shoulder control.",
    3,[8,12],"2-1-2-0",90,"Active scapular elevation/depression upside down"),
  E("VP9","Partial Handstand Push-up (Chest-to-Wall)","vp",9,M(["shoulders","triceps"]),"vertical_push",
    "Lower head partway down wall. Eccentric and partial range vertical push.",
    3,[5,10],"4-0-1-0",120,"Eccentric and partial range vertical push"),
  E("VP10","Back-to-Wall Handstand Push-up","vp",10,M(["shoulders","triceps"]),"vertical_push",
    "Back to wall, full ROM HSPU. Arch allowed for stability. Full vertical load.",
    3,[3,8],"3-0-1-0",120,"Full vertical load; back arch for stability"),
  E("VP11","Chest-to-Wall Handstand Push-up","vp",11,M(["shoulders","triceps","core"]),"vertical_push",
    "Chest to wall, strict vertical trajectory. Requires absolute shoulder power. No arch.",
    3,[3,6],"3-0-1-0",120,"Strict vertical; absolute shoulder power"),
  E("VP12","Freestanding Handstand Push-up","vp",12,M(["shoulders","triceps","core","traps"]),"vertical_push",
    "No wall support. Maximum shoulder girdle strength with active balance control. Elite skill.",
    3,[1,5],"3-0-1-0",120,"Maximum strength + active balance control"),
];

// ═══════════════════════════════════════════════════
// PATHWAY 3: Horizontal Pull (HPLL) — Lv 1-12
// ═══════════════════════════════════════════════════

const HPLL: Exercise96[] = [
  E("HPLL1","Supine Scapular Retractions","hpll",1,M(["rhomboids","traps","core"]),"horizontal_pull",
    "Lie face-up, arms at sides. Press upper back off floor slightly using scapular retraction.",
    3,[10,15],"2-1-2-1",60,"Lying face-up; scapular retraction isolation"),
  E("HPLL2","Standing Doorway Row (High Angle)","hpll",2,M(["lats","rhomboids","biceps"]),"horizontal_pull",
    "Grip doorframe at chest height, lean back at high angle. Low resistance horizontal pull.",
    3,[10,20],"3-0-2-1",60,"High standing angle; low resistance pull"),
  E("HPLL3","Standing Doorway Row (Deep Angle)","hpll",3,M(["lats","rhomboids","biceps"]),"horizontal_pull",
    "Same as HPLL2 but step feet closer to doorframe. Deeper lean = more load.",
    3,[10,20],"3-0-2-1",90,"Stepping closer to frame; increased lean angle"),
  E("HPLL4","Standing One-Arm Doorway Row","hpll",4,M(["lats","rhomboids","biceps","obliques"]),"unilateral_horizontal_pull",
    "Single-arm grip on doorframe. Anti-rotation core demand doubles pulling intensity.",
    3,[8,15],"3-0-2-1",90,"Unilateral load; doubles pulling demand"),
  E("HPLL5","Supine Butterfly Shrugs","hpll",5,M(["traps","rhomboids"]),"horizontal_pull",
    "Lie face-up, arms out wide. Drag elbows together to sit chest up. Mid-trap focus.",
    3,[10,15],"2-1-2-0",60,"Dragging elbows together; middle traps"),
  E("HPLL6","Floor Elbow Row (Back Widow)","hpll",6,M(["rhomboids","traps","lats"]),"horizontal_pull",
    "Lie face-down. Press elbows down into floor to lift upper body. Rhomboid isolation.",
    3,[8,15],"3-0-2-0",60,"Pressing elbows down to lift upper body"),
  E("HPLL7","Table-Underneath Inverted Row (Knees Bent)","hpll",7,M(["lats","rhomboids","biceps"]),"horizontal_pull",
    "Under sturdy table, grip edge. Pull chest up with knees bent. Shortened lever.",
    3,[8,15],"3-0-2-1",90,"Shortened lever; pulling chest to undersurface"),
  E("HPLL8","Towel-Anchor Door Row (Double Arm)","hpll",8,M(["lats","rhomboids"]),"horizontal_pull",
    "Towel wedged in door. Grip both ends, lean back, pull. Lean angle determines load.",
    3,[8,12],"3-0-2-1",90,"Towel wedged in door; lean angle determines load"),
  E("HPLL9","Table-Underneath Inverted Row (Legs Straight)","hpll",9,M(["lats","mid_back","biceps"]),"horizontal_pull",
    "Full body length lever inverted row. Pull chest to table underside with straight legs.",
    3,[8,12],"3-0-2-1",90,"Full body length lever; pulling against gravity"),
  E("HPLL10","Towel-Anchor Door Row (Single Arm)","hpll",10,M(["lats","obliques","biceps"]),"unilateral_horizontal_pull",
    "Single-arm towel row. Maximum anti-rotation core demand. Unilateral lat pull.",
    3,[8,12],"2-1-2-1",90,"Unilateral row; anti-rotation core demand"),
  E("HPLL11","Archer Inverted Row","hpll",11,M(["lats","biceps","rhomboids"]),"horizontal_pull",
    "Unilateral pull with one arm, opposite arm provides assistance. Advanced asymmetric load.",
    3,[6,10],"3-0-2-0",90,"Unilateral pull with opposite assisting"),
  E("HPLL12","Sliding Reverse Plank Hips-Through","hpll",12,M(["lats","triceps","core"]),"horizontal_pull",
    "Feet on sliders, reverse plank. Pull hips back past hands using full posterior chain.",
    3,[6,10],"3-0-2-0",90,"Feet on sliders; pulling hips past hands"),
];

// ═══════════════════════════════════════════════════
// PATHWAY 4: Vertical Pull (VPLL) — Lv 1-12
// ═══════════════════════════════════════════════════

const VPLL: Exercise96[] = [
  E("VPLL1","Wall Slides (Suck to Wall)","vpll",1,M(["traps","lats"]),"vertical_pull",
    "Stand against wall, arms up. Slide arms down while keeping contact. Thoracic extension focus.",
    3,[10,15],"3-0-2-0",60,"Thoracic extension + scapular depression against wall"),
  E("VPLL2","Prone Arm Circles","vpll",2,M(["rear_deltoids","lats","traps"]),"vertical_pull",
    "Face down, arms extended. Circle arms dynamically. Ground-based shoulder extension.",
    3,[10,15],"2-1-2-1",60,"Ground-based; dynamic shoulder extension"),
  E("VPLL3","Prone Swimmers","vpll",3,M(["traps","rhomboids","lats"]),"scapular_mobility",
    "Face down, sweep arms back rotating palms up. Squeeze behind hip. Lat + trap activation.",
    3,[10,15],"2-1-2-1",60,"Pronated; squeeze behind hip"),
  E("VPLL4","Prone Arch-Ups","vpll",4,M(["lats","lower_back","traps"]),"lower_body_pull",
    "Face down, lift chest and legs simultaneously. Spinal extension + shoulder retraction.",
    3,[10,15],"3-0-2-0",60,"Simultaneous spinal extension + shoulder retraction"),
  E("VPLL5","Sliding Floor Lat Pulldown (Knees Assisted)","vpll",5,M(["lats","core"]),"vertical_pull",
    "Towels on slick floor. Drag body forward from knees. Mimics straight-arm pulldown.",
    3,[8,12],"3-0-2-0",60,"Towel on slick floor; knees-down drag"),
  E("VPLL6","Sliding Floor Lat Pulldown (Full Plank)","vpll",6,M(["lats","core","shoulders"]),"vertical_pull",
    "Full plank position, slide body forward using lats. Full bodyweight straight-arm pulldown.",
    3,[8,12],"4-0-2-0",90,"Full body drag; bodyweight straight-arm pulldown"),
  E("VPLL7","Sliding Plank Slide-Outs","vpll",7,M(["lats","core","shoulders"]),"vertical_pull",
    "From plank, slide forearms forward and back. Eccentric lat load through shoulder flexion.",
    3,[6,10],"4-0-2-0",90,"Eccentric lat load; sliding forearms forward/back"),
  E("VPLL8","Door-Edge Pull-up (Feet Assisted)","vpll",8,M(["lats","biceps","rhomboids"]),"vertical_pull",
    "Hang from top of open door. Feet lightly touching ground for assistance. Partial pull-up.",
    3,[5,10],"3-0-1-0",90,"Hanging from door; feet lightly assisting"),
  E("VPLL9","Sliding One-Arm Floor Lat Pulldown","vpll",9,M(["lats","core","obliques"]),"unilateral_horizontal_pull",
    "One-arm sliding drag. Max lat isolation with anti-rotation core demand.",
    3,[6,10],"4-0-2-0",90,"Unilateral sliding drag; max lat isolation"),
  E("VPLL10","Door-Edge Negative Pull-up","vpll",10,M(["lats","biceps","rhomboids"]),"vertical_pull",
    "Jump to top position. 5-10 second slow eccentric lowering. Eccentric strength builder.",
    3,[3,8],"5-0-0-0",90,"Jump to top; 5-10s slow eccentric lowering"),
  E("VPLL11","Strict Door-Edge Pull-up","vpll",11,M(["lats","biceps","grip","rhomboids"]),"vertical_pull",
    "Full concentric + eccentric pull-up on stable door. Strict form, no kipping.",
    3,[3,8],"3-0-1-0",120,"Full concentric/eccentric pull-up on door"),
  E("VPLL12","L-Sit Door-Edge Pull-up","vpll",12,M(["lats","biceps","core","grip"]),"vertical_pull",
    "Pull-up with legs extended forward in L-position. Removes lower body assistance entirely.",
    3,[3,6],"3-0-1-0",120,"L-position removes lower body assistance"),
];

// ═══════════════════════════════════════════════════
// PATHWAY 5: Anterior Chain Legs (AQL) — Lv 1-12
// ═══════════════════════════════════════════════════

const AQL: Exercise96[] = [
  E("AQL1","Assisted Squat (Holding Door Frame)","aql",1,M(["quadriceps","glutes"]),"unilateral_lower_push",
    "Hold door frame for balance. Perform partial squat. External support reduces output needed.",
    3,[10,20],"3-0-2-0",60,"External balance point; reduces required output"),
  E("AQL2","Bodyweight Box Squat","aql",2,M(["glutes","quadriceps"]),"unilateral_lower_push",
    "Squat to a chair/box. Controlled sit, stand back up. Limited ROM, structured bottom pause.",
    3,[10,20],"3-1-2-0",60,"Limited ROM; structured bottom-range pause"),
  E("AQL3","Full-Depth Air Squat","aql",3,M(["quadriceps","glutes","core"]),"unilateral_lower_push",
    "Full ROM air squat — femur below parallel. Bodyweight only. Perfect form foundation.",
    3,[10,20],"3-0-2-0",90,"Full range of motion (femur below parallel)"),
  E("AQL4","Standing Calf Raise (Bilateral)","aql",4,M(["calves"]),"unilateral_lower_push",
    "Stand, rise onto balls of feet. Controlled lower. Basic ankle extension and calf contraction.",
    3,[15,25],"2-0-2-0",60,"Basic ankle extension and calf contraction"),
  E("AQL5","Close-Stance Squat","aql",5,M(["quadriceps","glutes"]),"unilateral_lower_push",
    "Feet together squat. Narrow base increases knee flexion torque. Quad-dominant variation.",
    3,[8,15],"3-0-2-0",90,"Narrow base; increases knee flexion torque"),
  E("AQL6","Reverse Lunge","aql",6,M(["glutes","quadriceps"]),"unilateral_lower_push",
    "Step backward into lunge. Front leg drives up. Unilateral stability and balance demand.",
    3,[8,12],"3-0-2-0",90,"Unilateral stability; step back front leg drive"),
  E("AQL7","Deficit Split Squat","aql",7,M(["quadriceps","glutes"]),"unilateral_lower_push",
    "Front foot elevated on surface. Increases depth and quad stretch. Unilateral lower push.",
    3,[8,12],"3-1-2-0",90,"Elevated front foot; increased depth and stretch"),
  E("AQL8","Bulgarian Split Squat","aql",8,M(["quadriceps","glutes"]),"unilateral_lower_push",
    "Rear foot elevated on surface. ~85% of load on front leg. Gold standard unilateral quad work.",
    3,[8,12],"3-1-1-0",90,"Rear foot elevated; ~85% load on front leg"),
  E("AQL9","Assisted Pistol Squat","aql",9,M(["quadriceps","glutes","core"]),"unilateral_lower_push",
    "Single-leg squat holding door frame for balance. Full unilateral leg strength development.",
    3,[5,10],"3-0-2-0",120,"Single-leg squat; holding for balance"),
  E("AQL10","Sissy Squat (Heels Elevated)","aql",10,M(["quadriceps","core"]),"unilateral_lower_push",
    "Hips locked straight, knees project forward. Heels elevated. Isolates rectus femoris.",
    3,[8,12],"3-0-2-0",90,"Hips locked; knees project forward quad isolation"),
  E("AQL11","Skater Squat","aql",11,M(["quadriceps","glutes","core"]),"unilateral_lower_push",
    "One-leg squat, trailing leg acts as counterbalance. Deep unilateral knee flexion.",
    3,[5,10],"3-0-2-0",120,"Trailing leg counterbalance, not support"),
  E("AQL12","Strict Pistol Squat","aql",12,M(["quadriceps","glutes","core"]),"unilateral_lower_push",
    "Full single-leg squat with free leg extended. Extreme mobility and strength required.",
    3,[3,8],"3-0-2-0",120,"Full single-leg knee flexion; extreme mobility"),
];

// ═══════════════════════════════════════════════════
// PATHWAY 6: Posterior Chain Legs (HPL) — Lv 1-12
// ═══════════════════════════════════════════════════

const HPL: Exercise96[] = [
  E("HPL1","Double-Leg Glute Bridge","hpl",1,M(["glutes","hamstrings"]),"lower_body_pull",
    "Lie supine, knees bent. Drive hips up squeezing glutes. Basic hip extension pattern.",
    3,[12,20],"2-1-2-0",60,"Basic hip extension; floor supported"),
  E("HPL2","Single-Leg Glute Bridge","hpl",2,M(["glutes","hamstrings","core"]),"lower_body_pull",
    "One-leg bridge, other leg extended. Doubles load on working glute. Unilateral hip extension.",
    3,[8,14],"3-1-2-0",60,"Unilateral hip extension; doubles bodyweight load"),
  E("HPL3","Bodyweight Good Morning","hpl",3,M(["hamstrings","glutes","lower_back"]),"lower_body_pull",
    "Hands behind head, hip hinge. Push hips back, torso lowers. Eccentric hamstring stretch.",
    3,[10,15],"3-0-2-0",90,"Hip hinge; hands behind head lengthens lever"),
  E("HPL4","Single-Leg Romanian Deadlift","hpl",4,M(["hamstrings","glutes","core"]),"lower_body_pull",
    "Stand on one leg, hinge at hip. Free leg extends behind for balance. Unilateral hinge.",
    3,[8,12],"3-0-2-0",90,"Unilateral balance; eccentric stretch under control"),
  E("HPL5","Reverse Hyperextension (Prone)","hpl",5,M(["lower_back","glutes","hamstrings"]),"lower_body_pull",
    "Lie prone on bed/table edge. Legs hang off. Lift legs dynamically. Lower back + glute focus.",
    3,[10,15],"2-0-2-0",60,"Prone hip extension; dynamic against gravity"),
  E("HPL6","Sliding Hamstring Curl (Bilateral)","hpl",6,M(["hamstrings","glutes"]),"closed_chain_lower_pull",
    "Heels on towels on slick floor. Bridge up, slide heels in/out. Dynamic knee flexion.",
    3,[8,12],"4-0-2-0",90,"Towel under heels; dynamic knee flexion"),
  E("HPL7","Standing Calf Raise (Unilateral)","hpl",7,M(["calves"]),"unilateral_lower_push",
    "Single-leg calf raise on floor. Full range of motion. Unilateral gastrocnemius loading.",
    3,[12,20],"2-0-2-0",60,"Single-leg loading of ankle plantar flexors"),
  E("HPL8","Deficit Single-Leg Calf Raise","hpl",8,M(["calves"]),"unilateral_lower_push",
    "On stair edge, single-leg. Increased ROM into deep stretch. Full gastrocnemius isolation.",
    3,[10,15],"3-0-2-0",60,"Single-leg; increased ankle ROM into stretch"),
  E("HPL9","Sliding Hamstring Curl (Slow Eccentric)","hpl",9,M(["hamstrings","glutes"]),"closed_chain_lower_pull",
    "Bilateral curl with 5-second eccentric phase. Time under tension hamstring builder.",
    3,[6,10],"5-0-2-0",90,"5s eccentric phase; extreme time under tension"),
  E("HPL10","Sliding Hamstring Curl (Unilateral)","hpl",10,M(["hamstrings","glutes","core"]),"closed_chain_lower_pull",
    "Single-leg towel curl on slick floor. Extreme hamstring isolation and tension.",
    3,[6,10],"4-0-2-0",90,"Single-leg towel curl; extreme hamstring tension"),
  E("HPL11","Assisted Nordic Hamstring Curl","hpl",11,M(["hamstrings"]),"lower_body_pull",
    "Anchored under couch. Lower torso slowly. Hands catch and push back. Eccentric focus.",
    3,[4,8],"5-0-1-0",120,"Feet anchored; hands assist push-up from floor"),
  E("HPL12","Unassisted Nordic Hamstring Curl","hpl",12,M(["hamstrings","glutes"]),"lower_body_pull",
    "Full eccentric hamstring curl to floor. No hand assistance. Elite hamstring output.",
    3,[3,6],"5-0-1-0",120,"Full eccentric control; elite hamstring output"),
];

// ═══════════════════════════════════════════════════
// PATHWAY 7: Anterior Core (AC) — Lv 1-12
// ═══════════════════════════════════════════════════

const AC: Exercise96[] = [
  E("AC1","Lying Dead Bug","ac",1,M(["core","obliques"]),"dynamic_core",
    "Lie supine, arms up, legs tabletop. Extend opposite arm/leg while keeping back flat.",
    3,[8,14],"3-0-2-0",60,"Anti-extension control; limbs move, spine stays flat"),
  E("AC2","Standard Crunch","ac",2,M(["upper_rectus_abdominis","core"]),"core_isometric",
    "Lie supine, knees bent. Curl shoulders up. Simple upper spine flexion, low demand.",
    3,[12,20],"2-0-2-0",60,"Simple upper spine flexion; low mechanical demand"),
  E("AC3","Hollow Body Tuck Hold","ac",3,M(["rectus_abdominis","core"]),"core_isometric",
    "Lie supine, knees/chest tucked. Press lower back down. Introduces posterior pelvic tilt.",
    3,[15,30],"isometric",60,"Knees/chest tucked; posterior pelvic tilt"),
  E("AC4","Reverse Crunch","ac",4,M(["lower_rectus_abdominis","core"]),"dynamic_core",
    "Lie supine, hands at sides. Lift hips off floor rolling pelvis. Lower abdominal focus.",
    3,[10,15],"3-0-2-0",60,"Rolling pelvis off floor; lower ab focus"),
  E("AC5","Hollow Body Hold (Full)","ac",5,M(["rectus_abdominis","core","hip_flexors"]),"core_isometric",
    "Full hollow body — straight legs, arms extended. Long lever anti-extension isometric hold.",
    3,[20,45],"isometric",60,"Straight legs/arms; long lever anti-extension"),
  E("AC6","V-Up (Fold-Up)","ac",6,M(["rectus_abdominis","core","hip_flexors"]),"dynamic_core",
    "Simultaneous upper + lower body flexion. Touch feet at top. Full anterior chain fold.",
    3,[8,15],"3-0-2-0",60,"Concurrent upper and lower body flexion"),
  E("AC7","Candlestick Leg Lifts","ac",7,M(["core","hip_flexors","lower_back"]),"dynamic_core",
    "Lie supine, lift legs to vertical. Thrust hips up at peak. Vertical hip thrust coordination.",
    3,[8,12],"3-0-2-0",60,"Vertical hip thrust at leg lift peak"),
  E("AC8","Dragon Flag Tuck","ac",8,M(["core","lats"]),"dynamic_core",
    "Grip anchor behind head. Lift body in tuck position. Shoulders as sole anchor point.",
    3,[5,10],"4-0-2-0",90,"Hips/knees bent; shoulders sole anchor"),
  E("AC9","Dragon Flag Advanced Tuck","ac",9,M(["core","lats","shoulders"]),"dynamic_core",
    "Knees bent but hips partially extended. Increases lever length from AC8.",
    3,[5,10],"4-0-2-0",90,"Knees bent, hips partially extended"),
  E("AC10","One-Leg Dragon Flag Negative","ac",10,M(["core","lats","shoulders"]),"dynamic_core",
    "One leg tucked, one straight. Slow 5s eccentric lowering of straight leg.",
    3,[4,8],"5-0-1-0",90,"One leg tucked; slow eccentric of other leg"),
  E("AC11","Straight-Leg Dragon Flag Negative","ac",11,M(["core","lats","shoulders"]),"dynamic_core",
    "Both legs straight. Controlled, slow eccentric descent. Extreme core tension.",
    3,[3,6],"5-0-1-0",120,"Straight legs; slow controlled eccentric descent"),
  E("AC12","Full Dragon Flag (Bruce Lee Hold)","ac",12,M(["core","lats","shoulders"]),"dynamic_core",
    "Complete isometric hold or dynamic reps with body perfectly rigid. Elite core feat.",
    3,[3,8],"4-1-2-0",120,"Complete isometric hold; rigid body control"),
];

// ═══════════════════════════════════════════════════
// PATHWAY 8: Posterior & Lateral Core (PLC) — Lv 1-12
// ═══════════════════════════════════════════════════

const PLC: Exercise96[] = [
  E("PLC1","Quadruped Bird-Dog","plc",1,M(["core","glutes","lower_back"]),"scapular_mobility",
    "On hands and knees. Extend opposite arm and leg. Simple stability, low demand.",
    3,[8,12],"3-0-2-0",60,"Opposite arm/leg raise; low stability demand"),
  E("PLC2","Superman Hold","plc",2,M(["lower_back","glutes","traps"]),"lower_body_pull",
    "Prone, lift chest and legs simultaneously. Isometric back extension hold.",
    3,[15,30],"isometric",60,"Prone spine extension; isometric"),
  E("PLC3","Standard Forearm Plank","plc",3,M(["core","obliques","shoulders"]),"core_isometric",
    "Forearms on floor, body straight. Static anti-extension abdominal brace.",
    3,[20,60],"isometric",60,"Isometric anti-extension; static abdominal brace"),
  E("PLC4","Side Plank (Knee Supported)","plc",4,M(["obliques","core","glutes"]),"core_isometric",
    "On forearm, knees bent. Short lever lateral core isolation. Introductory lateral stability.",
    3,[15,30],"isometric",60,"Lateral core isolation; short lever pivot"),
  E("PLC5","Cross-Body Mountain Climbers","plc",5,M(["core","obliques","shoulders"]),"dynamic_core",
    "From plank, drive knee to opposite elbow. Rotational stability under dynamic movement.",
    3,[10,20],"2-0-1-0",60,"Rotational stability; dynamic cross-body drive"),
  E("PLC6","Side Plank (Foot Supported)","plc",6,M(["obliques","core","glutes"]),"core_isometric",
    "Full long lever side plank on feet. Full body length lateral core brace.",
    3,[15,30],"isometric",60,"Long lever lateral core brace; full body length"),
  E("PLC7","Plank Jacks","plc",7,M(["core","hip_abductors","shoulders"]),"dynamic_core",
    "From plank, jump feet in and out. Dynamic lateral leg movement with static core brace.",
    3,[10,20],"1-0-1-0",60,"Dynamic lateral jumping; static core brace"),
  E("PLC8","Side Plank with Hip Dips","plc",8,M(["obliques","core","glutes"]),"dynamic_core",
    "Side plank position, dip hip down and raise back up. Dynamic lateral core under load.",
    3,[8,14],"3-0-2-0",60,"Dynamic lateral flexion/extension under load"),
  E("PLC9","Hollow Body Plank Shrugs","plc",9,M(["serratus_anterior","core","shoulders"]),"scapular_mobility",
    "From high plank, perform scapular protraction/retraction. Serratus + core bracing.",
    3,[8,12],"2-1-2-1",60,"Scapular movement from high plank; core bracing"),
  E("PLC10","Copenhagen Plank (Knee Supported)","plc",10,M(["obliques","core","hip_adductors"]),"core_isometric",
    "Top leg on elevated surface, bottom leg hover. Inner thigh + lateral core brace.",
    3,[15,30],"isometric",90,"Inner thigh + lateral core brace on elevated surface"),
  E("PLC11","Bear Walk (Exaggerated)","plc",11,M(["scapular_stabilizers","core","shoulders"]),"scapular_mobility",
    "On hands and feet (knees off floor). Walk forward with exaggerated ROM. Diagonal force lines.",
    3,[30,60],"2-0-1-0",60,"Dynamic animal crawl; diagonal force coordination"),
  E("PLC12","Copenhagen Plank (Foot Support)","plc",12,M(["obliques","core","hip_adductors"]),"core_isometric",
    "Full long lever Copenhagen plank. Foot on elevated surface. Max lateral core demand.",
    3,[10,20],"isometric",90,"Long lever; foot supported on elevated surface"),
];

// ═══════════════════════════════════════════════════
// MASTER EXPORT — all 96 exercises
// ═══════════════════════════════════════════════════

export const ALL_EXERCISES_96: Exercise96[] = [
  ...HP, ...VP, ...HPLL, ...VPLL,
  ...AQL, ...HPL, ...AC, ...PLC,
];

/** Lookup an exercise by its pathway ID (e.g. "HP6") */
export function getExercise96ById(id: string): Exercise96 | undefined {
  return ALL_EXERCISES_96.find((e) => e.id === id);
}

/** Get all exercises in a specific pathway */
export function getExercisesByPathway(pathway: PathwayId): Exercise96[] {
  return ALL_EXERCISES_96.filter((e) => e.pathwayId === pathway);
}

/** Get all exercises by parent family */
export function getExercisesByParentFamily(family: "push" | "pull" | "legs" | "core"): Exercise96[] {
  const families: Record<string, PathwayId[]> = {
    push: ["hp", "vp"],
    pull: ["hpll", "vpll"],
    legs: ["aql", "hpl"],
    core: ["ac", "plc"],
  };
  const ids = families[family] ?? [];
  return ALL_EXERCISES_96.filter((e) => ids.includes(e.pathwayId));
}

/** Legacy ID ↔ new pathway ID mapping */
export const LEGACY_TO_PATHWAY: Record<string, string> = {
  "bulgarian-split-squat": "AQL8",
  "doorway-row": "HPLL3",
  "decline-push-up": "HP7",
  "sliding-hamstring-curl": "HPL6",
  "floor-tricep-extension": "VP6",
  "hollow-body-hold": "AC5",
  "nordic-hamstring-curl": "HPL12",
  "decline-pike-push-up": "VP5",
  "one-arm-towel-row": "HPLL10",
  "prone-swimmers": "VPLL3",
  "sliding-chest-fly": "HP9",
  "dragon-flag-progression": "AC11",
  "doorframe-pull-up-negative": "VPLL10",
  "towel-bicep-curl": "supplementary",
  "glute-bridge-march": "HPL1",
  "reverse-plank": "PLC3",
  "table-row": "HPLL9",
  "dead-bug": "AC1",
  "jump-squat": "AQL6",
  "archer-push-up-progression": "HP10",
  "cossack-squat": "AQL5",
  "scapular-push-up": "PLC9",
  "single-leg-glute-bridge": "HPL2",
  "l-sit-progression": "PLC6",
};

/** Reverse mapping: new pathway ID → legacy ID */
export const PATHWAY_TO_LEGACY: Record<string, string> = Object.fromEntries(
  Object.entries(LEGACY_TO_PATHWAY).map(([k, v]) => [v, k]),
);
