/**
 * ARCH 96-Exercise Progression Database
 *
 * 8 movement pathways × 12 levels = 96 exercises
 * Structured from Level 1 (Absolute Beginner) to Level 12 (Elite).
 *
 * Extends the Exercise interface with pathway metadata (pathwayId,
 * pathwayLevel, overloadMechanism) for the Skill Tree system.
 * Each exercise includes biomechanical notes and 3 form checkpoints
 * (SETUP, EXECUTION, SAFETY) for the SkillDetailSheet.
 */

import {
  Exercise,
  Tempo,
  MuscleGroup,
  MovementCategory,
  FormCheckpoint,
} from "./exercises";
import { PathwayId } from "./pathways";

// ─── Extended exercise type ────────────────────────

export interface Exercise96 extends Exercise {
  pathwayId: PathwayId;
  pathwayLevel: number; // 1-12
  overloadMechanism: string;
}

// ─── Shortcut helpers ──────────────────────────────

const M = (ids: MuscleGroup[]): MuscleGroup[] => ids;

function CK(
  setup: [string, string],
  exec: [string, string],
  safety: [string, string],
): FormCheckpoint[] {
  return [
    { phase: "SETUP", instruction: setup[0], focusPoint: setup[1] },
    { phase: "EXECUTION", instruction: exec[0], focusPoint: exec[1] },
    { phase: "SAFETY", instruction: safety[0], focusPoint: safety[1] },
  ];
}

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
  checkpoints?: FormCheckpoint[],
): Exercise96 {
  const tiers: Record<number, "beginner" | "intermediate" | "advanced"> = {
    1: "beginner", 2: "beginner", 3: "beginner",
    4: "intermediate", 5: "intermediate", 6: "intermediate",
    7: "advanced", 8: "advanced", 9: "advanced",
    10: "advanced", 11: "advanced", 12: "advanced",
  };
  return {
    id,
    name,
    pathwayId: pw,
    pathwayLevel: lv,
    targetMuscles: target,
    category: cat,
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
    ...(checkpoints
      ? { visualGuide: { checkpoints, visuals: [] } }
      : {}),
  };
}

// ═══════════════════════════════════════════════════
// PATHWAY 1: Horizontal Push (HP) — Lv 1-12
// ═══════════════════════════════════════════════════

const HP: Exercise96[] = [
  E("HP1","Wall Push-up","hp",1,M(["chest","shoulders"]),"horizontal_push",
    "Stand arm's length from wall, hands at shoulder height. Lean in, lower chest to wall. High incline = lowest load.",
    3,[10,20],"3-0-2-0",60,"High incline angle; lowest relative load",false,
    "High incline reduces load to ~35% bodyweight. Maintain straight plank from head to heels.",
    CK(["Arm's length from wall, hands shoulder-width apart at shoulder height.","Hand placement"],
       ["Lean forward bending elbows, lower chest to wall. Push back to start in controlled motion.","Body alignment"],
       ["Keep core braced throughout; don't let lower back arch toward wall.","Neutral spine"])),

  E("HP2","Incline Push-up (Hands Elevated)","hp",2,M(["chest","shoulders","triceps"]),"horizontal_push",
    "Hands on couch/bench/stairs. Lower chest to hands. Medium incline increases lower pec load.",
    3,[10,20],"3-0-2-0",60,"Medium incline; increases load on lower chest",false,
    "Medium incline loads ~50% bodyweight on hands. Keep body in rigid plank.",
    CK(["Hands on sturdy elevated surface at mid-thigh height, plank position.","Plank alignment"],
       ["Lower chest toward hands keeping elbows at 45 degrees from torso. Press back up.","Elbow path"],
       ["Keep hips level; don't sag or pike. Maintain straight line head to heels.","Core bracing"])),

  E("HP3","Knee Push-up","hp",3,M(["chest","shoulders","triceps"]),"horizontal_push",
    "Plank on knees (ankles crossed). Lower chest to floor. Short lever = ~50% bodyweight.",
    3,[8,15],"3-1-2-0",60,"Shortened lever length (pivot at knees)",false,
    "Pivot at knees reduces lever length. ~50% bodyweight. Builds toward full push-up.",
    CK(["Start on knees with ankles crossed, hands shoulder-width apart.","Knee plank"],
       ["Lower chest toward floor keeping elbows at 45 degrees. Pause briefly at bottom.","Full ROM"],
       ["Keep hips extended; don't sit back onto calves. Straight torso throughout.","Hip position"])),

  E("HP4","Standard Push-up","hp",4,M(["chest","shoulders","triceps","core"]),"horizontal_push",
    "Full plank, hands shoulder-width. Lower chest nearly to floor. ~66% bodyweight resistance.",
    3,[8,15],"3-1-2-0",90,"Full body length lever; ~66% bodyweight",false,
    "~66% bodyweight at top, ~69% at bottom. Core must remain braced throughout.",
    CK(["Start in full plank, hands shoulder-width apart, wrists under shoulders.","Plank foundation"],
       ["Lower chest to floor bending elbows to 45 degrees. Drive through palms to extend.","Chest drive"],
       ["Brace abs and glutes to prevent lower back sag. Keep neck neutral.","Anti-extension"])),

  E("HP5","Wide-Grip Push-up","hp",5,M(["chest","shoulders"]),"horizontal_push",
    "Hands 2x shoulder width. Lower with elbows flared. Maximizes outer chest stretch.",
    3,[8,12],"3-1-2-0",90,"Increased lateral lever; max chest stretch",false,
    "Wider hand placement increases pec major stretch and reduces triceps contribution.",
    CK(["Hands placed 2x shoulder width apart. Fingers pointing forward.","Wide base"],
       ["Lower chest with elbows flared outward. Feel deep pectoral stretch at bottom.","Chest stretch"],
       ["Don't go beyond comfortable shoulder range. Stop if shoulders feel pinched.","Shoulder safety"])),

  E("HP6","Diamond Push-up","hp",6,M(["triceps","chest"]),"horizontal_push",
    "Hands together under chest forming diamond. Triceps-targeting narrow base.",
    3,[8,12],"3-1-2-0",90,"Narrow base; increases elbow extension demand",false,
    "Narrow hand position shifts load to triceps brachii. Keep elbows tracking close to ribs.",
    CK(["Place hands together forming a diamond shape under center of chest.","Hand position"],
       ["Lower chest toward hands keeping elbows close to ribs. Full triceps extension at top.","Elbow tracking"],
       ["Keep wrists aligned — don't let them buckle outward under load.","Wrist alignment"])),

  E("HP7","Decline Push-up (Feet Elevated)","hp",7,M(["upper_chest","shoulders","triceps"]),"horizontal_push",
    "Feet elevated on platform. ~77% bodyweight on hands. Targets upper pecs.",
    3,[8,12],"3-1-2-0",90,"Decreased angle; ~77% bodyweight",false,
    "Feet elevation shifts ~77% bodyweight to hands. Greater upper pectoral activation.",
    CK(["Place feet on elevated surface (12-18 inches). Hands shoulder-width on floor.","Plank angle"],
       ["Lower chest to floor with controlled tempo. Push through palms aggressively.","Upper chest focus"],
       ["Maintain rigid core; don't let hips drop or pike upward.","Straight line"])),

  E("HP8","Pseudo-Planche Push-up","hp",8,M(["shoulders","chest","triceps"]),"horizontal_push",
    "Forward lean with hands near hips. Extreme mechanical disadvantage for anterior delts.",
    3,[6,10],"3-1-2-0",120,"Forward shoulder lean; mechanical disadvantage",false,
    "Forward lean increases anterior delt demand exponentially. Wrist flexibility required.",
    CK(["Start in push-up position. Walk hands back toward hips while leaning forward.","Hand placement"],
       ["Lower chest toward floor keeping forward lean. Hands stay below shoulders.","Forward lean"],
       ["Stop immediately if wrists or shoulders feel sharp pain. Build lean gradually.","Joint safety"])),

  E("HP9","Sliding Chest Fly (Towels)","hp",9,M(["chest","shoulders"]),"horizontal_adduction",
    "High plank with towels under hands. Open arms wide, squeeze hands together. Floor limits ROM safely.",
    3,[6,10],"4-1-2-0",90,"Horizontal shoulder adduction; eccentric stretch",false,
    "Floor provides ROM safety stop. Towels reduce friction for smooth sliding. Eccentric stretch builds pecs.",
    CK(["High plank with towels or sliders under hands. Body rigid, core braced.","Plank foundation"],
       ["Slide hands outward in wide arc until chest near floor. Squeeze hands back together.","Pec squeeze"],
       ["Floor naturally limits ROM — never force stretch beyond shoulder control.","Shoulder safety"])),

  E("HP10","Archer Push-up","hp",10,M(["chest","shoulders","triceps"]),"horizontal_push",
    "Wide hands, shift weight to one side. One arm bends, other stays locked. ~80% BW on one arm.",
    3,[4,8],"3-0-2-0",120,"Bilaterally asymmetric; side-to-side transition",false,
    "~80% bodyweight shifts to the bending arm. Locked arm must maintain scapular stability.",
    CK(["Hands wide (2x shoulder width). Start centered, then shift weight to working side.","Weight shift"],
       ["Bend one elbow, lower chest toward that hand. Keep opposite arm fully locked.","Unilateral load"],
       ["Keep extended arm's shoulder packed down — don't let it shrug toward ear.","Scapular stability"])),

  E("HP11","One-Arm Incline Push-up","hp",11,M(["chest","shoulders","core"]),"horizontal_push",
    "Single-arm push-up on elevated surface. Core must resist rotation. Direct unilateral loading.",
    3,[4,8],"3-0-2-0",120,"Direct single-arm load on incline",true,
    "Single-arm loading increases core anti-rotation demand. Incline reduces load vs floor.",
    CK(["Single hand on elevated surface, feet wide for stability. Stagger feet for balance.","Stable base"],
       ["Lower chest toward hand keeping body straight. Press back up through palm.","Single-arm press"],
       ["Core must resist torso rotation. If rotating excessively, use lower incline.","Anti-rotation"])),

  E("HP12","One-Arm Floor Push-up","hp",12,M(["chest","shoulders","core"]),"horizontal_push",
    "Full one-arm push-up on floor. Maximum unilateral chest load with massive core stabilization.",
    3,[3,6],"3-1-2-0",120,"Absolute maximum load; core stabilization",true,
    "The ultimate bodyweight push variation. Requires extreme unilateral chest and core strength.",
    CK(["Feet wide for stability. Hand centered under chest. Body rigid from head to heels.","Stance width"],
       ["Lower chest to floor keeping body level. Drive through palm to full lockout.","Full ROM"],
       ["Keep hips square and level. Do not rotate or twist to compensate for weakness.","Hip alignment"])),
];

