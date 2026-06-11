import { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import {
  workoutA,
  workoutB,
  workoutC,
  workoutD,
  Exercise,
  MuscleGroup,
} from "../../src/data/exercises";
import { workouts } from "../../src/data/workouts";

const ALL_EXERCISES = [
  ...workoutA.exercises,
  ...workoutB.exercises,
  ...workoutC.exercises,
  ...workoutD.exercises,
];

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
};

// Map exercise IDs back to their workout for context
function findWorkoutForExercise(exerciseId: string): string {
  const workout = workouts.find((w) => w.exercises.some((e) => e.id === exerciseId));
  return workout?.name ?? "";
}

const WORKOUT_ID_MAP: Record<string, string> = {
  "WORKOUT A": "workout-a",
  "WORKOUT B": "workout-b",
  "WORKOUT C": "workout-c",
  "WORKOUT D": "workout-d",
};

export default function ExerciseCatalogScreen() {
  const colors = useColors();

  const router = useRouter();
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

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
  }, []);

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
        contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[12] }}
      >
        {/* Header */}
        <View style={{ marginBottom: spacing[4] }}>
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
                  marginBottom: spacing[1],
                }}
              >
                EXERCISE CATALOG
              </Text>
              <Text
                style={{
                  ...typography.display,
                  color: colors.text.primary,
                }}
              >
                EXERCISE LIBRARY
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
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[1],
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
              marginTop: spacing[2],
              lineHeight: 16,
            }}
          >
            Browse all {ALL_EXERCISES.length} exercises across {workouts.length} workouts. Filter by
            muscle group to find targeted movements.
          </Text>
        </View>

        {/* Muscle Group Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing[3] }}
          contentContainerStyle={{ gap: spacing[2] }}
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
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[1],
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
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[1],
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing[1],
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
            marginBottom: spacing[3],
          }}
        >
          {filteredExercises.length} EXERCISE{filteredExercises.length !== 1 ? "S" : ""}
          {selectedMuscle ? ` TARGETING ${MUSCLE_GROUP_LABELS[selectedMuscle].toUpperCase()}` : ""}
        </Text>

        {/* Exercise Cards */}
        {filteredExercises.map((exercise) => {
          const isExpanded = expandedExercise === exercise.id;
          const workoutName = findWorkoutForExercise(exercise.id);

          return (
            <TouchableOpacity
              key={exercise.id}
              activeOpacity={0.85}
              onPress={() => handleToggleExpand(exercise.id)}
              accessibilityRole="button"
              accessibilityLabel={`${exercise.name}. ${isExpanded ? 'Collapse details' : 'Expand details'}`}
              accessibilityState={{ expanded: isExpanded }}
              style={{
                backgroundColor: isExpanded ? colors.bg.highlight : colors.bg.elevated,
                borderWidth: 1,
                borderColor: isExpanded ? colors.accent.DEFAULT : colors.border.subtle,
                borderRadius: 4,
                marginBottom: spacing[2],
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
              <View style={{ padding: spacing[3], paddingLeft: spacing[4] }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flex: 1, marginRight: spacing[3] }}>
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
                        gap: spacing[1],
                        marginTop: spacing[1],
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
                            paddingHorizontal: spacing[1],
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
                  <View style={{ alignItems: "flex-end", gap: spacing[1] }}>
                    <View
                      style={{
                        backgroundColor: colors.bg.primary,
                        borderWidth: 1,
                        borderColor: colors.border.subtle,
                        borderRadius: 4,
                        paddingHorizontal: spacing[2],
                        paddingVertical: spacing[0],
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
                <View style={{ flexDirection: "row", marginTop: spacing[2], gap: spacing[1] }}>
                  <View
                    style={{
                      backgroundColor: colors.bg.primary,
                      borderWidth: 1,
                      borderColor: colors.border.subtle,
                      borderRadius: 4,
                      paddingHorizontal: spacing[2],
                      paddingVertical: spacing[0],
                    }}
                  >
                    <Text
                      style={{ ...typography.label, color: colors.text.secondary, fontSize: 7 }}
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
                      paddingHorizontal: spacing[2],
                      paddingVertical: spacing[0],
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
                      paddingHorizontal: spacing[2],
                      paddingVertical: spacing[0],
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
                    padding: spacing[3],
                    paddingLeft: spacing[4],
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
                        marginTop: spacing[3],
                        backgroundColor: colors.bg.primary,
                        borderWidth: 1,
                        borderColor: colors.border.subtle,
                        borderRadius: 4,
                        padding: spacing[2],
                      }}
                    >
                      <Text
                        style={{
                          ...typography.label,
                          color: colors.accent.DEFAULT,
                          fontSize: 8,
                          marginBottom: spacing[1],
                        }}
                      >
                        MECHANICS
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
                      marginTop: spacing[2],
                      backgroundColor: colors.bg.primary,
                      borderWidth: 1,
                      borderColor: colors.border.subtle,
                      borderRadius: 4,
                      padding: spacing[2],
                    }}
                  >
                    <Text
                      style={{
                        ...typography.label,
                        color: colors.success,
                        fontSize: 8,
                        marginBottom: spacing[1],
                      }}
                    >
                      PROGRESSION PATH
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
                    <View style={{ marginTop: spacing[2] }}>
                      <Text
                        style={{
                          ...typography.label,
                          color: colors.text.secondary,
                          fontSize: 8,
                          marginBottom: spacing[1],
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
                            gap: spacing[2],
                            marginBottom: spacing[1],
                            backgroundColor: colors.bg.primary,
                            borderWidth: 1,
                            borderColor: colors.border.subtle,
                            borderRadius: 4,
                            padding: spacing[2],
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
                              paddingHorizontal: spacing[1],
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

                  {/* Action: Train this workout */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleTrainWorkout(WORKOUT_ID_MAP[workoutName] || "workout-a")}
                    accessibilityRole="button"
                    accessibilityLabel={`Start ${workoutName}`}
                    style={{
                      marginTop: spacing[3],
                      backgroundColor: colors.accent.DEFAULT,
                      borderRadius: 4,
                      padding: spacing[3],
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
                      START {workoutName}
                    </Text>
                  </TouchableOpacity>
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
              padding: spacing[6],
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
