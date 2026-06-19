import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { XpBar } from "../../src/components/ui/XpBar";
import { LevelBadge } from "../../src/components/ui/LevelBadge";
import { Button } from "../../src/components/ui/Button";
import { StatModule } from "../../src/components/ui/StatModule";
import { WorkoutCard } from "../../src/components/ui/WorkoutCard";
import { DailyMission } from "../../src/components/home/DailyMission";
import { StreakDisplay } from "../../src/components/home/StreakDisplay";
import { RecoveryStatus } from "../../src/components/home/RecoveryStatus";
import { GlossyOverlay } from "../../src/components/ui/GlossyOverlay";
import { SyncIndicator } from "../../src/components/ui/SyncIndicator";
import { useUserStore } from "../../src/stores/useUserStore";
import { getWorkoutsForGoal } from "../../src/data/workouts";
import { getTrainingInsights, getRecommendation } from "../../src/utils/recommendations";
import { parseLocalDate, getLocalToday } from "../../src/utils/date";
import { HomeScreenSkeleton } from "../../src/components/ui/Skeleton";
import { StreakMilestone, getStreakMilestone } from "../../src/components/home/StreakMilestone";

export default function HomeScreen() {
  const colors = useColors();

  const router = useRouter();
  const { level, totalXp, streakData, recoveryStatus, xpProgress, workoutHistory, lastShownMilestone, setLastShownMilestone, isHydrated, fitnessGoal } = useUserStore();

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
    const workoutId = recommendation.recommendedId !== "rest" ? recommendation.recommendedId : "workout-a";
    router.push(`/workout/${workoutId}`);
  }, [router, recommendation]);

  const handleWorkoutSelect = useCallback(
    (workoutId: string) => {
      router.push(`/workout/preview/${workoutId}`);
    },
    [router],
  );

  // Goal-specific workouts
  const goalWorkouts = useMemo(
    () => getWorkoutsForGoal(fitnessGoal),
    [fitnessGoal],
  );

  const workouts = goalWorkouts.map((w) => ({ data: w, id: w.id }));

  // Memoized workout filtering for bento grid
  const featuredWorkoutId = useMemo(() => recommendation.recommendedId !== "rest" ? recommendation.recommendedId : "workout-a", [recommendation.recommendedId]);
  const featuredWorkout = useMemo(() => workouts.find((w) => w.id === featuredWorkoutId) || workouts[0], [featuredWorkoutId]);
  const remainingWorkouts = useMemo(() => workouts.filter((w) => w.id !== featuredWorkoutId), [featuredWorkoutId]);

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
      {/* Streak milestone celebration overlay */}
      {milestoneTier && (
        <StreakMilestone tier={milestoneTier} onDismiss={handleDismissMilestone} />
      )}
      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeIn }}
        contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[12] }}
      >
        {/* ── Hero Header: Level + XP + Quick Stats ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: spacing[5],
            position: "relative",
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
              Command Center
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

        {/* ── Intelligence Insights ── */}
        {insights.length > 0 && (
          <View style={{ gap: spacing[2], marginBottom: spacing[4] }}>
            {insights.map((insight, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[2],
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1,
                  borderColor:
                    insight.type === "deload"
                      ? colors.error
                      : insight.type === "progression"
                        ? colors.success
                        : colors.border.subtle,
                  borderRadius: 4,
                  padding: spacing[3],
                  // Glow for high-priority insights
                  ...(insight.type === "deload" && {
                    shadowColor: colors.error,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }),
                  ...(insight.type === "progression" && {
                    shadowColor: colors.success,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }),
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor:
                      insight.type === "deload"
                        ? `${colors.error}15`
                        : insight.type === "progression"
                          ? `${colors.success}15`
                          : colors.bg.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor:
                      insight.type === "deload"
                        ? colors.error
                        : insight.type === "progression"
                          ? colors.success
                          : colors.border.subtle,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{insight.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[1] }}>
                    <Text
                      style={{ ...typography.label, color: colors.text.secondary, fontSize: 9 }}
                    >
                      {insight.title}
                    </Text>
                  </View>
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: colors.text.primary,
                      fontSize: 11,
                      lineHeight: 16,
                      marginTop: 2,
                      fontFamily: fonts.body.regular,
                    }}
                  >
                    {insight.message}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Streak + Recovery row ── */}
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

        {/* ── Quick Start CTA ── */}
        <Button
          title={`${recommendation.recommendedName}`}
          onPress={handleQuickTrain}
          size="lg"
          fullWidth
        />

        {/* ── Bento Grid: Stats + Workouts ── */}
        <Text
          style={{
            ...typography.subtitle,
            color: colors.text.secondary,
            fontSize: 11,
            marginTop: spacing[6],
            marginBottom: spacing[3],
          }}
        >
          Quest Log
        </Text>

        {/* Row 1: Two equal stat cards */}
        <View style={{ flexDirection: "row", gap: spacing[2], marginBottom: spacing[2] }}>
          <View style={{ flex: 1 }}>
            <StatModule label="TOTAL XP" value={totalXp} accent="amber" size="sm" />
          </View>
          <View style={{ flex: 1 }}>
            <StatModule
              label="WORKOUTS"
              value={workoutHistory.length}
              subValue={
                streakData.currentStreak >= 3 ? `${streakData.currentStreak}d streak` : undefined
              }
              accent={streakData.currentStreak >= 3 ? "green" : "amber"}
              size="sm"
            />
          </View>
        </View>

        {/* Row 2: Featured workout (wide) + Exercise Library (square) */}
        <View style={{ flexDirection: "row", gap: spacing[2], marginBottom: spacing[2] }}>
          {/* Featured workout card — 2/3 width */}
          <View style={{ flex: 2 }}>
            <WorkoutCard
              workout={featuredWorkout.data}
              onPress={() => handleWorkoutSelect(featuredWorkoutId)}
              isActive={recommendation.recommendedId !== "rest"}
            />
          </View>
          {/* Exercise Library shortcut — 1/3 width */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/exercises/catalog")}
            accessibilityRole="button"
            accessibilityLabel="Exercise Library"
            accessibilityHint="Browse all 24 exercises by muscle group"
            style={{
              flex: 1,
              backgroundColor: colors.bg.elevated,
              borderWidth: 1.5,
              borderColor: colors.border.subtle,
              borderRadius: 4,
              padding: spacing[3],
              alignItems: "center",
              justifyContent: "center",
              minHeight: 120,
              overflow: "hidden",
            }}
          >
            <GlossyOverlay highlightOpacity={0.1} />
            <View
              style={{
                width: 36,
                height: 36,
                backgroundColor: `${colors.accent.DEFAULT}15`,
                borderWidth: 1,
                borderColor: colors.accent.DEFAULT,
                borderRadius: 4,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: spacing[2],
              }}
            >
              <Text style={{ fontSize: 14, color: colors.accent.DEFAULT }}>▤</Text>
            </View>
            <Text
              style={{
                ...typography.label,
                color: colors.accent.DEFAULT,
                fontSize: 8,
                textAlign: "center",
              }}
            >
              EXERCISE
            </Text>
            <Text
              style={{
                ...typography.label,
                color: colors.accent.DEFAULT,
                fontSize: 8,
                textAlign: "center",
              }}
            >
              LIBRARY
            </Text>
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.tertiary,
                fontSize: 7,
                textAlign: "center",
                marginTop: spacing[1],
              }}
            >
              24 exercises
            </Text>
          </TouchableOpacity>
        </View>

        {/* Row 3: Remaining workout cards in 2-column bento */}
        <View style={{ flexDirection: "row", gap: spacing[2], marginBottom: spacing[2] }}>
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

        {/* Row 4: Last workout card (full width) */}
        {remainingWorkouts.slice(2).map((w) => (
          <View key={w.id} style={{ marginBottom: spacing[2] }}>
            <WorkoutCard
              workout={w.data}
              onPress={() => handleWorkoutSelect(w.id)}
              isActive={false}
            />
          </View>
        ))}

        {/* ── Program Structure Panel ── */}
        <View
          style={{
            backgroundColor: colors.bg.elevated,
            borderWidth: 1,
            borderColor: colors.border.subtle,
            borderRadius: 4,
            padding: spacing[3],
            marginTop: spacing[2],
            overflow: "hidden",
          }}
        >
          <GlossyOverlay highlightOpacity={0.06} showReflection={false} />
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 9,
              marginBottom: spacing[2],
            }}
          >
            Quest Info
          </Text>
          <View style={{ gap: spacing[2] }}>
            <InfoRow label="Schedule" value="4 days/week" />
            <InfoRow label="Progression" value="Double progression method" />
            <InfoRow label="Recovery" value="Every 4-6 weeks" />
          </View>
        </View>
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
