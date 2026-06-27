import { View, Text, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { useColors, spacing, typography } from "../../tokens";
import { ScalePopView } from "./AnimationLibrary";

interface AchievementUnlockedProps {
  title: string;
  subtitle?: string;
  icon?: string;
  xpGained?: number;
  onAnimationComplete?: () => void;
}

/**
 * AchievementUnlocked — Full-screen achievement celebration
 * Shows when user completes a notable milestone
 * Includes pop animation, sound effect, and haptic feedback
 */
export function AchievementUnlocked({
  title,
  subtitle,
  icon = "🏆",
  xpGained,
  onAnimationComplete,
}: AchievementUnlockedProps) {
  const colors = useColors();
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto-hide after 2.5 seconds
    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, [glowAnim, onAnimationComplete]);

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        zIndex: 999,
      }}
    >
      <ScalePopView overshoot={5}>
        <View
          style={{
            alignItems: "center",
            backgroundColor: colors.bg.card,
            borderRadius: 20,
            paddingVertical: spacing.xl,
            paddingHorizontal: spacing.lg,
            width: "80%",
          }}
        >
          {/* Icon with glow */}
          <Animated.Text
            style={{
              fontSize: 60,
              marginBottom: spacing.md,
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              }),
            }}
          >
            {icon}
          </Animated.Text>

          {/* Title */}
          <Text
            style={{
              ...typography.display,
              color: colors.accent.DEFAULT,
              marginBottom: spacing.xs,
              textAlign: "center",
              fontSize: 24,
            }}
          >
            {title}
          </Text>

          {/* Subtitle */}
          {subtitle && (
            <Text
              style={{
                fontSize: 14,
                color: colors.text.secondary,
                marginBottom: spacing.md,
                textAlign: "center",
              }}
            >
              {subtitle}
            </Text>
          )}

          {/* XP badge */}
          {xpGained && (
            <View
              style={{
                backgroundColor: colors.accent.DEFAULT + "20",
                borderRadius: 12,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.accent.DEFAULT,
                }}
              >
                +{xpGained} XP
              </Text>
            </View>
          )}
        </View>
      </ScalePopView>
    </View>
  );
}