// ═══════════════════════════════════════════════════
// PATHWAY 2: Vertical Push (VP) — Lv 1-12
// ═══════════════════════════════════════════════════

const VP: Exercise96[] = [
  E("VP1","Pike Shrugs (Hands Elevated)","vp",1,M(["traps","shoulders"]),"vertical_push",
    "Hands elevated on surface, pike position. Scapular elevation focus. Low angle overhead load.",
    3,[10,15],"2-1-2-1",60,"Low angle overhead load; scapular elevation",false,
    "Introduces scapular elevation/depression in an inverted position. Foundation for handstand work.",
    CK(["Hands on elevated surface, hips high in pike. Arms straight, head between arms.","Pike position"],
       ["Shrug shoulders up toward ears (elevation), then depress back down.","Scapular control"],
       ["Keep arms straight throughout. Only shoulder blades should move.","Arm lockout"])),

  E("VP2","Incline Pike Push-up","vp",2,M(["shoulders","triceps"]),"vertical_push",
    "Hands on elevated surface, hips high. Partial bodyweight overhead press. High angle.",
    3,[8,15],"3-1-1-0",60,"High angle; partial bodyweight overhead press",false,
    "High incline angle reduces load. Establishes overhead pressing pattern safely.",
    CK(["Hands on elevated surface, walk feet back into deep pike. Hips directly over feet.","Pike angle"],
       ["Bend elbows to lower head toward floor between hands. Press back up.","Overhead press"],
       ["Keep forearms vertical throughout the movement. Don't let elbows flare wide.","Elbow path"])),

  E("VP3","Flat-Ground Pike Push-up","vp",3,M(["shoulders","triceps"]),"vertical_push",
    "Hands on floor, hips bent 90 degrees. Head travels forward of hands. Proper pike mechanics.",
    3,[8,12],"3-1-1-0",90,"90-degree hip bend; head past hands",false,
    "Head must travel forward of hands to achieve full ROM. Vertical forearms essential.",
    CK(["Hands on floor, hips bent to 90 degrees. Feet flat, legs straight.","90-degree pike"],
       ["Lower head forward of hands until forehead nearly touches floor. Press back.","Forward travel"],
       ["Keep forearms perpendicular to floor. If they angle forward, you're losing scapular control.","Arm angle"])),

  E("VP4","Decline Pike Push-up (Feet 12\")","vp",4,M(["shoulders","triceps","upper_chest"]),"vertical_push",
    "Feet elevated 12 inches. More mass shifts to shoulders. ~70% BW on hands.",
    3,[6,12],"3-1-1-0",90,"Elevated feet transfer mass to shoulders",false,
    "Elevating feet increases shoulder load to ~70% bodyweight. Prepare for handstand angle.",
    CK(["Feet elevated 12 inches on platform. Hips high, hands on floor.","Decline pike"],
       ["Lower head past hands with controlled tempo. Press back to full extension.","Vertical press"],
       ["Keep neck neutral — don't crank to look at feet. Eyes focused behind hands.","Neck position"])),

  E("VP5","High-Decline Pike Push-up (Feet 18\")","vp",5,M(["shoulders","triceps"]),"vertical_push",
    "Feet elevated 18 inches. Mimics ~77% of full handstand press. High shoulder demand.",
    3,[6,10],"3-1-1-0",90,"High elevation; ~77% of handstand press",false,
    "Near-vertical angle simulates handstand push-up mechanics. High scapular stability demand.",
    CK(["Feet elevated 18 inches, hips aligned over shoulders. Almost vertical.","Vertical angle"],
       ["Lower head well past hands until nose nearly touches floor. Press with control.","Deep ROM"],
       ["If wrists are stressed, use push-up bars or fists. Keep forearms vertical.","Wrist comfort"])),

  E("VP6","Floor Triceps Extension (Tiger Bend)","vp",6,M(["triceps","shoulders"]),"elbow_extension",
    "From forearm plank, press through palms to straighten elbows. Triceps isolation.",
    3,[8,15],"3-0-2-0",60,"Elbow isolation; pressing forearms to high plank",false,
    "Purely isolates triceps long head. Adjust hand placement to scale intensity.",
    CK(["Start in forearm plank. Place hands palm-down where elbows rest.","Start position"],
       ["Press through palms to straighten elbows fully, lifting forearms off floor. Lower slowly.","Elbow lockout"],
       ["Keep elbows pinned to ribs throughout. Don't let them slide forward or outward.","Elbow tracking"])),

  E("VP7","Wall-Assisted Handstand Hold","vp",7,M(["shoulders","core","traps"]),"vertical_push",
    "Chest-to-wall handstand hold. Isometric shoulder endurance. Aligns body vertically.",
    3,[15,45],"isometric",60,"Isometric endurance; vertical body alignment",false,
    "Builds isometric shoulder endurance and body awareness for vertical positioning.",
    CK(["Walk feet up wall until inverted. Chest facing wall. Hands 6 inches from wall.","Wall walk"],
       ["Squeeze glutes and core tight. Push floor away actively through shoulders.","Body line"],
       ["Keep arms straight but not locked. If neck strains, look between hands.","Spine alignment"])),

  E("VP8","Wall Handstand Shrugs","vp",8,M(["traps","shoulders"]),"vertical_push",
    "In handstand against wall, perform scapular elevation/depression. Active shoulder control.",
    3,[8,12],"2-1-2-0",90,"Active scapular elevation/depression upside down",false,
    "Active scapular control in inverted position. Essential for handstand push-up prep.",
    CK(["Hold chest-to-wall handstand. Start with active shoulders (not shrugged).","Stable handstand"],
       ["Shrug shoulders toward ears, then depress back down without bending elbows.","Scapular control"],
       ["Keep core braced and body straight. Don't arch back to compensate.","Body line"])),

  E("VP9","Partial Handstand Push-up (Chest-to-Wall)","vp",9,M(["shoulders","triceps"]),"vertical_push",
    "Lower head partway down wall. Eccentric and partial range vertical push.",
    3,[5,10],"4-0-1-0",120,"Eccentric and partial range vertical push",false,
    "Partial ROM builds strength safely. Eccentric emphasis (4s) builds tendon resilience.",
    CK(["Chest-to-wall handstand. Start at full shoulder extension.","Top position"],
       ["Lower head halfway down (partial ROM) with 4-second eccentric. Press back up.","Controlled descent"],
       ["Don't go deeper than comfortable. Stop if you feel pressure in the head/neck.","Gradual progression"])),

  E("VP10","Back-to-Wall Handstand Push-up","vp",10,M(["shoulders","triceps"]),"vertical_push",
    "Back to wall, full ROM HSPU. Arch allowed for stability. Full vertical load.",
    3,[3,8],"3-0-1-0",120,"Full vertical load; back arch for stability",false,
    "Full ROM handstand push-up. Back arch helps balance. ~100% bodyweight on shoulders.",
    CK(["Back-to-wall handstand. Hands 12 inches from wall. Walk feet down slightly.","Stable inversion"],
       ["Lower head to floor in full ROM, allowing slight arch for balance. Press back up.","Full ROM press"],
       ["Keep tight core. If you can't control the descent, return to partial ROM.","Controlled descent"])),

  E("VP11","Chest-to-Wall Handstand Push-up","vp",11,M(["shoulders","triceps","core"]),"vertical_push",
    "Chest to wall, strict vertical trajectory. Requires absolute shoulder power. No arch.",
    3,[3,6],"3-0-1-0",120,"Strict vertical; absolute shoulder power",false,
    "No arch allowed. Strictest form of wall HSPU. Demands scapular mobility and shoulder power.",
    CK(["Chest-to-wall handstand. Hands 6 inches from wall. Body in straight line.","Strict line"],
       ["Lower head to floor in straight vertical path. Press up without allowing back arch.","Vertical path"],
       ["Keep abs and glutes squeezed to prevent arching. Stop if form breaks.","Body tension"])),

  E("VP12","Freestanding Handstand Push-up","vp",12,M(["shoulders","triceps","core","traps"]),"vertical_push",
    "No wall support. Maximum shoulder girdle strength with active balance control. Elite skill.",
    3,[1,5],"3-0-1-0",120,"Maximum strength + active balance control",false,
    "Elite skill combining full strength with balance. Requires years of dedicated training.",
    CK(["Find balance in freestanding handstand. Overhead shoulder position.","Balance point"],
       ["Lower head to floor maintaining balance through finger pressure. Press back up.","Balanced press"],
       ["Practice near wall or with spotter initially. Bail out safely if overbalancing.","Safety awareness"])),
];

