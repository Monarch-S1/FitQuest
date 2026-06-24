import { View, Text } from "react-native";
import { useColors, spacing, Label, Body, H4, Tag } from "../../tokens";
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
        backgroundColor: isComplete ? `${colors.success}10` : colors.bg.base,
        borderWidth: 1.5,
        borderColor: isComplete ? colors.success : colors.accent.DEFAULT,
        borderRadius: 4,
        padding: spacing.lg,
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
          borderRightColor: isComplete ? `${colors.success}15` : `${colors.accent.DEFAULT}10`,
          borderBottomWidth: 60,
          borderBottomColor: "transparent",
        }}
      />

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Label variant="accent" style={{ marginBottom: spacing.xs }}>
            {isComplete ? "MISSION COMPLETE" : "TODAY'S MISSION"}
          </Label>
          <Body
            variant="primary"
            style={{
              fontFamily: "Inter-SemiBold",
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            {mission}
          </Body>
        </View>

        <View style={{ alignItems: "flex-end", marginLeft: spacing.md }}>
          <Tag variant="accent" style={{ marginBottom: spacing.xs }}>
            REWARD
          </Tag>
          <H4 variant={isComplete ? "success" : "accent"}>+{xpReward}</H4>
          <Body variant="secondary" size="sm" style={{ fontSize: 9 }}>
            XP
          </Body>
        </View>
      </View>

      {!isComplete && onStart && (
        <View style={{ marginTop: spacing.md }}>
          <Button title="START MISSION" onPress={onStart} size="sm" fullWidth />
        </View>
      )}

      {isComplete && (
        <View style={{ marginTop: spacing.sm, flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: colors.success, fontSize: 14, marginRight: spacing.xs }}>✓</Text>
          <Body variant="success" size="sm">
            Completed today
          </Body>
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
