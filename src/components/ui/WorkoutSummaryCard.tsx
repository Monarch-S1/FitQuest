import { View, Text } from "react-native";
import { useColors, spacing, typography, fonts, Label, H3, Body } from "../../tokens";
import { Card } from "./Card";

interface WorkoutDay {
  date: string;
  workoutId?: string;
  duration?: number;
  setsCompleted?: number;
  xpEarned?: number;
}

interface WorkoutSummaryCardProps {
  title: string;
  days: WorkoutDay[];
  totalWorkouts: number;
  totalXp: number;
  onDayPress?: (date: string) => void;
  elevation?: "low" | "medium" | "high";
}

/**
 * WorkoutSummaryCard — Shows weekly or period-based workout summary
 * Provides at-a-glance view of activity with day indicators.
 */
export function WorkoutSummaryCard({
  title,
  days,
  totalWorkouts,
  totalXp,
  onDayPress,
  elevation = "medium",
}: WorkoutSummaryCardProps) {
  const colors = useColors();

  return (
    <Card title={title} elevation={elevation} style={{ marginBottom: spacing.lg }}>
      {/* Summary stats */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: spacing.md,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        <View style={{ alignItems: "center", flex: 1 }}>
          <Label variant="secondary" style={{ fontSize: 9, marginBottom: spacing.xs }}>
            WORKOUTS
          </Label>
          <H3 style={{ color: colors.accent.DEFAULT }}>{totalWorkouts}</H3>
        </View>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Label variant="secondary" style={{ fontSize: 9, marginBottom: spacing.xs }}>
            TOTAL XP
          </Label>
          <H3 style={{ color: colors.accent.DEFAULT }}>+{totalXp}</H3>
        </View>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Label variant="secondary" style={{ fontSize: 9, marginBottom: spacing.xs }}>
            COMPLETION
          </Label>
          <H3 style={{ color: colors.success }}>
            {Math.round((totalWorkouts / days.length) * 100)}%
          </H3>
        </View>
      </View>

      {/* Day indicators */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.xs }}>
        {days.map((day, index) => {
          const isCompleted = !!day.workoutId;
          const dayLetter = ["M", "T", "W", "T", "F", "S", "S"][index] || "?";

          return (
            <View
              key={day.date}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: spacing.md,
                borderRadius: 8,
                backgroundColor: isCompleted ? colors.accent.DEFAULT + "20" : colors.bg.elevated,
                borderWidth: 1,
                borderColor: isCompleted ? colors.accent.DEFAULT : colors.border.subtle,
              }}
              onTouchEnd={() => onDayPress?.(day.date)}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: fonts.body.semiBold,
                  color: colors.text.secondary,
                  marginBottom: spacing.xs,
                }}
              >
                {dayLetter}
              </Text>
              {isCompleted ? (
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.accent.DEFAULT,
                    fontWeight: "600",
                  }}
                >
                  ✓
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.text.tertiary,
                  }}
                >
                  —
                </Text>
              )}
              {day.xpEarned && (
                <Text
                  style={{
                    fontSize: 7,
                    color: colors.text.secondary,
                    marginTop: spacing.xs,
                  }}
                >
                  +{day.xpEarned}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
}