// ═══════════════════════════════════════════════════
// PATHWAY 3: Horizontal Pull (HPLL) — Lv 1-12
// ═══════════════════════════════════════════════════

const HPLL: Exercise96[] = [
  E("HPLL1","Supine Scapular Retractions","hpll",1,M(["rhomboids","traps","core"]),"horizontal_pull",
    "Lie face-up, arms at sides. Press upper back off floor slightly using scapular retraction.",
    3,[10,15],"2-1-2-1",60,"Lying face-up; scapular retraction isolation",false,
    "Isolates scapular retraction. Establishes mind-muscle connection for pulling exercises.",
    CK(["Lie face-up with arms at sides, palms down, legs extended.","Starting position"],
       ["Press elbows into floor and squeeze shoulder blades together to lift upper back slightly.","Scapular squeeze"],
       ["Keep head and neck relaxed on floor. Only upper back should lift.","Neck relaxation"])),

  E("HPLL2","Standing Doorway Row (High Angle)","hpll",2,M(["lats","rhomboids","biceps"]),"horizontal_pull",
    "Grip doorframe at chest height, lean back at high angle. Low resistance horizontal pull.",
    3,[10,20],"3-0-2-1",60,"High standing angle; low resistance pull",false,
    "High lean angle reduces load to ~30% bodyweight. Perfect for learning row mechanics.",
    CK(["Grip doorframe at chest height. Walk feet back and lean back at shallow angle.","Grip position"],
       ["Pull chest toward doorframe driving elbows back. Squeeze shoulder blades.","Scapular retraction"],
       ["Keep body in straight line from head to heels. Don't sag at hips.","Body alignment"])),

  E("HPLL3","Standing Doorway Row (Deep Angle)","hpll",3,M(["lats","rhomboids","biceps"]),"horizontal_pull",
    "Same as HPLL2 but step feet closer to doorframe. Deeper lean = more load.",
    3,[10,20],"3-0-2-1",90,"Stepping closer to frame; increased lean angle",false,
    "Deeper body angle increases load to ~40% bodyweight. Progress by moving feet closer.",
    CK(["Grip doorframe at chest height. Step feet closer to wall for deeper lean.","Deeper lean"],
       ["Pull chest toward doorframe with elbows driving back and down.","Harder pull"],
       ["Maintain straight line. If hips sag, reduce lean angle.","Form integrity"])),

  E("HPLL4","Standing One-Arm Doorway Row","hpll",4,M(["lats","rhomboids","biceps","obliques"]),"unilateral_horizontal_pull",
    "Single-arm grip on doorframe. Anti-rotation core demand doubles pulling intensity.",
    3,[8,15],"3-0-2-1",90,"Unilateral load; doubles pulling demand",true,
    "Unilateral pull doubles load per arm and adds anti-rotation core challenge.",
    CK(["Single-arm grip on doorframe. Stand sideways, lean back with braced core.","Side stance"],
       ["Pull chest toward hand keeping elbow close to side. Resist torso rotation.","Anti-rotation pull"],
       ["Keep hips and shoulders square to wall. Don't let torso twist toward anchor.","Square alignment"])),

  E("HPLL5","Supine Butterfly Shrugs","hpll",5,M(["traps","rhomboids"]),"horizontal_pull",
    "Lie face-up, arms out wide. Drag elbows together to sit chest up. Mid-trap focus.",
    3,[10,15],"2-1-2-0",60,"Dragging elbows together; middle traps",false,
    "Isolates middle and lower trapezius. Key for scapular stability and posture.",
    CK(["Lie face-up with arms extended out to sides at 90 degrees, palms up.","Arms out"],
       ["Drag elbows together across floor to lift upper back. Squeeze shoulder blades.","Scapular pinch"],
       ["Keep lower back and hips on floor. Only upper back lifts.","Lower body stability"])),

  E("HPLL6","Floor Elbow Row (Back Widow)","hpll",6,M(["rhomboids","traps","lats"]),"horizontal_pull",
    "Lie face-down. Press elbows down into floor to lift upper body. Rhomboid isolation.",
    3,[8,15],"3-0-2-0",60,"Pressing elbows down to lift upper body",false,
    "Pressing elbows into floor creates upward thoracic extension. Intense rhomboid activation.",
    CK(["Lie face-down, arms extended overhead, forehead on floor.","Starting position"],
       ["Press elbows down into floor to lift chest and head upward. Squeeze mid-back.","Elbow press"],
       ["Keep neck long. Don't strain to lift too high — focus on scapular squeeze.","Neck position"])),

  E("HPLL7","Table-Underneath Inverted Row (Knees Bent)","hpll",7,M(["lats","rhomboids","biceps"]),"horizontal_pull",
    "Under sturdy table, grip edge. Pull chest up with knees bent. Shortened lever.",
    3,[8,15],"3-0-2-1",90,"Shortened lever; pulling chest to undersurface",false,
    "Knees bent shortens lever reducing load to ~50% bodyweight. Perfect for learning inverted rows.",
    CK(["Lie under sturdy table. Grip edge at chest height. Knees bent, feet flat.","Under-table position"],
       ["Pull chest up to touch table underside. Drive elbows back, squeeze shoulder blades.","Chest to table"],
       ["Ensure table is heavy enough to not tip. Keep neck neutral, gaze forward.","Table stability"])),

  E("HPLL8","Towel-Anchor Door Row (Double Arm)","hpll",8,M(["lats","rhomboids"]),"horizontal_pull",
    "Towel wedged in door. Grip both ends, lean back, pull. Lean angle determines load.",
    3,[8,12],"3-0-2-1",90,"Towel wedged in door; lean angle determines load",false,
    "Towel creates full ROM pulling motion. Load is controlled entirely by lean angle.",
    CK(["Wedge towel in door and close firmly. Grip both ends at chest height.","Towel anchor"],
       ["Lean back with straight arms. Pull chest toward door, squeezing shoulder blades.","Pulling phase"],
       ["Test towel anchor security before full lean. Start with shallow angle.","Anchor safety"])),

  E("HPLL9","Table-Underneath Inverted Row (Legs Straight)","hpll",9,M(["lats","mid_back","biceps"]),"horizontal_pull",
    "Full body length lever inverted row. Pull chest to table underside with straight legs.",
    3,[8,12],"3-0-2-1",90,"Full body length lever; pulling against gravity",false,
    "Straight legs lengthen lever arm, increasing resistance to ~65% bodyweight.",
    CK(["Lie under sturdy table, grip edge. Legs straight, only heels on floor.","Full lever"],
       ["Pull chest to table keeping body straight. Don't pike or bend at hips.","Straight body row"],
       ["If you can't pull with straight body, return to bent knee version.","Scale as needed"])),

  E("HPLL10","Towel-Anchor Door Row (Single Arm)","hpll",10,M(["lats","obliques","biceps"]),"unilateral_horizontal_pull",
    "Single-arm towel row. Maximum anti-rotation core demand. Unilateral lat pull.",
    3,[8,12],"2-1-2-1",90,"Unilateral row; anti-rotation core demand",true,
    "Unilateral row challenges obliques and deep spinal stabilizers to prevent rotation.",
    CK(["Single-arm grip on towel end. Stagger feet, lean back with braced core.","Staggered stance"],
       ["Pull elbow back and down, resisting torso rotation. Full scapular retraction.","Anti-rotation pull"],
       ["Keep shoulders square to door. If torso twists, reduce pull range.","Shoulder squareness"])),

  E("HPLL11","Archer Inverted Row","hpll",11,M(["lats","biceps","rhomboids"]),"horizontal_pull",
    "Unilateral pull with one arm, opposite arm provides assistance. Advanced asymmetric load.",
    3,[6,10],"3-0-2-0",90,"Unilateral pull with opposite assisting",false,
    "One arm pulls while other assists. Transitional movement to full one-arm row.",
    CK(["Under table, wide grip. One arm at chest, other extended straight.","Asymmetric grip"],
       ["Pull with bent arm while keeping other arm locked. Switch sides each rep.","Unilateral pull"],
       ["Keep body straight throughout. Don't rotate toward the pulling arm.","Body stability"])),

  E("HPLL12","Sliding Reverse Plank Hips-Through","hpll",12,M(["lats","triceps","core"]),"horizontal_pull",
    "Feet on sliders, reverse plank. Pull hips back past hands using full posterior chain.",
    3,[6,10],"3-0-2-0",90,"Feet on sliders; pulling hips past hands",false,
    "Advanced sliding movement combining posterior chain and lat engagement.",
    CK(["Start in reverse plank with feet on sliders or towels. Hands planted firmly.","Reverse plank"],
       ["Pull hips backward past hands by driving feet toward floor and sliding.","Hips through"],
       ["Keep core braced to protect lower back. Control the slide — no momentum.","Core control"])),
];

