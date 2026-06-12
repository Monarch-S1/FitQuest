import { useMemo, useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { useUserStore } from "../../src/stores/useUserStore";
import { getLevel, getProgressToNextLevel } from "../../src/utils/level";
import {
  LineChart,
  BarChart,
  StreakCalendar,
  WeekdayChart,
} from "../../src/components/workout/WorkoutChart";
import {
  getVolumeData,
  getXpData,
  getDurationData,
  getStreakCalendar,
  getWorkoutByWeekday,
} from "../../src/utils/chartData";
import { XpBar } from "../../src/components/ui/XpBar";
import { GlossyOverlay } from "../../src/components/ui/GlossyOverlay";
import { SyncIndicator } from "../../src/components/ui/SyncIndicator";

type Range = "7d" | "30d" | "all";
const RANGE_OPTIONS: { key: Range; label: string; points: number }[] = [
  { key: "7d", label: "7D", points: 7 },
  { key: "30d", label: "30D", points: 30 },
  { key: "all", label: "ALL", points: 99 },
];

function StatBox({ label, value, trend, colors }: { label: string; value: string; trend?: "up" | "down"; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 10, fontWeight: "bold", color: colors.text.secondary, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ fontFamily: fonts.heading, fontSize: 24, fontWeight: "900", color: colors.text.primary }}>
          {value}
        </Text>
        {trend && <Text style={{ fontSize: 12, color: trend === "up" ? colors.accent.DEFAULT : colors.error, marginLeft: 4 }}>{trend === "up" ? "↑" : "↓"}</Text>}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const { workoutHistory, totalXp, streakData } = useUserStore();
  const [range, setRange] = useState<Range>("30d");

  const maxPoints = RANGE_OPTIONS.find((o) => o.key === range)?.points ?? 30;

  const volumeData = useMemo(() => getVolumeData(workoutHistory, maxPoints), [workoutHistory, maxPoints]);
  const xpData = useMemo(() => getXpData(workoutHistory, maxPoints), [workoutHistory, maxPoints]);
  const durationData = useMemo(() => getDurationData(workoutHistory, maxPoints), [workoutHistory, maxPoints]);
  const streakCalendar = useMemo(() => getStreakCalendar(workoutHistory), [workoutHistory]);
  const weekdayData = useMemo(() => getWorkoutByWeekday(workoutHistory), [workoutHistory]);

  const hasData = workoutHistory.length > 0;

  const averageVolume = useMemo(() => {
    if (volumeData.points.length === 0) return 0;
    return Math.round(volumeData.points.reduce((a, b) => a + b.value, 0) / volumeData.points.length);
  }, [volumeData]);
  const averageXp = useMemo(() => {
    if (xpData.points.length === 0) return 0;
    return Math.round(xpData.points.reduce((a, b) => a + b.value, 0) / xpData.points.length);
  }, [xpData]);
  const averageDuration = useMemo(() => {
    if (durationData.points.length === 0) return 0;
    return Math.round(durationData.points.reduce((a, b) => a + b.value, 0) / durationData.points.length);
  }, [durationData]);

  const level = getLevel(totalXp);
  const xpProgress = getProgressToNextLevel(totalXp);

  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <Animated.ScrollView style={{ flex: 1, opacity: fadeIn }} contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[12] }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ marginBottom: spacing[4], position: "relative" }}>
          <SyncIndicator />
          <Text style={{ fontFamily: fonts.heading, fontSize: 28, fontWeight: "900", color: colors.text.primary, textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>
            Progress
          </Text>
        </View>

        {/* XP Bar */}
        {hasData && (
          <View style={{ marginBottom: spacing[3] }}>
            <XpBar currentXp={xpProgress.currentXp} requiredXp={xpProgress.requiredXp} level={level} nextLevel={level + 1} />
          </View>
        )}

        {/* Hero Stats */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 24 }}>
          <StatBox colors={colors} label="Workouts" value={String(workoutHistory.length)} trend="up" />
          <StatBox colors={colors} label="Streak" value={String(streakData.currentStreak)} trend="up" />
          <StatBox colors={colors} label="Volume" value={`${Math.round(totalXp / 1000)}k`} />
        </View>

        {/* Range selector */}
        {hasData && (
          <View style={{ flexDirection: "row", gap: spacing[1], marginBottom: spacing[4], backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.subtle, borderRadius: 4, padding: 2, alignSelf: "flex-start" }}>
            {RANGE_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt.key} onPress={() => setRange(opt.key)} activeOpacity={0.7} style={{ paddingHorizontal: spacing[3], paddingVertical: spacing[1], backgroundColor: range === opt.key ? colors.accent.DEFAULT : "transparent", borderRadius: 4 }}>
                <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 9, color: range === opt.key ? colors.bg.primary : colors.text.secondary, letterSpacing: 1.5 }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!hasData ? (
          <View style={{ backgroundColor: colors.bg.surface, borderRadius: 16, padding: 40, alignItems: "center", borderWidth: 1, borderColor: colors.border.subtle, overflow: "hidden" }}>
            <GlossyOverlay highlightOpacity={0.06} showReflection={false} />
            <Text style={{ fontSize: 32, marginBottom: 12 }}>◇</Text>
            <Text style={{ fontFamily: fonts.body.bold, fontSize: 10, fontWeight: "bold", color: colors.text.secondary, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>NO WORKOUT DATA</Text>
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 12, color: colors.text.tertiary, textAlign: "center", lineHeight: 18 }}>
              Complete your first workout to unlock analytics, charts, and performance tracking.
            </Text>
          </View>
        ) : (
          <>
            {/* Volume Chart */}
            <View style={{ backgroundColor: colors.bg.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border.subtle }}>
              <Text style={{ fontFamily: fonts.body.bold, fontSize: 10, fontWeight: "bold", color: colors.accent.DEFAULT, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>VOLUME</Text>
              <Text style={{ fontFamily: fonts.body.regular, fontSize: 9, color: colors.text.secondary, marginBottom: 8 }}>Sets per workout session</Text>
              <BarChart data={volumeData} accent={colors.accent.DEFAULT} />
            </View>

            {/* XP Chart */}
            <View style={{ backgroundColor: colors.bg.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border.subtle }}>
              <Text style={{ fontFamily: fonts.body.bold, fontSize: 10, fontWeight: "bold", color: colors.accent.DEFAULT, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>XP EARNED</Text>
              <Text style={{ fontFamily: fonts.body.regular, fontSize: 9, color: colors.text.secondary, marginBottom: 8 }}>Experience points per session</Text>
              <LineChart data={xpData} accent={colors.accent.DEFAULT} />
            </View>

            {/* Duration Chart */}
            <View style={{ backgroundColor: colors.bg.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border.subtle }}>
              <Text style={{ fontFamily: fonts.body.bold, fontSize: 10, fontWeight: "bold", color: colors.text.secondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>DURATION</Text>
              <Text style={{ fontFamily: fonts.body.regular, fontSize: 9, color: colors.text.secondary, marginBottom: 8 }}>Individual session durations</Text>
              <LineChart data={durationData} accent={colors.success} />
            </View>

            {/* Streak Calendar */}
            <View style={{ backgroundColor: colors.bg.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border.subtle }}>
              <Text style={{ fontFamily: fonts.body.bold, fontSize: 10, fontWeight: "bold", color: colors.success, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                STREAK CALENDAR · {streakData.currentStreak}d
              </Text>
              <StreakCalendar data={streakCalendar} />
            </View>

            {/* Weekday Distribution */}
            {weekdayData.some((d) => d.count > 0) && (
              <View style={{ backgroundColor: colors.bg.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border.subtle }}>
                <Text style={{ fontFamily: fonts.body.bold, fontSize: 10, fontWeight: "bold", color: colors.text.secondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>WEEKDAY DISTRIBUTION</Text>
                <WeekdayChart data={weekdayData} accent={colors.accent.DEFAULT} />
              </View>
            )}

            {/* Session List */}
            <View style={{ backgroundColor: colors.bg.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border.subtle }}>
              <Text style={{ fontFamily: fonts.body.bold, fontSize: 10, fontWeight: "bold", color: colors.text.secondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>ALL SESSIONS</Text>
              {[...workoutHistory].reverse().map((session) => (
                <View key={session.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border.subtle }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 11, color: colors.text.primary }}>{session.workoutId.toUpperCase()}</Text>
                    <Text style={{ fontFamily: fonts.body.regular, fontSize: 9, color: colors.text.secondary, marginTop: 1 }}>
                      {session.date} · {Math.round(session.duration / 60)}min · {session.setsCompleted} sets
                    </Text>
                  </View>
                  <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 11, color: colors.accent.DEFAULT }}>+{session.xpEarned} XP</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
