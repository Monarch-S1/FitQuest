import { useCallback, useMemo, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { getWorkoutsForGoal } from "../../src/data/workouts";
import { useUserStore } from "../../src/stores/useUserStore";
import { getRecommendation } from "../../src/utils/recommendations";
import { getProgressionSummary } from "../../src/utils/progression";
import { TrainScreenSkeleton } from "../../src/components/ui/Skeleton";
import { Animated, Easing } from "react-native";
import type { DifficultyTier } from "../../src/data/exercises";

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
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text
          style={{
            fontFamily: fonts.heading,
            fontSize: 28,
            fontWeight: "900",
            color: colors.text.primary,
            textTransform: "uppercase",
            letterSpacing: 2,
            marginBottom: 24,
          }}
        >
          Recommended
        </Text>

        {/* AI Recommendation Header — colored dots */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.success,
                marginRight: 8,
              }}
            />
          ))}
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: colors.accent.DEFAULT,
              marginRight: 8,
            }}
          />
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: colors.border.subtle,
              marginRight: 8,
            }}
          />
          <Text
            style={{
              fontFamily: fonts.body.semiBold,
              fontSize: 10,
              fontWeight: "bold",
              color: colors.text.secondary,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginLeft: 4,
            }}
          >
            Progression: Set {Math.min(workoutHistory.length + 1, 12)}/12
          </Text>
        </View>

        {/* Recommendation reasoning */}
        <View
          style={{
            backgroundColor: colors.bg.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border.subtle,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 13,
              color: colors.text.secondary,
              lineHeight: 20,
            }}
          >
            {recommendation.reasoning}
          </Text>
          {recommendation.recommendedId !== "rest" && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleWorkoutSelect(recommendation.recommendedId)}
              style={{
                marginTop: 12,
                backgroundColor: colors.accent.DEFAULT,
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.body.bold,
                  fontSize: 12,
                  fontWeight: "bold",
                  color: colors.bg.primary,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {recommendation.recommendedName}
              </Text>
            </TouchableOpacity>
          )}
          {/* Confidence indicator */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 6 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  recommendation.confidence === "high" ? colors.success :
                  recommendation.confidence === "medium" ? colors.accent.DEFAULT : colors.text.secondary,
              }}
            />
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 9, color: colors.text.secondary }}>
              {recommendation.confidence === "high" ? "HIGH CONFIDENCE" :
               recommendation.confidence === "medium" ? "MODERATE" : "ESTIMATE"}
            </Text>
          </View>
        </View>

        {/* Progression Readiness */}
        {progressionSummary.exercisesReady.length > 0 && (
          <View
            style={{
              backgroundColor: colors.bg.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.success,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 10,
                fontWeight: "bold",
                color: colors.success,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              {progressionSummary.exercisesReady.length} Ready to Progress
            </Text>
            {progressionSummary.exercisesReady.slice(0, 3).map((ex) => (
              <View
                key={ex.exerciseId}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.body.semiBold,
                    fontSize: 12,
                    color: colors.text.primary,
                    flex: 1,
                  }}
                >
                  {ex.exerciseName}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 9,
                    color: colors.success,
                  }}
                >
                  {ex.highEndPercentage}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Workout Cards */}
        {goalWorkouts.map((w) => {
          const isActive = recommendation.recommendedId === w.id;
          const sets = w.exercises?.length || 0;
          // Determine difficulty from average exercise difficulty tiers
          const difficulties = w.exercises.map((e) => e.difficulty).filter(Boolean);
          const avgDifficulty = difficulties.length > 0 ? difficulties[Math.floor(difficulties.length / 2)] : undefined;
          const dotColor = avgDifficulty === "advanced" ? colors.error : avgDifficulty === "intermediate" ? colors.accent.DEFAULT : colors.success;

          return (
            <TouchableOpacity
              key={w.id}
              activeOpacity={0.8}
              onPress={() => handleWorkoutSelect(w.id)}
              style={{
                backgroundColor: colors.bg.surface,
                borderRadius: 16,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderWidth: isActive ? 2 : 1,
                borderColor: isActive ? colors.accent.DEFAULT : colors.border.subtle,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: colors.border.subtle,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Text style={{ fontSize: 28 }}>🏋️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.body.bold,
                    fontSize: 18,
                    color: colors.text.primary,
                  }}
                >
                  {w.name}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 13,
                    color: colors.text.secondary,
                    marginTop: 2,
                  }}
                >
                  {sets} Exercises
                </Text>
              </View>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: dotColor,
                }}
              />
            </TouchableOpacity>
          );
        })}

        {/* Deload notice */}
        {progressionSummary.deloadRecommended && (
          <View
            style={{
              backgroundColor: colors.bg.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.error,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 10,
                fontWeight: "bold",
                color: colors.error,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              DELOAD WEEK SUGGESTED
            </Text>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 13,
                color: colors.text.secondary,
                lineHeight: 20,
              }}
            >
              You've been training consistently for {progressionSummary.totalTrainingWeeks} weeks.
              Reduce volume by 40-50% this week: 2 sets per exercise, leave 4-5 reps in reserve.
              Your body will come back stronger.
            </Text>
          </View>
        )}

        {/* CORE PROGRAMS */}
        <Text
          style={{
            fontFamily: fonts.body.semiBold,
            fontSize: 11,
            fontWeight: "bold",
            color: colors.text.secondary,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginTop: 8,
            marginBottom: 12,
          }}
        >
          CORE PROGRAMS
        </Text>

        {/* Exercise Library Link */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/exercises/catalog")}
          style={{
            backgroundColor: colors.bg.surface,
            borderRadius: 16,
            padding: 20,
            alignItems: "center",
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.border.subtle,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.heading,
              fontSize: 16,
              fontWeight: "900",
              color: colors.accent.DEFAULT,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            EXERCISE LIBRARY
          </Text>
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 11,
              color: colors.text.secondary,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            Browse all exercises · View form details · Track progression
          </Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