// ═══════════════════════════════════════════════════
// PATHWAY 4: Vertical Pull (VPLL) — Lv 1-12
// ═══════════════════════════════════════════════════

const VPLL: Exercise96[] = [
  E("VPLL1","Wall Slides (Suck to Wall)","vpll",1,M(["traps","lats"]),"vertical_pull",
    "Stand against wall, arms up. Slide arms down while keeping contact. Thoracic extension focus.",
    3,[10,15],"3-0-2-0",60,"Thoracic extension + scapular depression against wall",false,
    "Improves thoracic spine mobility and lat engagement. Essential for overhead pulling prep.",
    CK(["Stand with back against wall, arms extended overhead with backs of hands on wall.","Wall contact"],
       ["Slide arms down and elbows toward ribs keeping entire arm in contact with wall.","Lat engagement"],
       ["Keep lower back pressed to wall. Don't arch excessively to reach lower.","Core bracing"])),

  E("VPLL2","Prone Arm Circles","vpll",2,M(["rear_deltoids","lats","traps"]),"vertical_pull",
    "Face down, arms extended. Circle arms dynamically. Ground-based shoulder extension.",
    3,[10,15],"2-1-2-1",60,"Ground-based; dynamic shoulder extension",false,
    "Dynamic shoulder extension in prone position. Activates posterior shoulder chain.",
    CK(["Lie face-down, arms extended overhead, forehead on floor.","Prone position"],
       ["Circle arms down to sides and back overhead in controlled motion.","Shoulder circles"],
       ["Keep chest and forehead on floor. Only arms should move.","Upper body stability"])),

  E("VPLL3","Prone Swimmers","vpll",3,M(["traps","rhomboids","lats"]),"scapular_mobility",
    "Face down, sweep arms back rotating palms up. Squeeze behind hip. Lat + trap activation.",
    3,[10,15],"2-1-2-1",60,"Pronated; rotate palms up behind hip",false,
    "Often triggers cramping in underused posterior shoulder fibers. Scapular retraction at top.",
    CK(["Face down, arms extended overhead, thumbs up, forehead hovering.","Hovering start"],
       ["Sweep arms wide, rotate palms up, squeeze behind hips. Return to start.","Shoulder sweep"],
       ["Keep chest on floor. Don't hyperextend lumbar spine to lift higher.","Spine neutrality"])),

  E("VPLL4","Prone Arch-Ups","vpll",4,M(["lats","lower_back","traps"]),"lower_body_pull",
    "Face down, lift chest and legs simultaneously. Spinal extension + shoulder retraction.",
    3,[10,15],"3-0-2-0",60,"Simultaneous spinal extension + shoulder retraction",false,
    "Full posterior chain activation. Simultaneous hip extension and scapular retraction.",
    CK(["Face down, arms extended forward, legs straight. Full body contact.","Start position"],
       ["Lift chest and legs simultaneously. Arms sweep back squeezing shoulder blades.","Full arch"],
       ["Keep neck neutral looking at floor. Don't jerk or use momentum.","Controlled movement"])),

  E("VPLL5","Sliding Floor Lat Pulldown (Knees Assisted)","vpll",5,M(["lats","core"]),"vertical_pull",
    "Towels on slick floor. Drag body forward from knees. Mimics straight-arm pulldown.",
    3,[8,12],"3-0-2-0",60,"Towel on slick floor; knees-down drag",false,
    "Knees-down position reduces resistance. Mimics straight-arm lat pulldown mechanics.",
    CK(["Knees on towels on slick floor. Hands in push-up position.","Knees-down plank"],
       ["Drag body forward using lats to pull hands toward hips. Return under control.","Lat pull"],
       ["Keep core tight and back flat. Don't let hips rise or sag.","Core stability"])),

  E("VPLL6","Sliding Floor Lat Pulldown (Full Plank)","vpll",6,M(["lats","core","shoulders"]),"vertical_pull",
    "Full plank position, slide body forward using lats. Full bodyweight straight-arm pulldown.",
    3,[8,12],"4-0-2-0",90,"Full body drag; bodyweight straight-arm pulldown",false,
    "Full bodyweight lat pull. Towels under feet on hardwood/tile. Press hands into floor.",
    CK(["Full plank with feet on towels or sliders. Hands firmly planted.","Full plank"],
       ["Drag body forward by pulling arms back. Feet slide toward hands.","Lat drag"],
       ["Maintain rigid plank throughout. Don't let hips sag or pike up.","Body tension"])),

  E("VPLL7","Sliding Plank Slide-Outs","vpll",7,M(["lats","core","shoulders"]),"vertical_pull",
    "From plank, slide forearms forward and back. Eccentric lat load through shoulder flexion.",
    3,[6,10],"4-0-2-0",90,"Eccentric lat load; sliding forearms forward/back",false,
    "Eccentric-focused lat exercise. Shoulder flexion increases lat stretch at full extension.",
    CK(["Start in forearm plank with towels under forearms.","Forearm plank"],
       ["Slide forearms forward extending shoulders, keeping torso rigid. Pull back.","Shoulder glide"],
       ["Don't let lower back sag as arms extend forward. Braced core throughout.","Core bracing"])),

  E("VPLL8","Door-Edge Pull-up (Feet Assisted)","vpll",8,M(["lats","biceps","rhomboids"]),"vertical_pull",
    "Hang from top of open door. Feet lightly touching ground for assistance. Partial pull-up.",
    3,[5,10],"3-0-1-0",90,"Hanging from door; feet lightly assisting",false,
    "Feet-assisted pull-up builds lat and bicep strength while reducing total load. Door must be sturdy.",
    CK(["Grip top of sturdy open door. Feet on floor with knees slightly bent.","Door hang"],
       ["Pull chin toward door top keeping feet lightly assisting. Squeeze lats.","Assisted pull"],
       ["Test door stability before full load. Use towel over door for grip/hand protection.","Door safety"])),

  E("VPLL9","Sliding One-Arm Floor Lat Pulldown","vpll",9,M(["lats","core","obliques"]),"unilateral_horizontal_pull",
    "One-arm sliding drag. Max lat isolation with anti-rotation core demand.",
    3,[6,10],"4-0-2-0",90,"Unilateral sliding drag; max lat isolation",true,
    "Unilateral sliding intensifies lat isolation while obliques resist rotation.",
    CK(["Side plank variant: one hand planted, feet on slider. Body straight.","Side start"],
       ["Pull with one arm dragging body sideways. Resist rotation through core.","Unilateral pull"],
       ["Keep body straight and rigid. Don't let hips drop or rotate.","Straight line"])),

  E("VPLL10","Door-Edge Negative Pull-up","vpll",10,M(["lats","biceps","rhomboids"]),"vertical_pull",
    "Jump to top position. 5-10 second slow eccentric lowering. Eccentric strength builder.",
    3,[3,8],"5-0-0-0",90,"Jump to top; 5-10s slow eccentric lowering",false,
    "Eccentric training builds strength faster than concentric. 5-10s negatives build pull-up foundation.",
    CK(["Jump or step to top position with chin above hands. Engage lats.","Top position"],
       ["Lower body as slowly as possible — count 5+ seconds. Fight gravity all the way down.","Slow descent"],
       ["Land softly at bottom. If control breaks, reduce negative time to 3s.","Soft landing"])),

  E("VPLL11","Strict Door-Edge Pull-up","vpll",11,M(["lats","biceps","grip","rhomboids"]),"vertical_pull",
    "Full concentric + eccentric pull-up on stable door. Strict form, no kipping.",
    3,[3,8],"3-0-1-0",120,"Full concentric/eccentric pull-up on door",false,
    "Full pull-up on door edge. Requires strict form — no kipping or momentum.",
    CK(["Hang from door edge with straight arms. Scapula engaged (shoulders down).","Dead hang"],
       ["Pull chin above door edge. Lower under control to full hang.","Full pull-up"],
       ["Use towel for hand protection. Stop if door creaks or feels unstable.","Door stability"])),

  E("VPLL12","L-Sit Door-Edge Pull-up","vpll",12,M(["lats","biceps","core","grip"]),"vertical_pull",
    "Pull-up with legs extended forward in L-position. Removes lower body assistance entirely.",
    3,[3,6],"3-0-1-0",120,"L-position removes lower body assistance",false,
    "L-position eliminates any lower body momentum. Extreme lat and core demand.",
    CK(["Hang from door edge, then raise legs to 90 degrees in front (L-sit).","L-hang"],
       ["Pull chin above door edge while maintaining L-position. Lower under control.","L-pull-up"],
       ["Keep legs active and toes pointed. If L-position collapses, return to negatives.","Core engagement"])),
];

