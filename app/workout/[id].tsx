import { useEffect, useCallback, useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { Button } from "../../src/components/ui/Button";
import { HUDModule } from "../../src/components/ui/HUDModule";
import { CompletionAnimation } from "../../src/components/workout/CompletionAnimation";
import { ExerciseDemo } from "../../src/components/workout/ExerciseDemo";
import { TempoTimer } from "../../src/components/workout/TempoTimer";
import { VoiceCoachToggle } from "../../src/components/workout/VoiceCoachToggle";
import { RepCounterPanel } from "../../src/components/workout/RepCounterPanel";
import { useVoiceCoach } from "../../src/hooks/useVoiceCoach";
import { useWorkoutStore } from "../../src/stores/useWorkoutStore";
import { useRestNotifications } from "../../src/hooks/useRestNotifications";
import { useUserStore } from "../../src/stores/useUserStore";
import { getWorkoutByIdForGoal } from "../../src/data/workouts";
import { calculateWorkoutXp } from "../../src/utils/xp";
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

  // Rep counter state — user enters actual reps per set
  const preWorkoutLevelRef = useRef(1);

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

      // Capture level BEFORE calling addWorkoutSession
      preWorkoutLevelRef.current = userStore.level;

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
      />
    );
  }

  const currentProgress = exerciseProgress[currentExerciseIndex];
  const exercise = useWorkoutStore.getState().currentExercise;
  const timeBased = exercise ? isTimeBased(exercise.tempo) : false;

  // ── Next exercise preview ──
  const nextExercise = !isLastExercise ? exerciseProgress[currentExerciseIndex + 1] : null;
  const nextExerciseData = !isLastExercise ? useWorkoutStore.getState().exercises[currentExerciseIndex + 1] : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      {/* ═══════ FULL-SCREEN REST TIMER ═══════ */}
      {phase === "rest" && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg.primary, zIndex: 50, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: 10, color: colors.text.secondary, textTransform: "uppercase", letterSpacing: 4, marginBottom: 8 }}>REST</Text>
          <Text style={{ fontFamily: fonts.heading, fontSize: 120, color: colors.success, fontVariant: ["tabular-nums"] }}>
            {restTimer}
          </Text>
          <Text style={{ fontFamily: fonts.body.regular, fontSize: 12, color: colors.text.secondary, marginBottom: 48 }}>SECONDS</Text>
          {/* Next exercise preview */}
          {nextExerciseData && (
            <View style={{ backgroundColor: colors.bg.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border.subtle, width: "80%" }}>
              <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 8, color: colors.accent.DEFAULT, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>UP NEXT</Text>
              <Text style={{ fontFamily: fonts.heading, fontSize: 18, color: colors.text.primary }}>{nextExerciseData.name}</Text>
              <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
                {nextExerciseData.targetMuscles.map((m) => (
                  <View key={m} style={{ backgroundColor: colors.bg.elevated, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: fonts.body.regular, fontSize: 8, color: colors.text.secondary, textTransform: "capitalize" }}>{m.replace("_", " ")}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <TouchableOpacity
            onPress={() => { useWorkoutStore.setState({ phase: "exercise", restTimer: 0 }); }}
            activeOpacity={0.8}
            style={{ marginTop: 32, backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border.subtle, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 }}
          >
            <Text style={{ fontFamily: fonts.body.bold, fontSize: 12, color: colors.text.secondary, textTransform: "uppercase", letterSpacing: 2 }}>SKIP REST</Text>
          </TouchableOpacity>
        </View>
      )}

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
        >
          {workout.name}
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
          <VoiceCoachToggle
            initialEnabled={isVoiceEnabled.current}
            onToggle={(enabled) => {
              isVoiceEnabled.current = enabled;
            }}
          />
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
        {/* ═══════ EXERCISE PREVIEW CARD ═══════ */}
        {exercise && currentProgress && (
          <View style={{ backgroundColor: colors.bg.surface, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border.subtle }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 9, color: colors.accent.DEFAULT, textTransform: "uppercase", letterSpacing: 2 }}>
                EXERCISE {currentExerciseIndex + 1} / {exerciseProgress.length}
              </Text>
              {currentProgress.isUnilateral && (
                <View style={{ backgroundColor: currentProgress.currentSide === "left" ? `${colors.accent.DEFAULT}20` : colors.bg.elevated, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: currentProgress.currentSide === "left" ? colors.accent.DEFAULT : colors.border.subtle }}>
                  <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 8, color: currentProgress.currentSide === "left" ? colors.accent.DEFAULT : colors.text.secondary }}>
                    {currentProgress.currentSide === "left" ? "← LEFT" : "RIGHT →"}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 24, color: colors.text.primary, marginBottom: 8 }}>
              {exercise.name}
            </Text>
            {/* Muscle tags */}
            <View style={{ flexDirection: "row", gap: 4, marginBottom: 12 }}>
              {exercise.targetMuscles.map((muscle) => (
                <View key={muscle} style={{ backgroundColor: colors.bg.elevated, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontFamily: fonts.body.regular, fontSize: 9, color: colors.text.secondary, textTransform: "capitalize" }}>
                    {muscle.replace("_", " ")}
                  </Text>
                </View>
              ))}
            </View>
            {/* Set progress dots */}
            <View style={{ flexDirection: "row", gap: 6 }}>
              {Array.from({ length: currentProgress.isUnilateral ? Math.ceil(currentProgress.totalSets / 2) : currentProgress.totalSets }).map((_, i) => (
                <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < currentProgress.currentSet ? colors.success : colors.bg.elevated }} />
              ))}
            </View>
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 9, color: colors.text.secondary, marginTop: 6 }}>
              SET {Math.min(currentProgress.currentSet + 1, currentProgress.totalSets)} / {currentProgress.totalSets}
            </Text>
          </View>
        )}

        {/* ═══════ MASSIVE REP COUNTER ═══════ */}
        {!timeBased && phase === "exercise" && (
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 9, color: colors.text.secondary, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>REPS</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 24 }}>
              <TouchableOpacity
                onPress={() => setCurrentRepInput(currentRepInput - 1)}
                activeOpacity={0.7}
                style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border.subtle, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontFamily: fonts.heading, fontSize: 28, color: colors.text.secondary }}>−</Text>
              </TouchableOpacity>
              <Text style={{ fontFamily: fonts.heading, fontSize: 72, color: colors.accent.DEFAULT, fontVariant: ["tabular-nums"], minWidth: 100, textAlign: "center" }}>
                {currentRepInput}
              </Text>
              <TouchableOpacity
                onPress={() => setCurrentRepInput(currentRepInput + 1)}
                activeOpacity={0.7}
                style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border.subtle, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontFamily: fonts.heading, fontSize: 28, color: colors.text.secondary }}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 10, color: colors.text.secondary, marginTop: 4 }}>
              TARGET: {exercise?.repRange[0]}–{exercise?.repRange[1]}
            </Text>
          </View>
        )}

        {/* ═══════ TIME-BASED HOLD COUNTER ═══════ */}
        {timeBased && phase === "exercise" && (
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 9, color: colors.text.secondary, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>HOLD DURATION</Text>
            <View style={{ width: 160, height: 160, borderRadius: 80, borderWidth: 8, borderColor: isHolding ? colors.success : colors.bg.elevated, alignItems: "center", justifyContent: "center", backgroundColor: isHolding ? `${colors.success}10` : colors.bg.surface }}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 56, color: isHolding ? colors.success : colors.accent.DEFAULT, fontVariant: ["tabular-nums"] }}>
                {holdElapsed}
              </Text>
              <Text style={{ fontFamily: fonts.body.regular, fontSize: 10, color: colors.text.secondary }}>SECONDS</Text>
            </View>
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 10, color: colors.text.secondary, marginTop: 8 }}>
              TARGET: {exercise?.repRange[0]}s–{exercise?.repRange[1]}s
            </Text>
          </View>
        )}

        {/* ═══════ AUTO REP COUNTER ═══════ */}
        {!timeBased && phase === "exercise" && (
          <View style={{ marginBottom: 16 }}>
            <RepCounterPanel phase={phase} manualCount={currentRepInput} onSyncCount={(autoCount) => setCurrentRepInput(autoCount)} />
          </View>
        )}

        {/* Exercise demo + tempo + notes */}
        {exercise && (
          <View style={{ marginBottom: 16 }}>
            <ExerciseDemo exercise={exercise} />
          </View>
        )}
        {exercise && exercise.tempo !== "isometric" && (
          <View style={{ marginBottom: 16 }}>
            <TempoTimer tempo={exercise.tempo} isActive={phase === "exercise"} />
          </View>
        )}
        {exercise?.description && (
          <View style={{ backgroundColor: colors.bg.surface, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border.subtle }}>
            <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 8, color: colors.text.secondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>NOTES</Text>
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 11, color: colors.text.secondary, lineHeight: 16 }}>{exercise.description}</Text>
          </View>
        )}

        {/* Exercise navigation */}
        {exerciseProgress.length > 1 && (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 16 }}>
            <Button title="PREV" onPress={handlePrevExercise} variant="ghost" size="sm" disabled={isFirstExercise} />
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 10, color: colors.text.secondary }}>
              {currentExerciseIndex + 1} / {exerciseProgress.length}
            </Text>
            <Button title="NEXT" onPress={handleNextExercise} variant="ghost" size="sm" disabled={isLastExercise} />
          </View>
        )}
      </ScrollView>

      {/* ═══════ BOTTOM ACTION BAR ═══════ */}
      <View style={{ padding: spacing[4], borderTopWidth: 1, borderTopColor: colors.border.subtle, backgroundColor: colors.bg.primary }}>
        {timeBased ? (
          <>
            {!isHolding && !holdCompleted && (
              <Button title="START HOLD" onPress={handleStartHold} fullWidth />
            )}
            {isHolding && (
              <Button title="COMPLETE HOLD" onPress={handleCompleteHold} fullWidth />
            )}
            {holdCompleted && !currentProgress?.isComplete && (
              <Button title="NEXT SET" onPress={() => { const store = useWorkoutStore.getState(); if (store.phase !== "rest") { store.startRest(); } else { setHoldCompleted(false); holdCompletedRef.current = false; } }} variant="secondary" fullWidth />
            )}
          </>
        ) : (
          <Button
            title={currentProgress?.isUnilateral ? currentProgress.currentSide === "left" ? "COMPLETE LEFT SIDE" : "COMPLETE RIGHT SIDE" : currentProgress && currentProgress.currentSet >= currentProgress.totalSets - 1 ? "COMPLETE EXERCISE" : "COMPLETE SET"}
            onPress={handleCompleteSet}
            fullWidth
          />
        )}
        {phase === "exercise" && (
          <View style={{ marginTop: 8 }}>
            <Button title="FINISH WORKOUT" onPress={handleCompleteWorkout} variant="secondary" fullWidth />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
