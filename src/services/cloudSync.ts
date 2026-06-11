import { supabase, isSupabaseConfigured } from "./supabase";
import type { WorkoutSession, FitnessGoal, FitnessLevel } from "../stores/useUserStore";

// ─── Types ──────────────────────────────────────────────────────────────────

interface UserProfileRow {
  id: string;
  display_name: string;
  fitness_goal: FitnessGoal;
  fitness_level: FitnessLevel;
  avatar_url: string | null;
  theme_mode: string;
  accent_color: string;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

interface WorkoutSessionRow {
  id: string;
  user_id: string;
  workout_id: string;
  workout_date: string;
  duration: number;
  sets_completed: number;
  xp_earned: number;
  exercises: WorkoutSession["exercises"];
  created_at: string;
}

interface UserStatsRow {
  user_id: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
  total_workouts: number;
  updated_at: string;
}

// ─── Sync Status ────────────────────────────────────────────────────────────

export type SyncStatus = "idle" | "syncing" | "error";

let _syncStatus: SyncStatus = "idle";
let _syncListeners: ((status: SyncStatus) => void)[] = [];

export function getSyncStatus(): SyncStatus {
  return _syncStatus;
}

export function onSyncStatusChange(listener: (status: SyncStatus) => void): () => void {
  _syncListeners.push(listener);
  return () => {
    _syncListeners = _syncListeners.filter((l) => l !== listener);
  };
}

function setSyncStatus(status: SyncStatus) {
  _syncStatus = status;
  _syncListeners.forEach((l) => l(status));
}

// ─── Push: Local → Cloud ────────────────────────────────────────────────────

/**
 * Push user profile data to Supabase.
 * Upserts so it creates the row on first sync and updates on subsequent syncs.
 */
export async function pushProfile(userId: string, profile: {
  displayName: string;
  fitnessGoal: FitnessGoal;
  fitnessLevel: FitnessLevel;
  avatarUri: string | null;
  themeMode: string;
  accentColor: string;
  onboardingComplete: boolean;
}): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };

  const { error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        id: userId,
        display_name: profile.displayName,
        fitness_goal: profile.fitnessGoal,
        fitness_level: profile.fitnessLevel,
        avatar_url: profile.avatarUri,
        theme_mode: profile.themeMode,
        accent_color: profile.accentColor,
        onboarding_complete: profile.onboardingComplete,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  return { error: error?.message ?? null };
}

/**
 * Push workout sessions to Supabase.
 * Only pushes sessions that don't already exist in the cloud (by id).
 */
export async function pushWorkoutSessions(
  userId: string,
  sessions: WorkoutSession[],
): Promise<{ error: string | null; pushedCount: number }> {
  if (!isSupabaseConfigured() || sessions.length === 0) {
    return { error: null, pushedCount: 0 };
  }

  // Batch upsert — Supabase handles dedup via primary key
  const rows: Partial<WorkoutSessionRow>[] = sessions.map((s) => ({
    id: s.id,
    user_id: userId,
    workout_id: s.workoutId,
    workout_date: s.date,
    duration: s.duration,
    sets_completed: s.setsCompleted,
    xp_earned: s.xpEarned,
    exercises: s.exercises,
  }));

  // Upsert in batches of 50 to avoid payload limits
  const BATCH_SIZE = 50;
  let pushedCount = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("workout_sessions")
      .upsert(batch, { onConflict: "id" });
    if (error) return { error: error.message, pushedCount };
    pushedCount += batch.length;
  }

  return { error: null, pushedCount };
}

/**
 * Push aggregated stats to Supabase.
 */
export async function pushStats(userId: string, stats: {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  totalWorkouts: number;
}): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };

  const { error } = await supabase
    .from("user_stats")
    .upsert(
      {
        user_id: userId,
        total_xp: stats.totalXp,
        current_streak: stats.currentStreak,
        longest_streak: stats.longestStreak,
        last_workout_date: stats.lastWorkoutDate,
        total_workouts: stats.totalWorkouts,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  return { error: error?.message ?? null };
}

// ─── Pull: Cloud → Local ────────────────────────────────────────────────────

/**
 * Pull user profile from Supabase.
 */
export async function pullProfile(userId: string): Promise<{
  data: {
    displayName: string;
    fitnessGoal: FitnessGoal;
    fitnessLevel: FitnessLevel;
    avatarUri: string | null;
    themeMode: string;
    accentColor: string;
    onboardingComplete: boolean;
  } | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) return { data: null, error: null };

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  const row = data as UserProfileRow;
  return {
    data: {
      displayName: row.display_name,
      fitnessGoal: row.fitness_goal,
      fitnessLevel: row.fitness_level,
      avatarUri: row.avatar_url,
      themeMode: row.theme_mode,
      accentColor: row.accent_color,
      onboardingComplete: row.onboarding_complete,
    },
    error: null,
  };
}

/**
 * Pull all workout sessions from Supabase.
 */
export async function pullWorkoutSessions(userId: string): Promise<{
  data: WorkoutSession[];
  error: string | null;
}> {
  if (!isSupabaseConfigured()) return { data: [], error: null };

  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("workout_date", { ascending: false });

  if (error) return { data: [], error: error.message };
  if (!data) return { data: [], error: null };

  const sessions: WorkoutSession[] = (data as WorkoutSessionRow[]).map((row) => ({
    id: row.id,
    workoutId: row.workout_id,
    date: row.workout_date,
    duration: row.duration,
    setsCompleted: row.sets_completed,
    xpEarned: row.xp_earned,
    exercises: row.exercises,
  }));

  return { data: sessions, error: null };
}