// ═══════════════════════════════════════════════════
// PATHWAY 5: Anterior Chain Legs (AQL) — Lv 1-12
// ═══════════════════════════════════════════════════

const AQL: Exercise96[] = [
  E("AQL1","Assisted Squat (Holding Door Frame)","aql",1,M(["quadriceps","glutes"]),"unilateral_lower_push",
    "Hold door frame for balance. Perform partial squat. External support reduces output needed.",
    3,[10,20],"3-0-2-0",60,"External balance point; reduces required output",false,
    "Door frame support reduces stability demand. Focus on squat mechanics and depth.",
    CK(["Stand facing door frame. Grip lightly at shoulder height for balance.","Support position"],
       ["Sit back into partial squat keeping weight on heels. Stand by driving through feet.","Partial squat"],
       ["Use frame for balance only — don't pull yourself up. Let legs do the work.","Balance support"])),

  E("AQL2","Bodyweight Box Squat","aql",2,M(["glutes","quadriceps"]),"unilateral_lower_push",
    "Squat to a chair/box. Controlled sit, stand back up. Limited ROM, structured bottom pause.",
    3,[10,20],"3-1-2-0",60,"Limited ROM; structured bottom-range pause",false,
    "Box squat teaches proper depth and hip-hinge pattern. Pause eliminates momentum.",
    CK(["Stand in front of sturdy chair/box at knee height. Feet shoulder-width apart.","Box position"],
       ["Sit back onto box with control. Pause briefly, then drive up through heels.","Controlled sit"],
       ["Don't collapse onto box — tap and rise. Keep weight in midfoot, not toes.","Weight distribution"])),

  E("AQL3","Full-Depth Air Squat","aql",3,M(["quadriceps","glutes","core"]),"unilateral_lower_push",
    "Full ROM air squat — femur below parallel. Bodyweight only. Perfect form foundation.",
    3,[10,20],"3-0-2-0",90,"Full range of motion (femur below parallel)",false,
    "Full-depth squat builds mobility and strength. Femur below parallel is essential for full ROM.",
    CK(["Stand feet shoulder-width apart. Chest up, core braced.","Athletic stance"],
       ["Sit hips back and down until thighs break parallel to floor. Drive up.","Full depth"],
       ["Keep knees tracking over toes. Heels stay planted throughout.","Knee alignment"])),

  E("AQL4","Standing Calf Raise (Bilateral)","aql",4,M(["calves"]),"unilateral_lower_push",
    "Stand, rise onto balls of feet. Controlled lower. Basic ankle extension and calf contraction.",
    3,[15,25],"2-0-2-0",60,"Basic ankle extension and calf contraction",false,
    "Simple calf builder. Slow tempo increases time under tension for gastrocnemius growth.",
    CK(["Stand with feet hip-width apart. Hold wall for balance if needed.","Standing start"],
       ["Rise onto balls of feet as high as possible. Lower slowly through full ROM.","Full extension"],
       ["Control the descent — don't drop. Keep knees straight but not locked.","Knee position"])),

  E("AQL5","Close-Stance Squat","aql",5,M(["quadriceps","glutes"]),"unilateral_lower_push",
    "Feet together squat. Narrow base increases knee flexion torque. Quad-dominant variation.",
    3,[8,15],"3-0-2-0",90,"Narrow base; increases knee flexion torque",false,
    "Narrow stance shifts load to quadriceps and reduces glute activation. Greater knee flexion.",
    CK(["Stand with feet together. Arms forward for counterbalance.","Narrow stance"],
       ["Squat down keeping knees tracking over toes. Drive up through quads.","Quad squat"],
       ["If heels lift, work on ankle mobility or place heels on small wedge.","Heel contact"])),

  E("AQL6","Reverse Lunge","aql",6,M(["glutes","quadriceps"]),"unilateral_lower_push",
    "Step backward into lunge. Front leg drives up. Unilateral stability and balance demand.",
    3,[8,12],"3-0-2-0",90,"Unilateral stability; step back front leg drive",true,
    "Reverse lunge is easier on knees than forward lunge. Front leg does ~70% of the work.",
    CK(["Stand tall, hands on hips. Step one foot straight back into lunge.","Starting stance"],
       ["Lower back knee toward floor. Drive through front heel to return to standing.","Lunge pattern"],
       ["Keep front knee aligned over ankle. Don't let knee travel past toes.","Front knee position"])),

  E("AQL7","Deficit Split Squat","aql",7,M(["quadriceps","glutes"]),"unilateral_lower_push",
    "Front foot elevated on surface. Increases depth and quad stretch. Unilateral lower push.",
    3,[8,12],"3-1-2-0",90,"Elevated front foot; increased depth and stretch",true,
    "Elevating front foot increases ROM and quad stretch. ~80% bodyweight on front leg.",
    CK(["Front foot elevated on 2-4 inch surface. Rear foot back on floor.","Split stance"],
       ["Lower hips straight down until rear knee nearly touches floor. Drive up.","Deep split squat"],
       ["Keep torso upright. Don't lean forward to compensate for lack of mobility.","Upright posture"])),

  E("AQL8","Bulgarian Split Squat","aql",8,M(["quadriceps","glutes"]),"unilateral_lower_push",
    "Rear foot elevated on surface. ~85% of load on front leg. Gold standard unilateral quad work.",
    3,[8,12],"3-1-1-0",90,"Rear foot elevated; ~85% load on front leg",true,
    "~85% bodyweight on front leg. Rear foot elevation increases quad emphasis and stability demand.",
    CK(["Rear foot elevated on chair/bench. Front foot 2-3 feet forward.","Split setup"],
       ["Lower hips vertically until front thigh is parallel to floor. Drive through front heel.","Vertical descent"],
       ["Keep front knee tracking over toes. Don't let knee cave inward.","Knee alignment"])),

  E("AQL9","Assisted Pistol Squat","aql",9,M(["quadriceps","glutes","core"]),"unilateral_lower_push",
    "Single-leg squat holding door frame for balance. Full unilateral leg strength development.",
    3,[5,10],"3-0-2-0",120,"Single-leg squat; holding for balance",true,
    "Holding support reduces balance demand. Focus on single-leg strength and controlled descent.",
    CK(["Stand on one leg, grip door frame for support. Free leg extended forward.","Single-leg stance"],
       ["Squat down on supporting leg keeping heel planted. Use frame for balance only.","Assisted squat"],
       ["Use frame for balance — don't pull up. If heel lifts, reduce depth.","Balance vs support"])),

  E("AQL10","Sissy Squat (Heels Elevated)","aql",10,M(["quadriceps","core"]),"unilateral_lower_push",
    "Hips locked straight, knees project forward. Heels elevated. Isolates rectus femoris.",
    3,[8,12],"3-0-2-0",90,"Hips locked; knees project forward quad isolation",false,
    "Heels elevated shifts load to rectus femoris. Extreme quad isolation — start with partial ROM.",
    CK(["Heels on small wedge. Hips locked in extension. Hold support in front.","Setup"],
       ["Lean back keeping body straight, allowing knees to travel forward over toes.","Knee travel"],
       ["Start with shallow ROM. Deep sissy squat puts intense stress on patellar tendon.","Gradual depth"])),

  E("AQL11","Skater Squat","aql",11,M(["quadriceps","glutes","core"]),"unilateral_lower_push",
    "One-leg squat, trailing leg acts as counterbalance. Deep unilateral knee flexion.",
    3,[5,10],"3-0-2-0",120,"Trailing leg counterbalance, not support",true,
    "Trailing leg is counterbalance only — no weight bearing. Deep quad stretch at bottom.",
    CK(["Stand on one leg, other leg extended behind with toes hovering.","Balance stance"],
       ["Squat down on standing leg while trailing leg reaches back for balance.","Counterbalance squat"],
       ["Keep trailing leg light — it's for balance, not support. Heel stays planted.","Counterbalance only"])),

  E("AQL12","Strict Pistol Squat","aql",12,M(["quadriceps","glutes","core"]),"unilateral_lower_push",
    "Full single-leg squat with free leg extended. Extreme mobility and strength required.",
    3,[3,8],"3-0-2-0",120,"Full single-leg knee flexion; extreme mobility",true,
    "Ultimate unilateral bodyweight exercise. Requires ankle mobility, knee stability, and core strength.",
    CK(["Stand on one leg, other leg extended forward. Arms forward for balance.","Pistol start"],
       ["Squat down keeping extended leg off floor. Heel stays planted. Drive up.","Full pistol"],
       ["If you can't control descent, use support or box for assisted pistol first.","Gradual progression"])),
];

