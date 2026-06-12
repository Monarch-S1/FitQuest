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
      router.push(`/workout/${workoutId}`);
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
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0F1115" }}>
        <TrainScreenSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F1115" }}>
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
            color: "#F3F4F6",
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
                backgroundColor: "#10B981",
                marginRight: 8,
              }}
            />
          ))}
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#F59E0B",
              marginRight: 8,
            }}
          />
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: "#2D3139",
              marginRight: 8,
            }}
          />
          <Text
            style={{
              fontFamily: fonts.body.semiBold,
              fontSize: 10,
              fontWeight: "bold",
              color: "#9CA3AF",
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
            backgroundColor: "#1A1D24",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#2D3139",
          }}
        >
          <Text
            style={{
              fontFamily: fonts.body.regular,
              fontSize: 13,
              color: "#9CA3AF",
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
                backgroundColor: "#F59E0B",
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
                  color: "#0F1115",
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
                  recommendation.confidence === "high" ? "#10B981" :
                  recommendation.confidence === "medium" ? "#F59E0B" : "#9CA3AF",
              }}
            />
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 9, color: "#9CA3AF" }}>
              {recommendation.confidence === "high" ? "HIGH CONFIDENCE" :
               recommendation.confidence === "medium" ? "MODERATE" : "ESTIMATE"}
            </Text>
          </View>
        </View>

        {/* Progression Readiness */}
        {progressionSummary.exercisesReady.length > 0 && (
          <View
            style={{
              backgroundColor: "#1A1D24",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#10B981",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 10,
                fontWeight: "bold",
                color: "#10B981",
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
                    color: "#F3F4F6",
                    flex: 1,
                  }}
                >
                  {ex.exerciseName}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 9,
                    color: "#10B981",
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
          const dotColor = w.id.includes("a") ? "#10B981" : w.id.includes("d") ? "#EF4444" : "#F59E0B";

          return (
            <TouchableOpacity
              key={w.id}
              activeOpacity={0.8}
              onPress={() => handleWorkoutSelect(w.id)}
              style={{
                backgroundColor: "#1A1D24",
                borderRadius: 16,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderWidth: isActive ? 2 : 1,
                borderColor: isActive ? "#F59E0B" : "#2D3139",
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: "#2D3139",
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
                    color: "#F3F4F6",
                  }}
                >
                  {w.name}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body.regular,
                    fontSize: 13,
                    color: "#9CA3AF",
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

        {/* Exercise Library Link */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/exercises/catalog")}
          style={{
            backgroundColor: "#1A1D24",
            borderRadius: 16,
            padding: 20,
            alignItems: "center",
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: "#2D3139",
          }}
        >
          <Text
            style={{
              fontFamily: fonts.heading,
              fontSize: 16,
              fontWeight: "900",
              color: "#F59E0B",
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
              color: "#9CA3AF",
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
