/**
 * useSkillTreeSounds — Fires sound effects when skill tree nodes transition between states.
 *
 * Detects changes in `nodeStates` between renders and plays the appropriate sound
 * when a node advances to a higher state (e.g. unlocked → active, active → mastered).
 * Uses the priority-debounced `playSkillSound()` from levelUpSound to prevent
 * audio clutter when multiple nodes transition simultaneously.
 *
 * This hook is designed to be called from SkillTreeView, which owns the computed
 * `nodeStates` map.
 */

import { useEffect, useRef } from "react";
import { playSkillSound } from "../services/levelUpSound";

/**
 * Rank order for state transitions (higher = more advanced).
 */
const STATE_RANK: Record<string, number> = {
  locked: 0,
  unlocked: 1,
  active: 2,
  mastered: 3,
};

/**
 * Detect and play sounds for skill tree node state transitions.
 *
 * @param nodeStates - The current computed nodeStates map (id → state string)
 * @param enabled   - Whether sounds are currently enabled (default: true)
 */
export function useSkillTreeSounds(nodeStates: Map<string, string>, enabled: boolean = true): void {
  const prevRef = useRef<Map<string, string> | null>(null);

  useEffect(() => {
    if (!enabled || !nodeStates) return;

    const prev = prevRef.current;

    if (prev && prev.size > 0) {
      // Only scan the current states for advanced nodes — we only care about
      // nodes that have progressed since the last render
      let highestTransition: "unlock" | "mastery" | null = null;

      for (const [nodeId, currentState] of nodeStates) {
        const prevState = prev.get(nodeId);
        if (!prevState || prevState === currentState) continue;

        const prevRank = STATE_RANK[prevState] ?? 0;
        const currRank = STATE_RANK[currentState] ?? 0;

        if (currRank > prevRank && prevRank >= 0) {
          // Determine transition type
          if (currRank >= 3) {
            highestTransition = "mastery";
          } else if (currRank >= 1 && highestTransition !== "mastery") {
            // Only upgrade to 'unlock' if we haven't seen a mastery
            highestTransition = "unlock";
          }
        }
      }

      if (highestTransition) {
        playSkillSound(highestTransition);
      }
    }

    // Update ref for next render
    prevRef.current = new Map(nodeStates);
  }, [nodeStates, enabled]);
}
