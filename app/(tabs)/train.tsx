import { useCallback, useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, spacing, fonts, Label, Body, H4, Display, Tag } from "../../src/tokens";
import { Card } from "../../src/components/ui/Card";
import { WorkoutCard } from "../../src/components/ui/WorkoutCard";
import { Button } from "../../src/components/ui/Button";
import { getWorkouts96, getGoalConfig } from "../../src/data/workouts";
import { useUserStore } from "../../src/stores/useUserStore";
import { getRecommendation } from "../../src/utils/recommendations";
import { getProgressionSummary } from "../../src/utils/progression";
import { TrainScreenSkeleton } from "../../src/components/ui/Skeleton";
import {
  WORKOUT_CLASSES,
  getUnlockedClasses,
  getClassUnlockProgress,
} from "../../src/data/workoutClasses";

import {
  checkAllExerciseProgressions,
  confirmLevelUp,
  getLevelUpReplacement,
} from "../../src/utils/doubleProgression";

export default function TrainScreen() {
  const colors = useColors();
  const router = useRouter();
  const { workoutHistory, recoveryStatus, isHydrated, fitnessGoal } = useUserStore();

  // Goal-specific workouts — generated from 96-exercise database
  const storeMasteredIds = useUserStore((state) => state.masteredExerciseIds ?? []);
  const masteredIds = useMemo(() => new Set(storeMasteredIds), [storeMasteredIds]);

  const goalWorkouts = useMemo(
    () => getWorkouts96(fitnessGoal, masteredIds),
    [fitnessGoal, masteredIds],
  );
  const goalConfig = useMemo(() => getGoalConfig(fitnessGoal), [fitnessGoal]);

  // Intelligence-powered recommendation
  const recommendation = useMemo(
    () => getRecommendation(workoutHistory, recoveryStatus),
    [workoutHistory, recoveryStatus],
  );

  const progressionSummary = useMemo(() => getProgressionSummary(workoutHistory), [workoutHistory]);

  // Double progression — exercises ready to level up
  const readyToLevelUp = useMemo(
    () => checkAllExerciseProgressions(workoutHistory).filter((r) => r.canLevelUp),
    [workoutHistory],
  );

  // Unlocked workout classes based on mastered exercises
  const unlockedClasses = useMemo(() => getUnlockedClasses(masteredIds), [masteredIds]);

  // Classes still locked with progress
  const lockedClassesWithProgress = useMemo(
    () =>
      WORKOUT_CLASSES.filter((wc) => !unlockedClasses.find((u) => u.id === wc.id))
        .map((wc) => ({
          classDef: wc,
          progress: getClassUnlockProgress(wc, masteredIds),
        }))
        .filter(({ progress }) => progress.unlocked > 0),
    [masteredIds, unlockedClasses],
  );

  const handleWorkoutSelect = useCallback(
    (workoutId: string) => {
      router.push(`/workout/${workoutId}`);
    },
    [router],
  );

  const handleLevelUp = useCallback((exerciseId: string) => {
    const replacement = getLevelUpReplacement(exerciseId);
    if (replacement) {
      confirmLevelUp(exerciseId);
    }
  }, []);

  // Fade-in animation when content loads
  const fadeIn = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    if (isHydrated) {
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [isHydrated, fadeIn]);

  if (!isHydrated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
        <TrainScreenSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeIn }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing[12] }}
      >
        {/* Header */}
        <View style={{ marginBottom: spacing.lg }}>
          <Label variant="secondary" style={{ marginBottom: spacing.xs }}>
            Train
          </Label>
          <Display>Workouts</Display>
        </View>

        {/* Intelligence-Driven Recommendation */}
        <Card title="Pick a workout" accent="amber">
          <Body variant="secondary" style={{ fontSize: 13, lineHeight: 20 }}>
            {recommendation.reasoning}
          </Body>
          {recommendation.recommendedId !== "rest" && (
            <View style={{ marginTop: spacing.md }}>
              <Button
                title={`ACCEPT QUEST: ${recommendation.recommendedName}`}
                onPress={() => handleWorkoutSelect(recommendation.recommendedId)}
                fullWidth
              />
            </View>
          )}
          {/* Confidence indicator */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: spacing.sm,
              gap: spacing.xs,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  recommendation.confidence === "high"
                    ? colors.success
                    : recommendation.confidence === "medium"
                      ? colors.accent.DEFAULT
                      : colors.text.secondary,
              }}
            />
            <Label variant="secondary" style={{ fontSize: 9 }}>
              {recommendation.confidence === "high"
                ? "HIGH CONFIDENCE"
                : recommendation.confidence === "medium"
                  ? "MODERATE CONFIDENCE"
                  : "ESTIMATE"}
            </Label>
          </View>
        </Card>

        {/* Progression Readiness — only show when there's data */}
        {progressionSummary.exercisesReady.length > 0 && (
          <Card
            title={`${progressionSummary.exercisesReady.length} READY TO PROGRESS`}
            accent="green"
            style={{ marginTop: spacing.sm }}
          >
            {progressionSummary.exercisesReady.slice(0, 3).map((ex) => (
              <View
                key={ex.exerciseId}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: colors.bg.primary,
                  padding: spacing.sm,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                  marginBottom: spacing.xs,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Body
                    variant="primary"
                    size="sm"
                    style={{ fontFamily: fonts.body.semiBold, fontSize: 11 }}
                  >
                    {ex.exerciseName}
                  </Body>
                  <Body
                    variant="secondary"
                    size="sm"
                    style={{ fontSize: 9, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    Avg {ex.averageReps} reps · Trend: {ex.recentTrend.toUpperCase()}
                  </Body>
                </View>
                <View
                  style={{
                    backgroundColor: `${colors.success}20`,
                    borderWidth: 1,
                    borderColor: colors.success,
                    borderRadius: 4,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 0,
                    marginLeft: spacing.sm,
                  }}
                >
                  <Tag variant="success">{ex.highEndPercentage}%</Tag>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Double Progression — READY TO LEVEL UP */}
        {readyToLevelUp.length > 0 && (
          <Card
            title={`⬆ ${readyToLevelUp.length} READY TO LEVEL UP`}
            accent="amber"
            style={{ marginTop: spacing.sm }}
          >
            {readyToLevelUp.map((prog) => (
              <TouchableOpacity
                key={prog.exerciseId}
                activeOpacity={0.85}
                onPress={() => handleLevelUp(prog.exerciseId)}
                style={{
                  backgroundColor: `${colors.accent.DEFAULT}08`,
                  borderWidth: 1,
                  borderColor: prog.nextExercise ? `${colors.success}40` : colors.border.subtle,
                  borderRadius: 4,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  overflow: "hidden",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: `${colors.accent.DEFAULT}15`,
                      borderRadius: 4,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>⬆</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Body
                      variant="primary"
                      size="sm"
                      style={{ fontFamily: fonts.body.semiBold, fontSize: 12 }}
                    >
                      {prog.exerciseName}
                    </Body>
                    <Body variant="secondary" size="sm" style={{ fontSize: 9, marginTop: 2 }}>
                      {prog.pathwayLabel} · Lv {prog.currentLevel} →{" "}
                      {prog.nextExercise ? `Lv ${prog.nextExercise.level}` : "MAX"}
                    </Body>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Label variant="success" style={{ fontSize: 10 }}>
                      {prog.highEndPercentage}%
                    </Label>
                    <Body variant="secondary" size="sm" style={{ fontSize: 7, marginTop: 1 }}>
                      {prog.averageReps} avg
                    </Body>
                  </View>
                </View>
                {prog.nextExercise && (
                  <View
                    style={{
                      backgroundColor: `${colors.success}10`,
                      borderWidth: 1,
                      borderColor: `${colors.success}25`,
                      borderRadius: 4,
                      padding: spacing.sm,
                      marginTop: spacing.sm,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                      <Tag variant="success">NEXT LEVEL</Tag>
                      <View
                        style={{ flex: 1, height: 1, backgroundColor: `${colors.success}20` }}
                      />
                    </View>
                    <Body variant="primary" size="sm" style={{ fontSize: 11, marginTop: 0 }}>
                      {prog.nextExercise.name}
                    </Body>
                    <Body
                      variant="secondary"
                      size="sm"
                      style={{ fontSize: 8, marginTop: 1 }}
                      numberOfLines={1}
                    >
                      {prog.nextExercise.overloadMechanism}
                    </Body>
                    <View
                      style={{
                        backgroundColor: colors.success,
                        borderRadius: 4,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 0,
                        alignSelf: "flex-start",
                        marginTop: spacing.xs,
                      }}
                    >
                      <Tag style={{ color: colors.bg.primary }}>TAP TO LEVEL UP →</Tag>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Deload notice */}
        {progressionSummary.deloadRecommended && (
          <Card title="DELOAD WEEK SUGGESTED" accent="red" style={{ marginTop: spacing.sm }}>
            <Body variant="secondary" style={{ fontSize: 13, lineHeight: 20 }}>
              You&apos;ve been training consistently for {progressionSummary.totalTrainingWeeks}{" "}
              weeks. Reduce volume by 40-50% this week: 2 sets per exercise, leave 4-5 reps in
              reserve. Your body will come back stronger.
            </Body>
          </Card>
        )}

        {/* Core Programs */}
        <Label
          variant="secondary"
          style={{ fontSize: 11, marginTop: spacing.sm, marginBottom: spacing.md }}
        >
          Active Quests
        </Label>

        {goalWorkouts.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            onPress={() => handleWorkoutSelect(w.id)}
            isActive={recommendation.recommendedId === w.id}
          />
        ))}

        {/* Skills Library + Skill Tree row */}
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/exercises/catalog")}
            accessibilityRole="button"
            accessibilityLabel="Skills Library"
            accessibilityHint="Browse all exercises by muscle group"
            style={{
              flex: 1,
              backgroundColor: colors.bg.elevated,
              borderWidth: 1.5,
              borderColor: colors.border.subtle,
              borderRadius: 4,
              borderStyle: "dashed",
              padding: spacing.md,
              alignItems: "center",
            }}
          >
            <H4 variant="accent" style={{ fontSize: 16, marginBottom: spacing.xs }}>
              SKILLS LIBRARY
            </H4>
            <Body variant="secondary" size="sm" style={{ fontSize: 9, textAlign: "center" }}>
              Browse all skills by muscle group
            </Body>
            <View
              style={{
                marginTop: spacing.sm,
                backgroundColor: colors.accent.DEFAULT,
                borderRadius: 4,
                paddingHorizontal: spacing.sm,
                paddingVertical: 0,
              }}
            >
              <Tag style={{ color: colors.bg.primary }}>BROWSE →</Tag>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/skills/skill-tree")}
            accessibilityRole="button"
            accessibilityLabel="Skill Tree"
            accessibilityHint="View exercise progression tree and unlock path"
            style={{
              flex: 1,
              backgroundColor: `${colors.success}08`,
              borderWidth: 1.5,
              borderColor: `${colors.success}40`,
              borderRadius: 4,
              padding: spacing.md,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "BebasNeue-Regular",
                fontSize: 24,
                color: colors.success,
                marginBottom: spacing.xs,
              }}
            >
              ⬆ ⬇ ⬍ ◈
            </Text>
            <H4 variant="success" style={{ fontSize: 16, marginBottom: spacing.xs }}>
              SKILL TREE
            </H4>
            <Body variant="secondary" size="sm" style={{ fontSize: 9, textAlign: "center" }}>
              Movement families & progression
            </Body>
            <View
              style={{
                marginTop: spacing.sm,
                backgroundColor: colors.success,
                borderRadius: 4,
                paddingHorizontal: spacing.sm,
                paddingVertical: 0,
              }}
            >
              <Tag style={{ color: colors.bg.primary }}>VIEW →</Tag>
            </View>
          </TouchableOpacity>
        </View>

        {/* Workout Classes — unlocked and in-progress */}
        {unlockedClasses.length > 0 && (
          <View style={{ marginBottom: spacing.md }}>
            <Label variant="success" style={{ fontSize: 11, marginBottom: spacing.sm }}>
              ★ UNLOCKED CLASSES
            </Label>
            {unlockedClasses.map((wc) => (
              <TouchableOpacity
                key={wc.id}
                activeOpacity={0.85}
                onPress={() => handleWorkoutSelect(wc.id)}
                style={{
                  backgroundColor: `${wc.accent}10`,
                  borderWidth: 1.5,
                  borderColor: `${wc.accent}40`,
                  borderRadius: 4,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  overflow: "hidden",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Text style={{ fontSize: 24 }}>{wc.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <H4 style={{ color: wc.accent, fontSize: 14 }}>{wc.name}</H4>
                    <Body
                      variant="secondary"
                      size="sm"
                      style={{ fontSize: 10, marginTop: 2 }}
                      numberOfLines={2}
                    >
                      {wc.description}
                    </Body>
                    <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
                      {wc.focus.slice(0, 3).map((f) => (
                        <View
                          key={f}
                          style={{
                            backgroundColor: `${wc.accent}15`,
                            borderRadius: 1,
                            paddingHorizontal: spacing.xs,
                            paddingVertical: 1,
                          }}
                        >
                          <Tag style={{ color: wc.accent }}>{f}</Tag>
                        </View>
                      ))}
                    </View>
                  </View>
                  <Label variant="success" style={{ fontSize: 8, letterSpacing: 1 }}>
                    UNLOCKED
                  </Label>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* In-progress class unlocks */}
        {lockedClassesWithProgress.length > 0 && (
          <View style={{ marginBottom: spacing.md }}>
            <Label variant="secondary" style={{ fontSize: 11, marginBottom: spacing.sm }}>
              LOCKED CLASSES
            </Label>
            {lockedClassesWithProgress.map(({ classDef: wc, progress }) => (
              <View
                key={wc.id}
                style={{
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: colors.bg.primary,
                    borderWidth: 1,
                    borderColor: colors.border.subtle,
                    borderRadius: 4,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 16, opacity: 0.5 }}>{wc.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Body variant="secondary" size="sm" style={{ fontSize: 11 }}>
                    {wc.name}
                  </Body>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.xs,
                      marginTop: spacing.xs,
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        height: 3,
                        backgroundColor: colors.bg.primary,
                        borderRadius: 1,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${(progress.unlocked / progress.required) * 100}%` as any,
                          height: "100%",
                          backgroundColor: colors.accent.DEFAULT,
                          borderRadius: 1,
                        }}
                      />
                    </View>
                    <Body variant="secondary" size="sm" style={{ fontSize: 7 }}>
                      {progress.unlocked}/{progress.required}
                    </Body>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Program Info */}
        <Card title="QUEST INFO" accent="none">
          <View style={{ gap: spacing.sm }}>
            <InfoRow label="FREQUENCY" value="4 days/week, rotating quest cycle" />
            <InfoRow label="PROGRAM" value={goalConfig.label} />
            <InfoRow label="REST" value="Varies by goal (30-180s)" />
            <InfoRow label="PROGRESSION" value="Double progression method" />
            <InfoRow label="DELOAD" value="Every 4-6 weeks (-50% volume)" />
          </View>
        </Card>

        {/* Difficulty selector */}
        <Card title="DIFFICULTY TIERS" accent="none">
          <Body
            variant="secondary"
            style={{ fontSize: 13, lineHeight: 20, marginBottom: spacing.md }}
          >
            Each exercise has built-in progression pathways. Start at the level that matches your
            current capability and progress when you hit the upper rep range with perfect form.
          </Body>
          <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
            {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((level) => (
              <View
                key={level}
                style={{
                  flex: 1,
                  backgroundColor: colors.bg.highlight,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                  padding: spacing.sm,
                  alignItems: "center",
                }}
              >
                <Label
                  variant={level === "INTERMEDIATE" ? "accent" : "secondary"}
                  style={{ fontSize: 8, textAlign: "center" }}
                >
                  {level}
                </Label>
              </View>
            ))}
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/skills/skill-tree")}
            accessibilityRole="button"
            accessibilityLabel="Open Skill Tree"
            style={{
              backgroundColor: `${colors.accent.DEFAULT}10`,
              borderWidth: 1,
              borderColor: colors.accent.DEFAULT,
              borderRadius: 4,
              padding: spacing.md,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
            }}
          >
            <Text style={{ fontSize: 16 }}>🌳</Text>
            <Label variant="accent" style={{ fontSize: 10, letterSpacing: 1 }}>
              VIEW FULL SKILL TREE
            </Label>
          </TouchableOpacity>
        </Card>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Label variant="secondary" style={{ fontSize: 9 }}>
        {label}
      </Label>
      <Body variant="primary" size="sm" style={{ fontSize: 11 }}>
        {value}
      </Body>
    </View>
  );
}
