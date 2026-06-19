import { useCallback, useMemo, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { SegmentedPanel } from "../../src/components/ui/SegmentedPanel";
import { WorkoutCard } from "../../src/components/ui/WorkoutCard";
import { Button } from "../../src/components/ui/Button";
import { getWorkoutsForGoal, getGoalConfig } from "../../src/data/workouts";
import { useUserStore } from "../../src/stores/useUserStore";
import { getRecommendation } from "../../src/utils/recommendations";
import { getProgressionSummary } from "../../src/utils/progression";
import { TrainScreenSkeleton } from "../../src/components/ui/Skeleton";
import { Animated, Easing } from "react-native";
import { WORKOUT_CLASSES, getUnlockedClasses, getClassUnlockProgress } from "../../src/data/workoutClasses";
import { GlossyOverlay } from "../../src/components/ui/GlossyOverlay";

export default function TrainScreen() {
  const colors = useColors();
  const router = useRouter();
  const { workoutHistory, recoveryStatus, isHydrated, fitnessGoal } = useUserStore();

  // Goal-specific workouts
  const goalWorkouts = useMemo(
    () => getWorkoutsForGoal(fitnessGoal),
    [fitnessGoal],
  );
  const goalConfig = useMemo(() => getGoalConfig(fitnessGoal), [fitnessGoal]);

  // Intelligence-powered recommendation
  const recommendation = useMemo(
    () => getRecommendation(workoutHistory, recoveryStatus),
    [workoutHistory, recoveryStatus],
  );

  const progressionSummary = useMemo(() => getProgressionSummary(workoutHistory), [workoutHistory]);

  const storeMasteredIds = useUserStore((state) => state.masteredExerciseIds ?? []);
  const masteredIds = useMemo(() => new Set(storeMasteredIds), [storeMasteredIds]);

  // Unlocked workout classes based on mastered exercises
  const unlockedClasses = useMemo(
    () => getUnlockedClasses(masteredIds),
    [masteredIds],
  );

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
      router.push(`/workout/preview/${workoutId}`);
    },
    [router],
  );

  // Fade-in animation when content loads
  const fadeIn = useRef(new Animated.Value(0)).current;
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
        contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[12] }}
      >
        {/* Header */}
        <View style={{ marginBottom: spacing[4] }}>
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 10,
              marginBottom: spacing[1],
            }}
          >
            Train
          </Text>
          <Text
            style={{
              ...typography.display,
              color: colors.text.primary,
            }}
          >
            Workouts
          </Text>
        </View>

        {/* Intelligence-Driven Recommendation */}
        <SegmentedPanel title="            Pick a workout" accent="amber">          <Text
              style={{
                ...typography.body,
                color: colors.text.secondary,
                fontSize: 13,
                lineHeight: 20,
              }}
            >
              {recommendation.reasoning}
            </Text>
          {recommendation.recommendedId !== "rest" && (
            <View style={{ marginTop: spacing[3] }}>
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
              marginTop: spacing[2],
              gap: spacing[1],
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
            <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 9 }}>
              {recommendation.confidence === "high"
                ? "HIGH CONFIDENCE"
                : recommendation.confidence === "medium"
                  ? "MODERATE CONFIDENCE"
                  : "ESTIMATE"}
            </Text>
          </View>
        </SegmentedPanel>

        {/* Progression Readiness — only show when there's data */}
        {progressionSummary.exercisesReady.length > 0 && (
          <SegmentedPanel
            title={`${progressionSummary.exercisesReady.length} READY TO PROGRESS`}
            accent="green"
            style={{ marginTop: spacing[2] }}
          >
            {progressionSummary.exercisesReady.slice(0, 3).map((ex) => (
              <View
                key={ex.exerciseId}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: colors.bg.primary,
                  padding: spacing[2],
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                  marginBottom: spacing[1],
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: colors.text.primary,
                      fontFamily: fonts.body.semiBold,
                      fontSize: 11,
                    }}
                  >
                    {ex.exerciseName}
                  </Text>
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: colors.text.secondary,
                      fontSize: 9,
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    Avg {ex.averageReps} reps · Trend: {ex.recentTrend.toUpperCase()}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: `${colors.success}20`,
                    borderWidth: 1,
                    borderColor: colors.success,
                    borderRadius: 4,
                    paddingHorizontal: spacing[2],
                    paddingVertical: spacing[0],
                    marginLeft: spacing[2],
                  }}
                >
                  <Text style={{ ...typography.label, color: colors.success, fontSize: 7 }}>
                    {ex.highEndPercentage}%
                  </Text>
                </View>
              </View>
            ))}
          </SegmentedPanel>
        )}

        {/* Deload notice */}
        {progressionSummary.deloadRecommended && (
          <SegmentedPanel
            title="DELOAD WEEK SUGGESTED"
            accent="red"
            style={{ marginTop: spacing[2] }}
          >
            <Text
              style={{
                ...typography.body,
                color: colors.text.secondary,
                fontSize: 13,
                lineHeight: 20,
              }}
            >
              You've been training consistently for {progressionSummary.totalTrainingWeeks} weeks.
              Reduce volume by 40-50% this week: 2 sets per exercise, leave 4-5 reps in reserve.
              Your body will come back stronger.
            </Text>
          </SegmentedPanel>
        )}

        {/* Core Programs */}
        <Text
          style={{
            ...typography.subtitle,
            color: colors.text.secondary,
            fontSize: 11,
            marginTop: spacing[2],
            marginBottom: spacing[3],
          }}
        >
          Active Quests
        </Text>

        {goalWorkouts.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            onPress={() => handleWorkoutSelect(w.id)}
            isActive={recommendation.recommendedId === w.id}
          />
        ))}

        {/* Skills Library + Skill Tree row */}
        <View style={{ flexDirection: "row", gap: spacing[2], marginBottom: spacing[3] }}>
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
              padding: spacing[3],
              alignItems: "center",
            }}
          >
            <Text
              style={{
                ...typography.h4,
                color: colors.accent.DEFAULT,
                fontSize: 16,
                marginBottom: spacing[1],
              }}
            >
              SKILLS LIBRARY
            </Text>
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.secondary,
                fontSize: 9,
                textAlign: "center",
              }}
            >
              Browse all skills by muscle group
            </Text>
            <View
              style={{
                marginTop: spacing[2],
                backgroundColor: colors.accent.DEFAULT,
                borderRadius: 4,
                paddingHorizontal: spacing[2],
                paddingVertical: spacing[0],
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: colors.bg.primary,
                  fontSize: 8,
                }}
              >
                BROWSE →
              </Text>
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
              padding: spacing[3],
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "BebasNeue-Regular",
                fontSize: 24,
                color: colors.success,
                marginBottom: spacing[1],
              }}
            >
              ⬆ ⬇ ⬍ ◈
            </Text>
            <Text
              style={{
                ...typography.h4,
                color: colors.success,
                fontSize: 16,
                marginBottom: spacing[1],
              }}
            >
              SKILL TREE
            </Text>
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.secondary,
                fontSize: 9,
                textAlign: "center",
              }}
            >
              Movement families & progression
            </Text>
            <View
              style={{
                marginTop: spacing[2],
                backgroundColor: colors.success,
                borderRadius: 4,
                paddingHorizontal: spacing[2],
                paddingVertical: spacing[0],
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: colors.bg.primary,
                  fontSize: 8,
                }}
              >
                VIEW →
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Workout Classes — unlocked and in-progress */}
        {unlockedClasses.length > 0 && (
          <View style={{ marginBottom: spacing[3] }}>
            <Text
              style={{
                ...typography.subtitle,
                color: colors.success,
                fontSize: 11,
                marginBottom: spacing[2],
              }}
            >
              ★ UNLOCKED CLASSES
            </Text>
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
                  padding: spacing[3],
                  marginBottom: spacing[2],
                  overflow: "hidden",
                }}
              >
                <GlossyOverlay highlightOpacity={0.1} showReflection={false} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}>
                  <Text style={{ fontSize: 24 }}>{wc.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.h4, color: wc.accent, fontSize: 14 }}>
                      {wc.name}
                    </Text>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.secondary,
                        fontSize: 10,
                        marginTop: 2,
                      }}
                      numberOfLines={2}
                    >
                      {wc.description}
                    </Text>
                    <View style={{ flexDirection: "row", gap: spacing[2], marginTop: spacing[2] }}>
                      {wc.focus.slice(0, 3).map((f) => (
                        <View
                          key={f}
                          style={{
                            backgroundColor: `${wc.accent}15`,
                            borderRadius: 1,
                            paddingHorizontal: spacing[1],
                            paddingVertical: 1,
                          }}
                        >
                          <Text
                            style={{
                              ...typography.bodySmall,
                              color: wc.accent,
                              fontSize: 7,
                            }}
                          >
                            {f}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <Text
                    style={{
                      ...typography.label,
                      color: colors.success,
                      fontSize: 8,
                      letterSpacing: 1,
                    }}
                  >
                    UNLOCKED
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* In-progress class unlocks */}
        {lockedClassesWithProgress.length > 0 && (
          <View style={{ marginBottom: spacing[3] }}>
            <Text
              style={{
                ...typography.subtitle,
                color: colors.text.secondary,
                fontSize: 11,
                marginBottom: spacing[2],
              }}
            >
              LOCKED CLASSES
            </Text>
            {lockedClassesWithProgress.map(({ classDef: wc, progress }) => (
              <View
                key={wc.id}
                style={{
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                  padding: spacing[3],
                  marginBottom: spacing[2],
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[2],
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
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: colors.text.secondary,
                      fontSize: 11,
                    }}
                  >
                    {wc.name}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing[1],
                      marginTop: spacing[1],
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
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.secondary,
                        fontSize: 7,
                      }}
                    >
                      {progress.unlocked}/{progress.required}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Program Info */}
        <SegmentedPanel title="QUEST INFO" accent="none">
          <View style={{ gap: spacing[2] }}>
            <InfoRow label="FREQUENCY" value="4 days/week, rotating A→B→C→D" />
            <InfoRow label="PROGRAM" value={goalConfig.label} />
            <InfoRow label="REST" value="Varies by goal (30-180s)" />
            <InfoRow label="PROGRESSION" value="Double progression method" />
            <InfoRow label="DELOAD" value="Every 4-6 weeks (-50% volume)" />
          </View>
        </SegmentedPanel>

        {/* Difficulty selector */}
        <SegmentedPanel title="DIFFICULTY TIERS" accent="none">
          <Text
            style={{
              ...typography.body,
              color: colors.text.secondary,
              fontSize: 13,
              lineHeight: 20,
              marginBottom: spacing[3],
            }}
          >
            Each exercise has built-in progression pathways. Start at the level that matches your
            current capability and progress when you hit the upper rep range with perfect form.
          </Text>
          <View style={{ flexDirection: "row", gap: spacing[2], marginBottom: spacing[3] }}>
            {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((level) => (
              <View
                key={level}
                style={{
                  flex: 1,
                  backgroundColor: colors.bg.highlight,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                  padding: spacing[2],
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    color: level === "INTERMEDIATE" ? colors.accent.DEFAULT : colors.text.secondary,
                    fontSize: 8,
                    textAlign: "center",
                  }}
                >
                  {level}
                </Text>
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
              padding: spacing[3],
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing[2],
            }}
          >
            <Text style={{ fontSize: 16 }}>🌳</Text>
            <Text
              style={{
                ...typography.label,
                color: colors.accent.DEFAULT,
                fontSize: 10,
                letterSpacing: 1,
              }}
            >
              VIEW FULL SKILL TREE
            </Text>
          </TouchableOpacity>
        </SegmentedPanel>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 9 }}>
        {label}
      </Text>
      <Text style={{ ...typography.bodySmall, color: colors.text.primary, fontSize: 11 }}>
        {value}
      </Text>
    </View>
  );
}
