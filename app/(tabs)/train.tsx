import { useCallback, useMemo, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { WorkoutCard } from "../../src/components/ui/WorkoutCard";
import { Button } from "../../src/components/ui/Button";
import { SegmentedPanel } from "../../src/components/ui/SegmentedPanel";
import { getWorkoutsForGoal } from "../../src/data/workouts";
import { useUserStore } from "../../src/stores/useUserStore";
import { getRecommendation } from "../../src/utils/recommendations";
import { getProgressionSummary } from "../../src/utils/progression";
import { TrainScreenSkeleton } from "../../src/components/ui/Skeleton";
import { Animated, Easing } from "react-native";

export default function TrainScreen() {
  const colors = useColors();
  const router = useRouter();
  const { workoutHistory, recoveryStatus, isHydrated, fitnessGoal } = useUserStore();

  const goalWorkouts = useMemo(
    () => getWorkoutsForGoal(fitnessGoal),
    [fitnessGoal],
  );

  const recommendation = useMemo(
    () => getRecommendation(workoutHistory, recoveryStatus),
    [workoutHistory, recoveryStatus],
  );

  const progressionSummary = useMemo(() => getProgressionSummary(workoutHistory), [workoutHistory]);

  const handleWorkoutSelect = useCallback(
    (workoutId: string) => {
      router.push(`/workout/preview/${workoutId}`);
    },
    [router],
  );

  // Fade-in animation
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
            TRAIN · WORKOUT SYSTEM
          </Text>
          <Text
            style={{
              ...typography.display,
              color: colors.text.primary,
            }}
          >
            TRAINING GRID
          </Text>
        </View>

        {/* Intelligence-Driven Recommendation */}
        <SegmentedPanel title="TODAY'S RECOMMENDATION" accent="amber">
          <Text
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
                title={recommendation.recommendedName}
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
          CORE PROGRAMS
        </Text>

        {goalWorkouts.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            onPress={() => handleWorkoutSelect(w.id)}
            isActive={recommendation.recommendedId === w.id}
          />
        ))}

        {/* Exercise Library Link */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/exercises/catalog")}
          accessibilityRole="button"
          accessibilityLabel="Exercise Library"
          accessibilityHint="Browse all exercises by muscle group"
          style={{
            backgroundColor: colors.bg.elevated,
            borderWidth: 1.5,
            borderColor: colors.border.subtle,
            borderRadius: 4,
            borderStyle: "dashed",
            padding: spacing[4],
            marginBottom: spacing[3],
            alignItems: "center",
          }}
        >
          <Text
            style={{
              ...typography.h4,
              color: colors.accent.DEFAULT,
              fontSize: 18,
              marginBottom: spacing[1],
            }}
          >
            EXERCISE LIBRARY
          </Text>
          <Text
            style={{
              ...typography.bodySmall,
              color: colors.text.secondary,
              fontSize: 11,
              textAlign: "center",
            }}
          >
            Browse all exercises by muscle group · View form details · Track progression
          </Text>
          <View
            style={{
              marginTop: spacing[2],
              backgroundColor: colors.accent.DEFAULT,
              borderRadius: 4,
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[1],
            }}
          >
            <Text
              style={{
                ...typography.label,
                color: colors.bg.primary,
                fontSize: 9,
              }}
            >
              BROWSE →
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
