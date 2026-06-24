import { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors, typography, spacing, fonts, Label, H4, Body } from "../../src/tokens";
import { Card } from "../../src/components/ui/Card";
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
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing[12] }}
      >
        {/* Header */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 10,
              marginBottom: spacing.xs,
            }}
          >
            Body
          </Text>
          <Text
            style={{
              ...typography.display,
              color: colors.text.primary,
            }}
          >
            Body Map
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
              marginBottom: spacing.md,
              alignSelf: "flex-start",
            }}
          >
            {[
              { key: "latest" as ViewMode, label: "LATEST SESSION" },
              { key: "all" as ViewMode, label: "ALL TIME" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => {
                  setViewMode(opt.key);
                  setSelectedMuscle(null);
                }}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityLabel={`${opt.label} view mode`}
                accessibilityState={{ selected: viewMode === opt.key }}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
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
        <Card title="MUSCLE MAP" accent="amber" style={{ alignItems: "center" }}>
          <BodySilhouette
            muscleData={muscleData}
            selectedMuscle={selectedMuscle?.zone || null}
            onSelectMuscle={handleSelectZone}
          />
        </Card>

        {/* Muscle group grid */}
        <Text
          style={{
            ...typography.subtitle,
            color: colors.text.secondary,
            fontSize: 11,
            marginTop: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          Attributes
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
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
                padding: spacing.md,
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
                  marginTop: spacing.sm,
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
          <View style={{ marginTop: spacing.lg }}>
            <Card>
              <View style={{ alignItems: "center", gap: spacing.xs }}>
                <Label variant="secondary" style={{ fontSize: 9 }}>
                  {selectedMuscle.name.toUpperCase()}
                </Label>
                <H4 variant={selectedMuscle.level >= 3 ? "success" : "accent"}>
                  {selectedMuscle.level > 0 ? `Level ${selectedMuscle.level}` : "Not trained"}
                </H4>
                <Body variant="secondary" size="sm" style={{ fontSize: 9, textAlign: "center" }}>
                  {selectedMuscle.level > 0
                    ? `${selectedMuscle.xpIntoLevel} / ${selectedMuscle.nextLevelXp} XP to next level`
                    : "Complete workouts targeting this muscle to begin tracking"}
                </Body>
              </View>
            </Card>

            {/* XP history chart for selected muscle */}
            {selectedHistory && selectedHistory.points.length >= 2 && (
              <View style={{ marginTop: spacing.sm }}>
                <MuscleXpChart history={selectedHistory} accent={selectedMuscle.color} />
              </View>
            )}
          </View>
        )}

        {/* Hint when no muscle selected and history available */}
        {!selectedMuscle && hasHistory && (
          <View
            style={{
              marginTop: spacing.md,
              backgroundColor: colors.bg.elevated,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 4,
              padding: spacing.md,
              alignItems: "center",
            }}
          >
            <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 10 }}>
              Select an attribute to view XP progression
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
