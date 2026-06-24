/**
 * Intelligence-Driven Recommendation System — FitQuest
 *
 * Replaces the old A/B/C/D rotation with a smart recommendation engine that:
 * - Works with `workout-96-{0..3}` IDs from the 96-exercise generator
 * - Tracks pathway fatigue (which muscle families were trained recently)
 * - Recommends the pathway with the longest recovery gap
 * - Respects fitness goals for rep/set/rest adjustments
 * - Uses quest titles (THE VANGUARD, etc.) instead of "WORKOUT A"
 *
 * The 4-class archetype rotation (0% overlap between opposite pairs):
 *   Quest 0: THE VANGUARD — HP + VP + AQL + AC        (pure anterior chain)
 *   Quest 1: THE SHADOW   — HPLL + VPLL + HPL + PLC    (pure posterior chain)
 *   Quest 2: THE TEMPEST  — HP + VP + HPLL + VPLL      (pure upper body)
 *   Quest 3: THE COLOSSUS — AQL + HPL + AC + PLC       (pure lower body + core)
 */

import { WorkoutSession, FitnessGoal } from "../stores/useUserStore";
import { getAllExercises, getProgressionSummary } from "./progression";

// ─── Quest configuration ───────────────────────

const QUEST_NAMES = ["THE VANGUARD", "THE SHADOW", "THE TEMPEST", "THE COLOSSUS"];

const QUEST_IDS = ["workout-96-0", "workout-96-1", "workout-96-2", "workout-96-3"];

/** Pathway families trained per quest day */
const QUEST_PATHWAYS: { push: string[]; pull: string[]; legs: string[]; core: string[] }[] = [
  { push: ["HP", "VP"], pull: [], legs: ["AQL"], core: ["AC"] }, // Quest 0: VANGUARD
  { push: [], pull: ["HPLL", "VPLL"], legs: ["HPL"], core: ["PLC"] }, // Quest 1: SHADOW
  { push: ["HP", "VP"], pull: ["HPLL", "VPLL"], legs: [], core: [] }, // Quest 2: TEMPEST
  { push: [], pull: [], legs: ["AQL", "HPL"], core: ["AC", "PLC"] }, // Quest 3: COLOSSUS
];

const QUEST_FOCUS = [
  "Horizontal Push · Vertical Push · Anterior Legs · Core Flexion",
  "Horizontal Pull · Vertical Pull · Posterior Legs · Core Extension",
  "Horizontal Push · Vertical Push · Horizontal Pull · Vertical Pull",
  "Anterior Legs · Posterior Legs · Core Flexion · Core Extension",
];

// ─── Exports ───────────────────────────────────

export interface TrainingInsight {
  type: "progression" | "deload" | "recovery" | "imbalance" | "milestone" | "volume";
  icon: string;
  title: string;
  message: string;
  priority: number;
}

