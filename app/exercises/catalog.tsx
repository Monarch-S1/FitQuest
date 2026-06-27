import { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { Exercise, Tempo, MuscleGroup } from "../../src/data/exercises";
import { getAllExercises96 } from "../../src/data/exercises96";
import { PATHWAYS, PathwayId } from "../../src/data/pathways";
import { useUserStore } from "../../src/stores/useUserStore";
import { hasPreset, createPresetFromExercise } from "../../src/utils/exercisePresets";

/** Strip Exercise96 fields to plain Exercise */
function toExercise(ex96: import("../../src/data/exercises96").Exercise96): Exercise {
  const { pathwayId: _pw, pathwayLevel: _lvl, overloadMechanism: _om, ...exercise } = ex96;
  return exercise as Exercise;
}

/** Check if an exercise ID is a 96-pathway ID (e.g. "HP6", "AQL3") */
function isPathwayId(id: string): boolean {
  return /^[A-Z]{2,4}\d+$/.test(id);
}

/** Get pathway label from a 96 exercise ID */
function getPathwayLabel(id: string): string | null {
  const match = id.match(/^([A-Z]{2,4})/);
  if (!match) return null;
  const pwKey = match[1].toLowerCase() as PathwayId;
  const pw = PATHWAYS[pwKey];
  if (!pw) return null;
  return `${pw.label} Lv${id.slice(match[1].length)} · ${pw.fullLabel}`;
}

const ALL_EXERCISES: Exercise[] = getAllExercises96().map(toExercise);

const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  quadriceps: "Quads",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
  chest: "Chest",
  shoulders: "Shoulders",
  triceps: "Triceps",
  biceps: "Biceps",
  lats: "Lats",
  rhomboids: "Rhomboids",
  traps: "Traps",
  lower_back: "Lower Back",
  core: "Core",
  obliques: "Obliques",
  rotator_cuff: "Rotator Cuff",
  forearms: "Forearms",
  calves: "Calves",
  upper_chest: "Upper Chest",
  mid_back: "Mid Back",
  rear_deltoids: "Rear Delts",
  grip: "Grip",
  upper_rectus_abdominis: "Upper Abs",
  lower_rectus_abdominis: "Lower Abs",
  hip_flexors: "Hip Flexors",
  hip_abductors: "Hip Abductors",
  serratus_anterior: "Serratus",
  hip_adductors: "Hip Adductors",
  scapular_stabilizers: "Scapular",
  rectus_abdominis: "Abs",
};

const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  quadriceps: "#EF4444",
  glutes: "#F59E0B",
  hamstrings: "#8B5CF6",
  chest: "#10B981",
  shoulders: "#3B82F6",
  triceps: "#F97316",
  biceps: "#EC4899",
  lats: "#6366F1",
  rhomboids: "#14B8A6",
  traps: "#A855F7",
  lower_back: "#84CC16",
  core: "#06B6D4",
  obliques: "#D946EF",
  rotator_cuff: "#0EA5E9",
  forearms: "#78716C",
  calves: "#2DD4BF",
  upper_chest: "#10B981",
  mid_back: "#14B8A6",
  rear_deltoids: "#8B5CF6",
  grip: "#78716C",
  upper_rectus_abdominis: "#06B6D4",
  lower_rectus_abdominis: "#06B6D4",
  hip_flexors: "#F59E0B",
  hip_abductors: "#2DD4BF",
  serratus_anterior: "#3B82F6",
  hip_adductors: "#2DD4BF",
  scapular_stabilizers: "#6366F1",
  rectus_abdominis: "#06B6D4",
};

// Map exercise IDs back to their pathway for context
function findWorkoutForExercise(exerciseId: string): { label: string; routeId: string | null } {
  if (isPathwayId(exerciseId)) {
    const label = getPathwayLabel(exerciseId);
    if (label) {
      return { label, routeId: "workout-96-0" };
    }
  }
  return { label: "", routeId: null };
}

