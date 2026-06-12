import { useMemo, useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { useUserStore } from "../../src/stores/useUserStore";
import { getLevel, getProgressToNextLevel } from "../../src/utils/level";

function StatBox({
  label,
  value,
  trend,
  color,
}: {
  label: string;
  value: string;
  trend?: "up" | "down";
  color: string;
}) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text
        style={{
          fontFamily: fonts.body.semiBold,
          fontSize: 10,
          fontWeight: "bold",
          color: "#9CA3AF",
          textTransform: "uppercase",
          letterSpacing: 2,
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text
          style={{
            fontFamily: fonts.heading,
            fontSize: 24,
            fontWeight: "900",
            color: "#F3F4F6",
          }}
        >
          {value}
        </Text>
        {trend && (
          <Text
            style={{
              fontSize: 12,
              color: trend === "up" ? "#F59E0B" : "#EF4444",
              marginLeft: 4,
            }}
          >
            {trend === "up" ? "↑" : "↓"}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const { workoutHistory, totalXp, streakData } = useUserStore();
  const [range, setRange] = useState<"7d" | "30d" | "all">("30d");

  const hasData = workoutHistory.length > 0;

  const level = getLevel(totalXp);
  const xpProgress = getProgressToNextLevel(totalXp);

  // Simple bar chart data from recent workouts
  const barData = useMemo(() => {
    const recent = [...workoutHistory].reverse().slice(0, 7);
    if (recent.length === 0) return [];
    const maxSets = Math.max(...recent.map((s) => s.setsCompleted), 1);
    return recent.map((s) => ({
      height: Math.round((s.setsCompleted / maxSets) * 100),
      label: s.date.slice(5),
    }));
  }, [workoutHistory]);

  // Fade-in animation
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F1115" }}>
      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeIn }}
        contentContainerStyle={{
          padding: spacing[4],
          paddingBottom: spacing[12],
        }}
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
          History
        </Text>

        {/* Hero Stats */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 40,
          }}
        >
          <StatBox
            label="Workouts"
            value={String(workoutHistory.length)}
            trend="up"
            color="#F59E0B"
          />
          <StatBox
            label="Streak"
            value={String(streakData.currentStreak)}
            trend="up"
            color="#10B981"
          />
          <StatBox
            label="Volume"
            value={`${Math.round(totalXp / 1000)}k`}
            trend={undefined}
            color="#F59E0B"
          />
        </View>

        {!hasData ? (
          <View
            style={{
              backgroundColor: "#1A1D24",
              borderRadius: 16,
              padding: 40,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#2D3139",
            }}
          >
            <Text style={{ fontSize: 32, marginBottom: 12 }}>◇</Text>
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 10,
                fontWeight: "bold",
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              No Workout Data
            </Text>
            <Text
              style={{
                fontFamily: fonts.body.regular,
                fontSize: 12,
                color: "#6B7280",
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              Complete your first workout to unlock analytics and performance tracking.
            </Text>
          </View>
        ) : (
          <>
            {/* Minimal Bar Chart */}
            <View
              style={{
                height: 160,
                width: "100%",
                marginBottom: 40,
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  height: "100%",
                  paddingHorizontal: 8,
                  gap: 16,
                }}
              >
                {barData.map((bar, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      backgroundColor: "#F59E0B33",
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                      height: `${bar.height}%`,
                      minHeight: 4,
                    }}
                  >
                    <View
                      style={{
                        height: 2,
                        backgroundColor: "#F59E0B",
                        width: "100%",
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Session List */}
            {[...workoutHistory].reverse().map((session, i) => (
              <View
                key={session.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "#2D3139",
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#F59E0B",
                    marginRight: 16,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: fonts.body.bold,
                      fontSize: 14,
                      color: "#F3F4F6",
                    }}
                  >
                    {session.date} • {session.workoutId.toUpperCase().replace("WORKOUT-", "")}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.body.regular,
                      fontSize: 12,
                      color: "#9CA3AF",
                      marginTop: 2,
                    }}
                  >
                    {Math.round(session.duration / 60)} mins • {session.setsCompleted} sets • +{session.xpEarned} XP
                  </Text>
                </View>
                <Text style={{ fontSize: 16, color: "#2D3139" }}>›</Text>
              </View>
            ))}
          </>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
