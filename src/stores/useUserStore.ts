import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLevel, getProgressToNextLevel } from "../utils/level";
import { calculateStreak, StreakData } from "../utils/streak";
import { getLocalToday, parseLocalDate } from "../utils/date";
import type { ThemeMode, AccentKey } from "../tokens/themes";
import { pushProfile, incrementalSync, fullSync } from "../services/cloudSync";
import { isSupabaseConfigured } from "../services/supabase";
import type { Tempo } from "../data/exercises";

// ─── Storage Migration ───────────────────────────────────────────
// One-time migration: reads from old `arch-user-storage` key if the new
// `fitquest-user-storage` key is empty, then deletes the old key.
// Once migrated, all subsequent reads/writes use the new key only.

const OLD_STORAGE_KEY = "arch-user-storage";
const NEW_STORAGE_KEY = "fitquest-user-storage";

function createMigratedStorage(storage: typeof AsyncStorage) {
  return {
    getItem: async (name: string) => {
      if (name === NEW_STORAGE_KEY) {
        const newData = await storage.getItem(NEW_STORAGE_KEY);
        if (newData) return newData;
        const oldData = await storage.getItem(OLD_STORAGE_KEY);
        if (oldData) {
          await storage.setItem(NEW_STORAGE_KEY, oldData);
          await storage.removeItem(OLD_STORAGE_KEY);
          if (__DEV__) {
            console.log("[Storage] Migrated data from", OLD_STORAGE_KEY, "to", NEW_STORAGE_KEY);
          }
          return oldData;
        }
      }
      return storage.getItem(name);
    },
    setItem: (name: string, value: string) => storage.setItem(name, value),
    removeItem: (name: string) => storage.removeItem(name),
  };
}

// ─── Exercise Preset ───────────────────────────────────────────

export interface ExercisePreset {
  exerciseId: string;
  label?: string;
  defaultSets: number;
  repRange: [number, number];
  tempo: Tempo;
  restInterval: number;
  createdAt: string;
  updatedAt: string;
}

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

  // First-visit tracking
  hasSeenSkillTreeIntro: boolean;

  // Mastery tracking — IDs of exercises where upper rep range was hit
  masteredExerciseIds: string[];

  // Custom exercise presets
  exercisePresets: Record<string, ExercisePreset>;

  // Voice coach setting
  voiceCoachEnabled: boolean;

  // Actions
  setAuth: (userId: string, email: string) => void;
  clearAuth: () => void;
  completeOnboarding: (name: string, goal: FitnessGoal, level: FitnessLevel) => void;
  updateProfile: (updates: {
    displayName?: string;
    fitnessGoal?: FitnessGoal;
    fitnessLevel?: FitnessLevel;
    avatarUri?: string | null;
    masteredExerciseIds?: string[];
  }) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (accent: AccentKey) => void;
  addWorkoutSession: (session: WorkoutSession) => void;
  /** Mark exercises as mastered when upper rep range is met */
  markMastered: (exerciseIds: string[]) => void;
  /** Save or update a custom exercise preset */
  setExercisePreset: (preset: ExercisePreset) => void;
  /** Remove a custom exercise preset */
  removeExercisePreset: (exerciseId: string) => void;
  recalculate: () => void;
  setLastShownMilestone: (days: number) => void;
  markSkillTreeIntroSeen: () => void;
  setVoiceCoachEnabled: (enabled: boolean) => void;
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
let _capturedSet:
  | ((partial: Partial<UserState> | ((state: UserState) => Partial<UserState>)) => void)
  | null = null;

// Captured sync promise so login/register can await cloud sync before navigating
let _pendingSync: Promise<void> | null = null;

/**
 * Wait for the auth-triggered cloud sync to complete.
 * Used by login/register screens to ensure profile data (including
 * onboardingComplete) is restored before routing to the root gate.
 */
