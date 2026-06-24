import { View, Text } from "react-native";
import { useColors, spacing, H3, Label, Body } from "../../tokens";
import { StreakData } from "../../utils/streak";

interface StreakDisplayProps {
  streak: StreakData;
}

export function StreakDisplay({ streak }: StreakDisplayProps) {
  const colors = useColors();

  const isBurning = streak.currentStreak >= 3;
  const isOnFire = streak.currentStreak >= 7;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.bg.card,
        borderWidth: 1,
        borderColor: isOnFire ? colors.accent.DEFAULT : colors.border.subtle,
        borderRadius: 4,
        padding: spacing.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View
          style={{
            width: 40,
            height: 40,
            backgroundColor: isBurning ? `${colors.accent.DEFAULT}15` : colors.bg.base,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: isOnFire ? colors.accent.DEFAULT : colors.border.subtle,
            borderRadius: 4,
          }}
        >
          <Text style={{ fontSize: isOnFire ? 22 : 18 }}>
            {isOnFire ? "🔥" : isBurning ? "⚡" : "○"}
          </Text>
        </View>

        <View>
          <H3 variant={isOnFire ? "accent" : "primary"} style={{ lineHeight: 28 }}>
            {streak.currentStreak}
          </H3>
          <Label variant="secondary" style={{ marginTop: 2 }}>
            DAY STREAK
          </Label>
        </View>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Body variant="secondary" size="sm" style={{ fontSize: 10 }}>
          Best: {streak.longestStreak}
        </Body>
        <Body
          variant={isOnFire ? "accent" : "secondary"}
          size="sm"
          style={{ fontSize: 9, marginTop: 2 }}
        >
          {streak.isActiveToday ? "TRAINED TODAY ✓" : "TRAIN TODAY →"}
        </Body>
      </View>
    </View>
  );
}