export default function ExerciseCatalogScreen() {
  const colors = useColors();

  const router = useRouter();
  const { setExercisePreset, removeExercisePreset } = useUserStore();
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // Preset editor state
  const [editPresetId, setEditPresetId] = useState<string | null>(null);
  const [editSets, setEditSets] = useState(3);
  const [editRepLow, setEditRepLow] = useState(8);
  const [editRepHigh, setEditRepHigh] = useState(15);
  const [editRest, setEditRest] = useState(90);
  const [editTempo, setEditTempo] = useState<Tempo>("3-1-2-0");
  const [editLabel, setEditLabel] = useState("");

  // Derive unique muscle groups present across all exercises
  const availableMuscles = useMemo(() => {
    const muscleSet = new Set<MuscleGroup>();
    for (const ex of ALL_EXERCISES) {
      for (const muscle of ex.targetMuscles) {
        muscleSet.add(muscle);
      }
    }
    return Array.from(muscleSet).sort((a, b) =>
      MUSCLE_GROUP_LABELS[a].localeCompare(MUSCLE_GROUP_LABELS[b]),
    );
  }, []);

  // Filter exercises by selected muscle group
  const filteredExercises = useMemo(() => {
    if (!selectedMuscle) return ALL_EXERCISES;
    return ALL_EXERCISES.filter((ex) => ex.targetMuscles.includes(selectedMuscle));
  }, [selectedMuscle]);

  const handleToggleExpand = useCallback((exerciseId: string) => {
    setExpandedExercise((prev) => (prev === exerciseId ? null : exerciseId));
    setEditPresetId(null);
  }, []);

  const handleOpenPresetEditor = useCallback((exercise: Exercise) => {
    const preset = hasPreset(exercise.id)
      ? useUserStore.getState().exercisePresets?.[exercise.id]
      : null;
    setEditPresetId(exercise.id);
    if (preset) {
      setEditSets(preset.defaultSets);
      setEditRepLow(preset.repRange[0]);
      setEditRepHigh(preset.repRange[1]);
      setEditRest(preset.restInterval);
      setEditTempo(preset.tempo);
      setEditLabel(preset.label ?? "");
    } else {
      setEditSets(exercise.defaultSets);
      setEditRepLow(exercise.repRange[0]);
      setEditRepHigh(exercise.repRange[1]);
      setEditRest(exercise.restInterval);
      setEditTempo(exercise.tempo);
      setEditLabel("");
    }
  }, []);

  const handleSavePreset = useCallback(() => {
    if (!editPresetId) return;
    const preset = createPresetFromExercise({ id: editPresetId } as Exercise, {
      label: editLabel || undefined,
      defaultSets: editSets,
      repRange: [editRepLow, editRepHigh],
      restInterval: editRest,
      tempo: editTempo,
    });
    setExercisePreset(preset);
    setEditPresetId(null);
  }, [
    editPresetId,
    editLabel,
    editSets,
    editRepLow,
    editRepHigh,
    editRest,
    editTempo,
    setExercisePreset,
  ]);

  const handleRemovePreset = useCallback(
    (exerciseId: string) => {
      removeExercisePreset(exerciseId);
    },
    [removeExercisePreset],
  );

  const handleTrainWorkout = useCallback(
    (workoutId: string) => {
      router.push(`/workout/${workoutId}`);
    },
    [router],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing[12] }}
      >
        {/* Header */}
        <View style={{ marginBottom: spacing.lg }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  ...typography.label,
                  color: colors.text.secondary,
                  fontSize: 10,
                  marginBottom: spacing.xs,
                }}
              >
                SKILLS CATALOG
              </Text>
              <Text
                style={{
                  ...typography.display,
                  color: colors.text.primary,
                }}
              >
                SKILLS LIBRARY
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close catalog"
              style={{
                borderWidth: 1,
                borderColor: colors.border.subtle,
                borderRadius: 4,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
              }}
            >
              <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 10 }}>
                CLOSE
              </Text>
            </TouchableOpacity>
          </View>
          <Text
            style={{
              ...typography.bodySmall,
              color: colors.text.secondary,
              fontSize: 11,
              marginTop: spacing.sm,
              lineHeight: 16,
            }}
          >
            Browse all {ALL_EXERCISES.length} exercises across 8 movement pathways. Filter by muscle
            group to find targeted movements.
          </Text>
        </View>

        {/* Muscle Group Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.md }}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSelectedMuscle(null)}
            accessibilityRole="radio"
            accessibilityLabel="Show all exercises"
            accessibilityState={{ selected: !selectedMuscle }}
            style={{
              backgroundColor: !selectedMuscle ? colors.accent.DEFAULT : colors.bg.elevated,
              borderWidth: 1,
              borderColor: !selectedMuscle ? colors.accent.DEFAULT : colors.border.subtle,
              borderRadius: 4,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
            }}
          >
            <Text
              style={{
                ...typography.label,
                color: !selectedMuscle ? colors.bg.primary : colors.text.secondary,
                fontSize: 9,
              }}
            >
              ALL
            </Text>
          </TouchableOpacity>
          {availableMuscles.map((muscle) => {
            const isSelected = selectedMuscle === muscle;
            const muscleColor = MUSCLE_GROUP_COLORS[muscle];
            return (
              <TouchableOpacity
                key={muscle}
                activeOpacity={0.7}
                onPress={() => setSelectedMuscle(isSelected ? null : muscle)}
                accessibilityRole="radio"
                accessibilityLabel={`Filter by ${MUSCLE_GROUP_LABELS[muscle]}`}
                accessibilityState={{ selected: isSelected }}
                style={{
                  backgroundColor: isSelected ? `${muscleColor}20` : colors.bg.elevated,
                  borderWidth: 1,
                  borderColor: isSelected ? muscleColor : colors.border.subtle,
                  borderRadius: 4,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: muscleColor,
                  }}
                />
                <Text
                  style={{
                    ...typography.label,
                    color: isSelected ? muscleColor : colors.text.secondary,
                    fontSize: 9,
                  }}
                >
                  {MUSCLE_GROUP_LABELS[muscle]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Results count */}
        <Text
          style={{
            ...typography.bodySmall,
            color: colors.text.secondary,
            fontSize: 10,
            marginBottom: spacing.md,
          }}
        >
          {filteredExercises.length} EXERCISE{filteredExercises.length !== 1 ? "S" : ""}
          {selectedMuscle ? ` TARGETING ${MUSCLE_GROUP_LABELS[selectedMuscle].toUpperCase()}` : ""}
        </Text>

        {/* Exercise Cards */}
        {filteredExercises.map((exercise) => {
          const isExpanded = expandedExercise === exercise.id;
          const { label: workoutName, routeId: workoutRouteId } = findWorkoutForExercise(
            exercise.id,
          );
          const is96Exercise = isPathwayId(exercise.id);

          return (
            <TouchableOpacity
              key={exercise.id}
              activeOpacity={0.85}
              onPress={() => handleToggleExpand(exercise.id)}
              accessibilityRole="button"
              accessibilityLabel={`${exercise.name}. ${isExpanded ? "Collapse details" : "Expand details"}`}
              accessibilityState={{ expanded: isExpanded }}
              style={{
                backgroundColor: isExpanded ? colors.bg.highlight : colors.bg.elevated,
                borderWidth: 1,
                borderColor: isExpanded ? colors.accent.DEFAULT : colors.border.subtle,
                borderRadius: 4,
                marginBottom: spacing.sm,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Left accent bar */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 3,
                  height: "100%",
                  backgroundColor: isExpanded ? colors.accent.DEFAULT : colors.border.subtle,
                }}
              />

              {/* Collapsed view */}
              <View style={{ padding: spacing.md, paddingLeft: spacing.lg }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flex: 1, marginRight: spacing.md }}>
                    <Text
                      style={{
                        ...typography.body,
                        color: colors.text.primary,
                        fontFamily: fonts.body.semiBold,
                        fontSize: 13,
                      }}
                    >
                      {exercise.name}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: spacing.xs,
                        marginTop: spacing.xs,
                      }}
                    >
                      {exercise.targetMuscles.map((muscle) => (
                        <View
                          key={muscle}
                          style={{
                            backgroundColor: `${MUSCLE_GROUP_COLORS[muscle]}15`,
                            borderWidth: 1,
                            borderColor: `${MUSCLE_GROUP_COLORS[muscle]}40`,
                            borderRadius: 4,
                            paddingHorizontal: spacing.xs,
                            paddingVertical: 1,
                          }}
                        >
                          <Text
                            style={{
                              ...typography.label,
                              color: MUSCLE_GROUP_COLORS[muscle],
                              fontSize: 7,
                            }}
                          >
                            {MUSCLE_GROUP_LABELS[muscle]}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Info badges */}
                  <View style={{ alignItems: "flex-end", gap: spacing.xs }}>
                    <View
                      style={{
                        backgroundColor: colors.bg.primary,
                        borderWidth: 1,
                        borderColor: colors.border.subtle,
                        borderRadius: 4,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 0,
                      }}
                    >
                      <Text
                        style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}
                      >
                        {exercise.repRange[0]}-{exercise.repRange[1]} × {exercise.defaultSets}
                      </Text>
                    </View>
                    <Text
                      style={{
                        ...typography.label,
                        color: isExpanded ? colors.accent.DEFAULT : colors.text.secondary,
                        fontSize: 8,
                      }}
                    >
                      {isExpanded ? "▲ HIDE" : "▼ DETAILS"}
                    </Text>
                  </View>
                </View>

                {/* Workout badge */}
                <View style={{ flexDirection: "row", marginTop: spacing.sm, gap: spacing.xs }}>
                  <View
                    style={{
                      backgroundColor: is96Exercise ? `${colors.success}10` : colors.bg.primary,
                      borderWidth: 1,
                      borderColor: is96Exercise ? `${colors.success}40` : colors.border.subtle,
                      borderRadius: 4,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 0,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.label,
                        color: is96Exercise ? colors.success : colors.text.secondary,
                        fontSize: 7,
                      }}
                    >
                      {workoutName}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: colors.bg.primary,
                      borderWidth: 1,
                      borderColor: colors.border.subtle,
                      borderRadius: 4,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 0,
                    }}
                  >
                    <Text
                      style={{ ...typography.label, color: colors.text.secondary, fontSize: 7 }}
                    >
                      {exercise.tempo === "isometric" ? "ISOMETRIC" : `${exercise.tempo} TEMPO`}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: colors.bg.primary,
                      borderWidth: 1,
                      borderColor: colors.border.subtle,
                      borderRadius: 4,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 0,
                    }}
                  >
                    <Text
                      style={{ ...typography.label, color: colors.text.secondary, fontSize: 7 }}
                    >
                      {exercise.restInterval}s REST
                    </Text>
                  </View>
                </View>
              </View>

              {/* Expanded detail view */}
              {isExpanded && (
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: colors.border.subtle,
                    padding: spacing.md,
                    paddingLeft: spacing.lg,
                  }}
                >
                  {/* Description */}
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: colors.text.primary,
                      fontSize: 11,
                      lineHeight: 17,
                    }}
                  >
                    {exercise.description}
                  </Text>

                  {/* Biomechanical notes */}
                  {exercise.biomechanicalNotes && (
                    <View
                      style={{
                        marginTop: spacing.md,
                        backgroundColor: colors.bg.primary,
                        borderWidth: 1,
                        borderColor: colors.border.subtle,
                        borderRadius: 4,
                        padding: spacing.sm,
                      }}
                    >
                      <Text
                        style={{
                          ...typography.label,
                          color: colors.accent.DEFAULT,
                          fontSize: 8,
                          marginBottom: spacing.xs,
                        }}
                      >
                        BIOMECHANICS
                      </Text>
                      <Text
                        style={{
                          ...typography.bodySmall,
                          color: colors.text.secondary,
                          fontSize: 10,
                          lineHeight: 15,
                        }}
                      >
                        {exercise.biomechanicalNotes}
                      </Text>
                    </View>
                  )}

                  {/* Progression pathway */}
                  <View
                    style={{
                      marginTop: spacing.sm,
                      backgroundColor: colors.bg.primary,
                      borderWidth: 1,
                      borderColor: colors.border.subtle,
                      borderRadius: 4,
                      padding: spacing.sm,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.label,
                        color: colors.success,
                        fontSize: 8,
                        marginBottom: spacing.xs,
                      }}
                    >
                      SKILL PATH
                    </Text>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.primary,
                        fontSize: 10,
                        lineHeight: 15,
                      }}
                    >
                      {exercise.progressionPathway}
                    </Text>
                  </View>

                  {/* Form checkpoints */}
                  {exercise.visualGuide?.checkpoints && (
                    <View style={{ marginTop: spacing.sm }}>
                      <Text
                        style={{
                          ...typography.label,
                          color: colors.text.secondary,
                          fontSize: 8,
                          marginBottom: spacing.xs,
                        }}
                      >
                        FORM CHECKPOINTS
                      </Text>
                      {exercise.visualGuide.checkpoints.map((cp, idx) => (
                        <View
                          key={idx}
                          style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                            gap: spacing.sm,
                            marginBottom: spacing.xs,
                            backgroundColor: colors.bg.primary,
                            borderWidth: 1,
                            borderColor: colors.border.subtle,
                            borderRadius: 4,
                            padding: spacing.sm,
                          }}
                        >
                          <View
                            style={{
                              backgroundColor:
                                cp.phase === "SETUP"
                                  ? colors.accent.DEFAULT
                                  : cp.phase === "EXECUTION"
                                    ? colors.success
                                    : colors.error,
                              borderRadius: 4,
                              paddingHorizontal: spacing.xs,
                              paddingVertical: 1,
                              marginTop: 1,
                            }}
                          >
                            <Text
                              style={{
                                ...typography.label,
                                color: colors.bg.primary,
                                fontSize: 6,
                              }}
                            >
                              {cp.phase.charAt(0)}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                ...typography.bodySmall,
                                color: colors.text.primary,
                                fontSize: 10,
                                lineHeight: 14,
                              }}
                            >
                              {cp.instruction}
                            </Text>
                            <Text
                              style={{
                                ...typography.bodySmall,
                                color: colors.accent.DEFAULT,
                                fontSize: 8,
                                marginTop: 2,
                              }}
                            >
                              FOCUS: {cp.focusPoint}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Custom Preset Section */}
                  {editPresetId === exercise.id ? (
                    <View
                      style={{
                        marginTop: spacing.md,
                        backgroundColor: colors.bg.primary,
                        borderWidth: 1,
                        borderColor: `${colors.warning ?? "#F59E0B"}40`,
                        borderRadius: 4,
                        padding: spacing.md,
                      }}
                    >
                      <Text
                        style={{
                          ...typography.label,
                          color: colors.warning ?? "#F59E0B",
                          fontSize: 8,
                          marginBottom: spacing.sm,
                        }}
                      >
                        CUSTOM PRESET
                      </Text>

                      {/* Label */}
                      <TextInput
                        placeholder="Label (optional)"
                        placeholderTextColor={colors.text.tertiary}
                        value={editLabel}
                        onChangeText={setEditLabel}
                        style={{
                          backgroundColor: colors.bg.elevated,
                          borderWidth: 1,
                          borderColor: colors.border.subtle,
                          borderRadius: 4,
                          padding: spacing.sm,
                          color: colors.text.primary,
                          fontSize: 12,
                          marginBottom: spacing.sm,
                        }}
                      />

                      {/* Sets */}
                      <View
                        style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              ...typography.label,
                              color: colors.text.secondary,
                              fontSize: 7,
                              marginBottom: 0,
                            }}
                          >
                            SETS
                          </Text>
                          <TextInput
                            keyboardType="number-pad"
                            value={String(editSets)}
                            onChangeText={(v) => setEditSets(Math.max(1, Number(v) || 1))}
                            style={{
                              backgroundColor: colors.bg.elevated,
                              borderWidth: 1,
                              borderColor: colors.border.subtle,
                              borderRadius: 4,
                              padding: spacing.sm,
                              color: colors.text.primary,
                              fontSize: 14,
                              textAlign: "center",
                            }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              ...typography.label,
                              color: colors.text.secondary,
                              fontSize: 7,
                              marginBottom: 0,
                            }}
                          >
                            REPS LOW
                          </Text>
                          <TextInput
                            keyboardType="number-pad"
                            value={String(editRepLow)}
                            onChangeText={(v) => setEditRepLow(Math.max(1, Number(v) || 1))}
                            style={{
                              backgroundColor: colors.bg.elevated,
                              borderWidth: 1,
                              borderColor: colors.border.subtle,
                              borderRadius: 4,
                              padding: spacing.sm,
                              color: colors.text.primary,
                              fontSize: 14,
                              textAlign: "center",
                            }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              ...typography.label,
                              color: colors.text.secondary,
                              fontSize: 7,
                              marginBottom: 0,
                            }}
                          >
                            REPS HIGH
                          </Text>
                          <TextInput
                            keyboardType="number-pad"
                            value={String(editRepHigh)}
                            onChangeText={(v) =>
                              setEditRepHigh(
                                Math.max(
                                  Number(editRepLow) + 1,
                                  Number(v) || Number(editRepLow) + 1,
                                ),
                              )
                            }
                            style={{
                              backgroundColor: colors.bg.elevated,
                              borderWidth: 1,
                              borderColor: colors.border.subtle,
                              borderRadius: 4,
                              padding: spacing.sm,
                              color: colors.text.primary,
                              fontSize: 14,
                              textAlign: "center",
                            }}
                          />
                        </View>
                      </View>

                      {/* Rest & Tempo */}
                      <View
                        style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              ...typography.label,
                              color: colors.text.secondary,
                              fontSize: 7,
                              marginBottom: 0,
                            }}
                          >
                            REST (s)
                          </Text>
                          <TextInput
                            keyboardType="number-pad"
                            value={String(editRest)}
                            onChangeText={(v) => setEditRest(Math.max(10, Number(v) || 30))}
                            style={{
                              backgroundColor: colors.bg.elevated,
                              borderWidth: 1,
                              borderColor: colors.border.subtle,
                              borderRadius: 4,
                              padding: spacing.sm,
                              color: colors.text.primary,
                              fontSize: 14,
                              textAlign: "center",
                            }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              ...typography.label,
                              color: colors.text.secondary,
                              fontSize: 7,
                              marginBottom: 0,
                            }}
                          >
                            TEMPO
                          </Text>
                          <TextInput
                            value={editTempo}
                            onChangeText={(v) => setEditTempo(v as Tempo)}
                            placeholder="3-1-2-0"
                            placeholderTextColor={colors.text.tertiary}
                            style={{
                              backgroundColor: colors.bg.elevated,
                              borderWidth: 1,
                              borderColor: colors.border.subtle,
                              borderRadius: 4,
                              padding: spacing.sm,
                              color: colors.text.primary,
                              fontSize: 14,
                              textAlign: "center",
                            }}
                          />
                        </View>
                      </View>

                      {/* Action buttons */}
                      <View style={{ flexDirection: "row", gap: spacing.sm }}>
                        <View style={{ flex: 1 }}>
                          <TouchableOpacity
                            onPress={() => setEditPresetId(null)}
                            activeOpacity={0.7}
                            style={{
                              borderWidth: 1,
                              borderColor: colors.border.subtle,
                              borderRadius: 4,
                              padding: spacing.sm,
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                ...typography.label,
                                color: colors.text.secondary,
                                fontSize: 9,
                              }}
                            >
                              CANCEL
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                          <TouchableOpacity
                            onPress={handleSavePreset}
                            activeOpacity={0.85}
                            style={{
                              backgroundColor: colors.accent.DEFAULT,
                              borderRadius: 4,
                              padding: spacing.sm,
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{ ...typography.label, color: colors.bg.primary, fontSize: 9 }}
                            >
                              SAVE PRESET
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <>
                      {/* Preset indicator & CUSTOMIZE button */}
                      <View
                        style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}
                      >
                        {hasPreset(exercise.id) && (
                          <View
                            style={{
                              backgroundColor: `${colors.warning ?? "#F59E0B"}15`,
                              borderWidth: 1,
                              borderColor: colors.warning ?? "#F59E0B",
                              borderRadius: 4,
                              paddingHorizontal: spacing.sm,
                              paddingVertical: 0,
                            }}
                          >
                            <Text
                              style={{
                                ...typography.label,
                                color: colors.warning ?? "#F59E0B",
                                fontSize: 7,
                              }}
                            >
                              CUSTOM
                            </Text>
                          </View>
                        )}
                        <TouchableOpacity
                          onPress={() => handleOpenPresetEditor(exercise)}
                          activeOpacity={0.7}
                          style={{
                            backgroundColor: colors.bg.primary,
                            borderWidth: 1,
                            borderColor: colors.border.subtle,
                            borderRadius: 4,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: 0,
                          }}
                        >
                          <Text
                            style={{
                              ...typography.label,
                              color: colors.text.secondary,
                              fontSize: 7,
                            }}
                          >
                            {hasPreset(exercise.id) ? "EDIT" : "CUSTOMIZE"}
                          </Text>
                        </TouchableOpacity>
                        {hasPreset(exercise.id) && (
                          <TouchableOpacity
                            onPress={() => handleRemovePreset(exercise.id)}
                            activeOpacity={0.7}
                            style={{
                              borderWidth: 1,
                              borderColor: colors.error,
                              borderRadius: 4,
                              paddingHorizontal: spacing.sm,
                              paddingVertical: 0,
                            }}
                          >
                            <Text style={{ ...typography.label, color: colors.error, fontSize: 7 }}>
                              RESET
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Action: Train this workout */}
                      {workoutRouteId && (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => handleTrainWorkout(workoutRouteId)}
                          accessibilityRole="button"
                          accessibilityLabel={`Start ${workoutName}`}
                          style={{
                            marginTop: spacing.sm,
                            backgroundColor: colors.accent.DEFAULT,
                            borderRadius: 4,
                            padding: spacing.md,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              ...typography.label,
                              color: colors.bg.primary,
                              fontSize: 11,
                            }}
                          >
                            {is96Exercise ? "TRAIN PATHWAY →" : `START ${workoutName}`}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Link to Skill Tree for 96 exercises */}
                      {is96Exercise && (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => router.push("/skills/skill-tree")}
                          accessibilityRole="button"
                          accessibilityLabel="View in Skill Tree"
                          style={{
                            marginTop: spacing.xs,
                            backgroundColor: `${colors.success}12`,
                            borderWidth: 1,
                            borderColor: `${colors.success}30`,
                            borderRadius: 4,
                            padding: spacing.md,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              ...typography.label,
                              color: colors.success,
                              fontSize: 9,
                            }}
                          >
                            VIEW IN SKILL TREE ✦
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {filteredExercises.length === 0 && (
          <View
            style={{
              backgroundColor: colors.bg.elevated,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 4,
              padding: spacing.xl,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.secondary,
                fontSize: 12,
              }}
            >
              No exercises found for this muscle group.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