/**
 * Pull aggregated stats from Supabase.
 */
export async function pullStats(userId: string): Promise<{
  data: {
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
    lastWorkoutDate: string | null;
    totalWorkouts: number;
  } | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) return { data: null, error: null };

  const { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  const row = data as UserStatsRow;
  return {
    data: {
      totalXp: row.total_xp,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastWorkoutDate: row.last_workout_date,
      totalWorkouts: row.total_workouts,
    },
    error: null,
  };
}

// ─── Full Sync ──────────────────────────────────────────────────────────────

/**
 * Full bidirectional sync: pull from cloud, merge with local, push back.
 * Uses a "cloud wins for profile, local wins for workouts" strategy.
 */
export async function fullSync(userId: string, localData: {
  displayName: string;
  fitnessGoal: FitnessGoal;
  fitnessLevel: FitnessLevel;
  avatarUri: string | null;
  themeMode: string;
  accentColor: string;
  onboardingComplete: boolean;
  workoutHistory: WorkoutSession[];
  totalXp: number;
  streakData: { currentStreak: number; longestStreak: number; lastWorkoutDate: string | null };
  totalWorkouts: number;
}): Promise<{
  mergedProfile: typeof localData | null;
  mergedWorkouts: WorkoutSession[];
  error: string | null;
}> {
  setSyncStatus("syncing");

  try {
    // ── Pull from cloud ──
    const [profileResult, workoutsResult, statsResult] = await Promise.all([
      pullProfile(userId),
      pullWorkoutSessions(userId),
      pullStats(userId),
    ]);

    const cloudError = profileResult.error || workoutsResult.error || statsResult.error;
    if (cloudError) {
      console.warn("Cloud pull errors:", cloudError);
    }

    // ── Merge profile: cloud wins if it has onboarding complete ──
    let mergedProfile: typeof localData | null = null;
    if (profileResult.data) {
      const cloud = profileResult.data;
      mergedProfile = {
        ...localData,
        displayName: cloud.onboardingComplete ? cloud.displayName : localData.displayName,
        fitnessGoal: cloud.onboardingComplete ? cloud.fitnessGoal : localData.fitnessGoal,
        fitnessLevel: cloud.onboardingComplete ? cloud.fitnessLevel : localData.fitnessLevel,
        avatarUri: cloud.avatarUri ?? localData.avatarUri,
        themeMode: cloud.themeMode,
        accentColor: cloud.accentColor,
        onboardingComplete: cloud.onboardingComplete || localData.onboardingComplete,
      };
    }

    // ── Merge workouts: union by id, local takes priority for duplicates ──
    const cloudWorkouts = workoutsResult.data;
    const localWorkoutMap = new Map(localData.workoutHistory.map((w) => [w.id, w]));
    const mergedWorkouts = [...localData.workoutHistory];

    for (const cloudW of cloudWorkouts) {
      if (!localWorkoutMap.has(cloudW.id)) {
        mergedWorkouts.push(cloudW);
      }
    }

    // Sort by date descending
    mergedWorkouts.sort((a, b) => b.date.localeCompare(a.date));

    // ── Push local data back to cloud ──
    await pushProfile(userId, {
      displayName: mergedProfile?.displayName ?? localData.displayName,
      fitnessGoal: mergedProfile?.fitnessGoal ?? localData.fitnessGoal,
      fitnessLevel: mergedProfile?.fitnessLevel ?? localData.fitnessLevel,
      avatarUri: mergedProfile?.avatarUri ?? localData.avatarUri,
      themeMode: mergedProfile?.themeMode ?? localData.themeMode,
      accentColor: mergedProfile?.accentColor ?? localData.accentColor,
      onboardingComplete: mergedProfile?.onboardingComplete ?? localData.onboardingComplete,
    });

    await pushWorkoutSessions(userId, mergedWorkouts);

    await pushStats(userId, {
      totalXp: localData.totalXp,
      currentStreak: localData.streakData.currentStreak,
      longestStreak: localData.streakData.longestStreak,
      lastWorkoutDate: localData.streakData.lastWorkoutDate,
      totalWorkouts: localData.totalWorkouts,
    });

    setSyncStatus("idle");
    return { mergedProfile, mergedWorkouts, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("Full sync failed:", msg);
    setSyncStatus("error");
    return { mergedProfile: null, mergedWorkouts: localData.workoutHistory, error: msg };
  }
}

// ─── Incremental Sync (after workout completion) ────────────────────────────

/**
 * Push only the latest workout session and updated stats.
 * Called after each workout completion for near-real-time cloud backup.
 */
export async function incrementalSync(userId: string, session: WorkoutSession, stats: {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  totalWorkouts: number;
}): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) return { error: null };

  setSyncStatus("syncing");

  try {
    const [, statsResult] = await Promise.all([
      pushWorkoutSessions(userId, [session]),
      pushStats(userId, stats),
    ]);

    setSyncStatus("idle");
    return { error: statsResult.error };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    setSyncStatus("error");
    return { error: msg };
  }
}
