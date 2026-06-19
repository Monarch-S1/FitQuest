import { useEffect, useCallback, useState, useRef } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors, typography, spacing } from "../../src/tokens";
import { Button } from "../../src/components/ui/Button";
import { HUDModule } from "../../src/components/ui/HUDModule";
import { CompletionAnimation } from "../../src/components/workout/CompletionAnimation";
import { ExerciseDemo } from "../../src/components/workout/ExerciseDemo";
import { TempoTimer } from "../../src/components/workout/TempoTimer";
import { useVoiceCoach } from "../../src/hooks/useVoiceCoach";
import { useWorkoutStore } from "../../src/stores/useWorkoutStore";
import { useRestNotifications } from "../../src/hooks/useRestNotifications";
import { useUserStore } from "../../src/stores/useUserStore";
import { getWorkoutByIdForGoal } from "../../src/data/workouts";
import { calculateWorkoutXp } from "../../src/utils/xp";
import { extractCompletedIds, findNewUnlocks } from "../../src/utils/skillUnlocks";
import { playLevelUpSound } from "../../src/services/levelUpSound";
import { GlossyOverlay } from "../../src/components/ui/GlossyOverlay";

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
  const { addWorkoutSession, workoutHistory, streakData, level, totalXp, fitnessGoal } = useUserStore();
  const workout = getWorkoutByIdForGoal(id || "", fitnessGoal);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedWorkout = useRef(false);
  const prevPhaseRef = useRef<string | null>(null);

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
  } = useWorkoutStore();

  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [xpBreakdown, setXpBreakdown] = useState(calculateWorkoutXp(0, 0));
  const [newSkillUnlocks, setNewSkillUnlocks] = useState<
    import("../../src/utils/skillUnlocks").NewSkillUnlock[]
  >([]);

  // Rep counter state — user enters actual reps per set
  const preWorkoutLevelRef = useRef(1);

  // Capture the exercise IDs that were completed BEFORE this workout,
  // so we can diff against the post-workout state to find new unlocks.
  const preWorkoutCompletedRef = useRef<Set<string>>(new Set());

  // Time-based hold state — use refs to avoid effect dependency loops
  const [isHolding, setIsHolding] = useState(false);
  const [holdElapsed, setHoldElapsed] = useState(0);
  const [holdCompleted, setHoldCompleted] = useState(false);
  const holdCompletedRef = useRef(false);

  // Keep ref in sync with state for reference in effects
  useEffect(() => {
    holdCompletedRef.current = holdCompleted;
  }, [holdCompleted]);

  // Reset hold input when exercise changes
  useEffect(() => {
    if (currentExercise) {
      setIsHolding(false);
      setHoldElapsed(0);
      setHoldCompleted(false);
      holdCompletedRef.current = false;
    }
  }, [currentExerciseIndex, currentExercise]);

  // Start the workout when the screen loads — resets store FIRST (not in cleanup)
  useEffect(() => {
    if (workout && !hasStartedWorkout.current) {
      hasStartedWorkout.current = true;
      // Reset any stale workout state from a previous session
      useWorkoutStore.getState().reset();
      startWorkout(workout.exercises);
    }
  }, [workout, startWorkout]);

  // Timer interval — stable effect, only depends on phase
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

  // Hold timer interval — uses ref to avoid re-creating callback every second
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

  // Reset hold state when transitioning from rest → exercise — uses ref to break deps cycle
  useEffect(() => {
    if (prevPhaseRef.current === "rest" && phase === "exercise" && holdCompletedRef.current) {
      setHoldCompleted(false);
      holdCompletedRef.current = false;
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  // ── Voice Coach ──
  const isVoiceEnabled = useRef(true);
  useVoiceCoach({ enabled: true });

  // ── Rest Timer Notifications ──
  useRestNotifications();

  // Guard ref to prevent handleCompleteWorkout from firing twice
  const completingRef = useRef(false);

  // Stable callback for completing the workout — reads fresh state via getState()
  const handleCompleteWorkout = useCallback(() => {
    // Guard: prevent re-entry from the useEffect watching phase
    if (completingRef.current) return;
    completingRef.current = true;

    try {
      const userStore = useUserStore.getState();

      // Capture level and completed exercises BEFORE calling addWorkoutSession
      preWorkoutLevelRef.current = userStore.level;
      preWorkoutCompletedRef.current = extractCompletedIds(userStore.workoutHistory);

      const result = finishWorkout();
      const streak = userStore.streakData.currentStreak;
      // Read fresh exercise progress from the store (result already computed)
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
        exercises: freshProgress.map((ep) => ({
          exerciseId: ep.exerciseId,
          sets: ep.currentSet,
          repsCompleted: ep.repsCompleted,
        })),
      };

      addWorkoutSession(session);

      // Compute newly unlocked skill tree exercises by diffing pre vs post
      const freshState = useUserStore.getState();
      const newCompleted = extractCompletedIds(freshState.workoutHistory);
      const unlocks = findNewUnlocks(preWorkoutCompletedRef.current, newCompleted);
      if (unlocks.length > 0) {
        setNewSkillUnlocks(unlocks);
        // Play unlock sound for the first unlock
        if (unlocks.length >= 1) {
          playLevelUpSound();
        }
      }

      setWorkoutComplete(true);
    } finally {
      completingRef.current = false;
    }
  }, [finishWorkout, id, addWorkoutSession]);

  // Watch for phase === "completed"
  useEffect(() => {
    if (phase === "completed" && !workoutComplete) {
      handleCompleteWorkout();
    }
  }, [phase, workoutComplete, handleCompleteWorkout]);

  // Handle completing a rep-based set
  const handleCompleteSet = useCallback(() => {
    const store = useWorkoutStore.getState();
    const currentEx = store.currentExercise;
    if (!currentEx) return;

    const currentProgress = store.exerciseProgress[store.currentExerciseIndex];
    const isLastSet = currentProgress
      ? currentProgress.currentSet + 1 >= currentProgress.totalSets
      : false;

    completeSet(currentRepInput);

    if (!isLastSet) {
      useWorkoutStore.getState().startRest();
    }
  }, [currentRepInput, completeSet]);

  // Handle starting a hold (time-based exercise)
  const handleStartHold = useCallback(() => {
    setIsHolding(true);
    setHoldElapsed(0);
    setHoldCompleted(false);
    holdCompletedRef.current = false;
  }, []);

  // Handle completing a hold (time-based exercise)
  const handleCompleteHold = useCallback(() => {
    setIsHolding(false);
    setHoldCompleted(true);
    holdCompletedRef.current = true;

    const store = useWorkoutStore.getState();
    const currentEx = store.currentExercise;
    if (!currentEx) return;

    // Read the latest hold duration from the ref (avoids stale closure over holdElapsed state)
    const secondsHeld = holdElapsedRef.current;
    const currentProgress = store.exerciseProgress[store.currentExerciseIndex];
    const isLastSet = currentProgress
      ? currentProgress.currentSet + 1 >= currentProgress.totalSets
      : false;

    completeSet(secondsHeld);

    if (!isLastSet) {
      useWorkoutStore.getState().startRest();
    }
  }, [completeSet]);

  const handleContinue = useCallback(() => {
    router.back();
  }, [router]);

  const totalExercises = exerciseProgress.length;
  const isFirstExercise = currentExerciseIndex === 0;
  const isLastExercise = currentExerciseIndex >= totalExercises - 1;

  const handlePrevExercise = useCallback(() => {
    if (!isFirstExercise) {
      navigateToExercise(currentExerciseIndex - 1);
    }
  }, [isFirstExercise, currentExerciseIndex, navigateToExercise]);

  const handleNextExercise = useCallback(() => {
    if (!isLastExercise) {
      navigateToExercise(currentExerciseIndex + 1);
    }
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
        <View style={{ marginTop: spacing[4] }}>
          <Button title="GO BACK" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  // Completion screen
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
      />
    );
  }

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
          padding: spacing[3],
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2], flex: 1 }}>
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
        >            QUEST: {workout.name}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[2],
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
              paddingHorizontal: spacing[2],
              paddingVertical: spacing[0],
              overflow: "hidden",
            }}
          >
            <GlossyOverlay highlightOpacity={0.1} showReflection={false} />
            <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 9 }}>
              {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, "0")}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[12] }}>
        {/* Exercise header */}
        <HUDModule
          label={`EXERCISE ${currentExerciseIndex + 1} OF ${exerciseProgress.length}`}
          accent="amber"
          style={{ marginBottom: spacing[4] }}
        >
          {exercise && currentProgress && (
            <>
              <Text style={{ ...typography.h2, color: colors.text.primary, fontSize: 24 }}>
                {exercise.name}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  gap: spacing[1],
                  marginTop: spacing[2],
                }}
              >
                {exercise.targetMuscles.map((muscle) => (
                  <View
                    key={muscle}
                    style={{
                      backgroundColor: colors.bg.highlight,
                      borderWidth: 1,
                      borderColor: colors.border.subtle,
                      borderRadius: 4,
                      paddingHorizontal: spacing[2],
                      paddingVertical: spacing[0],
                    }}
                  >
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.secondary,
                        fontSize: 9,
                        textTransform: "capitalize",
                      }}
                    >
                      {muscle.replaceAll("_", " ")}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </HUDModule>

        {/* Unilateral side indicator */}
        {currentProgress?.isUnilateral && (
          <View style={{ flexDirection: "row", gap: spacing[2], marginBottom: spacing[2] }}>
            <View
              style={{
                flex: 1,
                height: 32,
                backgroundColor:
                  currentProgress.currentSide === "left" ? `${colors.accent.DEFAULT}20` : colors.bg.elevated,
                borderWidth: 1.5,
                borderColor:
                  currentProgress.currentSide === "left" ? colors.accent.DEFAULT : colors.border.subtle,
                borderRadius: 4,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: currentProgress.currentSide === "left" ? colors.accent.DEFAULT : colors.text.secondary,
                  fontSize: 9,
                }}
              >
                ← LEFT
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                height: 32,
                backgroundColor:
                  currentProgress.currentSide === "right" ? `${colors.accent.DEFAULT}20` : colors.bg.elevated,
                borderWidth: 1.5,
                borderColor:
                  currentProgress.currentSide === "right" ? colors.accent.DEFAULT : colors.border.subtle,
                borderRadius: 4,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: currentProgress.currentSide === "right" ? colors.accent.DEFAULT : colors.text.secondary,
                  fontSize: 9,
                }}
              >
                RIGHT →
              </Text>
            </View>
          </View>
        )}

        {/* Set progress — for unilateral, show per-side sets (e.g. 3) not doubled (6) */}
        <View style={{ flexDirection: "row", gap: spacing[2], marginBottom: spacing[4] }}>
          {currentProgress &&
            Array.from({
              length: currentProgress.isUnilateral
                ? Math.ceil(currentProgress.totalSets / 2)
                : currentProgress.totalSets,
            }).map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 40,
                  backgroundColor:
                    i < currentProgress.currentSet ? `${colors.success}30` : colors.bg.elevated,
                  borderWidth: 1.5,
                  borderColor:
                    i < currentProgress.currentSet
                      ? colors.success
                      : i === currentProgress.currentSet
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
                      i < currentProgress.currentSet
                        ? colors.success
                        : i === currentProgress.currentSet
                          ? colors.accent.DEFAULT
                          : colors.text.secondary,
                    fontSize: 10,
                  }}
                >
                  SET {i + 1}
                </Text>
              </View>
            ))}
        </View>

        {/* Target info — adapts for time-based exercises */}
        {exercise && (
          <HUDModule label="TARGET" accent="none" style={{ marginBottom: spacing[4] }}>
            <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
              <View style={{ alignItems: "center" }}>
                <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
                  {timeBased ? "HOLD" : "REPS"}
                </Text>
                <Text style={{ ...typography.h3, color: colors.accent.DEFAULT, fontSize: 20 }}>
                  {timeBased
                    ? `${exercise.repRange[0]}s-${exercise.repRange[1]}s`
                    : `${exercise.repRange[0]}-${exercise.repRange[1]}`}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
                  TEMPO
                </Text>
                <Text style={{ ...typography.h3, color: colors.text.primary, fontSize: 20 }}>
                  {exercise.tempo === "isometric" ? "STATIC" : exercise.tempo}
                </Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
                  REST
                </Text>
                <Text style={{ ...typography.h3, color: colors.text.primary, fontSize: 20 }}>
                  {exercise.restInterval}s
                </Text>
              </View>
            </View>
          </HUDModule>
        )}

        {/* Exercise demo video link */}
        {exercise && <ExerciseDemo exercise={exercise} />}

        {/* Animated tempo timer — REMOVED for isometric exercises (no beat cycle) */}
        {exercise && exercise.tempo !== "isometric" && (
          <View style={{ marginBottom: spacing[4] }}>
            <TempoTimer tempo={exercise.tempo} isActive={phase === "exercise"} />
          </View>
        )}

        {/* Description */}
        {exercise?.description && (
          <HUDModule label="NOTES" accent="none" style={{ marginBottom: spacing[4] }}>
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.secondary,
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              {exercise.description}
            </Text>
          </HUDModule>
        )}

        {/* Rest timer overlay */}
        {phase === "rest" && (
          <HUDModule label="REST" accent="green" style={{ marginBottom: spacing[4] }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ ...typography.h1, color: colors.success, fontSize: 48 }}>
                {restTimer}
              </Text>
              <Text style={{ ...typography.label, color: colors.success, fontSize: 10 }}>
                SECONDS
              </Text>
            </View>
          </HUDModule>
        )}
      </ScrollView>

      {/* Bottom action bar */}
      <View
        style={{
          padding: spacing[4],
          borderTopWidth: 1,
          borderTopColor: colors.border.subtle,
          backgroundColor: colors.bg.primary,
          gap: spacing[2],
        }}
      >
        {phase === "rest" ? (
          <Button
            title="SKIP REST"
            onPress={() => {
              useWorkoutStore.setState({ phase: "exercise", restTimer: 0 });
            }}
            variant="secondary"
            fullWidth
          />
        ) : timeBased ? (
          <>
            {/* Time-based exercise interface */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing[3],
                marginBottom: spacing[2],
              }}
            >
              <View
                style={{
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                  paddingHorizontal: spacing[2],
                  paddingVertical: spacing[0],
                }}
              >
                <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
                  HOLD DURATION
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing[3],
                marginBottom: spacing[3],
              }}
            >
              <View
                style={{
                  minWidth: 80,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isHolding ? `${colors.success}15` : colors.bg.elevated,
                  borderWidth: 1.5,
                  borderColor: isHolding ? colors.success : colors.accent.DEFAULT,
                  borderRadius: 4,
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[2],
                }}
              >
                <Text
                  style={{
                    ...typography.h1,
                    color: isHolding ? colors.success : colors.accent.DEFAULT,
                    fontSize: 36,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {holdElapsed}
                </Text>
                <Text
                  style={{
                    ...typography.label,
                    color: isHolding ? colors.success : colors.text.secondary,
                    fontSize: 8,
                    marginTop: -spacing[0],
                  }}
                >
                  SECONDS
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: spacing[2] }}>
              {!isHolding && !holdCompleted && (
                <Button title="START HOLD" onPress={handleStartHold} variant="primary" fullWidth />
              )}
              {isHolding && (
                <Button
                  title="COMPLETE HOLD"
                  onPress={handleCompleteHold}
                  variant="primary"
                  fullWidth
                />
              )}
              {holdCompleted && !currentProgress?.isComplete && (
                <Button
                  title="NEXT SET"
                  onPress={() => {
                    const store = useWorkoutStore.getState();
                    if (store.phase !== "rest") {
                      store.startRest();
                    } else {
                      setHoldCompleted(false);
                      holdCompletedRef.current = false;
                    }
                  }}
                  variant="secondary"
                  fullWidth
                />
              )}
            </View>
          </>
        ) : (
          <>
            {/* Rep-based exercise interface */}
            {/* Manual rep input label */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing[3],
                marginBottom: spacing[2],
              }}
            >
              <View
                style={{
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                  paddingHorizontal: spacing[2],
                  paddingVertical: spacing[0],
                }}
              >
                <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
                  MANUAL REPS
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing[3],
                marginBottom: spacing[3],
              }}
            >
              <Button
                title="−"
                onPress={() => setCurrentRepInput(currentRepInput - 1)}
                variant="secondary"
                size="sm"
              />
              <View
                style={{
                  minWidth: 64,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1.5,
                  borderColor: colors.accent.DEFAULT,
                  borderRadius: 4,
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[1],
                }}
              >
                <Text style={{ ...typography.h2, color: colors.accent.DEFAULT, fontSize: 24 }}>
                  {currentRepInput}
                </Text>
              </View>
              <Button
                title="+"
                onPress={() => setCurrentRepInput(currentRepInput + 1)}
                variant="secondary"
                size="sm"
              />
            </View>

            {/* Exercise navigation */}
            {exerciseProgress.length > 1 && (
              <View
                style={{
                  flexDirection: "row",
                  gap: spacing[2],
                  marginBottom: spacing[2],
                }}
              >
                <View style={{ flex: 1 }}>
                  <Button
                    title="← PREV"
                    onPress={handlePrevExercise}
                    variant="ghost"
                    size="sm"
                    disabled={isFirstExercise}
                  />
                </View>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Text
                    style={{
                      ...typography.label,
                      color: colors.text.secondary,
                      fontSize: 8,
                    }}
                  >
                    {currentExerciseIndex + 1} / {totalExercises}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="NEXT →"
                    onPress={handleNextExercise}
                    variant="ghost"
                    size="sm"
                    disabled={isLastExercise}
                  />
                </View>
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
        )}

        {phase === "exercise" && (
          <Button
            title="            COMPLETE QUEST"
            onPress={handleCompleteWorkout}
            variant="secondary"
            fullWidth
          />
        )}
      </View>
    </SafeAreaView>
  );
}
