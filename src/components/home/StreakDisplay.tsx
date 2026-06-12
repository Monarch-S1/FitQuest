import { View, Text } from "react-native";
import { useColors, typography, spacing } from "../../tokens";
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
        backgroundColor: colors.bg.elevated,
        borderWidth: 1,
        borderColor: isOnFire ? colors.accent.DEFAULT : colors.border.subtle,
        borderRadius: 4,
        padding: spacing[3],
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}>
        <View
          style={{
            width: 40,
            height: 40,
            backgroundColor: isBurning ? `${colors.accent.DEFAULT}26` : colors.bg.primary,
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
          <Text
            style={{
              ...typography.h3,
              color: isOnFire ? colors.accent.DEFAULT : colors.text.primary,
              fontSize: 28,
              lineHeight: 28,
            }}
          >
            {streak.currentStreak}
          </Text>
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 9,
              marginTop: 2,
            }}
          >
            DAY STREAK
          </Text>
        </View>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Text
          style={{
            ...typography.bodySmall,
            color: colors.text.secondary,
            fontSize: 10,
          }}
        >
          Best: {streak.longestStreak}
        </Text>
        <Text
          style={{
            ...typography.bodySmall,
            color: isOnFire ? colors.accent.DEFAULT : colors.text.secondary,
            fontSize: 9,
            marginTop: 2,
          }}
        >
          {streak.isActiveToday ? "TRAINED TODAY ✓" : "TRAIN TODAY →"}
        </Text>
      </View>
    </View>
  );
}
