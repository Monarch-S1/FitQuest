import { useState } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { useColors, typography, spacing } from "../../tokens";
import { WorkoutDay } from "../../data/exercises";
import { hapticPress } from "../../utils/haptics";
import { GlossyOverlay } from "./GlossyOverlay";

interface WorkoutCardProps {
  workout: WorkoutDay;
  onPress: () => void;
  isActive?: boolean;
}

export function WorkoutCard({ workout, onPress, isActive = false }: WorkoutCardProps) {
  const colors = useColors();
  const [isPressed, setIsPressed] = useState(false);

  const estimatedMin = Math.round(
    workout.exercises.reduce((sum, ex) => {
      const avgReps = (ex.repRange[0] + ex.repRange[1]) / 2;
      const repTime = avgReps * 4;
      const setTime = repTime * ex.defaultSets;
      const restTime = ex.restInterval * (ex.defaultSets - 1);
      return sum + setTime + restTime;
    }, 0) / 60,
  );

  return (
    <TouchableOpacity
      onPress={() => {
        hapticPress();
        onPress();
      }}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${workout.name}, ${workout.focus}. ${workout.exercises.length} exercises, approximately ${estimatedMin} minutes.${isActive ? " Recommended." : ""}`}
      accessibilityHint="Double tap to preview this workout"
      accessibilityState={{ selected: isActive }}
      style={{
        backgroundColor: isActive ? colors.bg.highlight : colors.bg.elevated,
        borderWidth: 1.5,
        borderColor: isActive ? colors.accent.DEFAULT : colors.border.subtle,
        borderRadius: 12,
        padding: spacing[4],
        marginBottom: spacing[3],
        position: "relative",
        overflow: "hidden",
        transform: [{ scale: isPressed ? 0.98 : 1 }],
        ...(isActive
          ? {
              shadowColor: colors.accent.DEFAULT,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }
          : {}),
      }}
    >
      {/* Glossy finish */}
      <GlossyOverlay highlightOpacity={isActive ? 0.18 : 0.08} />

      {/* Top glow accent bar */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: isActive ? colors.accent.DEFAULT : colors.border.subtle,
          opacity: isActive ? 1 : 0.5,
        }}
      />

      {/* Left accent bar */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 3,
          height: "100%",
          backgroundColor: isActive ? colors.accent.DEFAULT : colors.border.subtle,
        }}
      />

      {/* Subtle background gradient for active */}
      {isActive && (
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.accent.glow,
            opacity: 0.15,
            transform: [{ translateX: 40 }, { translateY: -40 }],
          }}
        />
      )}

      {/* Content */}
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <View style={{ flex: 1, marginRight: spacing[3] }}>
          <Text
            style={{
              ...typography.h4,
              color: isActive ? colors.accent.DEFAULT : colors.text.primary,
            }}
          >
            {workout.name}
          </Text>
          <Text
            style={{
              ...typography.bodySmall,
              color: colors.text.secondary,
              marginTop: spacing[1],
            }}
          >
            {workout.focus}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: isActive ? colors.accent.DEFAULT : "transparent",
            borderWidth: 1.5,
            borderColor: isActive ? colors.accent.DEFAULT : colors.border.subtle,
            borderRadius: 12,
            paddingHorizontal: spacing[2],
            paddingVertical: spacing[1],
          }}
        >
          <Text
            style={{
              ...typography.label,
              color: isActive ? colors.bg.primary : colors.text.secondary,
              fontSize: 10,
            }}
          >
            {workout.exercises.length} EX
          </Text>
        </View>
      </View>

      {/* Exercise list preview */}
      <View
        style={{ marginTop: spacing[3], flexDirection: "row", flexWrap: "wrap", gap: spacing[1] }}
      >
        {workout.exercises.slice(0, 4).map((ex) => (
          <View
            key={ex.id}
            style={{
              backgroundColor: isActive ? `${colors.accent.DEFAULT}10` : colors.bg.primary,
              borderWidth: 1,
              borderColor: isActive ? `${colors.accent.DEFAULT}30` : colors.border.subtle,
              borderRadius: 12,
              paddingHorizontal: spacing[2],
              paddingVertical: spacing[0],
            }}
          >
            <Text
              style={{
                ...typography.bodySmall,
                color: isActive ? colors.accent.light : colors.text.secondary,
                fontSize: 10,
              }}
              numberOfLines={1}
            >
              {ex.name}
            </Text>
          </View>
        ))}
        {workout.exercises.length > 4 && (
          <View
            style={{
              backgroundColor: colors.bg.primary,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 12,
              paddingHorizontal: spacing[2],
              paddingVertical: spacing[0],
            }}
          >
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.secondary,
                fontSize: 10,
              }}
            >
              +{workout.exercises.length - 4}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom info row */}
      <View
        style={{
          marginTop: spacing[3],
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderTopWidth: 1,
          borderTopColor: isActive ? `${colors.accent.DEFAULT}20` : colors.border.subtle,
          paddingTop: spacing[2],
        }}
      >
        <Text
          style={{
            ...typography.bodySmall,
            color: colors.text.secondary,
            fontSize: 10,
          }}
        >
          ~{estimatedMin} min
        </Text>
        <Text
          style={{
            ...typography.label,
            color: isActive ? colors.accent.DEFAULT : colors.text.secondary,
            fontSize: 10,
          }}
        >
          {isActive ? "★ RECOMMENDED" : "PREVIEW →"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
