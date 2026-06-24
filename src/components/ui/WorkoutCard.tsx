import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { useColors, spacing, H4, Label, Body, Tag } from "../../tokens";
import { WorkoutDay } from "../../data/exercises";
import { hapticPress } from "../../utils/haptics";

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
        backgroundColor: isActive ? colors.bg.highlight : colors.bg.card,
        borderRadius: 12,
        padding: spacing.lg,
        marginBottom: spacing.md,
        position: "relative",
        overflow: "hidden",
        transform: [{ scale: isPressed ? 0.98 : 1 }],
        ...(isActive
          ? {
              shadowColor: colors.accent.DEFAULT,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.12,
              shadowRadius: 10,
              elevation: 4,
            }
          : {}),
      }}
    >
      {/* Left accent bar — only for active/recommended */}
      {isActive && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 3,
            height: "100%",
            backgroundColor: colors.accent.DEFAULT,
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
          }}
        />
      )}

      {/* Content */}
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <View style={{ flex: 1, marginRight: spacing.md }}>
          <H4 variant={isActive ? "accent" : "primary"} style={{ marginBottom: spacing.xs }}>
            {workout.name}
          </H4>
          <Body variant="secondary" size="sm">
            {workout.focus}
          </Body>
        </View>

        <View
          style={{
            backgroundColor: isActive ? `${colors.accent.DEFAULT}15` : colors.bg.highlight,
            borderRadius: 8,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
          }}
        >
          <Tag variant={isActive ? "accent" : "secondary"}>{workout.exercises.length} EX</Tag>
        </View>
      </View>

      {/* Exercise list preview */}
      <View
        style={{ marginTop: spacing.md, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}
      >
        {workout.exercises.slice(0, 4).map((ex) => (
          <View
            key={ex.id}
            style={{
              backgroundColor: isActive ? `${colors.accent.DEFAULT}10` : colors.bg.highlight,
              borderRadius: 8,
              paddingHorizontal: spacing.sm,
              paddingVertical: 3,
            }}
          >
            <Body
              variant={isActive ? "accent" : "secondary"}
              size="sm"
              style={{ fontSize: 9 }}
              numberOfLines={1}
            >
              {ex.name}
            </Body>
          </View>
        ))}
        {workout.exercises.length > 4 && (
          <View
            style={{
              backgroundColor: colors.bg.highlight,
              borderRadius: 8,
              paddingHorizontal: spacing.sm,
              paddingVertical: 3,
            }}
          >
            <Body variant="secondary" size="sm" style={{ fontSize: 9 }}>
              +{workout.exercises.length - 4}
            </Body>
          </View>
        )}
      </View>

      {/* Bottom info row */}
      <View
        style={{
          marginTop: spacing.md,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border.subtle,
        }}
      >
        <Body variant="secondary" size="sm" style={{ fontSize: 10 }}>
          ~{estimatedMin} min
        </Body>
        <Label variant={isActive ? "accent" : "secondary"} style={{ fontSize: 9 }}>
          {isActive ? "★ RECOMMENDED" : "PREVIEW →"}
        </Label>
      </View>
    </TouchableOpacity>
  );
}
