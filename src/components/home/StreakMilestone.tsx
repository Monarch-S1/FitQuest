import { useEffect, useState, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { MotiView } from "moti";
import { useColors, typography, spacing } from "../../tokens";
import { hapticSuccess } from "../../utils/haptics";

export interface StreakMilestoneTier {
  days: number;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  glowColor: string;
  particleColors: string[];
}

const MILESTONES: Record<number, StreakMilestoneTier> = {
  7: {
    days: 7,
    label: "7 DAY STREAK",
    subtitle: "One full week of consistency. You're building the habit.",
    icon: "🔥",
    color: "#F59E0B",
    glowColor: "rgba(245, 158, 11, 0.3)",
    particleColors: ["#F59E0B", "#FBBF24", "#D97706", "#FCD34D"],
  },
  14: {
    days: 14,
    label: "14 DAY STREAK",
    subtitle: "Two weeks strong. Discipline is becoming second nature.",
    icon: "⚡",
    color: "#10B981",
    glowColor: "rgba(16, 185, 129, 0.3)",
    particleColors: ["#10B981", "#34D399", "#059669", "#6EE7B7"],
  },
  30: {
    days: 30,
    label: "30 DAY STREAK",
    subtitle: "A full month. You're in the elite tier. Unstoppable.",
    icon: "👑",
    color: "#A855F7",
    glowColor: "rgba(168, 85, 247, 0.35)",
    particleColors: ["#A855F7", "#C084FC", "#7C3AED", "#E9D5FF", "#F59E0B"],
  },
};

export function getStreakMilestone(days: number): StreakMilestoneTier | null {
  return MILESTONES[days] ?? null;
}

interface StreakMilestoneProps {
  tier: StreakMilestoneTier;
  onDismiss: () => void;
}

export function StreakMilestone({ tier, onDismiss }: StreakMilestoneProps) {
  const colors = useColors();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    hapticSuccess();
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Confetti particles
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        translateY: -500 - Math.random() * 400,
        translateX: (Math.random() - 0.5) * 120,
        duration: 1500 + Math.random() * 2000,
        left: `${5 + Math.random() * 90}%`,
        size: 3 + Math.random() * 8,
        color: tier.particleColors[i % tier.particleColors.length],
        rotation: Math.random() * 360,
        delay: i * 60,
      })),
    [tier.particleColors],
  );

  return (
    <Pressable
      onPress={onDismiss}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(8, 10, 15, 0.92)",
      }}
    >
      {/* Background glow */}
      {showContent && (
        <MotiView
          from={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.2, scale: 4 }}
          transition={{ type: "timing", duration: 2500 }}
          style={{
            position: "absolute",
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: tier.color,
          }}
        />
      )}

      {/* Particles */}
      {showContent && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          {particles.map((p, i) => (
            <MotiView
              key={i}
              from={{ translateY: 0, opacity: 1, scale: 1, rotate: "0deg" }}
              animate={{
                translateY: p.translateY,
                translateX: p.translateX,
                opacity: 0,
                scale: 0,
                rotate: `${p.rotation}deg`,
              }}
              transition={{
                type: "timing",
                duration: p.duration,
                delay: p.delay,
              }}
              style={{
                position: "absolute",
                bottom: "30%",
                left: p.left as any,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: 1,
              }}
            />
          ))}
        </View>
      )}

      {/* Main content */}
      <MotiView
        from={{ opacity: 0, scale: 0.3, translateY: 60 }}
        animate={{
          opacity: showContent ? 1 : 0,
          scale: showContent ? 1 : 0.3,
          translateY: showContent ? 0 : 60,
        }}
        transition={{ type: "spring", damping: 12, stiffness: 80 }}
        style={{ alignItems: "center", width: "100%", padding: spacing.xl }}
      >
        {/* Icon badge */}
        <MotiView
          from={{ scale: 0, rotate: "-180deg" }}
          animate={{ scale: 1, rotate: "0deg" }}
          transition={{ type: "spring", damping: 10, stiffness: 100, delay: 200 }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              backgroundColor: `${tier.color}15`,
              borderWidth: 2,
              borderColor: tier.color,
              borderRadius: 4,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: spacing[5],
              shadowColor: tier.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            <Text style={{ fontSize: 48 }}>{tier.icon}</Text>
          </View>
        </MotiView>

        {/* Title */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 400, type: "spring", damping: 15 }}
        >
          <Text
            style={{
              ...typography.h1,
              color: tier.color,
              fontSize: 28,
              textAlign: "center",
              letterSpacing: 3,
            }}
          >
            {tier.label}
          </Text>
        </MotiView>

        {/* Subtitle */}
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 600 }}>
          <Text
            style={{
              ...typography.body,
              color: colors.text.secondary,
              textAlign: "center",
              marginTop: spacing.md,
              maxWidth: 280,
              lineHeight: 20,
            }}
          >
            {tier.subtitle}
          </Text>
        </MotiView>

        {/* Dismiss hint */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1200 }}
          style={{ marginTop: spacing.xxl }}
        >
          <Text
            style={{
              ...typography.label,
              color: colors.text.tertiary,
              fontSize: 9,
              textAlign: "center",
            }}
          >
            TAP ANYWHERE TO CONTINUE
          </Text>
        </MotiView>
      </MotiView>
    </Pressable>
  );
}
