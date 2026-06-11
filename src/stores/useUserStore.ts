import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLevel, getProgressToNextLevel } from "../utils/level";
import { calculateStreak, StreakData } from "../utils/streak";
import { getLocalToday, parseLocalDate } from "../utils/date";
import type { ThemeMode, AccentKey } from "../tokens/themes";

export interface WorkoutSession {
  id: string;
  workoutId: string;
  date: string;
  duration: number;
  setsCompleted: number;
  xpEarned: number;
  exercises: {
    exerciseId: string;
    sets: number;
    repsCompleted: number[];
  }[];
}

export type RecoveryStatus = "optimal" | "moderate" | "caution";

export type FitnessGoal = "strength" | "muscle_gain" | "endurance" | "general";
export type FitnessLevel = "beginner" | "intermediate" | "advanced";

interface UserState {
  // Auth state
  isAuthenticated: boolean;
  userId: string;
  email: string;

  // Onboarding state
  onboardingComplete: boolean;
  displayName: string;
  fitnessGoal: FitnessGoal;
  fitnessLevel: FitnessLevel;

  // Training data
  totalXp: number;
  workoutHistory: WorkoutSession[];
  streakData: StreakData;
  recoveryStatus: RecoveryStatus;

  // Computed
  level: number;
  xpProgress: { currentXp: number; requiredXp: number; progress: number };
  totalWorkouts: number;

  // Profile image
  avatarUri: string | null;

  // Theme state
  themeMode: ThemeMode;
  accentColor: AccentKey;

  // Hydration state
  isHydrated: boolean;

  // Milestone tracking
  lastShownMilestone: number;

  // Actions
  setAuth: (userId: string, email: string) => void;
  clearAuth: () => void;
  completeOnboarding: (name: string, goal: FitnessGoal, level: FitnessLevel) => void;
  updateProfile: (updates: {
    displayName?: string;
    fitnessGoal?: FitnessGoal;
    fitnessLevel?: FitnessLevel;
    avatarUri?: string | null;
  }) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (accent: AccentKey) => void;
  addWorkoutSession: (session: WorkoutSession) => void;
  recalculate: () => void;
  setLastShownMilestone: (days: number) => void;
}

/** Compute derived state from core state */
function computeDerived(totalXp: number, workoutHistory: WorkoutSession[]) {
  return {
    level: getLevel(totalXp),
    xpProgress: getProgressToNextLevel(totalXp),
    totalWorkouts: workoutHistory.length,
  };
}

/**
 * Calculate recovery status based on recent session dates.
 * Uses the recency of sessions, not just their count.
 */
function calculateRecoveryStatus(workoutHistory: WorkoutSession[]): RecoveryStatus {
  if (workoutHistory.length === 0) return "optimal";

  const today = getLocalToday();
  const todayMs = parseLocalDate(today);

  // Sort sessions by date descending
  const sortedDates = workoutHistory
    .map((s) => s.date)
    .sort()
    .reverse();

  const lastDate = sortedDates[0];
  const lastMs = parseLocalDate(lastDate);
  const daysSinceLastWorkout = Math.round((todayMs - lastMs) / (1000 * 60 * 60 * 24));

  // If it's been 2+ days since the last workout, fully recovered
  if (daysSinceLastWorkout >= 2) return "optimal";

  // Check how many sessions occurred in the last 5 days
  const recentCutoff = todayMs - 5 * 24 * 60 * 60 * 1000;
  const recentSessions = sortedDates.filter((d) => parseLocalDate(d) >= recentCutoff).length;

  // Caution only if 3+ sessions happened in the last 5 days
  if (recentSessions >= 3) return "caution";

  return "moderate";
}

