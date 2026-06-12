import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { useUserStore } from "../../src/stores/useUserStore";
import { getRecommendation } from "../../src/utils/recommendations";
import { parseLocalDate, getLocalToday } from "../../src/utils/date";
import { HomeScreenSkeleton } from "../../src/components/ui/Skeleton";
import { StreakMilestone, getStreakMilestone } from "../../src/components/home/StreakMilestone";
import { Animated, Easing } from "react-native";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    level, totalXp, streakData, recoveryStatus, xpProgress,
    workoutHistory, lastShownMilestone, setLastShownMilestone,
    isHydrated, fitnessGoal, displayName,
  } = useUserStore();

  const recommendation = useMemo(
    () => getRecommendation(workoutHistory, recoveryStatus, fitnessGoal),
    [workoutHistory, recoveryStatus, fitnessGoal],
  );

  const handleQuickTrain = useCallback(() => {
    const workoutId = recommendation.recommendedId !== "rest" ? recommendation.recommendedId : "workout-a";
    router.push(`/workout/${workoutId}`);
  }, [router, recommendation]);

  // Streak milestone celebration
  const [milestoneTier, setMilestoneTier] = useState<ReturnType<typeof getStreakMilestone>>(null);
  useEffect(() => {
    if (!isHydrated) return;
    const milestone = getStreakMilestone(streakData.currentStreak);
    if (milestone && streakData.currentStreak > lastShownMilestone) {
      const timer = setTimeout(() => setMilestoneTier(milestone), 400);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, streakData.currentStreak, lastShownMilestone]);

  const handleDismissMilestone = useCallback(() => {
    if (milestoneTier) {
      setLastShownMilestone(milestoneTier.days);
    }
    setMilestoneTier(null);
  }, [milestoneTier, setLastShownMilestone]);

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
        <HomeScreenSkeleton />
      </SafeAreaView>
    );
  }

  // Recovery percentage for the gauge (0-100)
  const recoveryPct =
    recoveryStatus === "optimal" ? 88 :
    recoveryStatus === "moderate" ? 65 : 40;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F1115" }}>
      {milestoneTier && (
        <StreakMilestone tier={milestoneTier} onDismiss={handleDismissMilestone} />
      )}
      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeIn }}
        contentContainerStyle={{
          padding: spacing[4],
          paddingBottom: spacing[12],
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header & Streak ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: spacing[5],
          }}
        >
          <View style={{ flex: 1, marginRight: spacing[3] }}>
            <Text
              style={{
                fontFamily: fonts.body.semiBold,
                fontSize: 10,
                fontWeight: "bold",
                color: "#9CA3AF",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Welcome back
            </Text>
            <Text
              style={{
                fontFamily: fonts.heading,
                fontSize: 24,
                fontWeight: "900",
                color: "#F3F4F6",
                letterSpacing: -0.5,
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              {displayName || "ATHLETE"}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#1A1D24",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#2D3139",
            }}
          >
            <Text style={{ fontSize: 16, marginRight: 4 }}>🔥</Text>
            <Text style={{ fontFamily: fonts.body.bold, fontSize: 14, color: "#F3F4F6" }}>
              {streakData.currentStreak}
            </Text>
          </View>
        </View>

        {/* ── Hero Readiness Gauge ── */}
        <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 40 }}>
          <View
            style={{
              width: 192,
              height: 192,
              borderRadius: 96,
              borderWidth: 10,
              borderColor: "#1A1D24",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Accent ring arc — simplified as a border overlay */}
            <View
              style={{
                position: "absolute",
                top: -10,
                left: -10,
                right: -10,
                bottom: -10,
                borderRadius: 96,
                borderWidth: 10,
                borderColor: "#F59E0B",
                borderRightColor: "transparent",
                borderBottomColor: "transparent",
                transform: [{ rotate: "45deg" }],
              }}
            />
            <Text
              style={{
                fontFamily: fonts.heading,
                fontSize: 48,
                fontWeight: "900",
                color: "#F3F4F6",
              }}
            >
              {recoveryPct}%
            </Text>
            <Text
              style={{
                fontFamily: fonts.body.semiBold,
                fontSize: 10,
                fontWeight: "bold",
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              Recovery
            </Text>
          </View>
        </View>

        {/* ── Daily Mission Card ── */}
        <View
          style={{
            backgroundColor: "#1A1D24",
            borderRadius: 16,
            padding: 20,
            marginBottom: 32,
            borderWidth: 1,
            borderColor: "#2D3139",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 40,
                height: 40,
                backgroundColor: "#0F1115",
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 20 }}>⚡</Text>
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.body.bold,
                  fontSize: 18,
                  color: "#F3F4F6",
                }}
              >
                {recommendation.recommendedName}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body.regular,
                  fontSize: 12,
                  color: "#9CA3AF",
                  marginTop: 2,
                }}
              >
                {recommendation.recommendedId !== "rest"
                  ? `Target: ${recommendation.recommendedName}`
                  : "Recovery day — rest and repair"}
              </Text>
            </View>
          </View>
          {/* Progress bar */}
          <View
            style={{
              height: 4,
              backgroundColor: "#2D3139",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: streakData.isActiveToday ? "100%" : "75%",
                height: "100%",
                backgroundColor: "#F59E0B",
                borderRadius: 999,
              }}
            />
          </View>
        </View>

        {/* ── THE ACTION BUTTON ── */}
        <TouchableOpacity activeOpacity={0.9} onPress={handleQuickTrain}>
          <LinearGradient
            colors={["#F59E0B", "#D97706"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 64,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#F59E0B",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.heading,
                fontSize: 20,
                fontWeight: "900",
                color: "#0F1115",
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              START TRAINING
            </Text>
            <Text
              style={{
                fontSize: 20,
                color: "#0F1115",
                marginLeft: 8,
              }}
            >
              ›
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
