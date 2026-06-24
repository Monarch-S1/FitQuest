/**
 * SkillTreeIntroOverlay — Quick-start guide shown on first skill tree visit.
 *
 * Explains the core interactions:
 * 1. Tap spheres to view exercise details
 * 2. Collapsible branches — tap headers to expand/collapse
 * 3. Legend — what sphere states mean
 * 4. Filter tabs — focus on specific muscle families
 *
 * Dismisses on tap. Persists via useUserStore.hasSeenSkillTreeIntro.
 */

import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Dimensions, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import { useColors, spacing } from "../../tokens";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TipCard {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}

const TIPS: TipCard[] = [
  {
    icon: "◎",
    title: "TAP SPHERES",
    subtitle:
      "Tap any sphere to see exercise details, form checkpoints, and skill progression. Tap again to close.",
    color: "#60A5FA",
  },
  {
    icon: "▼",
    title: "COLLAPSIBLE BRANCHES",
    subtitle:
      "Each branch has 12 exercises across 2 pathways. Tap a branch header to expand or collapse — reduce visual clutter by focusing on one branch at a time.",
    color: "#34D399",
  },
  {
    icon: "◇",
    title: "SPHERE STATES",
    subtitle:
      "🔒 Locked (gray) → Unlocked (dim) → Active (bright) → ✓ Mastered (green). Complete workouts to advance nodes along each pathway.",
    color: "#FBBF24",
  },
  {
    icon: "⬆",
    title: "FILTER TABS",
    subtitle:
      "Use the tabs at the top to filter by muscle family: PUSH, PULL, LEGS, or CORE. The mastery bar shows your overall progress.",
    color: "#F472B6",
  },
];

export function SkillTreeIntroOverlay({ onDismiss }: { onDismiss: () => void }) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Stagger entrance so the user sees the tree first, then the overlay fades in
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    // Wait for fade-out animation before calling onDismiss
    setTimeout(onDismiss, 300);
  };

  if (!visible) {
    return (
      <Pressable
        onPress={handleDismiss}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: "rgba(8, 10, 15, 0.92)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "timing", duration: 200 }}
          style={{ alignItems: "center", padding: spacing.lg }}
        >
          <Text
            style={{
              fontFamily: "Inter-Regular",
              fontSize: 10,
              color: colors.text.tertiary,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            Loading guide…
          </Text>
        </MotiView>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handleDismiss}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: "rgba(8, 10, 15, 0.92)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Background glow orb */}
      <MotiView
        from={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.08, scale: 3 }}
        transition={{ type: "timing", duration: 2000, delay: 200 }}
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: colors.accent.DEFAULT,
        }}
        pointerEvents="none"
      />

      {/* Title */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 14, stiffness: 90, delay: 200 }}
        style={{
          alignItems: "center",
          marginBottom: spacing.xl,
          paddingHorizontal: spacing.lg,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            marginBottom: spacing.sm,
          }}
        >
          <Text style={{ fontSize: 22, opacity: 0.7 }}>✦</Text>
          <Text
            style={{
              fontFamily: "Inter-SemiBold",
              fontSize: 18,
              color: colors.text.primary,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Skill Tree Guide
          </Text>
          <Text style={{ fontSize: 22, opacity: 0.7 }}>✦</Text>
        </View>
        <Text
          style={{
            fontFamily: "Inter-Regular",
            fontSize: 10,
            color: colors.text.secondary,
            letterSpacing: 0.5,
            textAlign: "center",
            opacity: 0.7,
          }}
        >
          Master exercises by completing workouts. Each sphere represents a skill you can unlock.
        </Text>
      </MotiView>

      {/* Tips cards */}
      <ScrollView
        style={{ maxHeight: 400 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
      >
        <View style={{ gap: spacing.md }}>
          {TIPS.map((tip, index) => (
            <MotiView
              key={index}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{
                type: "spring",
                damping: 16,
                stiffness: 100,
                delay: 350 + index * 120,
              }}
            >
              <Pressable
                onPress={handleDismiss}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: spacing.md,
                  backgroundColor: `${tip.color}08`,
                  borderWidth: 1,
                  borderColor: `${tip.color}18`,
                  borderRadius: 6,
                  padding: spacing.md,
                  width: Math.min(SCREEN_WIDTH - spacing.lg * 4, 320),
                }}
              >
                {/* Icon circle */}
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: `${tip.color}15`,
                    borderWidth: 1,
                    borderColor: `${tip.color}25`,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ fontSize: 14, color: tip.color }}>{tip.icon}</Text>
                </View>

                {/* Text */}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={{
                      fontFamily: "Inter-SemiBold",
                      fontSize: 9,
                      color: tip.color,
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                    }}
                  >
                    {tip.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter-Regular",
                      fontSize: 10,
                      color: colors.text.secondary,
                      lineHeight: 16,
                    }}
                  >
                    {tip.subtitle}
                  </Text>
                </View>
              </Pressable>
            </MotiView>
          ))}
        </View>
      </ScrollView>

      {/* Skip button — bottom-left */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 600, delay: 1000 }}
        style={{
          position: "absolute",
          bottom: spacing.lg,
          left: spacing.lg,
        }}
      >
        <TouchableOpacity
          onPress={handleDismiss}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Skip tutorial"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text
            style={{
              fontFamily: "Inter-Regular",
              fontSize: 8,
              color: colors.text.tertiary,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              opacity: 0.6,
            }}
          >
            Skip tutorial
          </Text>
        </TouchableOpacity>
      </MotiView>

      {/* Dismiss hint */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 600, delay: 1200 }}
        style={{ marginTop: spacing.xl }}
      >
        <View
          style={{
            backgroundColor: `${colors.text.tertiary}10`,
            borderRadius: 20,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm + 2,
            borderWidth: 1,
            borderColor: `${colors.text.tertiary}15`,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter-Regular",
              fontSize: 9,
              color: colors.text.tertiary,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            Tap anywhere to begin
          </Text>
        </View>
      </MotiView>
    </Pressable>
  );
}