// ═══════════════════════════════════════════════════
// PATHWAY 6: Posterior Chain Legs (HPL) — Lv 1-12
// ═══════════════════════════════════════════════════

const HPL: Exercise96[] = [
  E("HPL1","Double-Leg Glute Bridge","hpl",1,M(["glutes","hamstrings"]),"lower_body_pull",
    "Lie supine, knees bent. Drive hips up squeezing glutes. Basic hip extension pattern.",
    3,[12,20],"2-1-2-0",60,"Basic hip extension; floor supported",false,
    "Foundation for all hip extension exercises. Squeeze glutes hard at top. Posterior pelvic tilt.",
    CK(["Lie supine, knees bent 90 degrees, feet hip-width apart. Arms at sides.","Neutral spine"],
       ["Drive hips up squeezing glutes at top. Hold for 1 second, lower with control.","Glute squeeze"],
       ["Don't overextend through lower back. Stop when hips start to arch.","Back health"])),

  E("HPL2","Single-Leg Glute Bridge","hpl",2,M(["glutes","hamstrings","core"]),"lower_body_pull",
    "One-leg bridge, other leg extended. Doubles load on working glute. Unilateral hip extension.",
    3,[8,14],"3-1-2-0",60,"Unilateral hip extension; doubles bodyweight load",true,
    "Single-leg version doubles glute load and adds core stability challenge to keep hips level.",
    CK(["Lie supine, one knee bent with foot flat. Other leg extended straight.","Single-leg setup"],
       ["Drive through planted heel to lift hips. Squeeze working glute at top. Lower with control.","Unilateral bridge"],
       ["Keep hips level — don't let one side drop. Brace core throughout.","Hip squareness"])),

  E("HPL3","Bodyweight Good Morning","hpl",3,M(["hamstrings","glutes","lower_back"]),"lower_body_pull",
    "Hands behind head, hip hinge. Push hips back, torso lowers. Eccentric hamstring stretch.",
    3,[10,15],"3-0-2-0",90,"Hip hinge; hands behind head lengthens lever",false,
    "Hip hinge pattern strengthens spinal erectors and hamstrings. Keep back neutral throughout.",
    CK(["Stand with feet hip-width apart, hands behind head. Chest up, tall posture.","Standing start"],
       ["Push hips back while keeping back straight. Lower torso until parallel to floor. Return.","Hip hinge"],
       ["Maintain neutral spine throughout. If back rounds, reduce range of motion.","Spine position"])),

  E("HPL4","Single-Leg Romanian Deadlift","hpl",4,M(["hamstrings","glutes","core"]),"lower_body_pull",
    "Stand on one leg, hinge at hip. Free leg extends behind for balance. Unilateral hinge.",
    3,[8,12],"3-0-2-0",90,"Unilateral balance; eccentric stretch under control",true,
    "Unilateral hinge challenges hamstring flexibility and single-leg balance simultaneously.",
    CK(["Stand on one leg with slight knee bend. Other leg hovering behind.","Balance stance"],
       ["Hinge at hip sending free leg backward. Keep back straight. Return to standing.","Hinge extension"],
       ["Keep standing knee slightly bent. Don't lock out or hyperextend.","Knee position"])),

  E("HPL5","Reverse Hyperextension (Prone)","hpl",5,M(["lower_back","glutes","hamstrings"]),"lower_body_pull",
    "Lie prone on bed/table edge. Legs hang off. Lift legs dynamically. Lower back + glute focus.",
    3,[10,15],"2-0-2-0",60,"Prone hip extension; dynamic against gravity",false,
    "Lying prone shifts hamstring vs glute activation. Light hip extension against gravity.",
    CK(["Lie face-down on elevated surface with hips at edge. Legs hanging free.","Prone position"],
       ["Lift legs toward ceiling using glutes and hamstrings. Lower with control.","Leg lift"],
       ["Keep upper body flat on surface. Don't arch neck to look at legs.","Upper body position"])),

  E("HPL6","Sliding Hamstring Curl (Bilateral)","hpl",6,M(["hamstrings","glutes"]),"closed_chain_lower_pull",
    "Heels on towels on slick floor. Bridge up, slide heels in/out. Dynamic knee flexion.",
    3,[8,12],"4-0-2-0",90,"Towel under heels; dynamic knee flexion",false,
    "Slick surface reduces friction. Slow eccentric (4s) builds hamstring eccentric strength.",
    CK(["Lie supine, heels on towels on slick floor. Bridge hips up.","Bridge position"],
       ["Slide heels away until legs straight. Pull them back keeping hips elevated.","Heel slide"],
       ["Keep hips elevated throughout. If hips drop, reduce slide distance.","Hip height"])),

  E("HPL7","Standing Calf Raise (Unilateral)","hpl",7,M(["calves"]),"unilateral_lower_push",
    "Single-leg calf raise on floor. Full range of motion. Unilateral gastrocnemius loading.",
    3,[12,20],"2-0-2-0",60,"Single-leg loading of ankle plantar flexors",true,
    "Unilateral calf raise doubles gastrocnemius load compared to bilateral version.",
    CK(["Stand on one foot. Hold wall for balance.","Single-leg stance"],
       ["Rise onto ball of foot as high as possible. Lower through full ROM.","Calf raise"],
       ["Keep ankle stable throughout. Don't roll inward or outward.","Ankle stability"])),

  E("HPL8","Deficit Single-Leg Calf Raise","hpl",8,M(["calves"]),"unilateral_lower_push",
    "On stair edge, single-leg. Increased ROM into deep stretch. Full gastrocnemius isolation.",
    3,[10,15],"3-0-2-0",60,"Single-leg; increased ankle ROM into stretch",true,
    "Stair edge allows heel to drop below toes for full stretch. Increased ROM drives hypertrophy.",
    CK(["Stand on stair edge on one foot. Heel hanging off edge. Hold rail for balance.","Deficit stance"],
       ["Lower heel into deep stretch below stair level. Rise onto toe as high as possible.","Deep ROM"],
       ["Use rail for balance only. Keep ankle stable — don't let it wobble.","Ankle control"])),

  E("HPL9","Sliding Hamstring Curl (Slow Eccentric)","hpl",9,M(["hamstrings","glutes"]),"closed_chain_lower_pull",
    "Bilateral curl with 5-second eccentric phase. Time under tension hamstring builder.",
    3,[6,10],"5-0-2-0",90,"5s eccentric phase; extreme time under tension",false,
    "Extended eccentric (5s) maximizes muscle damage and hamstring hypertrophy stimulus.",
    CK(["Lie supine, heels on towels. Bridge hips up and hold.","Elevated bridge"],
       ["Slide heels away in 5 seconds. Pull back in 2 seconds. Keep hips up throughout.","Slow eccentric"],
       ["If hamstrings cramp, shorten eccentric to 3s and hydrate between sets.","Cramp management"])),

  E("HPL10","Sliding Hamstring Curl (Unilateral)","hpl",10,M(["hamstrings","glutes","core"]),"closed_chain_lower_pull",
    "Single-leg towel curl on slick floor. Extreme hamstring isolation and tension.",
    3,[6,10],"4-0-2-0",90,"Single-leg towel curl; extreme hamstring tension",true,
    "Single-leg curl doubles hamstring load. Add core challenge by keeping other leg elevated.",
    CK(["Lie supine, one heel on towel. Other leg extended straight or elevated.","Unilateral setup"],
       ["Bridge up. Slide working heel in and out with control. Keep hips elevated.","Single-leg curl"],
       ["Keep hips level and square. Don't rotate toward the working leg.","Hip alignment"])),

  E("HPL11","Assisted Nordic Hamstring Curl","hpl",11,M(["hamstrings"]),"lower_body_pull",
    "Anchored under couch. Lower torso slowly. Hands catch and push back. Eccentric focus.",
    3,[4,8],"5-0-1-0",120,"Feet anchored; hands assist push-up from floor",false,
    "Eccentric-focused nordic curl. Hands assist concentric. Builds toward full nordic.",
    CK(["Kneel with ankles secured under couch. Torso upright, hands at sides.","Anchored start"],
       ["Lower torso forward slowly (5s). Catch with hands at full extension. Push back up.","Assisted descent"],
       ["Keep hips extended throughout. Don't hinge at hips to reduce load.","Hip lockout"])),

  E("HPL12","Unassisted Nordic Hamstring Curl","hpl",12,M(["hamstrings","glutes"]),"lower_body_pull",
    "Full eccentric hamstring curl to floor. No hand assistance. Elite hamstring output.",
    3,[3,6],"5-0-1-0",120,"Full eccentric control; elite hamstring output",false,
    "Maximum hamstring eccentric strength. Control the full descent without hand catch.",
    CK(["Kneel with ankles secured. Torso upright. Arms crossed on chest.","Unassisted start"],
       ["Lower torso forward with 5-second eccentric. Catch yourself at floor level.","Full eccentric"],
       ["If you can't control descent, return to assisted nordic. Keep hips extended.","Hip position"])),
];

