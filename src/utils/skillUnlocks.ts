import { SKILL_TREE, SkillNode } from "../data/skillTree";
import type { WorkoutSession } from "../stores/useUserStore";

/**
 * Get the set of exercise IDs that are currently "unlocked" based on
 * workout history. This mirrors the logic in SkillTreeView so our
 * notifications stay in sync with what the tree actually shows.
 */
export function getUnlockedExerciseIds(
  completedIds: Set<string>,
): Set<string> {
  const unlocked = new Set<string>();

  for (const branch of SKILL_TREE) {
    const anyCompleted = branch.nodes.some((n) => completedIds.has(n.exercise.id));
    if (anyCompleted) {
      // Entire family is unlocked
      for (const node of branch.nodes) {
        unlocked.add(node.exercise.id);
      }
    }
  }

  // If nothing completed yet, unlock all beginner exercises
  if (completedIds.size === 0) {
    for (const branch of SKILL_TREE) {
      for (const node of branch.nodes) {
        if (node.difficulty === "beginner") {
          unlocked.add(node.exercise.id);
        }
      }
    }
  }

  // Always unlock the first exercise in each family
  for (const branch of SKILL_TREE) {
    if (branch.nodes.length > 0) {
      unlocked.add(branch.nodes[0].exercise.id);
    }
  }

  return unlocked;
}

/**
 * Extract completed exercise IDs from a workout history array.
 */
export function extractCompletedIds(
  workoutHistory: WorkoutSession[],
): Set<string> {
  const completed = new Set<string>();
  for (const session of workoutHistory) {
    for (const ex of session.exercises || []) {
      if (ex.repsCompleted?.length) {
        completed.add(ex.exerciseId);
      }
    }
  }
  return completed;
}

/**
 * Find which exercises are newly unlocked by comparing the completed
 * exercise sets before and after a workout.
 *
 * Returns an array of SkillNode objects for the newly unlocked exercises,
 * grouped by their movement family for display.
 */
export interface NewSkillUnlock {
  node: SkillNode;
  branchLabel: string;
  branchAccent: string;
  branchIcon: string;
  family: string;
}

export function findNewUnlocks(
  oldCompletedIds: Set<string>,
  newCompletedIds: Set<string>,
): NewSkillUnlock[] {
  const oldUnlocked = getUnlockedExerciseIds(oldCompletedIds);
  const newUnlocked = getUnlockedExerciseIds(newCompletedIds);

  const newlyUnlocked: NewSkillUnlock[] = [];

  for (const branch of SKILL_TREE) {
    for (const node of branch.nodes) {
      const wasUnlocked = oldUnlocked.has(node.exercise.id);
      const isNowUnlocked = newUnlocked.has(node.exercise.id);

      // Only notify if it wasn't unlocked before AND wasn't just completed
      // (completing an exercise shouldn't show it as a "new unlock")
      if (!wasUnlocked && isNowUnlocked && !newCompletedIds.has(node.exercise.id)) {
        newlyUnlocked.push({
          node,
          branchLabel: branch.label,
          branchAccent: branch.accent,
          branchIcon: branch.icon,
          family: branch.family,
        });
      }
    }
  }

  return newlyUnlocked;
}
