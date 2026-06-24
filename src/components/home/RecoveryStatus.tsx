import { View, Text } from "react-native";
import { useColors, spacing, Label, Body } from "../../tokens";

interface RecoveryStatusProps {
  status: "optimal" | "moderate" | "caution";
  daysSinceLastWorkout?: number;
}

export function RecoveryStatus({ status, daysSinceLastWorkout }: RecoveryStatusProps) {
  const colors = useColors();

  const variantForStatus = {
    optimal: "success" as const,
    moderate: "accent" as const,
    caution: "error" as const,
  };

  const config = {
    optimal: {
      label: "READY",
      message: "You're recovered and ready to train.",
      icon: "●",
    },
    moderate: {
      label: "MODERATE",
      message: "Light training recommended.",
      icon: "●",
    },
    caution: {
      label: "CAUTION",
      message: "Consider rest day or light mobility.",
      icon: "●",
    },
  }[status];

  const labelVariant = variantForStatus[status];
  const statusColor =
    labelVariant === "success"
      ? colors.success
      : labelVariant === "accent"
        ? colors.accent.DEFAULT
        : colors.error;

  return (
    <View
      style={{
        backgroundColor: colors.bg.card,
        borderWidth: 1,
        borderColor: `${statusColor}30`,
        borderRadius: 4,
        padding: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
      }}
    >
      {/* Status indicator */}
      <View
        style={{
          width: 36,
          height: 36,
          backgroundColor: `${statusColor}15`,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          borderWidth: 1,
          borderColor: statusColor,
        }}
      >
        <Text style={{ color: statusColor, fontSize: 18 }}>{config.icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Label variant={labelVariant}>{config.label}</Label>
          {daysSinceLastWorkout !== undefined && (
            <Body variant="secondary" size="sm" style={{ fontSize: 9 }}>
              {daysSinceLastWorkout}d since last workout
            </Body>
          )}
        </View>
        <Body variant="secondary" size="sm" style={{ fontSize: 11, marginTop: 2 }}>
          {config.message}
        </Body>
      </View>
    </View>
  );
}
