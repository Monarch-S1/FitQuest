import { useEffect, useCallback, useState, useRef, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import type { Exercise } from "../../src/data/exercises";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { CompletionAnimation } from "../../src/components/workout/CompletionAnimation";
import { ExerciseDemo } from "../../src/components/workout/ExerciseDemo";
import { TempoTimer } from "../../src/components/workout/TempoTimer";
import { useVoiceCoach } from "../../src/hooks/useVoiceCoach";
import { useWorkoutStore } from "../../src/stores/useWorkoutStore";
import { useRestNotifications } from "../../src/hooks/useRestNotifications";
import { useUserStore } from "../../src/stores/useUserStore";
import { getWorkoutByIdForGoal, getWorkout96ById } from "../../src/data/workouts";
import { calculateWorkoutXp } from "../../src/utils/xp";
import { extractCompletedIds, findNewUnlocks } from "../../src/utils/skillUnlocks";
import { detectNewMastery } from "../../src/utils/doubleProgression";
import {
  generateWarmUp,
  estimateWarmUpDuration,
  getWarmUpZoneSummary,
} from "../../src/utils/warmup";
import { playLevelUpSound } from "../../src/services/levelUpSound";

/** Get today's date in local timezone as YYYY-MM-DD */
function getLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Check if an exercise is time-based (isometric holds, not rep-based) */
function isTimeBased(tempo: string): boolean {
  return tempo === "isometric";
}

export default function WorkoutPlayerScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    addWorkoutSession,
    workoutHistory,
    streakData,
    level,
    totalXp,
    fitnessGoal,
    masteredExerciseIds,
    voiceCoachEnabled,
  } = useUserStore();

  // Lookup workout — route to 96 generator for workflow-96-N IDs, or legacy A/B/C/D/class otherwise
  const workout = useMemo(() => {
    const workoutId = id || "";
    if (workoutId.startsWith("workout-96-")) {
      return getWorkout96ById(workoutId, fitnessGoal, new Set(masteredExerciseIds ?? []));
    }
    return getWorkoutByIdForGoal(workoutId, fitnessGoal);
  }, [id, fitnessGoal, masteredExerciseIds]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedWorkout = useRef(false);
  const prevPhaseRef = useRef<string | null>(null);

  // ── Preview / Active state ──
  const [hasStarted, setHasStarted] = useState(false);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  // Reset any stale workout store state on mount so a previous completed
  // workout doesn't auto-trigger handleCompleteWorkout in the preview.
  useEffect(() => {
    resetWorkoutStore();
  }, []);

  const {
    phase,
    currentExerciseIndex,
    currentExercise,
    exerciseProgress,
    restTimer,
    totalDuration,
    currentRepInput,
    startWorkout,
    completeSet,
    setCurrentRepInput,
    navigateToExercise,
    completeWorkout: finishWorkout,
    reset: resetWorkoutStore,
  } = useWorkoutStore();

  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [xpBreakdown, setXpBreakdown] = useState(calculateWorkoutXp(0, 0));
  const [newSkillUnlocks, setNewSkillUnlocks] = useState<
    import("../../src/utils/skillUnlocks").NewSkillUnlock[]
  >([]);
  const [newClassUnlocks, setNewClassUnlocks] = useState<
    import("../../src/utils/skillUnlocks").NewClassUnlock[]
  >([]);

  // Warm-up generation
  const warmUpRef = useRef<import("../../src/utils/warmup").WarmUpExercise[]>([]);
  const warmUpCountRef = useRef(0);
  const preWorkoutLevelRef = useRef(1);
  const preWorkoutCompletedRef = useRef<Set<string>>(new Set());

  // Time-based hold state
  const [isHolding, setIsHolding] = useState(false);
  const [holdElapsed, setHoldElapsed] = useState(0);
  const [holdCompleted, setHoldCompleted] = useState(false);
  const holdCompletedRef = useRef(false);

  useEffect(() => {
    holdCompletedRef.current = holdCompleted;
  }, [holdCompleted]);

  useEffect(() => {
    if (currentExercise) {
      setIsHolding(false);
      setHoldElapsed(0);
      setHoldCompleted(false);
      holdCompletedRef.current = false;
    }
  }, [currentExerciseIndex, currentExercise]);

  // ── Preview computed data ──
  const estimatedDuration = useMemo(() => {
    if (!workout) return 0;
    return Math.round(
      workout.exercises.reduce((sum, ex) => {
        const avgReps = (ex.repRange[0] + ex.repRange[1]) / 2;
        const repTime = avgReps * 4;
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

  // ── Start workout handler ──
  const handleStartWorkout = useCallback(() => {
    if (!workout) return;
    resetWorkoutStore();

    const warmUps = generateWarmUp(workout);
    warmUpRef.current = warmUps;
    warmUpCountRef.current = warmUps.length;
    const warmUpExercises: import("../../src/data/exercises").Exercise[] = warmUps.map((wu) => ({
      ...wu.exercise,
      defaultSets: wu.sets,
      repRange: wu.repRange,
      tempo: wu.tempo,
      restInterval: wu.restInterval,
      biomechanicalNotes:
        "WARM-UP: " + (wu.exercise.biomechanicalNotes || "Prepare target muscles."),
    }));

    const allExercises = [...warmUpExercises, ...workout.exercises];
    startWorkout(allExercises);
    setHasStarted(true);
  }, [workout, resetWorkoutStore, startWorkout]);

  // Timer interval
  useEffect(() => {
    if (phase === "exercise" || phase === "rest") {
      intervalRef.current = setInterval(() => {
        useWorkoutStore.getState().tickTimer();
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase]);

  // Hold timer
  const holdElapsedRef = useRef(0);
  useEffect(() => {
    if (isHolding) {
      holdElapsedRef.current = 0;
      holdIntervalRef.current = setInterval(() => {
        holdElapsedRef.current += 1;
        setHoldElapsed(holdElapsedRef.current);
      }, 1000);
    }
    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
      }
    };
  }, [isHolding]);

  useEffect(() => {
    if (prevPhaseRef.current === "rest" && phase === "exercise" && holdCompletedRef.current) {
      setHoldCompleted(false);
      holdCompletedRef.current = false;
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  // Voice Coach
  useVoiceCoach({ enabled: voiceCoachEnabled });
  useRestNotifications();

  const completingRef = useRef(false);

  const handleCompleteWorkout = useCallback(() => {
    if (completingRef.current) return;
    completingRef.current = true;
    try {
      const userStore = useUserStore.getState();
      preWorkoutLevelRef.current = userStore.level;
      preWorkoutCompletedRef.current = extractCompletedIds(userStore.workoutHistory);
      const result = finishWorkout();
      const streak = userStore.streakData.currentStreak;
      const freshProgress = useWorkoutStore.getState().exerciseProgress;
      const allComplete = freshProgress.every((ep) => ep.isComplete);
      const xp = calculateWorkoutXp(result.totalSets, streak, allComplete);
      setXpBreakdown(xp);
      const session = {
        id: `session-${Date.now()}`,
        workoutId: id || "unknown",
        date: getLocalDate(),
        duration: result.totalDuration,
        setsCompleted: result.totalSets,
        xpEarned: xp.total,
        exercises: freshProgress.map((ep: any) => ({
          exerciseId: ep.exerciseId,
          sets: ep.currentSet,
          repsCompleted: ep.repsCompleted,
        })),
      };
      addWorkoutSession(session);
      const freshState = useUserStore.getState();
      const newMasteryIds = detectNewMastery(freshState.workoutHistory, session);
      if (newMasteryIds.length > 0) freshState.markMastered(newMasteryIds);
      const postMarkState = useUserStore.getState();
      const newCompleted = extractCompletedIds(postMarkState.workoutHistory);
      const preMastered = new Set(userStore.masteredExerciseIds ?? []);
      const postMastered = new Set(postMarkState.masteredExerciseIds ?? []);
      const unlocks = findNewUnlocks(
        preWorkoutCompletedRef.current,
        newCompleted,
        preMastered,
        postMastered,
      );
      if (unlocks.skillUnlocks.length > 0 || unlocks.classUnlocks.length > 0) {
        setNewSkillUnlocks(unlocks.skillUnlocks);
        setNewClassUnlocks(unlocks.classUnlocks);
        playLevelUpSound();
      }
      setWorkoutComplete(true);
    } finally {
      completingRef.current = false;
    }
  }, [finishWorkout, id, addWorkoutSession]);

  useEffect(() => {
    // Only auto-complete during an active workout, not on mount/preview
    if (hasStarted && phase === "completed" && !workoutComplete) {
      handleCompleteWorkout();
    }
  }, [hasStarted, phase, workoutComplete, handleCompleteWorkout]);

  const handleCompleteSet = useCallback(() => {
    const store = useWorkoutStore.getState();
    const currentEx = store.currentExercise;
    if (!currentEx) return;
    const currentProgress = store.exerciseProgress[store.currentExerciseIndex];
    const isLastSet = currentProgress
      ? currentProgress.currentSet + 1 >= currentProgress.totalSets
      : false;
    completeSet(currentRepInput);
    if (!isLastSet) useWorkoutStore.getState().startRest();
  }, [currentRepInput, completeSet]);

  const handleStartHold = useCallback(() => {
    setIsHolding(true);
    setHoldElapsed(0);
    setHoldCompleted(false);
    holdCompletedRef.current = false;
  }, []);
  const handleCompleteHold = useCallback(() => {
    setIsHolding(false);
    setHoldCompleted(true);
    holdCompletedRef.current = true;
    const store = useWorkoutStore.getState();
    const currentEx = store.currentExercise;
    if (!currentEx) return;
    const secondsHeld = holdElapsedRef.current;
    const currentProgress = store.exerciseProgress[store.currentExerciseIndex];
    const isLastSet = currentProgress
      ? currentProgress.currentSet + 1 >= currentProgress.totalSets
      : false;
    completeSet(secondsHeld);
    if (!isLastSet) useWorkoutStore.getState().startRest();
  }, [completeSet]);

  const handleContinue = useCallback(() => {
    router.back();
  }, [router]);

  const totalExercises = exerciseProgress.length;
  const isFirstExercise = currentExerciseIndex === 0;
  const isLastExercise = currentExerciseIndex >= totalExercises - 1;

  const handlePrevExercise = useCallback(() => {
    if (!isFirstExercise) navigateToExercise(currentExerciseIndex - 1);
  }, [isFirstExercise, currentExerciseIndex, navigateToExercise]);
  const handleNextExercise = useCallback(() => {
    if (!isLastExercise) navigateToExercise(currentExerciseIndex + 1);
  }, [isLastExercise, currentExerciseIndex, navigateToExercise]);

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
        <View style={{ marginTop: spacing.lg }}>
          <Button title="GO BACK" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  // ── COMPLETION SCREEN ──
  if (workoutComplete) {
    const freshUserState = useUserStore.getState();
    return (
      <CompletionAnimation
        xpBreakdown={xpBreakdown}
        level={preWorkoutLevelRef.current}
        newLevel={freshUserState.level}
        duration={totalDuration}
        workoutName={workout.name}
        onContinue={handleContinue}
        achievementContext={{
          totalWorkouts: workoutHistory.length,
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          level: freshUserState.level,
          totalXp,
          lastWorkoutXp: xpBreakdown.total,
          lastWorkoutDuration: totalDuration,
          lastWorkoutAllComplete: exerciseProgress.every((ep) => ep.isComplete),
        }}
        newSkillUnlocks={newSkillUnlocks}
        newClassUnlocks={newClassUnlocks}
      />
    );
  }

  // ── PREVIEW MODE (before workout starts) ──
  if (!hasStarted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
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
              WORKOUT PREVIEW
            </Text>
            <Text style={{ ...typography.display, color: colors.text.primary }}>
              {workout.name}
            </Text>
            <Text
              style={{ ...typography.body, color: colors.text.secondary, marginTop: spacing.xs }}
            >
              {workout.focus}
            </Text>
          </View>

          {/* Quick Stats */}
          <Card title="OVERVIEW" accent="amber">
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
                <Text style={{ ...typography.h3, color: "#F59E0B" }}>
                  {warmUp.length} · ~{warmUpDuration < 60 ? "<1" : Math.round(warmUpDuration / 60)}{" "}
                  min
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
          </Card>

          {/* Target Muscles */}
          <Card title="TARGET MUSCLES" accent="green" style={{ marginTop: spacing.sm }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {targetMuscles.map((muscle) => (
                <View
                  key={muscle}
                  style={{
                    backgroundColor: `${colors.success}15`,
                    borderWidth: 1,
                    borderColor: colors.success,
                    borderRadius: 4,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 0,
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
          </Card>

          {/* Warm-Up List */}
          {warmUp.length > 0 && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: spacing.lg,
                  marginBottom: spacing.sm,
                  gap: spacing.sm,
                }}
              >
                <View
                  style={{
                    backgroundColor: `${"#F59E0B"}20`,
                    borderWidth: 1,
                    borderColor: "#F59E0B",
                    borderRadius: 4,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 0,
                  }}
                >
                  <Text style={{ ...typography.label, color: "#F59E0B", fontSize: 8 }}>
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
                  {warmUpZones.join(" · ")} ·{" "}
                  {warmUpDuration < 60 ? "<1 min" : `~${Math.round(warmUpDuration / 60)} min`}
                </Text>
              </View>
              {warmUp.map((wu, index) => (
                <View
                  key={`wu-${wu.exercise.id}`}
                  style={{
                    backgroundColor: colors.bg.elevated,
                    borderWidth: 1,
                    borderColor: `${"#F59E0B"}40`,
                    borderLeftWidth: 3,
                    borderLeftColor: "#F59E0B",
                    borderRadius: 4,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        backgroundColor: `${"#F59E0B"}40`,
                        borderRadius: 4,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: spacing.sm,
                      }}
                    >
                      <Text style={{ ...typography.label, color: "#F59E0B", fontSize: 10 }}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...typography.h4, color: colors.text.primary, fontSize: 16 }}>
                        {wu.exercise.name}
                      </Text>
                      <View
                        style={{ flexDirection: "row", marginTop: spacing.xs, gap: spacing.sm }}
                      >
                        <Text style={{ ...typography.bodySmall, color: "#F59E0B", fontSize: 10 }}>
                          {wu.sets} SETS
                        </Text>
                        <Text
                          style={{
                            ...typography.bodySmall,
                            color: colors.text.secondary,
                            fontSize: 10,
                          }}
                        >
                          ×
                        </Text>
                        <Text
                          style={{
                            ...typography.bodySmall,
                            color: colors.text.primary,
                            fontSize: 10,
                          }}
                        >
                          {wu.repRange[0]}-{wu.repRange[1]}{" "}
                          {wu.tempo === "isometric" ? "SEC" : "REPS"}
                        </Text>
                        <Text
                          style={{
                            ...typography.bodySmall,
                            color: colors.text.secondary,
                            fontSize: 10,
                          }}
                        >
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
              marginTop: spacing.lg,
              marginBottom: spacing.sm,
            }}
          >
            EXERCISES
          </Text>
          {workout.exercises.map((exercise, index) => (
            <TouchableOpacity
              key={exercise.id}
              onPress={() => setPreviewExercise(exercise)}
              activeOpacity={0.8}
              style={{
                backgroundColor: colors.bg.elevated,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                borderRadius: 4,
                padding: spacing.md,
                marginBottom: spacing.sm,
              }}
              accessibilityRole="button"
              accessibilityLabel={`Preview ${exercise.name}`}
              accessibilityHint="Tap to see exercise details"
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    backgroundColor: colors.accent.DEFAULT,
                    borderRadius: 4,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: spacing.sm,
                  }}
                >
                  <Text style={{ ...typography.label, color: colors.bg.primary, fontSize: 10 }}>
                    {index + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.h4, color: colors.text.primary, fontSize: 16 }}>
                    {exercise.name}
                  </Text>
                  <View style={{ flexDirection: "row", marginTop: spacing.xs, gap: spacing.sm }}>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.secondary,
                        fontSize: 10,
                      }}
                    >
                      {exercise.defaultSets} SETS × {exercise.repRange[0]}-{exercise.repRange[1]}{" "}
                      REPS
                    </Text>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.secondary,
                        fontSize: 10,
                      }}
                    >
                      {exercise.tempo === "isometric" ? "ISOMETRIC" : exercise.tempo}
                    </Text>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.secondary,
                        fontSize: 10,
                      }}
                    >
                      {exercise.restInterval}s REST
                    </Text>
                  </View>
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: colors.accent.DEFAULT,
                      fontSize: 8,
                      marginTop: spacing.xs,
                    }}
                  >
                    TAP TO PREVIEW →
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Exercise Detail Preview Modal */}
        <Modal
          visible={!!previewExercise}
          animationType="slide"
          transparent
          onRequestClose={() => setPreviewExercise(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: colors.bg.primary,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                maxHeight: "85%",
                padding: spacing.lg,
                paddingBottom: spacing.xxl,
              }}
            >
              {previewExercise && (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: spacing.md,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.h3,
                        color: colors.text.primary,
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {previewExercise.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setPreviewExercise(null)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.bg.elevated,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Close preview"
                    >
                      <Text style={{ color: colors.text.secondary, fontSize: 16 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: spacing.lg }}
                    nestedScrollEnabled
                  >
                    <ExerciseDemo exercise={previewExercise} />
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Start Button */}
        <View
          style={{
            padding: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.border.subtle,
            backgroundColor: colors.bg.primary,
          }}
        >
          <Button title="START WORKOUT" onPress={handleStartWorkout} fullWidth size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  // ── ACTIVE WORKOUT MODE ──
  const currentProgress = exerciseProgress[currentExerciseIndex];
  const exercise = useWorkoutStore.getState().currentExercise;
  const timeBased = exercise ? isTimeBased(exercise.tempo) : false;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      {/* Top bar */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
          <Button title="EXIT" onPress={() => router.back()} variant="ghost" size="sm" />
        </View>
        <Text
          style={{
            ...typography.label,
            color: colors.accent.DEFAULT,
            fontSize: 9,
            flex: 1,
            textAlign: "center",
          }}
        >
          QUEST: {workout.name}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            flex: 1,
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.bg.elevated,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 4,
              paddingHorizontal: spacing.sm,
              paddingVertical: 0,
            }}
          >
            <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 9 }}>
              {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, "0")}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          paddingBottom: spacing.xxl,
        }}
      >
        {/* Exercise name + workout step */}
        {exercise && currentProgress && (
          <View style={{ marginBottom: spacing.sm }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: spacing.xs,
              }}
            >
              <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
                {currentExerciseIndex < warmUpCountRef.current
                  ? `WARM-UP ${currentExerciseIndex + 1} OF ${warmUpCountRef.current}`
                  : `EXERCISE ${currentExerciseIndex + 1 - warmUpCountRef.current} OF ${exerciseProgress.length - warmUpCountRef.current}`}
              </Text>
              <Text style={{ ...typography.label, color: colors.accent.DEFAULT, fontSize: 8 }}>
                {!timeBased
                  ? `${exercise.repRange[0]}-${exercise.repRange[1]} reps · ${exercise.restInterval}s rest`
                  : `${exercise.repRange[0]}-${exercise.repRange[1]}s hold`}
              </Text>
            </View>
            <Text
              style={{
                ...typography.display,
                color: colors.text.primary,
                fontSize: 26,
                letterSpacing: 0.5,
              }}
              numberOfLines={1}
            >
              {exercise.name}
            </Text>
            {/* Muscle tags */}
            <View style={{ flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs }}>
              {exercise.targetMuscles.slice(0, 4).map((muscle) => (
                <View
                  key={muscle}
                  style={{
                    backgroundColor: colors.bg.highlight,
                    borderWidth: 1,
                    borderColor: colors.border.subtle,
                    borderRadius: 4,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 0,
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
                    {muscle.replaceAll("_", " ")}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Exercise demo (video-first with tab switcher) */}
        {exercise && <ExerciseDemo exercise={exercise} />}

        {/* Set progress dots */}
        {currentProgress && (
          <View style={{ marginBottom: spacing.md }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: spacing.xs,
              }}
            >
              <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
                SET {currentProgress.currentSet + 1} OF {currentProgress.totalSets}
              </Text>
              {currentProgress.isComplete && (
                <Text style={{ ...typography.label, color: colors.success, fontSize: 8 }}>
                  COMPLETE ✓
                </Text>
              )}
            </View>
            <View style={{ flexDirection: "row", gap: spacing.xs }}>
              {Array.from({ length: currentProgress.totalSets }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    backgroundColor:
                      i < currentProgress.currentSet
                        ? colors.success
                        : i === currentProgress.currentSet
                          ? colors.accent.DEFAULT
                          : colors.bg.highlight,
                    borderRadius: 2,
                  }}
                />
              ))}
            </View>
            {/* Unilateral indicator */}
            {currentProgress.isUnilateral && (
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
                <View
                  style={{
                    flex: 1,
                    height: 24,
                    backgroundColor:
                      currentProgress.currentSide === "left"
                        ? `${colors.accent.DEFAULT}20`
                        : colors.bg.elevated,
                    borderWidth: 1.5,
                    borderColor:
                      currentProgress.currentSide === "left"
                        ? colors.accent.DEFAULT
                        : colors.border.subtle,
                    borderRadius: 4,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      ...typography.label,
                      color:
                        currentProgress.currentSide === "left"
                          ? colors.accent.DEFAULT
                          : colors.text.secondary,
                      fontSize: 8,
                    }}
                  >
                    ← LEFT
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    height: 24,
                    backgroundColor:
                      currentProgress.currentSide === "right"
                        ? `${colors.accent.DEFAULT}20`
                        : colors.bg.elevated,
                    borderWidth: 1.5,
                    borderColor:
                      currentProgress.currentSide === "right"
                        ? colors.accent.DEFAULT
                        : colors.border.subtle,
                    borderRadius: 4,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      ...typography.label,
                      color:
                        currentProgress.currentSide === "right"
                          ? colors.accent.DEFAULT
                          : colors.text.secondary,
                      fontSize: 8,
                    }}
                  >
                    RIGHT →
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Rep counter / Hold timer display */}
        <View style={{ marginBottom: spacing.sm }}>
          {timeBased ? (
            /* Isometric hold timer display */
            <View style={{ alignItems: "center", marginBottom: spacing.md }}>
              <View
                style={{
                  width: 96,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isHolding ? `${colors.success}15` : colors.bg.elevated,
                  borderWidth: 1.5,
                  borderColor: isHolding ? colors.success : colors.accent.DEFAULT,
                  borderRadius: 4,
                  paddingVertical: spacing.md,
                }}
              >
                <Text
                  style={{
                    ...typography.h1,
                    color: isHolding ? colors.success : colors.accent.DEFAULT,
                    fontSize: 40,
                    fontVariant: ["tabular-nums"] as any,
                  }}
                >
                  {holdElapsed}
                </Text>
                <Text
                  style={{
                    ...typography.label,
                    color: isHolding ? colors.success : colors.text.secondary,
                    fontSize: 8,
                  }}
                >
                  SECONDS
                </Text>
              </View>
            </View>
          ) : (
            /* Rep counter display */
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.lg,
                marginBottom: spacing.sm,
              }}
            >
              <TouchableOpacity
                onPress={() => setCurrentRepInput(currentRepInput - 1)}
                activeOpacity={0.7}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{
                    color: colors.text.secondary,
                    fontSize: 22,
                    fontFamily: "Inter-Regular",
                  }}
                >
                  −
                </Text>
              </TouchableOpacity>
              <View
                style={{
                  width: 96,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1.5,
                  borderColor: colors.accent.DEFAULT,
                  borderRadius: 4,
                  paddingVertical: spacing.md,
                }}
              >
                <Text
                  style={{
                    ...typography.h1,
                    color: colors.accent.DEFAULT,
                    fontSize: 40,
                    fontVariant: ["tabular-nums"] as any,
                  }}
                >
                  {currentRepInput}
                </Text>
                <Text
                  style={{
                    ...typography.label,
                    color: colors.text.secondary,
                    fontSize: 8,
                  }}
                >
                  REPS
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCurrentRepInput(currentRepInput + 1)}
                activeOpacity={0.7}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{
                    color: colors.text.secondary,
                    fontSize: 22,
                    fontFamily: "Inter-Regular",
                  }}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tempo timer */}
        {exercise && exercise.tempo !== "isometric" && (
          <View style={{ marginBottom: spacing.md }}>
            <TempoTimer tempo={exercise.tempo} isActive={phase === "exercise"} />
          </View>
        )}

        {/* Rest timer */}
        {phase === "rest" && (
          <View
            style={{
              backgroundColor: colors.bg.elevated,
              borderWidth: 1,
              borderColor: colors.success,
              borderRadius: 4,
              padding: spacing.lg,
              alignItems: "center",
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={{
                ...typography.label,
                color: colors.success,
                fontSize: 9,
                marginBottom: spacing.xs,
              }}
            >
              REST
            </Text>
            <Text
              style={{
                ...typography.h1,
                color: colors.success,
                fontSize: 48,
              }}
            >
              {restTimer}
            </Text>
            <Text
              style={{
                ...typography.label,
                color: colors.success,
                fontSize: 9,
              }}
            >
              SECONDS
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom action bar */}
      <View
        style={{
          padding: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border.subtle,
          backgroundColor: colors.bg.primary,
          gap: spacing.sm,
        }}
      >
        {phase === "rest" ? (
          <Button
            title="SKIP REST"
            onPress={() => useWorkoutStore.setState({ phase: "exercise", restTimer: 0 })}
            variant="secondary"
            fullWidth
          />
        ) : phase === "exercise" ? (
          timeBased ? (
            /* Hold action buttons */
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {!isHolding && !holdCompleted && (
                <Button title="START HOLD" onPress={handleStartHold} fullWidth />
              )}
              {isHolding && <Button title="COMPLETE HOLD" onPress={handleCompleteHold} fullWidth />}
              {holdCompleted && !currentProgress?.isComplete && (
                <Button
                  title="NEXT SET"
                  onPress={() => {
                    const store = useWorkoutStore.getState();
                    if (store.phase !== "rest") store.startRest();
                    else {
                      setHoldCompleted(false);
                      holdCompletedRef.current = false;
                    }
                  }}
                  variant="secondary"
                  fullWidth
                />
              )}
            </View>
          ) : (
            /* Rep-based action buttons */
            <>
              {exerciseProgress.length > 1 && (
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Button
                    title="← PREV"
                    onPress={handlePrevExercise}
                    variant="ghost"
                    size="sm"
                    disabled={isFirstExercise}
                  />
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text
                      style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}
                    >
                      {currentExerciseIndex + 1} / {totalExercises}
                    </Text>
                  </View>
                  <Button
                    title="NEXT →"
                    onPress={handleNextExercise}
                    variant="ghost"
                    size="sm"
                    disabled={isLastExercise}
                  />
                </View>
              )}
              <Button
                title={
                  currentProgress?.isUnilateral
                    ? currentProgress.currentSide === "left"
                      ? "COMPLETE LEFT SIDE"
                      : "COMPLETE RIGHT SIDE"
                    : currentProgress && currentProgress.currentSet >= currentProgress.totalSets - 1
                      ? "COMPLETE EXERCISE"
                      : "COMPLETE SET"
                }
                onPress={handleCompleteSet}
                fullWidth
              />
            </>
          )
        ) : null}
        {phase === "exercise" && (
          <Button
            title="COMPLETE QUEST"
            onPress={handleCompleteWorkout}
            variant="secondary"
            fullWidth
          />
        )}
      </View>
    </SafeAreaView>
  );
}