export interface WorkoutRecommendation {
  recommendedId: string;
  recommendedName: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

// ─── Fatigue tracking helpers ──────────────────

interface PathwayFatigue {
  lastTrainedDate: string | null;
  daysSinceTraining: number;
  pathwayId: string;
  trainedSessions: number;
}

/**
 * Calculate days since each pathway was last trained based on workout history.
 * Each workout-96-N session trains specific pathways.
 */
function calculatePathwayFatigue(workoutHistory: WorkoutSession[]): PathwayFatigue[] {
  const pathwayMap = new Map<string, { lastDate: string | null; count: number }>();
  const allPathways = ["HP", "VP", "HPLL", "VPLL", "AQL", "HPL", "AC", "PLC"];

  for (const pw of allPathways) {
    pathwayMap.set(pw, { lastDate: null, count: 0 });
  }

  for (const session of workoutHistory) {
    const match = session.workoutId?.match(/^workout-96-(\d)$/);
    if (!match) continue;

    const dayIndex = parseInt(match[1], 10);
    const pathways = QUEST_PATHWAYS[dayIndex];
    if (!pathways) continue;

    for (const family of Object.values(pathways)) {
      for (const pw of family) {
        const entry = pathwayMap.get(pw)!;
        entry.lastDate = session.date;
        entry.count++;
      }
    }
  }

  const today = new Date();
  const result: PathwayFatigue[] = [];

  for (const pw of allPathways) {
    const entry = pathwayMap.get(pw)!;
    let daysSince = 999;
    if (entry.lastDate) {
      const lastDate = new Date(entry.lastDate);
      daysSince = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    result.push({
      lastTrainedDate: entry.lastDate,
      daysSinceTraining: daysSince,
      pathwayId: pw,
      trainedSessions: entry.count,
    });
  }

  return result;
}

/**
 * Score each quest day based on pathway fatigue gaps.
 * Higher score = more recommended (pathways with longer gaps get prioritized).
 */
function scoreQuestDays(fatigue: PathwayFatigue[]): { dayIndex: number; score: number }[] {
  const scores = [0, 0, 0, 0];

  for (let day = 0; day < 4; day++) {
    let score = 0;
    const pathways = QUEST_PATHWAYS[day];

    for (const family of Object.values(pathways)) {
      for (const pw of family) {
        const f = fatigue.find((f) => f.pathwayId === pw);
        if (f) {
          // Score = days since training (longer gap = higher score)
          score += Math.min(f.daysSinceTraining, 14); // Cap at 14 days
          // Bonus for pathways never trained
          if (f.trainedSessions === 0) score += 5;
        }
      }
    }

    scores[day] = score;
  }

  return scores.map((score, dayIndex) => ({ dayIndex, score }));
}

// ─── Main recommendation ───────────────────────

/**
 * Recommend which quest to do today based on:
 * 1. Already trained today? → Rest
 * 2. Pathway fatigue gaps → Recommend the quest with the most rested pathways
 * 3. Recovery status → Confidence adjustment
 * 4. Fitness goal → Tailored reasoning
 */
export function getRecommendation(
  workoutHistory: WorkoutSession[],
  recoveryStatus: "optimal" | "moderate" | "caution",
  fitnessGoal: FitnessGoal = "general",
): WorkoutRecommendation {
  const lastSession = workoutHistory.length > 0 ? workoutHistory[workoutHistory.length - 1] : null;
  const lastSessionDate = lastSession?.date ?? null;

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

  // Calculate fatigue and score quest days
  const fatigue = calculatePathwayFatigue(workoutHistory);
  const scored = scoreQuestDays(fatigue);

  // Sort by score descending, pick the highest
  scored.sort((a, b) => b.score - a.score);
  const bestDay = scored[0];
  const questId = QUEST_IDS[bestDay.dayIndex];
  const questName = QUEST_NAMES[bestDay.dayIndex];
  const focus = QUEST_FOCUS[bestDay.dayIndex];

  // Find the most fatigued pathway for reasoning
  fatigue.sort((a, b) => b.daysSinceTraining - a.daysSinceTraining);
  const mostRested = fatigue[0];

  // Build reasoning based on confidence + data
  const isNewUser = workoutHistory.length === 0;
  const hasHistory = workoutHistory.length >= 3;

  let reasoning: string;
  let confidence: "high" | "medium" | "low";

  if (isNewUser) {
    reasoning = `Starting fresh — ${questName} is a great first quest. It builds ${focus.toLowerCase()}, establishing your foundation across all movement families.`;
    confidence = "high";
  } else if (recoveryStatus === "caution") {
    reasoning = `Your recovery is flagged as CAUTION. ${questName} (
${focus.toLowerCase()}) is recommended based on recovery gaps, but consider reducing intensity — leave more reps in reserve.`;
    confidence = "medium";
  } else if (mostRested && mostRested.daysSinceTraining >= 3) {
    reasoning = `${questName} targets ${focus.toLowerCase()}. Your ${mostRested.pathwayId} pathway has been resting for ${mostRested.daysSinceTraining} days — prime time to train it.`;
    confidence = "high";
  } else if (hasHistory) {
    reasoning = `${questName} continues your balanced progression. Focus: ${focus.toLowerCase()}. All major movement families are primed.`;
    confidence = "high";
  } else {
    reasoning = `Next up: ${questName}. This quest builds ${focus.toLowerCase()} for balanced development.`;
    confidence = "high";
  }

  // Append goal-specific note
  if (fitnessGoal !== "general" && fitnessGoal !== "endurance") {
    const goalLabel = fitnessGoal === "strength" ? "Strength" : "Hypertrophy";
    reasoning += ` Your ${goalLabel} goal is factored into the rep schemes.`;
  }

  return {
    recommendedId: questId,
    recommendedName: questName,
    confidence,
    reasoning,
  };
}

// ─── Training Insights (updated for 96-exercise DB) ─────

/**
 * Generate training insights based on workout history and current state.
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

  // --- Pathway balance insight (new) ---
  if (workoutHistory.length >= 3) {
    const fatigue = calculatePathwayFatigue(workoutHistory);
    fatigue.sort((a, b) => b.daysSinceTraining - a.daysSinceTraining);
    const mostRested = fatigue[0];
    if (mostRested && mostRested.daysSinceTraining >= 4 && mostRested.trainedSessions > 0) {
      insights.push({
        type: "imbalance",
        icon: "◇",
        title: "PATHWAY RESTED",
        message: `Your ${mostRested.pathwayId} pathway hasn't been trained in ${mostRested.daysSinceTraining} days. Consider a quest that targets this movement family.`,
        priority: 70,
      });
    }
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
