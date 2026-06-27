/**
 * SkillNode — Connected Sphere Node with Enhanced State Indicators
 *
 * Game-inspired sphere design with strong visual distinction:
 *   🔒 LOCKED    — 24dp, dark gray, padlock icon, no glow
 *   ○ UNLOCKED   — 28dp, visible colored border, faint fill, open circle
 *   ◉ ACTIVE     — 34dp, bright fill, strong breathing glow ring
 *   ★ MASTERED   — 42dp, brilliant fill, pulsing radiant ring, checkmark icon
 *
 * Design inspired by: Path of Exile (color states), God of War (clear icons),
 * Final Fantasy X Sphere Grid (physical progression distinction).
 */

import { useEffect, useRef, useMemo } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { MotiView } from "moti";
import { useColors } from "../../tokens";
import { SkillNode as SkillNodeData } from "../../data/skillTree";

interface SkillNodeProps {
  node: SkillNodeData;
  isCompleted: boolean;
  isUnlocked: boolean;
  isMastered: boolean;
  isSelected: boolean;
  onPress: () => void;
  onLayout?: (event: any) => void;
  /** Stagger delay for mount animation (index * ms) */
  animationDelay?: number;
}

/** Sphere diameter by state — 20% larger than before */
const SPHERE_SIZE = {
  locked: 24,
  unlocked: 28,
  active: 34,
  mastered: 42,
};

/** Glow ring diameter for active/mastered states */
const GLOW_RING = {
  active: 44,
  mastered: 54,
};

/** State ranks for transition detection (higher = more advanced) */
const STATE_RANK: Record<string, number> = {
  locked: 0,
  unlocked: 1,
  active: 2,
  mastered: 3,
};

export function SkillNode({
  node,
  isCompleted,
  isUnlocked,
  isMastered,
  isSelected,
  onPress,
  onLayout,
  animationDelay = 0,
}: SkillNodeProps) {
  const colors = useColors();

  const state = isMastered
    ? "mastered"
    : isCompleted
      ? "active"
      : isUnlocked
        ? "unlocked"
        : "locked";

  const size = SPHERE_SIZE[state];
  const isDim = state === "locked";
  const isHighlighted = state === "mastered" || state === "active";

  // Brighter, more distinct colors
  const sphereColor =
    state === "mastered"
      ? colors.success
      : state === "active"
        ? node.accent
        : state === "unlocked"
          ? colors.text.secondary
          : "#3A3645";

  const labelColor = isDim ? colors.text.tertiary : colors.text.primary;

  // ── State transition "pop" animation ──────────────

  const prevStateRef = useRef(state);
  const popScale = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;

    const prevRank = STATE_RANK[prev] ?? 0;
    const currRank = STATE_RANK[state] ?? 0;

    if (currRank > prevRank && prevRank >= 0) {
      popScale.setValue(0.85);
      Animated.spring(popScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [state, popScale]);

  return (
    <MotiView
      from={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        damping: 14,
        stiffness: 90,
        delay: animationDelay,
      }}
      onLayout={onLayout}
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: GLOW_RING.mastered,
        height: GLOW_RING.mastered,
      }}
    >
      {/* ── Glow ring — mastered (wide, pulsing radial) ── */}
      {state === "mastered" && (
        <MotiView
          from={{ scale: 0.95, opacity: 0.35 }}
          animate={{ scale: 1.06, opacity: 0.5 }}
          transition={{ loop: true, repeatReverse: true, duration: 2000, type: "timing" }}
          style={{
            position: "absolute",
            width: GLOW_RING.mastered,
            height: GLOW_RING.mastered,
            borderRadius: GLOW_RING.mastered / 2,
            backgroundColor: `${sphereColor}20`,
            borderWidth: 1.5,
            borderColor: `${sphereColor}40`,
          }}
        />
      )}

      {/* ── Glow ring — active (breathing pulse) ── */}
      {state === "active" && (
        <MotiView
          from={{ scale: 0.97, opacity: 0.2 }}
          animate={{ scale: 1.05, opacity: 0.35 }}
          transition={{ loop: true, repeatReverse: true, duration: 1500, type: "timing" }}
          style={{
            position: "absolute",
            width: GLOW_RING.active,
            height: GLOW_RING.active,
            borderRadius: GLOW_RING.active / 2,
            backgroundColor: `${sphereColor}18`,
          }}
        />
      )}

      {/* ── Selected ring ── */}
      {isSelected && (
        <View
          style={{
            position: "absolute",
            width: GLOW_RING.mastered + 8,
            height: GLOW_RING.mastered + 8,
            borderRadius: (GLOW_RING.mastered + 8) / 2,
            borderWidth: 2,
            borderColor: colors.accent.DEFAULT,
          }}
        />
      )}

      {/* ── Core sphere ── */}
      <Animated.View style={{ transform: [{ scale: popScale }] }}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${node.exercise.name}, ${state}`}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: isDim ? sphereColor : `${sphereColor}25`,
            borderWidth: isDim ? 1 : 2.5,
            borderColor: isDim ? "#3A3645" : sphereColor,
            alignItems: "center",
            justifyContent: "center",
            opacity: isDim ? 0.5 : 1,
            ...(isHighlighted
              ? {
                  shadowColor: sphereColor,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: state === "mastered" ? 12 : 6,
                  elevation: state === "mastered" ? 12 : 6,
                }
              : {}),
          }}
        >
          {/* Mastered: checkmark ✓ */}
          {state === "mastered" && (
            <MotiView
              from={{ rotate: "0deg", scale: 0.8 }}
              animate={{ rotate: "360deg", scale: 1 }}
              transition={{ type: "timing", duration: 600, delay: animationDelay + 200 }}
            >
              <Text
                style={{ fontSize: 16, color: colors.bg.base, fontWeight: "bold", marginTop: -1 }}
              >
                ✓
              </Text>
            </MotiView>
          )}

          {/* Active: diamond ◇ */}
          {state === "active" && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 1,
                backgroundColor: sphereColor,
                transform: [{ rotate: "45deg" }],
              }}
            />
          )}

          {/* Unlocked: open circle */}
          {state === "unlocked" && (
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sphereColor }} />
          )}

          {/* Locked: padlock 🔒 */}
          {state === "locked" && (
            <Text style={{ fontSize: 10, color: "#5A5665", marginTop: -1 }}>🔒</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Level label */}
      <Text
        style={{
          fontFamily: "Inter-SemiBold",
          fontSize: 8,
          color: labelColor,
          letterSpacing: 0.5,
          marginTop: 4,
          textAlign: "center",
          opacity: isDim ? 0.4 : 0.8,
        }}
      >
        Lv{node.pathwayLevel}
      </Text>
    </MotiView>
  );
}
