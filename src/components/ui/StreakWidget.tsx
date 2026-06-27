import { View, Text } from "react-native";
import { useColors, spacing, typography, fonts, Label, H2, H4, Body } from "../../tokens";
import { Card } from "./Card";

interface StreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  elevation?: "low" | "medium" | "high";
}

/**
 * StreakWidget — Prominent display of current and best streak
 * Shows visual encouragement and progress celebration.
 */
export function StreakWidget({
  currentStreak,
  longestStreak,
  isActiveToday,
  elevation = "high",
}: StreakWidgetProps) {
  const colors = useColors();

  const streakStatus = currentStreak >= longestStreak && currentStreak > 0 ? "🔥 ON FIRE!" : "🔥 ACTIVE";

  return (
    <Card
      variant={currentStreak >= 7 ? "glass" : "solid"}
      elevation={elevation}
      style={{ marginBottom: spacing.lg }}
    >
      <View style={{ gap: spacing.md, alignItems: "center", paddingVertical: spacing.sm }}>
        {/* Flame icon */}
        <Text style={{ fontSize: 32, marginBottom: spacing.xs }}>🔥</Text>

        {/* Current Streak */}
        <View style={{ alignItems: "center" }}>
          <Label variant="secondary" style={{ fontSize: 9, marginBottom: spacing.xs }}>
            CURRENT STREAK
          </Label>
          <H2 style={{ color: colors.accent.DEFAULT }}>{currentStreak}</H2>
          <Body variant="secondary" size="sm" style={{ marginTop: spacing.xs, fontSize: 10 }}>
            {streakStatus}
          </Body>
        </View>

        {/* Motivation message */}
        {!isActiveToday ? (
          <View
            style={{
              backgroundColor: colors.accent.DEFAULT + "20",
              borderRadius: 8,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              marginTop: spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: colors.accent.DEFAULT,
                fontFamily: fonts.body.semiBold,
                textAlign: "center",
              }}
            >
              Complete a workout today to keep the streak alive!
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: colors.success + "20",
              borderRadius: 8,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              marginTop: spacing.sm,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: colors.success,
                fontFamily: fonts.body.semiBold,
                textAlign: "center",
              }}
            >
              ✓ Workout completed today!
            </Text>
          </View>
        )}

        {/* Best streak comparison */}
        {currentStreak < longestStreak && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              marginTop: spacing.sm,
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border.subtle,
            }}
          >
            <Text style={{ fontSize: 10, color: colors.text.secondary }}>Personal Best:</Text>
            <H4 style={{ color: colors.text.primary }}>{longestStreak}</H4>
            <Body variant="secondary" size="sm" style={{ fontSize: 8 }}>
              ({longestStreak - currentStreak} more to go!)
            </Body>
          </View>
        )}
      </View>
    </Card>
  );
}
