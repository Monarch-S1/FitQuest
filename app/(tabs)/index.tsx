import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { XpBar } from "../../src/components/ui/XpBar";
import { LevelBadge } from "../../src/components/ui/LevelBadge";
import { Button } from "../../src/components/ui/Button";
import { DailyMission } from "../../src/components/home/DailyMission";
import { StreakDisplay } from "../../src/components/home/StreakDisplay";
import { RecoveryStatus } from "../../src/components/home/RecoveryStatus";
import { SyncIndicator } from "../../src/components/ui/SyncIndicator";
import { useUserStore } from "../../src/stores/useUserStore";
import { getRecommendation } from "../../src/utils/recommendations";
import { parseLocalDate, getLocalToday } from "../../src/utils/date";
import { HomeScreenSkeleton } from "../../src/components/ui/Skeleton";
import { StreakMilestone, getStreakMilestone } from "../../src/components/home/StreakMilestone";

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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
        <HomeScreenSkeleton />
      </SafeAreaView>
    );
  }

  // Recovery percentage for the gauge
  const recoveryPct =
    recoveryStatus === "optimal" ? 88 :
    recoveryStatus === "moderate" ? 65 : 40;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
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
        {/* Hero Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: spacing[5],
          }}
        >
          <View style={{ flex: 1, marginRight: spacing[3] }}>
            <SyncIndicator />
            <Text
              style={{
                fontFamily: fonts.body.semiBold,
                fontSize: 10,
                fontWeight: "bold",
                color: colors.text.secondary,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              Welcome back
            </Text>
            <Text
              style={{
                fontFamily: fonts.heading,
                fontSize: 24,
                fontWeight: "900",
                color: colors.text.primary,
                letterSpacing: -0.5,
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              {displayName || "ATHLETE"}
            </Text>
            <View style={{ marginTop: spacing[2] }}>
              <XpBar
                currentXp={xpProgress.currentXp}
                requiredXp={xpProgress.requiredXp}
                level={level}
                nextLevel={level + 1}
              />
            </View>
          </View>
          <LevelBadge level={level} size="md" />
        </View>

        {/* Welcome banner for new users */}
        {workoutHistory.length === 0 && (
          <View
            style={{
              backgroundColor: colors.bg.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              padding: spacing[4],
              marginBottom: spacing[4],
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 10,
                fontWeight: "bold",
                color: colors.accent.DEFAULT,
                letterSpacing: 2,
                marginBottom: spacing[2],
              }}
            >
              WELCOME TO ARCH
            </Text>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                color: colors.text.secondary,
                fontSize: 13,
                lineHeight: 20,
                textAlign: "center",
              }}
            >
              Complete your first workout to begin tracking progress and building your streak.
            </Text>
          </View>
        )}

        {/* Streak + Recovery */}
        <View style={{ gap: spacing[2], marginBottom: spacing[4] }}>
          <StreakDisplay streak={streakData} />
          <RecoveryStatus
            status={recoveryStatus}
            daysSinceLastWorkout={
              streakData.lastWorkoutDate
                ? Math.round(
                    (parseLocalDate(getLocalToday()) - parseLocalDate(streakData.lastWorkoutDate)) /
                      (1000 * 60 * 60 * 24),
                  )
                : undefined
            }
          />
        </View>

        {/* Hero Readiness Gauge */}
        <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
          <View
            style={{
              width: 192,
              height: 192,
              borderRadius: 96,
              borderWidth: 10,
              borderColor: colors.bg.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: -10,
                left: -10,
                right: -10,
                bottom: -10,
                borderRadius: 96,
                borderWidth: 10,
                borderColor: colors.accent.DEFAULT,
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
                color: colors.text.primary,
              }}
            >
              {recoveryPct}%
            </Text>
            <Text
              style={{
                fontFamily: fonts.body.semiBold,
                fontSize: 10,
                fontWeight: "bold",
                color: colors.text.secondary,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              Recovery
            </Text>
          </View>
        </View>

        {/* Daily Mission Card */}
        <View style={{ marginBottom: spacing[4] }}>
          <DailyMission
            mission="Complete today's recommended workout with perfect form"
            isComplete={streakData.isActiveToday}
            onStart={handleQuickTrain}
          />
        </View>

        {/* Gradient TRAIN CTA */}
        <TouchableOpacity activeOpacity={0.9} onPress={handleQuickTrain}>
          <LinearGradient
            colors={[colors.accent.DEFAULT, colors.accent.DEFAULT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: 64,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.accent.DEFAULT,
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
                color: colors.bg.primary,
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              TRAIN {recommendation.recommendedName}
            </Text>
            <Text style={{ fontSize: 20, color: colors.bg.primary, marginLeft: 8 }}>›</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