// ═══════════════════════════════════════════════════
// PATHWAY 7: Anterior Core (AC) — Lv 1-12
// ═══════════════════════════════════════════════════

const AC: Exercise96[] = [
  E("AC1","Lying Dead Bug","ac",1,M(["core","obliques"]),"dynamic_core",
    "Lie supine, arms up, legs tabletop. Extend opposite arm/leg while keeping back flat.",
    3,[8,14],"3-0-2-0",60,"Anti-extension control; limbs move, spine stays flat",false,
    "Trains anti-extension core stability dynamically. Lower back must stay pressed to floor.",
    CK(["Lie supine, arms reaching up, legs in tabletop (knees 90 degrees, shins parallel).","Tabletop position"],
       ["Slowly extend right arm and left leg toward floor. Return to center. Alternate.","Controlled extension"],
       ["Press lower back into floor throughout. If back arches, reduce extension range.","Lumbar contact"])),

  E("AC2","Standard Crunch","ac",2,M(["upper_rectus_abdominis","core"]),"core_isometric",
    "Lie supine, knees bent. Curl shoulders up. Simple upper spine flexion, low demand.",
    3,[12,20],"2-0-2-0",60,"Simple upper spine flexion; low mechanical demand",false,
    "Basic spine flexion targets upper rectus abdominis. Keep neck relaxed — don't pull on head.",
    CK(["Lie supine, knees bent, feet flat. Hands lightly behind head or crossed on chest.","Starting position"],
       ["Curl shoulders up toward ceiling by contracting abs. Lower slowly.","Controlled curl"],
       ["Keep lower back on floor. Don't yank on neck. Use abs, not momentum.","Neck safety"])),

  E("AC3","Hollow Body Tuck Hold","ac",3,M(["rectus_abdominis","core"]),"core_isometric",
    "Lie supine, knees/chest tucked. Press lower back down. Introduces posterior pelvic tilt.",
    3,[15,30],"isometric",60,"Knees/chest tucked; posterior pelvic tilt",false,
    "Introduces the posterior pelvic tilt essential for all advanced core and handstand work.",
    CK(["Lie supine. Lift knees toward chest and shoulders off floor. Curl into tight ball.","Tuck position"],
       ["Press lower back firmly into floor. Breathe steadily while holding the tuck.","Isometric hold"],
       ["If lower back lifts off floor, tuck tighter. Form over duration.","Form check"])),

  E("AC4","Reverse Crunch","ac",4,M(["lower_rectus_abdominis","core"]),"dynamic_core",
    "Lie supine, hands at sides. Lift hips off floor rolling pelvis. Lower abdominal focus.",
    3,[10,15],"3-0-2-0",60,"Rolling pelvis off floor; lower ab focus",false,
    "Reverse crunch targets lower rectus abdominis. Rolling pelvis up requires lower ab contraction.",
    CK(["Lie supine, arms at sides, legs in tabletop.","Tabletop start"],
       ["Lift hips off floor by curling pelvis toward ribs. Lower with control.","Pelvic curl"],
       ["Use momentum from abs, not legs. Keep upper back and head on floor.","Controlled movement"])),

  E("AC5","Hollow Body Hold (Full)","ac",5,M(["rectus_abdominis","core","hip_flexors"]),"core_isometric",
    "Full hollow body — straight legs, arms extended. Long lever anti-extension isometric hold.",
    3,[20,45],"isometric",60,"Straight legs/arms; long lever anti-extension",false,
    "Foundation of all advanced calisthenic core control. Press lower back into floor throughout.",
    CK(["Lie supine, arms extended overhead, legs straight. Press lower back into floor.","Long lever start"],
       ["Lift shoulders and legs 2-3 inches off floor. Hold like a banana shape.","Hollow position"],
       ["If lower back lifts, raise legs higher to scale down load instantly.","Lumbar check"])),

  E("AC6","V-Up (Fold-Up)","ac",6,M(["rectus_abdominis","core","hip_flexors"]),"dynamic_core",
    "Simultaneous upper + lower body flexion. Touch feet at top. Full anterior chain fold.",
    3,[8,15],"3-0-2-0",60,"Concurrent upper and lower body flexion",false,
    "Simultaneous hip and spine flexion targets full anterior chain. Reach toward feet at top.",
    CK(["Lie supine, arms extended overhead, legs straight on floor.","Full extension"],
       ["Lift arms and legs simultaneously to touch fingers to toes. Lower under control.","Full fold"],
       ["Keep legs straight throughout. Bend at waist, not knees.","Leg position"])),

  E("AC7","Candlestick Leg Lifts","ac",7,M(["core","hip_flexors","lower_back"]),"dynamic_core",
    "Lie supine, lift legs to vertical. Thrust hips up at peak. Vertical hip thrust coordination.",
    3,[8,12],"3-0-2-0",60,"Vertical hip thrust at leg lift peak",false,
    "Hip thrust at top of leg lift engages lower abs. Controlled descent essential.",
    CK(["Lie supine, arms at sides, legs straight.","Starting position"],
       ["Lift legs to vertical. At top, thrust hips upward into candlestick position.","Candlestick peak"],
       ["Lower legs under control. If lower back arches, bend knees slightly.","Back contact"])),

  E("AC8","Dragon Flag Tuck","ac",8,M(["core","lats"]),"dynamic_core",
    "Grip anchor behind head. Lift body in tuck position. Shoulders as sole anchor point.",
    3,[5,10],"4-0-2-0",90,"Hips/knees bent; shoulders sole anchor",false,
    "Tucked dragon flag introduces the shoulder-anchor mechanics. Body rolls up onto upper back.",
    CK(["Grip stable anchor behind head. Roll weight onto upper shoulders.","Shoulder anchor"],
       ["Lift body in tucked position (knees to chest). Lower with 4-second eccentric.","Tuck descent"],
       ["Never load cervical spine. All weight should rest on shoulder blades.","Neck safety"])),

  E("AC9","Dragon Flag Advanced Tuck","ac",9,M(["core","lats","shoulders"]),"dynamic_core",
    "Knees bent but hips partially extended. Increases lever length from AC8.",
    3,[5,10],"4-0-2-0",90,"Knees bent, hips partially extended",false,
    "Partially opening the hips increases lever length and core demand beyond full tuck.",
    CK(["Grip anchor behind head. Start in tuck, then partially extend hips.","Advanced tuck"],
       ["Lower body with 4-second eccentric keeping hip angle open.","Hip extension"],
       ["If lower back arches, reduce hip opening until you maintain straight line.","Lever control"])),

  E("AC10","One-Leg Dragon Flag Negative","ac",10,M(["core","lats","shoulders"]),"dynamic_core",
    "One leg tucked, one straight. Slow 5s eccentric lowering of straight leg.",
    3,[4,8],"5-0-1-0",90,"One leg tucked; slow eccentric of other leg",false,
    "Asymmetric dragon flag. One leg straight increases load; tucking other reduces total torque.",
    CK(["Grip anchor behind head. One leg tucked, one extended straight.","Asymmetric start"],
       ["Lower both legs slowly (5s) keeping tucked leg stable and straight leg rigid.","Eccentric control"],
       ["Keep lower back flat. If arch occurs, keep both legs tucked.","Spine alignment"])),

  E("AC11","Straight-Leg Dragon Flag Negative","ac",11,M(["core","lats","shoulders"]),"dynamic_core",
    "Both legs straight. Controlled, slow eccentric descent. Extreme core tension.",
    3,[3,6],"5-0-1-0",120,"Straight legs; slow controlled eccentric descent",false,
    "Straight leg dragon flag is extreme core work. Entire body must remain rigid.",
    CK(["Grip anchor behind head. Both legs straight, body rigid.","Full extension"],
       ["Lower body slowly (5s) keeping perfect straight line. Stop at parallel to floor.","Slow descent"],
       ["If hips sag or back arches, return to advanced tuck progression.","Form threshold"])),

  E("AC12","Full Dragon Flag (Bruce Lee Hold)","ac",12,M(["core","lats","shoulders"]),"dynamic_core",
    "Complete isometric hold or dynamic reps with body perfectly rigid. Elite core feat.",
    3,[3,8],"4-1-2-0",120,"Complete isometric hold; rigid body control",false,
    "Elite calisthenic core exercise. Body must be perfectly rigid throughout full ROM.",
    CK(["Grip anchor behind head. Body straight and rigid from shoulders to toes.","Rigid start"],
       ["Lower body with control to just above parallel. Hold or press back up.","Full ROM"],
       ["Maintain perfect body tension throughout. Any breakdown means scale down.","Absolute control"])),
];

