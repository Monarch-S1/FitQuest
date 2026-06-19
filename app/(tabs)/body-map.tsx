import { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { HUDModule } from "../../src/components/ui/HUDModule";
import { StatModule } from "../../src/components/ui/StatModule";
import { BodySilhouette } from "../../src/components/ui/BodySilhouette";
import { MuscleXpChart } from "../../src/components/workout/MuscleXpChart";
import { useUserStore } from "../../src/stores/useUserStore";
import {
  calculateMuscleProgress,
  getAllMuscleGroups,
  MuscleProgress,
  getMuscleXpHistory,
} from "../../src/utils/muscleXp";

type ViewMode = "latest" | "all";

export default function BodyMapScreen() {
  const colors = useColors();

  const { workoutHistory } = useUserStore();
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleProgress | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("latest");

  // Compute muscle data based on view mode
  const muscleData = useMemo(() => {
    if (workoutHistory.length === 0) return getAllMuscleGroups();
    if (viewMode === "latest") {
      const latestSession = workoutHistory[workoutHistory.length - 1];
      return calculateMuscleProgress([latestSession]);
    }
    // All Time — cumulative across all sessions
    return calculateMuscleProgress(workoutHistory);
  }, [workoutHistory, viewMode]);

  // Per-muscle XP history (always computed from full history)
  const muscleHistories = useMemo(() => {
    if (workoutHistory.length < 2) return [];
    return getMuscleXpHistory(workoutHistory);
  }, [workoutHistory]);

  // XP history for the currently selected muscle
  const selectedHistory = useMemo(() => {
    if (!selectedMuscle) return null;
    return muscleHistories.find((h) => h.zone === selectedMuscle.zone) || null;
  }, [selectedMuscle, muscleHistories]);

  const handleSelectZone = (zone: string) => {
    const muscle = muscleData.find((m) => m.zone === zone) || null;
    setSelectedMuscle(muscle);
  };

  const hasHistory = muscleHistories.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[12] }}
      >
        {/* Header */}
        <View style={{ marginBottom: spacing[4] }}>
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 10,
              marginBottom: spacing[1],
            }}
          >
            BODY MAP · MUSCLE EVOLUTION
          </Text>
          <Text
            style={{
              ...typography.display,
              color: colors.text.primary,
            }}
          >
            BODY EVOLUTION
          </Text>
        </View>

        {/* View mode toggle */}
        {workoutHistory.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              backgroundColor: colors.bg.elevated,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 4,
              padding: 2,
              marginBottom: spacing[3],
              alignSelf: "flex-start",
            }}
          >
            {([
              { key: "latest" as ViewMode, label: "LATEST SESSION" },
              { key: "all" as ViewMode, label: "ALL TIME" },
            ]).map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => { setViewMode(opt.key); setSelectedMuscle(null); }}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityLabel={`${opt.label} view mode`}
                accessibilityState={{ selected: viewMode === opt.key }}
                style={{
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[1],
                  backgroundColor: viewMode === opt.key ? colors.accent.DEFAULT : "transparent",
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    fontSize: 8,
                    color: viewMode === opt.key ? colors.bg.primary : colors.text.secondary,
                    letterSpacing: 1,
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Interactive SVG Body Silhouette */}
        <HUDModule
          label="BODY SILHOUETTE"
          accent="amber"
          style={{ alignItems: "center", padding: spacing[4] }}
        >
          <BodySilhouette
            muscleData={muscleData}
            selectedMuscle={selectedMuscle?.zone || null}
            onSelectMuscle={handleSelectZone}
          />
        </HUDModule>

        {/* Muscle group grid */}
        <Text
          style={{
            ...typography.subtitle,
            color: colors.text.secondary,
            fontSize: 11,
            marginTop: spacing[2],
            marginBottom: spacing[3],
          }}
        >
          MUSCLE DEVELOPMENT
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[2] }}>
          {muscleData.map((muscle) => (
            <TouchableOpacity
              key={muscle.zone}
              activeOpacity={0.7}
              onPress={() => setSelectedMuscle(muscle)}
              accessibilityRole="button"
              accessibilityLabel={`${muscle.name}, Level ${muscle.level}`}
              accessibilityState={{ selected: selectedMuscle?.zone === muscle.zone }}
              style={{
                width: "48%",
                backgroundColor:
                  selectedMuscle?.zone === muscle.zone ? `${muscle.color}20` : colors.bg.elevated,
                borderWidth: 1,
                borderColor:
                  selectedMuscle?.zone === muscle.zone ? muscle.color : colors.border.subtle,
                borderRadius: 4,
                padding: spacing[3],
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    ...typography.body,
                    color: colors.text.primary,
                    fontFamily: fonts.body.semiBold,
                    fontSize: 12,
                  }}
                >
                  {muscle.name}
                </Text>
                <Text
                  style={{
                    ...typography.h4,
                    color: muscle.level >= 3 ? "#10B981" : colors.accent.DEFAULT,
                    fontSize: 16,
                  }}
                >
                  {muscle.level > 0 ? `LV.${muscle.level}` : "--"}
                </Text>
              </View>

              {/* XP bar for this muscle */}
              <View
                style={{
                  height: 3,
                  backgroundColor: colors.bg.highlight,
                  borderRadius: 4,
                  marginTop: spacing[2],
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${muscle.xp > 0 ? Math.min((muscle.xpIntoLevel / muscle.nextLevelXp) * 100, 100) : 0}%`,
                    height: "100%",
                    backgroundColor: muscle.color,
                    borderRadius: 4,
                  }}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected muscle detail */}
        {selectedMuscle && (
          <View style={{ marginTop: spacing[4] }}>
            <StatModule
              label={selectedMuscle.name.toUpperCase()}
              value={selectedMuscle.level > 0 ? `Level ${selectedMuscle.level}` : "Not trained"}
              subValue={
                selectedMuscle.level > 0
                  ? `${selectedMuscle.xpIntoLevel} / ${selectedMuscle.nextLevelXp} XP to next level`
                  : "Complete workouts targeting this muscle to begin tracking"
              }
              accent={selectedMuscle.level >= 3 ? "green" : "amber"}
            />

            {/* XP history chart for selected muscle */}
            {selectedHistory && selectedHistory.points.length >= 2 && (
              <View style={{ marginTop: spacing[2] }}>
                <MuscleXpChart history={selectedHistory} accent={selectedMuscle.color} />
              </View>
            )}
          </View>
        )}

        {/* Hint when no muscle selected and history available */}
        {!selectedMuscle && hasHistory && (
          <View
            style={{
              marginTop: spacing[3],
              backgroundColor: colors.bg.elevated,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 4,
              padding: spacing[3],
              alignItems: "center",
            }}
          >
            <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 10 }}>
              Tap a muscle to see its XP progression chart
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