export async function waitForAuthSync(): Promise<void> {
  if (_pendingSync) {
    await _pendingSync;
  }
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      _capturedSet = set;
      return {
        // Auth defaults
        isAuthenticated: false,
        userId: "",
        email: "",

        // Onboarding defaults
        onboardingComplete: false,
        displayName: "FITQUEST OPERATOR",
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

        // First-visit defaults
        hasSeenSkillTreeIntro: false,

        // Mastery defaults
        masteredExerciseIds: [],

        // Exercise presets defaults
        exercisePresets: {},

        // Voice coach defaults
        voiceCoachEnabled: true,

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
          // Trigger full sync from cloud after login
          const state = get();
          _pendingSync = fullSync(userId, {
            displayName: state.displayName,
            fitnessGoal: state.fitnessGoal,
            fitnessLevel: state.fitnessLevel,
            avatarUri: state.avatarUri,
            themeMode: state.themeMode,
            accentColor: state.accentColor,
            onboardingComplete: state.onboardingComplete,
            workoutHistory: state.workoutHistory,
            totalXp: state.totalXp,
            streakData: state.streakData,
            totalWorkouts: state.totalWorkouts,
          })
            .then(({ mergedProfile, mergedWorkouts, error }) => {
              if (error) {
                console.warn("Initial sync failed:", error);
                return;
              }
              if (mergedProfile || mergedWorkouts.length > 0) {
                const updates: Partial<UserState> = {};
                if (mergedProfile) {
                  updates.displayName = mergedProfile.displayName;
                  updates.fitnessGoal = mergedProfile.fitnessGoal;
                  updates.fitnessLevel = mergedProfile.fitnessLevel;
                  updates.avatarUri = mergedProfile.avatarUri;
                  updates.themeMode = mergedProfile.themeMode as ThemeMode;
                  updates.accentColor = mergedProfile.accentColor as AccentKey;
                  updates.onboardingComplete = mergedProfile.onboardingComplete;
                }
                if (mergedWorkouts.length > 0) {
                  updates.workoutHistory = mergedWorkouts;
                  const newTotalXp = mergedWorkouts.reduce((sum, s) => sum + s.xpEarned, 0);
                  updates.totalXp = newTotalXp;
                  const workoutDates = mergedWorkouts.map((s) => s.date);
                  updates.streakData = calculateStreak(workoutDates);
                  Object.assign(updates, computeDerived(newTotalXp, mergedWorkouts));
                }
                set(updates);
              }
            })
            .catch((e) => console.warn("Initial sync merge failed:", e))
            .finally(() => {
              _pendingSync = null;
            });
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
          const PATHWAY_PREFIXES = ["HP", "VP", "HPLL", "VPLL", "AQL", "HPL", "AC", "PLC"];
          const startLevels: Record<string, number> = {
            beginner: 1,
            intermediate: 3,
            advanced: 5,
          };
          const targetStart = startLevels[level] ?? 1;
          const mastered: string[] = [];
          for (const prefix of PATHWAY_PREFIXES) {
            for (let l = 1; l < targetStart; l++) {
              mastered.push(`${prefix}${l}`);
            }
          }
          set({
            onboardingComplete: true,
            displayName: name,
            fitnessGoal: goal,
            fitnessLevel: level,
            masteredExerciseIds: mastered,
          });
          // Push profile to cloud after onboarding
          const state = get();
          if (state.isAuthenticated && isSupabaseConfigured()) {
            pushProfile(state.userId, {
              displayName: name,
              fitnessGoal: goal,
              fitnessLevel: level,
              avatarUri: state.avatarUri,
              themeMode: state.themeMode,
              accentColor: state.accentColor,
              onboardingComplete: true,
            }).catch((e) => console.warn("Onboarding sync failed:", e));
          }
        },

        updateProfile: (updates) => {
          const state = get();
          // When fitnessLevel changes, recalculate which exercises are pre-mastered
          if (updates.fitnessLevel && updates.fitnessLevel !== state.fitnessLevel) {
            const PATHWAY_PREFIXES = ["HP", "VP", "HPLL", "VPLL", "AQL", "HPL", "AC", "PLC"];
            const startLevels: Record<string, number> = {
              beginner: 1,
              intermediate: 3,
              advanced: 5,
            };
            const targetStart = startLevels[updates.fitnessLevel] ?? 1;
            const mastered: string[] = [];
            for (const prefix of PATHWAY_PREFIXES) {
              for (let l = 1; l < targetStart; l++) {
                mastered.push(`${prefix}${l}`);
              }
            }
            set({ ...updates, masteredExerciseIds: mastered });
          } else {
            set(updates);
          }
          // Push profile changes to cloud
          if (state.isAuthenticated && isSupabaseConfigured()) {
            pushProfile(state.userId, {
              displayName: state.displayName,
              fitnessGoal: state.fitnessGoal,
              fitnessLevel: state.fitnessLevel,
              avatarUri: state.avatarUri,
              themeMode: state.themeMode,
              accentColor: state.accentColor,
              onboardingComplete: state.onboardingComplete,
            }).catch((e) => console.warn("Profile sync failed:", e));
          }
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

          // Incremental sync to cloud after workout
          if (state.isAuthenticated && isSupabaseConfigured()) {
            incrementalSync(state.userId, session, {
              totalXp: newTotalXp,
              currentStreak: streakData.currentStreak,
              longestStreak: streakData.longestStreak,
              lastWorkoutDate: streakData.lastWorkoutDate,
              totalWorkouts: updatedHistory.length,
            }).catch((e) => console.warn("Workout sync failed:", e));
          }
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

        markMastered: (exerciseIds) => {
          const state = get();
          const updated = new Set([...state.masteredExerciseIds, ...exerciseIds]);
          set({ masteredExerciseIds: Array.from(updated) });
        },

        setExercisePreset: (preset) => {
          const state = get();
          set({
            exercisePresets: {
              ...state.exercisePresets,
              [preset.exerciseId]: {
                ...preset,
                updatedAt: new Date().toISOString(),
                createdAt: state.exercisePresets[preset.exerciseId]?.createdAt ?? preset.createdAt,
              },
            },
          });
        },

        removeExercisePreset: (exerciseId) => {
          const state = get();
          const copy = { ...state.exercisePresets };
          delete copy[exerciseId];
          set({ exercisePresets: copy });
        },

        setLastShownMilestone: (days) => {
          set({ lastShownMilestone: days });
        },

        markSkillTreeIntroSeen: () => {
          set({ hasSeenSkillTreeIntro: true });
        },

        setVoiceCoachEnabled: (enabled) => {
          set({ voiceCoachEnabled: enabled });
        },
      };
    },
    {
      name: NEW_STORAGE_KEY,
      storage: createJSONStorage(() => createMigratedStorage(AsyncStorage)),
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
        masteredExerciseIds: state.masteredExerciseIds,
        hasSeenSkillTreeIntro: state.hasSeenSkillTreeIntro,
        exercisePresets: state.exercisePresets,
        voiceCoachEnabled: state.voiceCoachEnabled,
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
