import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
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
    isHydrated, fitnessGoal,
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
      >
        {/* ── Hero Header ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: spacing[5],
          }}
        >
          <SyncIndicator />
          <View style={{ flex: 1, marginRight: spacing[3] }}>
            <Text
              style={{
                ...typography.label,
                color: colors.text.secondary,
                fontSize: 10,
                marginBottom: spacing[1],
              }}
            >
              HOME · COMMAND CENTER
            </Text>
            <Text
              style={{
                ...typography.display,
                color: colors.text.primary,
              }}
            >
              ARCH
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
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 4,
              padding: spacing[4],
              marginBottom: spacing[4],
              alignItems: "center",
            }}
          >
            <Text
              style={{
                ...typography.label,
                color: colors.accent.DEFAULT,
                fontSize: 10,
                marginBottom: spacing[2],
              }}
            >
              WELCOME TO ARCH
            </Text>
            <Text
              style={{
                ...typography.body,
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

        {/* ── Streak + Recovery ── */}
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

        {/* ── Daily Mission ── */}
        <View style={{ marginBottom: spacing[4] }}>
          <DailyMission
            mission="Complete today's recommended workout with perfect form"
            isComplete={streakData.isActiveToday}
            onStart={handleQuickTrain}
          />
        </View>

        {/* ── Big TRAIN CTA ── */}
        <Button
          title={`TRAIN ${recommendation.recommendedName}`}
          onPress={handleQuickTrain}
          size="lg"
          fullWidth
        />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
