import { View, Text } from "react-native";
import { useColors, typography, spacing } from "../../tokens";

interface RecoveryStatusProps {
  status: "optimal" | "moderate" | "caution";
  daysSinceLastWorkout?: number;
}

export function RecoveryStatus({ status, daysSinceLastWorkout }: RecoveryStatusProps) {
  const colors = useColors();

  const statusConfig = {
    optimal: {
      label: "READY",
      color: colors.success,
      message: "You're recovered and ready to train.",
      icon: "●",
    },
    moderate: {
      label: "MODERATE",
      color: colors.accent.DEFAULT,
      message: "Light training recommended.",
      icon: "●",
    },
    caution: {
      label: "CAUTION",
      color: colors.error,
      message: "Consider rest day or light mobility.",
      icon: "●",
    },
  };

  const config = statusConfig[status];

  return (
    <View
      style={{
        backgroundColor: colors.bg.elevated,
        borderWidth: 1,
        borderColor: config.color,
        borderRadius: 4,
        padding: spacing[3],
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[3],
      }}
    >
      {/* Status indicator */}
      <View
        style={{
          width: 36,
          height: 36,
          backgroundColor: `${config.color}15`,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          borderWidth: 1,
          borderColor: config.color,
        }}
      >
        <Text style={{ color: config.color, fontSize: 18 }}>{config.icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}>
          <Text style={{ ...typography.label, color: config.color, fontSize: 10 }}>
            {config.label}
          </Text>
          {daysSinceLastWorkout !== undefined && (
            <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 9 }}>
              {daysSinceLastWorkout}d since last workout
            </Text>
          )}
        </View>
        <Text
          style={{
            ...typography.bodySmall,
            color: colors.text.secondary,
            fontSize: 11,
            marginTop: 2,
          }}
        >
          {config.message}
        </Text>
      </View>
    </View>
  );
}