// Captured set for onRehydrateStorage (runs outside the state creator scope)
let _capturedSet: ((partial: Partial<UserState> | ((state: UserState) => Partial<UserState>)) => void) | null = null;

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      _capturedSet = set;
      return ({
      // Auth defaults
      isAuthenticated: false,
      userId: "",
      email: "",

      // Onboarding defaults
      onboardingComplete: false,
      displayName: "ARCH OPERATOR",
      fitnessGoal: "general",
      fitnessLevel: "beginner",

      // Profile image default
      avatarUri: null,

  // Theme defaults
  themeMode: "dark" as ThemeMode,
  accentColor: "amber" as AccentKey,

  // Hydration default
  isHydrated: false,

  // Milestone defaults
  lastShownMilestone: 0,

      // Training data defaults
      totalXp: 0,
      workoutHistory: [],
      streakData: {
        currentStreak: 0,
        longestStreak: 0,
        lastWorkoutDate: null,
        isActiveToday: false,
      },
      recoveryStatus: "optimal",

      // Initial derived values
      ...computeDerived(0, []),

      // Auth actions
      setAuth: (userId, email) => {
        set({ isAuthenticated: true, userId, email });
      },

      clearAuth: () => {
        // Preserve profile preferences and workout history across auth sessions
        set({
          isAuthenticated: false,
          userId: "",
          email: "",
        });
      },

      // Onboarding actions
      completeOnboarding: (name, goal, level) => {
        set({
          onboardingComplete: true,
          displayName: name,
          fitnessGoal: goal,
          fitnessLevel: level,
        });
      },

      updateProfile: (updates) => {
        set(updates);
      },

      // Theme actions
      setThemeMode: (mode) => {
        set({ themeMode: mode });
      },
      setAccentColor: (accent) => {
        set({ accentColor: accent });
      },

      // Training actions
      addWorkoutSession: (session) => {
        const state = get();
        const updatedHistory = [...state.workoutHistory, session];
        const newTotalXp = updatedHistory.reduce((sum, s) => sum + s.xpEarned, 0);
        const workoutDates = updatedHistory.map((s) => s.date);
        const streakData = calculateStreak(workoutDates);
        const recoveryStatus = calculateRecoveryStatus(updatedHistory);

        set({
          totalXp: newTotalXp,
          workoutHistory: updatedHistory,
          streakData,
          recoveryStatus,
          ...computeDerived(newTotalXp, updatedHistory),
        });
      },

      recalculate: () => {
        const state = get();
        const workoutDates = state.workoutHistory.map((s) => s.date);
        const streakData = calculateStreak(workoutDates);
        const recoveryStatus = calculateRecoveryStatus(state.workoutHistory);
        set({
          streakData,
          recoveryStatus,
          ...computeDerived(state.totalXp, state.workoutHistory),
        });
      },

      setLastShownMilestone: (days) => {
        set({ lastShownMilestone: days });
      },
    });
    },
    {
      name: "arch-user-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist raw data — derived values (level, xpProgress) are recalculated
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        email: state.email,
        onboardingComplete: state.onboardingComplete,
        displayName: state.displayName,
        fitnessGoal: state.fitnessGoal,
        fitnessLevel: state.fitnessLevel,
        totalXp: state.totalXp,
        workoutHistory: state.workoutHistory,
        streakData: state.streakData,
        recoveryStatus: state.recoveryStatus,
        avatarUri: state.avatarUri,
        themeMode: state.themeMode,
        accentColor: state.accentColor,
        lastShownMilestone: state.lastShownMilestone,
      }),
      // Recompute all derived values after loading persisted data
      // (streak, recovery, and level may have changed since last save)
      onRehydrateStorage: () => (state) => {
        if (state) {
          const derived = computeDerived(state.totalXp, state.workoutHistory);
          state.level = derived.level;
          state.xpProgress = derived.xpProgress;
          state.totalWorkouts = derived.totalWorkouts;
          // Recompute streak and recovery — "isActiveToday" may be stale from yesterday
          const workoutDates = state.workoutHistory.map((s) => s.date);
          state.streakData = calculateStreak(workoutDates);
          state.recoveryStatus = calculateRecoveryStatus(state.workoutHistory);
          // Signal hydration complete — screens can now render real content
          _capturedSet?.({ isHydrated: true });
        }
      },
    },
  ),
);
