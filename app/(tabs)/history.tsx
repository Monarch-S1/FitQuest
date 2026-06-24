import { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors, typography, spacing, fonts, Label, H4, Body } from "../../src/tokens";
import { Card } from "../../src/components/ui/Card";
import { StreakCalendar } from "../../src/components/workout/WorkoutChart";
import { useUserStore } from "../../src/stores/useUserStore";
import { getPathwayLevels } from "../../src/data/workoutGenerator96";
import { PATHWAY_LIST } from "../../src/data/pathways";
import { getStreakCalendar } from "../../src/utils/chartData";
import { getLevel, getProgressToNextLevel } from "../../src/utils/level";

const DAY_NAMES = ["THE VANGUARD", "THE SHADOW", "THE TEMPEST", "THE COLOSSUS"];

function getWorkoutDisplayName(workoutId: string): string {
  const match = workoutId.match(/^workout-96-(\d)$/);
  if (match) return DAY_NAMES[parseInt(match[1])];
  return workoutId.toUpperCase();
}

export default function HistoryScreen() {
  const colors = useColors();
  const { workoutHistory, totalXp, streakData, masteredExerciseIds } = useUserStore();

  const hasData = workoutHistory.length > 0;

  const level = getLevel(totalXp);
  const xpProgress = getProgressToNextLevel(totalXp);

  const pathwayLevels = useMemo(
    () => (hasData ? getPathwayLevels(new Set(masteredExerciseIds ?? [])) : null),
    [masteredExerciseIds, hasData],
  );

  const streakCalendar = useMemo(() => getStreakCalendar(workoutHistory), [workoutHistory]);

  const lastWorkout = useMemo(() => {
    if (workoutHistory.length === 0) return null;
    return [...workoutHistory].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [workoutHistory]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
      >
        {/* Header */}
        <View style={{ marginBottom: spacing.lg }}>
          <Label variant="secondary" style={{ fontSize: 10, marginBottom: spacing.xs }}>
            ACTIVITY LOG
          </Label>
          <Text style={{ ...typography.display, color: colors.text.primary }}>Activity Log</Text>
        </View>

        {!hasData ? (
          <View
            style={{
              backgroundColor: colors.bg.surface,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 4,
              padding: spacing.xxl,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                ...typography.h3,
                color: colors.text.secondary,
                fontSize: 20,
                marginBottom: spacing.sm,
              }}
            >
              ◇
            </Text>
            <Label variant="secondary" style={{ marginBottom: spacing.sm }}>
              NO RECORDS
            </Label>
            <Body variant="secondary" size="sm" style={{ textAlign: "center", lineHeight: 18 }}>
              Complete your first workout to see your activity here.
            </Body>
          </View>
        ) : (
          <>
            {/* Quick Stats Row */}
            <View
              style={{
                flexDirection: "row",
                gap: spacing.sm,
                marginBottom: spacing.lg,
              }}
            >
              <Card style={{ flex: 1 }}>
                <View style={{ alignItems: "center", gap: spacing.xs }}>
                  <Label variant="secondary" style={{ fontSize: 9 }}>
                    WORKOUTS
                  </Label>
                  <H4 variant="accent">{workoutHistory.length}</H4>
                </View>
              </Card>
              <Card style={{ flex: 1 }}>
                <View style={{ alignItems: "center", gap: spacing.xs }}>
                  <Label variant="secondary" style={{ fontSize: 9 }}>
                    STREAK
                  </Label>
                  <H4 variant={streakData.currentStreak >= 3 ? "success" : "accent"}>
                    {streakData.currentStreak}
                  </H4>
                  <Body variant="secondary" size="sm" style={{ fontSize: 8 }}>
                    Best: {streakData.longestStreak}
                  </Body>
                </View>
              </Card>
              <Card style={{ flex: 1 }}>
                <View style={{ alignItems: "center", gap: spacing.xs }}>
                  <Label variant="secondary" style={{ fontSize: 9 }}>
                    LEVEL
                  </Label>
                  <H4 variant="accent">{level}</H4>
                  <Body variant="secondary" size="sm" style={{ fontSize: 8 }}>
                    {totalXp} XP
                  </Body>
                </View>
              </Card>
            </View>

            {/* Last Workout */}
            {lastWorkout && (
              <Card style={{ marginBottom: spacing.lg }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Label variant="secondary" style={{ fontSize: 9 }}>
                      LAST WORKOUT
                    </Label>
                    <Body
                      variant="primary"
                      size="sm"
                      style={{ fontFamily: fonts.body.semiBold, marginTop: 2 }}
                    >
                      {getWorkoutDisplayName(lastWorkout.workoutId)}
                    </Body>
                    <Body variant="secondary" size="sm" style={{ fontSize: 9, marginTop: 1 }}>
                      {lastWorkout.date} · {Math.round(lastWorkout.duration / 60)} min ·{" "}
                      {lastWorkout.setsCompleted} sets
                    </Body>
                  </View>
                  <Text
                    style={{
                      ...typography.h3,
                      color: colors.accent.DEFAULT,
                      fontSize: 20,
                    }}
                  >
                    +{lastWorkout.xpEarned}
                  </Text>
                </View>
              </Card>
            )}

            {/* Pathway Progression */}
            {pathwayLevels && (
              <Card title="PROGRESSION" accent="none" style={{ marginBottom: spacing.lg }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                  {PATHWAY_LIST.map((pw) => {
                    const pl = pathwayLevels[pw.id];
                    const tierLabel =
                      pl.level <= 3
                        ? "BEGINNER"
                        : pl.level <= 6
                          ? "INTERMEDIATE"
                          : pl.level <= 9
                            ? "ADVANCED"
                            : "ELITE";
                    const tierColors: Record<string, string> = {
                      BEGINNER: colors.text.secondary,
                      INTERMEDIATE: colors.accent.DEFAULT,
                      ADVANCED: colors.success,
                      ELITE: "#F59E0B",
                    };
                    return (
                      <View
                        key={pw.id}
                        style={{
                          width: "48%",
                          backgroundColor: colors.bg.elevated,
                          borderWidth: 1,
                          borderColor: colors.border.subtle,
                          borderRadius: 4,
                          padding: spacing.sm,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Body
                            variant="primary"
                            size="sm"
                            style={{ fontFamily: fonts.body.semiBold, fontSize: 11, flex: 1 }}
                          >
                            {pw.fullLabel}
                          </Body>
                          <Text
                            style={{
                              ...typography.h4,
                              color: colors.accent.DEFAULT,
                              fontSize: 18,
                              marginLeft: spacing.sm,
                            }}
                          >
                            {pl.level}
                          </Text>
                        </View>
                        <Text
                          style={{
                            ...typography.label,
                            color: tierColors[tierLabel],
                            fontSize: 8,
                            marginTop: 2,
                          }}
                        >
                          {tierLabel}
                        </Text>
                        {/* Mini level bar */}
                        <View
                          style={{
                            height: 2,
                            backgroundColor: colors.bg.highlight,
                            borderRadius: 1,
                            marginTop: spacing.sm,
                            overflow: "hidden",
                          }}
                        >
                          <View
                            style={{
                              width: `${(pl.level / pw.maxLevel) * 100}%`,
                              height: "100%",
                              backgroundColor: colors.accent.DEFAULT,
                              borderRadius: 1,
                            }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Card>
            )}

            {/* XP Progress */}
            <Card style={{ marginBottom: spacing.lg }}>
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Label variant="secondary" style={{ fontSize: 9 }}>
                    LEVEL {level} → {level + 1}
                  </Label>
                  <Label variant="secondary" style={{ fontSize: 9 }}>
                    {Math.round(xpProgress.progress * 100)}%
                  </Label>
                </View>
                <View
                  style={{
                    height: 4,
                    backgroundColor: colors.bg.highlight,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${xpProgress.progress * 100}%`,
                      height: "100%",
                      backgroundColor: colors.accent.DEFAULT,
                      borderRadius: 2,
                    }}
                  />
                </View>
                <Body variant="secondary" size="sm" style={{ fontSize: 9 }}>
                  {xpProgress.currentXp} / {xpProgress.requiredXp} XP
                </Body>
              </View>
            </Card>

            {/* Streak Calendar */}
            <Card
              title={`STREAK · ${streakData.currentStreak}-DAY CHAIN`}
              accent="green"
              style={{ marginBottom: spacing.lg }}
            >
              <StreakCalendar data={streakCalendar} />
            </Card>

            {/* Recent Sessions */}
            <Card title="RECENT WORKOUTS" accent="none">
              {[...workoutHistory]
                .reverse()
                .slice(0, 20)
                .map((session) => (
                  <View
                    key={session.id}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: spacing.sm,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border.subtle,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          ...typography.bodySmall,
                          color: colors.text.primary,
                          fontSize: 11,
                          fontFamily: fonts.body.semiBold,
                        }}
                      >
                        {getWorkoutDisplayName(session.workoutId)}
                      </Text>
                      <Text
                        style={{
                          ...typography.bodySmall,
                          color: colors.text.secondary,
                          fontSize: 9,
                          marginTop: 1,
                        }}
                      >
                        {session.date} · {Math.round(session.duration / 60)} min ·{" "}
                        {session.setsCompleted} sets
                      </Text>
                    </View>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.accent.DEFAULT,
                        fontSize: 11,
                        fontFamily: fonts.body.semiBold,
                      }}
                    >
                      +{session.xpEarned} XP
                    </Text>
                  </View>
                ))}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
