import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { SegmentedPanel } from "../../src/components/ui/SegmentedPanel";
import { StatModule } from "../../src/components/ui/StatModule";
import { XpBar } from "../../src/components/ui/XpBar";
import {
  LineChart,
  BarChart,
  StreakCalendar,
  WeekdayChart,
} from "../../src/components/workout/WorkoutChart";
import { useUserStore } from "../../src/stores/useUserStore";
import { GlossyOverlay } from "../../src/components/ui/GlossyOverlay";
import { SyncIndicator } from "../../src/components/ui/SyncIndicator";
import {
  getVolumeData,
  getXpData,
  getDurationData,
  getStreakCalendar,
  getWorkoutByWeekday,
} from "../../src/utils/chartData";
import { getLevel, getProgressToNextLevel } from "../../src/utils/level";

type Range = "7d" | "30d" | "all";

const RANGE_OPTIONS: { key: Range; label: string; points: number }[] = [
  { key: "7d", label: "7D", points: 7 },
  { key: "30d", label: "30D", points: 30 },
  { key: "all", label: "ALL", points: 99 },
];

export default function HistoryScreen() {
  const colors = useColors();

  const { workoutHistory, totalXp, streakData } = useUserStore();

  const [range, setRange] = useState<Range>("30d");

  const maxPoints = RANGE_OPTIONS.find((o) => o.key === range)?.points ?? 30;

  const volumeData = useMemo(
    () => getVolumeData(workoutHistory, maxPoints),
    [workoutHistory, maxPoints],
  );
  const xpData = useMemo(() => getXpData(workoutHistory, maxPoints), [workoutHistory, maxPoints]);
  const durationData = useMemo(
    () => getDurationData(workoutHistory, maxPoints),
    [workoutHistory, maxPoints],
  );
  const streakCalendar = useMemo(() => getStreakCalendar(workoutHistory), [workoutHistory]);
  const weekdayData = useMemo(() => getWorkoutByWeekday(workoutHistory), [workoutHistory]);

  const hasData = workoutHistory.length > 0;

  const averageVolume = useMemo(() => {
    if (volumeData.points.length === 0) return 0;
    const sum = volumeData.points.reduce((a, b) => a + b.value, 0);
    return Math.round(sum / volumeData.points.length);
  }, [volumeData]);

  const averageXp = useMemo(() => {
    if (xpData.points.length === 0) return 0;
    const sum = xpData.points.reduce((a, b) => a + b.value, 0);
    return Math.round(sum / xpData.points.length);
  }, [xpData]);

  const averageDuration = useMemo(() => {
    if (durationData.points.length === 0) return 0;
    const sum = durationData.points.reduce((a, b) => a + b.value, 0);
    return Math.round(sum / durationData.points.length);
  }, [durationData]);

  const level = getLevel(totalXp);
  const xpProgress = getProgressToNextLevel(totalXp);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing[4],
          paddingBottom: spacing[12],
        }}
      >
        {/* Header */}
        <View style={{ marginBottom: spacing[4], position: "relative" }}>
          <SyncIndicator />
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 10,
              marginBottom: spacing[1],
            }}
          >
            HISTORY · ANALYTICS
          </Text>
          <Text
            style={{
              ...typography.display,
              color: colors.text.primary,
            }}
          >
            HISTORY
          </Text>
        </View>

        {/* XP Bar + Level */}
        {hasData && (
          <View style={{ marginBottom: spacing[3] }}>
            <XpBar
              currentXp={xpProgress.currentXp}
              requiredXp={xpProgress.requiredXp}
              level={level}
              nextLevel={level + 1}
            />
          </View>
        )}

        {/* Range selector */}
        {hasData && (
          <View
            style={{
              flexDirection: "row",
              gap: spacing[1],
              marginBottom: spacing[4],
              backgroundColor: colors.bg.elevated,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 4,
              padding: 2,
              alignSelf: "flex-start",
            }}
          >
            {RANGE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setRange(opt.key)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityLabel={`${opt.label} range filter`}
                accessibilityState={{ selected: range === opt.key }}
                style={{
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[1],
                  backgroundColor: range === opt.key ? colors.accent.DEFAULT : "transparent",
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    fontSize: 9,
                    color: range === opt.key ? colors.bg.primary : colors.text.secondary,
                    letterSpacing: 1.5,
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!hasData ? (
          // ── Empty State ──
          <View
            style={{
              backgroundColor: colors.bg.surface,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 4,
              padding: spacing[8],
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <GlossyOverlay highlightOpacity={0.06} showReflection={false} />
            <Text
              style={{
                ...typography.h3,
                color: colors.text.secondary,
                fontSize: 20,
                marginBottom: spacing[2],
              }}
            >
              ◇
            </Text>
            <Text
              style={{
                ...typography.label,
                color: colors.text.secondary,
                fontSize: 10,
                marginBottom: spacing[2],
              }}
            >
              NO WORKOUT DATA
            </Text>
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.secondary,
                fontSize: 12,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              Complete your first workout to unlock analytics, charts, and performance tracking.
            </Text>
          </View>
        ) : (
          <>
            {/* ── Summary Stats ── */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing[2],
                marginBottom: spacing[4],
              }}
            >
              <View style={{ width: "48%" }}>
                <StatModule
                  label="TOTAL WORKOUTS"
                  value={workoutHistory.length}
                  accent="amber"
                  size="sm"
                />
              </View>
              <View style={{ width: "48%" }}>
                <StatModule label="TOTAL XP" value={totalXp} accent="amber" size="sm" />
              </View>
              <View style={{ width: "48%" }}>
                <StatModule
                  label="CURRENT STREAK"
                  value={streakData.currentStreak}
                  accent={streakData.currentStreak >= 3 ? "green" : "amber"}
                  size="sm"
                  subValue={`Best: ${streakData.longestStreak}`}
                />
              </View>
              <View style={{ width: "48%" }}>
                <StatModule
                  label="AVG / SESSION"
                  value={averageDuration}
                  accent="amber"
                  size="sm"
                  subValue={`${averageVolume} sets · ${averageXp} XP`}
                />
              </View>
            </View>

            {/* ── Volume Chart ── */}
            <SegmentedPanel title="VOLUME" accent="amber" style={{ marginBottom: spacing[2] }}>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.secondary,
                  fontSize: 9,
                  marginBottom: spacing[2],
                }}
              >
                Sets per workout session
              </Text>
              <BarChart data={volumeData} accent={colors.accent.DEFAULT} />
            </SegmentedPanel>

            {/* ── XP Chart ── */}
            <SegmentedPanel title="XP EARNED" accent="amber" style={{ marginBottom: spacing[2] }}>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.secondary,
                  fontSize: 9,
                  marginBottom: spacing[2],
                }}
              >
                Experience points per session
              </Text>
              <LineChart data={xpData} accent={colors.accent.DEFAULT} />
            </SegmentedPanel>

            {/* ── Duration Chart ── */}
            <SegmentedPanel title="DURATION" accent="none" style={{ marginBottom: spacing[2] }}>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.secondary,
                  fontSize: 9,
                  marginBottom: spacing[2],
                }}
              >
                Individual session durations
              </Text>
              <LineChart data={durationData} accent={colors.success} />
            </SegmentedPanel>

            {/* ── Streak Calendar ── */}
            <SegmentedPanel
              title={`STREAK CALENDAR · ${streakData.currentStreak}d`}
              accent="green"
              style={{ marginBottom: spacing[2] }}
            >
              <StreakCalendar data={streakCalendar} />
            </SegmentedPanel>

            {/* ── Weekday Distribution ── */}
            {weekdayData.some((d) => d.count > 0) && (
              <SegmentedPanel
                title="WEEKDAY DISTRIBUTION"
                accent="none"
                style={{ marginBottom: spacing[2] }}
              >
                <WeekdayChart data={weekdayData} accent={colors.accent.DEFAULT} />
              </SegmentedPanel>
            )}

            {/* ── Recent Sessions List ── */}
            <SegmentedPanel title="ALL SESSIONS" accent="none">
              {[...workoutHistory].reverse().map((session) => (
                <View
                  key={session.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: spacing[2],
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border.subtle,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.primary,
                        fontSize: 11,
                        fontFamily: fonts.body.semiBold,
                      }}
                    >
                      {session.workoutId.toUpperCase()}
                    </Text>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.secondary,
                        fontSize: 9,
                        marginTop: 1,
                      }}
                    >
                      {session.date} · {Math.round(session.duration / 60)}min ·{" "}
                      {session.setsCompleted} sets
                    </Text>
                  </View>
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: colors.accent.DEFAULT,
                      fontSize: 11,
                      fontFamily: fonts.body.semiBold,
                    }}
                  >
                    +{session.xpEarned} XP
                  </Text>
                </View>
              ))}
            </SegmentedPanel>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