// ═══════════════════════════════════════════════════
// PATHWAY 8: Posterior & Lateral Core (PLC) — Lv 1-12
// ═══════════════════════════════════════════════════

const PLC: Exercise96[] = [
  E("PLC1","Quadruped Bird-Dog","plc",1,M(["core","glutes","lower_back"]),"scapular_mobility",
    "On hands and knees. Extend opposite arm and leg. Simple stability, low demand.",
    3,[8,12],"3-0-2-0",60,"Opposite arm/leg raise; low stability demand",false,
    "Foundational anti-rotation core exercise. Keep hips square and spine neutral throughout.",
    CK(["On hands and knees, hands under shoulders, knees under hips.","Tabletop position"],
       ["Extend right arm forward and left leg back simultaneously. Hold, return to center. Alternate.","Extension"],
       ["Keep hips level and square. Don't rotate or let hip drop.","Core stability"])),

  E("PLC2","Superman Hold","plc",2,M(["lower_back","glutes","traps"]),"lower_body_pull",
    "Prone, lift chest and legs simultaneously. Isometric back extension hold.",
    3,[15,30],"isometric",60,"Prone spine extension; isometric",false,
    "Isometric posterior chain activation. Builds spinal erector endurance for deadlifts.",
    CK(["Lie face-down, arms extended overhead, legs straight.","Prone start"],
       ["Lift chest, arms, and legs off floor simultaneously. Hold and breathe.","Isometric hold"],
       ["Keep neck neutral — eyes looking at floor. Don't hyperextend neck.","Neck position"])),

  E("PLC3","Standard Forearm Plank","plc",3,M(["core","obliques","shoulders"]),"core_isometric",
    "Forearms on floor, body straight. Static anti-extension abdominal brace.",
    3,[20,60],"isometric",60,"Isometric anti-extension; static abdominal brace",false,
    "Core anti-extension benchmark. Body must form straight line from head to heels.",
    CK(["Forearms on floor, elbows under shoulders. Toes tucked, legs straight.","Plank setup"],
       ["Lift body into straight line. Squeeze glutes and brace abs. Hold steady.","Straight line"],
       ["If hips sag, raise them slightly. If hips pike, lower them. Straight line only.","Form check"])),

  E("PLC4","Side Plank (Knee Supported)","plc",4,M(["obliques","core","glutes"]),"core_isometric",
    "On forearm, knees bent. Short lever lateral core isolation. Introductory lateral stability.",
    3,[15,30],"isometric",60,"Lateral core isolation; short lever pivot",false,
    "Knee-supported side plank reduces lever length. Introductory lateral core stability.",
    CK(["Lie on side, forearm on floor. Knees bent at 90 degrees behind you.","Side setup"],
       ["Lift hips off floor forming straight line from knees to shoulders. Hold.","Knee side plank"],
       ["Keep hips pushed forward — don't let them sink back.","Hip alignment"])),

  E("PLC5","Cross-Body Mountain Climbers","plc",5,M(["core","obliques","shoulders"]),"dynamic_core",
    "From plank, drive knee to opposite elbow. Rotational stability under dynamic movement.",
    3,[10,20],"2-0-1-0",60,"Rotational stability; dynamic cross-body drive",false,
    "Dynamic anti-rotation core training. Cross-body pattern engages obliques and hip flexors.",
    CK(["Start in high plank position. Body straight, core braced.","Plank start"],
       ["Drive right knee toward left elbow. Return and alternate. Keep hips low.","Cross-body drive"],
       ["Keep hips level. Don't let them rise up toward the driving knee.","Hip stability"])),

  E("PLC6","Side Plank (Foot Supported)","plc",6,M(["obliques","core","glutes"]),"core_isometric",
    "Full long lever side plank on feet. Full body length lateral core brace.",
    3,[15,30],"isometric",60,"Long lever lateral core brace; full body length",false,
    "Full side plank with feet stacked. Long lever maximizes lateral core demand.",
    CK(["Lie on side, forearm on floor. Feet stacked, legs straight.","Full side plank"],
       ["Lift hips off floor forming straight line from head to heels. Hold.","Full extension"],
       ["Keep hips pushed forward. Don't let them sink or rotate backward.","Alignment"])),

  E("PLC7","Plank Jacks","plc",7,M(["core","hip_abductors","shoulders"]),"dynamic_core",
    "From plank, jump feet in and out. Dynamic lateral leg movement with static core brace.",
    3,[10,20],"1-0-1-0",60,"Dynamic lateral jumping; static core brace",false,
    "Dynamic core stability challenge. Torso must remain still while legs move laterally.",
    CK(["Start in high plank, feet together. Body straight, core braced.","Plank start"],
       ["Jump feet apart and back together in controlled motion. Keep torso still.","Jump jacks"],
       ["Keep hips level and core tight. Don't let hips rise or sag.","Core bracing"])),

  E("PLC8","Side Plank with Hip Dips","plc",8,M(["obliques","core","glutes"]),"dynamic_core",
    "Side plank position, dip hip down and raise back up. Dynamic lateral core under load.",
    3,[8,14],"3-0-2-0",60,"Dynamic lateral flexion/extension under load",false,
    "Dynamic oblique training. Dip adds range of motion and eccentric lateral flexion.",
    CK(["Start in full side plank on forearm. Feet stacked.","Side plank"],
       ["Lower hip toward floor in controlled dip (3s). Raise back to plank position.","Hip dip"],
       ["Keep upper body stable — only hip moves. Don't rotate torso.","Upper body stability"])),

  E("PLC9","Hollow Body Plank Shrugs","plc",9,M(["serratus_anterior","core","shoulders"]),"scapular_mobility",
    "From high plank, perform scapular protraction/retraction. Serratus + core bracing.",
    3,[8,12],"2-1-2-1",60,"Scapular movement from high plank; core bracing",false,
    "Serratus anterior activation from scapular protraction. Key for shoulder health.",
    CK(["Start in high plank, arms straight, shoulders over wrists.","Plank position"],
       ["Push upper back toward ceiling (protract). Then squeeze shoulder blades together (retract).","Scapular motion"],
       ["Keep arms locked straight throughout. Only shoulder blades move.","Arm lockout"])),

  E("PLC10","Copenhagen Plank (Knee Supported)","plc",10,M(["obliques","core","hip_adductors"]),"core_isometric",
    "Top leg on elevated surface, bottom leg hover. Inner thigh + lateral core brace.",
    3,[15,30],"isometric",90,"Inner thigh + lateral core brace on elevated surface",false,
    "Copenhagen plank trains adductors and obliques simultaneously. Knee support reduces load.",
    CK(["Lie on side. Top knee on elevated surface (chair/couch). Bottom leg hovers.","Side setup"],
       ["Lift hips off floor forming straight line. Brace core and squeeze adductors.","Lift and hold"],
       ["Keep hips stacked and pushed forward. Don't let them sink.","Hip squareness"])),

  E("PLC11","Bear Walk (Exaggerated)","plc",11,M(["scapular_stabilizers","core","shoulders"]),"scapular_mobility",
    "On hands and feet (knees off floor). Walk forward with exaggerated ROM. Diagonal force lines.",
    3,[30,60],"2-0-1-0",60,"Dynamic animal crawl; diagonal force coordination",false,
    "Dynamic crawling builds coordinated core stability and scapular control through movement.",
    CK(["On hands and feet, knees off floor. Hips at 90 degrees.","Bear stance"],
       ["Walk forward with exaggerated steps. Keep core braced and hips level.","Bear crawl"],
       ["Don't let hips sway or rotate. Keep them as stable as a table.","Stable core"])),

  E("PLC12","Copenhagen Plank (Foot Support)","plc",12,M(["obliques","core","hip_adductors"]),"core_isometric",
    "Full long lever Copenhagen plank. Foot on elevated surface. Max lateral core demand.",
    3,[10,20],"isometric",90,"Long lever; foot supported on elevated surface",false,
    "Full Copenhagen plank with foot support. Maximum adductor and oblique challenge.",
    CK(["Lie on side. Top foot on elevated surface. Bottom leg straight and hovering.","Full lever"],
       ["Lift hips off floor into straight line. Hold with adductor squeeze and oblique brace.","Max hold"],
       ["If hips can't stay level, reduce to knee-supported version.","Progressive loading"])),
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
