import { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors, typography, spacing, fonts } from "../../../src/tokens";
import { Button } from "../../../src/components/ui/Button";
import { SegmentedPanel } from "../../../src/components/ui/SegmentedPanel";
import { getWorkoutByIdForGoal } from "../../../src/data/workouts";
import { useUserStore } from "../../../src/stores/useUserStore";
import { GlossyOverlay } from "../../../src/components/ui/GlossyOverlay";
import { generateWarmUp, estimateWarmUpDuration, getWarmUpZoneSummary } from "../../../src/utils/warmup";

export default function WorkoutPreviewScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { fitnessGoal } = useUserStore();
  const workout = getWorkoutByIdForGoal(id || "", fitnessGoal);

  const estimatedDuration = useMemo(() => {
    if (!workout) return 0;
    return Math.round(
      workout.exercises.reduce((sum, ex) => {
        const avgReps = (ex.repRange[0] + ex.repRange[1]) / 2;
        const repTime = avgReps * 4; // ~4s per rep
        const setTime = repTime * ex.defaultSets;
        const restTime = ex.restInterval * (ex.defaultSets - 1);
        return sum + setTime + restTime;
      }, 0) / 60,
    );
  }, [workout]);

  const warmUp = useMemo(() => (workout ? generateWarmUp(workout) : []), [workout]);
  const warmUpDuration = useMemo(() => estimateWarmUpDuration(warmUp), [warmUp]);
  const warmUpZones = useMemo(() => getWarmUpZoneSummary(warmUp), [warmUp]);

  const targetMuscles = useMemo(() => {
    if (!workout) return [];
    const muscleSet = new Set<string>();
    for (const ex of workout.exercises) {
      for (const muscle of ex.targetMuscles) {
        muscleSet.add(muscle);
      }
    }
    return Array.from(muscleSet);
  }, [workout]);

  if (!workout) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.bg.primary,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ ...typography.h2, color: colors.text.primary }}>Workout not found</Text>
        <View style={{ marginTop: spacing[4] }}>
          <Button title="GO BACK" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

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
            WORKOUT PREVIEW
          </Text>
          <Text style={{ ...typography.display, color: colors.text.primary }}>
            {workout.name}
          </Text>
          <Text
            style={{
              ...typography.body,
              color: colors.text.secondary,
              marginTop: spacing[1],
            }}
          >
            {workout.focus}
          </Text>
        </View>

        {/* Quick Stats */}
        <SegmentedPanel title="OVERVIEW" accent="amber">
          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
                EXERCISES
              </Text>
              <Text style={{ ...typography.h3, color: colors.accent.DEFAULT }}>
                {workout.exercises.length}
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
                EST. TIME
              </Text>
              <Text style={{ ...typography.h3, color: colors.text.primary }}>
                ~{estimatedDuration} min
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
                WARM-UP
              </Text>
              <Text style={{ ...typography.h3, color: colors.warning ?? "#F59E0B" }}>
                {warmUp.length} · ~{warmUpDuration < 60 ? "<1" : Math.round(warmUpDuration / 60)} min
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
                MUSCLES
              </Text>
              <Text style={{ ...typography.h3, color: colors.text.primary }}>
                {targetMuscles.length}
              </Text>
            </View>
          </View>
        </SegmentedPanel>

        {/* Target Muscles */}
        <SegmentedPanel title="TARGET MUSCLES" accent="green" style={{ marginTop: spacing[2] }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[1] }}>
            {targetMuscles.map((muscle) => (
              <View
                key={muscle}
                style={{
                  backgroundColor: `${colors.success}15`,
                  borderWidth: 1,
                  borderColor: colors.success,
                  borderRadius: 4,
                  paddingHorizontal: spacing[2],
                  paddingVertical: spacing[0],
                }}
              >
                <Text
                  style={{
                    ...typography.bodySmall,
                    color: colors.success,
                    fontSize: 10,
                    textTransform: "capitalize",
                  }}
                >
                  {muscle.replace("_", " ")}
                </Text>
              </View>
            ))}
          </View>
        </SegmentedPanel>

        {/* Warm-Up */}
        {warmUp.length > 0 && (
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: spacing[4],
                marginBottom: spacing[3],
                gap: spacing[2],
              }}
            >
              <View
                style={{
                  backgroundColor: `${colors.warning ?? "#F59E0B"}20`,
                  borderWidth: 1,
                  borderColor: colors.warning ?? "#F59E0B",
                  borderRadius: 4,
                  paddingHorizontal: spacing[2],
                  paddingVertical: spacing[0],
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    color: colors.warning ?? "#F59E0B",
                    fontSize: 8,
                  }}
                >
                  WARM-UP
                </Text>
              </View>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.secondary,
                  fontSize: 10,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {warmUpZones.join(" · ")} · {warmUpDuration < 60
                  ? "<1 min"
                  : `~${Math.round(warmUpDuration / 60)} min`}
              </Text>
            </View>

            {warmUp.map((wu, index) => (
              <View
                key={`warmup-${wu.exercise.id}`}
                style={{
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1,
                  borderColor: `${colors.warning ?? "#F59E0B"}40`,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.warning ?? "#F59E0B",
                  borderRadius: 4,
                  padding: spacing[3],
                  marginBottom: spacing[2],
                  overflow: "hidden",
                }}
              >
                <GlossyOverlay highlightOpacity={0.08} showReflection={false} />
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: `${colors.warning ?? "#F59E0B"}40`,
                      borderRadius: 4,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: spacing[2],
                    }}
                  >
                    <Text
                      style={{
                        ...typography.label,
                        color: colors.warning ?? "#F59E0B",
                        fontSize: 10,
                      }}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...typography.h4,
                        color: colors.text.primary,
                        fontSize: 16,
                      }}
                    >
                      {wu.exercise.name}
                    </Text>

                    <View style={{ flexDirection: "row", marginTop: spacing[1], gap: spacing[2] }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ ...typography.bodySmall, color: colors.warning ?? "#F59E0B", fontSize: 10 }}>
                          {wu.sets} SETS
                        </Text>
                        <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 10, marginHorizontal: spacing[1] }}>
                          ×
                        </Text>
                        <Text style={{ ...typography.bodySmall, color: colors.text.primary, fontSize: 10 }}>
                          {wu.repRange[0]}-{wu.repRange[1]} {wu.tempo === "isometric" ? "SEC" : "REPS"}
                        </Text>
                      </View>
                      <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 10 }}>
                        {wu.restInterval}s REST
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Exercise List */}
        <Text
          style={{
            ...typography.subtitle,
            color: colors.text.secondary,
            fontSize: 11,
            marginTop: spacing[4],
            marginBottom: spacing[3],
          }}
        >
          EXERCISES
        </Text>

        {workout.exercises.map((exercise, index) => (
          <View
            key={exercise.id}
            style={{
              backgroundColor: colors.bg.elevated,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 4,
              padding: spacing[3],
              marginBottom: spacing[2],
              overflow: "hidden",
            }}
          >
            <GlossyOverlay highlightOpacity={0.08} showReflection={false} />
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              {/* Exercise Number */}
              <View
                style={{
                  width: 24,
                  height: 24,
                  backgroundColor: colors.accent.DEFAULT,
                  borderRadius: 4,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: spacing[2],
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    color: colors.bg.primary,
                    fontSize: 10,
                  }}
                >
                  {index + 1}
                </Text>
              </View>

              {/* Exercise Info */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      ...typography.h4,
                      color: colors.text.primary,
                      fontSize: 16,
                    }}
                  >
                    {exercise.name}
                  </Text>
                  {exercise.isUnilateral && (
                    <View
                      style={{
                        backgroundColor: `${colors.accent.DEFAULT}20`,
                        borderWidth: 1,
                        borderColor: colors.accent.DEFAULT,
                        borderRadius: 4,
                        paddingHorizontal: spacing[1],
                        marginLeft: spacing[2],
                      }}
                    >
                      <Text
                        style={{
                          ...typography.label,
                          color: colors.accent.DEFAULT,
                          fontSize: 7,
                        }}
                      >
                        UNILATERAL
                      </Text>
                    </View>
                  )}
                </View>

                {/* Sets × Reps */}
                <View style={{ flexDirection: "row", marginTop: spacing[1], gap: spacing[2] }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 10 }}>
                      {exercise.defaultSets} SETS
                    </Text>
                    <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 10, marginHorizontal: spacing[1] }}>
                      ×
                    </Text>
                    <Text style={{ ...typography.bodySmall, color: colors.text.primary, fontSize: 10 }}>
                      {exercise.repRange[0]}-{exercise.repRange[1]} REPS
                    </Text>
                  </View>
                  <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 10 }}>
                    {exercise.tempo === "isometric" ? "ISOMETRIC" : exercise.tempo}
                  </Text>
                  <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 10 }}>
                    {exercise.restInterval}s REST
                  </Text>
                </View>

                {/* Target Muscles */}
                <View style={{ flexDirection: "row", marginTop: spacing[1], gap: spacing[1] }}>
                  {exercise.targetMuscles.map((muscle) => (
                    <View
                      key={muscle}
                      style={{
                        backgroundColor: colors.bg.primary,
                        borderWidth: 1,
                        borderColor: colors.border.subtle,
                        borderRadius: 4,
                        paddingHorizontal: spacing[1],
                      }}
                    >
                      <Text
                        style={{
                          ...typography.bodySmall,
                          color: colors.text.secondary,
                          fontSize: 8,
                          textTransform: "capitalize",
                        }}
                      >
                        {muscle.replace("_", " ")}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Description */}
            {exercise.description && (
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.secondary,
                  fontSize: 10,
                  lineHeight: 15,
                  marginTop: spacing[2],
                }}
                numberOfLines={2}
              >
                {exercise.description}
              </Text>
            )}
          </View>
        ))}

        {/* Program Info */}
        <SegmentedPanel title="PROGRAM" accent="none" style={{ marginTop: spacing[2] }}>
          <Text
            style={{
              ...typography.bodySmall,
              color: colors.text.secondary,
              fontSize: 11,
              lineHeight: 16,
            }}
          >
            {workout.recommendedFrequency}
          </Text>
        </SegmentedPanel>
      </ScrollView>

      {/* Start Button */}
      <View
        style={{
          padding: spacing[4],
          borderTopWidth: 1,
          borderTopColor: colors.border.subtle,
          backgroundColor: colors.bg.primary,
        }}
      >
        <Button
          title="START WORKOUT"
          onPress={() => router.push(`/workout/${id}`)}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}
