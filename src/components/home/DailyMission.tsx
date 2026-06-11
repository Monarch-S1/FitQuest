import { View, Text } from "react-native";
import { useColors, typography, spacing, fonts } from "../../tokens";
import { Button } from "../ui/Button";
import { calculateDailyMissionXp } from "../../utils/xp";

interface DailyMissionProps {
  mission: string;
  xpReward?: number;
  isComplete?: boolean;
  onStart?: () => void;
}

export function DailyMission({
  mission,
  xpReward = calculateDailyMissionXp(),
  isComplete = false,
  onStart,
}: DailyMissionProps) {
  const colors = useColors();
  return (
    <View
      style={{
        backgroundColor: isComplete ? "rgba(16, 185, 129, 0.08)" : colors.bg.primary,
        borderWidth: 1.5,
        borderColor: isComplete ? colors.success : colors.border.accent,
        borderRadius: 4,
        padding: spacing[4],
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative diagonal line */}
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 60,
          height: 60,
          borderRightWidth: 60,
          borderRightColor: isComplete ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.06)",
          borderBottomWidth: 60,
          borderBottomColor: "transparent",
        }}
      />

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...typography.label,
              color: colors.accent.DEFAULT,
              fontSize: 10,
              marginBottom: spacing[1],
            }}
          >
            {isComplete ? "MISSION COMPLETE" : "TODAY'S MISSION"}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: colors.text.primary,
              fontFamily: fonts.body.semiBold,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            {mission}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end", marginLeft: spacing[3] }}>
          <Text style={{ ...typography.label, color: colors.accent.DEFAULT, fontSize: 8 }}>
            REWARD
          </Text>
          <Text
            style={{
              ...typography.h3,
              color: isComplete ? colors.success : colors.accent.DEFAULT,
              fontSize: 24,
            }}
          >
            +{xpReward}
          </Text>
          <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 9 }}>
            XP
          </Text>
        </View>
      </View>

      {!isComplete && onStart && (
        <View style={{ marginTop: spacing[3] }}>
          <Button title="START MISSION" onPress={onStart} size="sm" fullWidth />
        </View>
      )}

      {isComplete && (
        <View style={{ marginTop: spacing[2], flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: colors.success, fontSize: 14, marginRight: spacing[1] }}>✓</Text>
          <Text style={{ ...typography.bodySmall, color: colors.success, fontSize: 11 }}>
            Completed today
          </Text>
        </View>
      )}

      {/* Corner notches */}
      <View
        style={{
          position: "absolute",
          top: -1,
          left: -1,
          width: 5,
          height: 5,
          borderTopWidth: 2,
          borderLeftWidth: 2,
          borderColor: isComplete ? colors.success : colors.accent.DEFAULT,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: -1,
          right: -1,
          width: 5,
          height: 5,
          borderTopWidth: 2,
          borderRightWidth: 2,
          borderColor: isComplete ? colors.success : colors.accent.DEFAULT,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -1,
          left: -1,
          width: 5,
          height: 5,
          borderBottomWidth: 2,
          borderLeftWidth: 2,
          borderColor: isComplete ? colors.success : colors.accent.DEFAULT,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -1,
          right: -1,
          width: 5,
          height: 5,
          borderBottomWidth: 2,
          borderRightWidth: 2,
          borderColor: isComplete ? colors.success : colors.accent.DEFAULT,
        }}
      />
    </View>
  );
}
