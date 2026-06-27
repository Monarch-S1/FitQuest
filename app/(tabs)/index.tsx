import { useCallback, useMemo, useState, useEffect } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, spacing, Display, Label, Body } from "../../src/tokens";
import { XpBar } from "../../src/components/ui/XpBar";
import { LevelBadge } from "../../src/components/ui/LevelBadge";
import { Card } from "../../src/components/ui/Card";
import { WorkoutCard } from "../../src/components/ui/WorkoutCard";
import { DailyMission } from "../../src/components/home/DailyMission";
import { SyncIndicator } from "../../src/components/ui/SyncIndicator";
import { useUserStore } from "../../src/stores/useUserStore";
import { getWorkouts96 } from "../../src/data/workouts";
import { getTrainingInsights, getRecommendation } from "../../src/utils/recommendations";
import { HomeScreenSkeleton } from "../../src/components/ui/Skeleton";
import { StreakMilestone, getStreakMilestone } from "../../src/components/home/StreakMilestone";

export default function HomeScreen() {
  const colors = useColors();

  const router = useRouter();
  const {
    level,
    totalXp,
    streakData,
    recoveryStatus,
    xpProgress,
    workoutHistory,
    lastShownMilestone,
    setLastShownMilestone,
    isHydrated,
    fitnessGoal,
  } = useUserStore();

  // Intelligence-driven insights
  const insights = useMemo(
    () => getTrainingInsights(workoutHistory, recoveryStatus, streakData.currentStreak),
    [workoutHistory, recoveryStatus, streakData.currentStreak],
  );

  const recommendation = useMemo(
    () => getRecommendation(workoutHistory, recoveryStatus, fitnessGoal),
    [workoutHistory, recoveryStatus, fitnessGoal],
  );

  const handleQuickTrain = useCallback(() => {
    const workoutId =
      recommendation.recommendedId !== "rest" ? recommendation.recommendedId : "workout-96-0";
    router.push(`/workout/${workoutId}`);
  }, [router, recommendation]);

  const handleWorkoutSelect = useCallback(
    (workoutId: string) => {
      router.push(`/workout/${workoutId}`);
    },
    [router],
  );

  // Goal-specific workouts — generated from 96-exercise database
  const storeMasteredIds = useUserStore((state) => state.masteredExerciseIds ?? []);
  const masteredIds = useMemo(() => new Set(storeMasteredIds), [storeMasteredIds]);

  const goalWorkouts = useMemo(
    () => getWorkouts96(fitnessGoal, masteredIds),
    [fitnessGoal, masteredIds],
  );

  const workouts = goalWorkouts.map((w) => ({ data: w, id: w.id }));

  const featuredWorkoutId = useMemo(
    () => (recommendation.recommendedId !== "rest" ? recommendation.recommendedId : "workout-96-0"),
    [recommendation.recommendedId],
  );
  const featuredWorkout = useMemo(
    () => workouts.find((w) => w.id === featuredWorkoutId) || workouts[0],
    [featuredWorkoutId, workouts],
  );
  const remainingWorkouts = useMemo(
    () => workouts.filter((w) => w.id !== featuredWorkoutId),
    [featuredWorkoutId, workouts],
  );

  const [milestoneTier, setMilestoneTier] = useState<ReturnType<typeof getStreakMilestone>>(null);

  // Check for new streak milestone after hydration
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
        <HomeScreenSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.base }}>
      {/* Streak milestone celebration overlay */}
      {milestoneTier && <StreakMilestone tier={milestoneTier} onDismiss={handleDismissMilestone} />}

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeIn }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
      >
        {/* ── Hero Header: Level + XP ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: spacing.xl,
          }}
        >
          <SyncIndicator />
          <View style={{ flex: 1, marginRight: spacing.md }}>
            <Label variant="secondary" style={{ marginBottom: spacing.xs }}>
              SYSTEM ONLINE
            </Label>
            <Display>FitQuest</Display>
            <View style={{ marginTop: spacing.sm }}>
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

        {/* ── Hero Stats: Streak · XP · Readiness ── */}
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl }}>
          {/* Streak */}
          <Card style={{ flex: 1 }}>
            <View style={{ alignItems: "center", gap: spacing.xs }}>
              <Text
                style={{
                  fontFamily: "BebasNeue-Regular",
                  fontSize: 28,
                  letterSpacing: 0.5,
                  color:
                    streakData.currentStreak >= 3 ? colors.accent.DEFAULT : colors.text.primary,
                }}
              >
                {streakData.currentStreak}
              </Text>
              <Label variant="secondary">DAY STREAK</Label>
            </View>
          </Card>

          {/* Total XP */}
          <Card style={{ flex: 1 }}>
            <View style={{ alignItems: "center", gap: spacing.xs }}>
              <Text
                style={{
                  fontFamily: "BebasNeue-Regular",
                  fontSize: 28,
                  letterSpacing: 0.5,
                  color: colors.accent.DEFAULT,
                }}
              >
                {totalXp}
              </Text>
              <Label variant="secondary">TOTAL XP</Label>
            </View>
          </Card>

          {/* Readiness */}
          <Card style={{ flex: 1 }}>
            <View style={{ alignItems: "center", gap: spacing.xs }}>
              <Text
                style={{
                  fontFamily: "BebasNeue-Regular",
                  fontSize: 22,
                  letterSpacing: 0.5,
                  color:
                    recoveryStatus === "optimal"
                      ? colors.success
                      : recoveryStatus === "moderate"
                        ? colors.accent.DEFAULT
                        : colors.error,
                }}
              >
                {recoveryStatus === "optimal" ? "✓" : recoveryStatus === "moderate" ? "△" : "○"}
              </Text>
              <Label variant="secondary">{recoveryStatus.toUpperCase()}</Label>
            </View>
          </Card>
        </View>

        {/* ── Welcome banner for new users ── */}
        {workoutHistory.length === 0 && (
          <Card style={{ marginBottom: spacing.xl }}>
            <View style={{ alignItems: "center" }}>
              <Label variant="accent" style={{ marginBottom: spacing.sm }}>
                WELCOME TO FITQUEST
              </Label>
              <Body variant="secondary" style={{ textAlign: "center" }}>
                Complete your first workout to begin tracking progress and building your streak.
              </Body>
            </View>
          </Card>
        )}

        {/* ── Daily Mission (quest panel) ── */}
        <View style={{ marginBottom: spacing.xl }}>
          <DailyMission
            mission="Complete today's recommended workout with perfect form"
            isComplete={streakData.isActiveToday}
            onStart={handleQuickTrain}
          />
        </View>

        {/* ── Featured Workout ── */}
        <View style={{ marginBottom: spacing.lg }}>
          <Label variant="secondary" style={{ marginBottom: spacing.sm }}>
            FEATURED QUEST
          </Label>
          <WorkoutCard
            workout={featuredWorkout.data}
            onPress={() => handleWorkoutSelect(featuredWorkoutId)}
            isActive={recommendation.recommendedId !== "rest"}
          />
        </View>

        {/* ── Intelligence Insights ── */}
        {insights.length > 0 && (
          <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
            {insights.map((insight, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  backgroundColor: colors.bg.card,
                  borderRadius: 10,
                  padding: spacing.md,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    backgroundColor:
                      insight.type === "deload"
                        ? `${colors.error}15`
                        : insight.type === "progression"
                          ? `${colors.success}15`
                          : colors.bg.highlight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{insight.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Label variant="secondary">{insight.title}</Label>
                  <Body variant="primary" size="sm" style={{ marginTop: 2 }}>
                    {insight.message}
                  </Body>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Remaining Workouts ── */}
        {remainingWorkouts.length > 0 && (
          <>
            <Label variant="secondary" style={{ marginBottom: spacing.sm }}>
              ALL WORKOUTS
            </Label>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm }}>
              {remainingWorkouts.slice(0, 2).map((w) => (
                <View key={w.id} style={{ flex: 1 }}>
                  <WorkoutCard
                    workout={w.data}
                    onPress={() => handleWorkoutSelect(w.id)}
                    isActive={false}
                  />
                </View>
              ))}
            </View>
            {remainingWorkouts.slice(2).map((w) => (
              <View key={w.id} style={{ marginBottom: spacing.sm }}>
                <WorkoutCard
                  workout={w.data}
                  onPress={() => handleWorkoutSelect(w.id)}
                  isActive={false}
                />
              </View>
            ))}
          </>
        )}

        {/* ── Quest Log ── */}
        <Card style={{ marginTop: spacing.sm }}>
          <Label variant="secondary" style={{ marginBottom: spacing.sm }}>
            QUEST LOG
          </Label>
          <View style={{ gap: spacing.sm }}>
            <InfoRow label="Schedule" value="4 days/week" />
            <InfoRow label="Progression" value="Double progression method" />
            <InfoRow label="Recovery" value="Every 4-6 weeks" />
          </View>
        </Card>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Label variant="secondary">{label}</Label>
      <Body variant="primary">{value}</Body>
    </View>
  );
}
