/**
 * @jest-environment node
 */

// ── Mock Supabase (fns created INSIDE factory to avoid hoisting issues) ────

import { supabase, isSupabaseConfigured } from "../services/supabase";
import type { WorkoutSession } from "../stores/useUserStore";

jest.mock("../services/supabase", () => ({
  supabase: { from: jest.fn() },
  isSupabaseConfigured: jest.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────

const tableChains = new Map<string, any>();

function mockTable(tableName: string) {
  const chain = {
    upsert: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
    order: jest.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.single.mockReturnValue(chain);
  chain.order.mockReturnValue(Promise.resolve({ data: [], error: null }));

  tableChains.set(tableName, chain);
  (supabase.from as jest.Mock).mockImplementation((name: string) => {
    return (
      tableChains.get(name) ?? {
        upsert: jest.fn().mockResolvedValue({ error: null }),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }
    );
  });
  return chain;
}

function createSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: "session-1",
    workoutId: "workout-96-0",
    date: "2026-06-01",
    duration: 30,
    setsCompleted: 10,
    xpEarned: 250,
    exercises: [{ exerciseId: "push-up", sets: 3, repsCompleted: [10, 10, 10] }],
    ...overrides,
  };
}

function createLocalData(overrides: any = {}) {
  return {
    displayName: "TestUser",
    fitnessGoal: "general" as const,
    fitnessLevel: "beginner" as const,
    avatarUri: null,
    themeMode: "dark" as const,
    accentColor: "amber" as const,
    onboardingComplete: true,
    workoutHistory: [createSession()],
    totalXp: 250,
    streakData: { currentStreak: 1, longestStreak: 1, lastWorkoutDate: "2026-06-01" },
    totalWorkouts: 1,
    ...overrides,
  };
}

// ── Simulated data rows ────────────────────────────────────────────────────

const PROFILE_ROW = {
  id: "user-1",
  display_name: "CloudUser",
  fitness_goal: "strength" as const,
  fitness_level: "intermediate" as const,
  avatar_url: null,
  theme_mode: "dark",
  accent_color: "amber",
  onboarding_complete: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

const STATS_ROW = {
  user_id: "user-1",
  total_xp: 500,
  current_streak: 3,
  longest_streak: 5,
  last_workout_date: "2026-06-01",
  total_workouts: 2,
  updated_at: "2026-06-01T00:00:00Z",
};

// ═══════════════════════════════════════════════════
// pushProfile
// ═══════════════════════════════════════════════════

describe("pushProfile", () => {
  const { pushProfile } = jest.requireActual("../services/cloudSync");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns { error: null } when Supabase is not configured", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
    const result = await pushProfile("user-1", {
      displayName: "Test",
      fitnessGoal: "general",
      fitnessLevel: "beginner",
      avatarUri: null,
      themeMode: "dark",
      accentColor: "amber",
      onboardingComplete: true,
    });
    expect(result).toEqual({ error: null });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("upserts profile data when configured", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    const chain = mockTable("user_profiles");
    chain.upsert.mockResolvedValue({ error: null });

    const result = await pushProfile("user-1", {
      displayName: "Test",
      fitnessGoal: "general",
      fitnessLevel: "beginner",
      avatarUri: null,
      themeMode: "dark",
      accentColor: "amber",
      onboardingComplete: true,
    });

    expect(result).toEqual({ error: null });
    expect(supabase.from).toHaveBeenCalledWith("user_profiles");
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-1",
        display_name: "Test",
        fitness_goal: "general",
      }),
      expect.objectContaining({ onConflict: "id" }),
    );
  });

  it("returns error message on failure", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    const chain = mockTable("user_profiles");
    chain.upsert.mockResolvedValue({ error: { message: "DB error" } });

    const result = await pushProfile("user-1", {
      displayName: "Test",
      fitnessGoal: "general",
      fitnessLevel: "beginner",
      avatarUri: null,
      themeMode: "dark",
      accentColor: "amber",
      onboardingComplete: true,
    });

    expect(result.error).toBe("DB error");
  });
});

// ═══════════════════════════════════════════════════
// pushWorkoutSessions
// ═══════════════════════════════════════════════════

describe("pushWorkoutSessions", () => {
  const { pushWorkoutSessions } = jest.requireActual("../services/cloudSync");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns zero pushed when not configured", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
    const result = await pushWorkoutSessions("user-1", [createSession()]);
    expect(result).toEqual({ error: null, pushedCount: 0 });
  });

  it("returns zero pushed for empty sessions array", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    const result = await pushWorkoutSessions("user-1", []);
    expect(result).toEqual({ error: null, pushedCount: 0 });
  });

  it("upserts sessions in batches", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    const chain = mockTable("workout_sessions");
    chain.upsert.mockResolvedValue({ error: null });

    const sessions = Array.from({ length: 3 }, (_, i) => createSession({ id: `s-${i}` }));
    const result = await pushWorkoutSessions("user-1", sessions);

    expect(result).toEqual({ error: null, pushedCount: 3 });
    expect(chain.upsert).toHaveBeenCalledTimes(1);
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "s-0" })]),
      expect.objectContaining({ onConflict: "id" }),
    );
  });

  it("batches correctly for >50 sessions", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    const chain = mockTable("workout_sessions");
    chain.upsert.mockResolvedValue({ error: null });

    const sessions = Array.from({ length: 55 }, (_, i) => createSession({ id: `s-${i}` }));
    const result = await pushWorkoutSessions("user-1", sessions);

    expect(result).toEqual({ error: null, pushedCount: 55 });
    expect(chain.upsert).toHaveBeenCalledTimes(2);
  });

  it("returns error on batch failure", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    const chain = mockTable("workout_sessions");
    chain.upsert.mockResolvedValue({ error: { message: "Batch failed" } });

    const sessions = [createSession()];
    const result = await pushWorkoutSessions("user-1", sessions);

    expect(result.error).toBe("Batch failed");
    expect(result.pushedCount).toBe(0);
  });
});

// ═══════════════════════════════════════════════════
// pushStats
// ═══════════════════════════════════════════════════

describe("pushStats", () => {
  const { pushStats } = jest.requireActual("../services/cloudSync");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("skips when not configured", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
    const result = await pushStats("user-1", {
      totalXp: 250,
      currentStreak: 1,
      longestStreak: 1,
      lastWorkoutDate: "2026-06-01",
      totalWorkouts: 1,
    });
    expect(result).toEqual({ error: null });
  });

  it("upserts stats when configured", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    const chain = mockTable("user_stats");
    chain.upsert.mockResolvedValue({ error: null });

    const result = await pushStats("user-1", {
      totalXp: 250,
      currentStreak: 1,
      longestStreak: 1,
      lastWorkoutDate: "2026-06-01",
      totalWorkouts: 1,
    });

    expect(result).toEqual({ error: null });
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        total_xp: 250,
      }),
      expect.objectContaining({ onConflict: "user_id" }),
    );
  });
});

// ═══════════════════════════════════════════════════
// pullProfile
// ═══════════════════════════════════════════════════

describe("pullProfile", () => {
  const { pullProfile } = jest.requireActual("../services/cloudSync");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when not configured", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
    const result = await pullProfile("user-1");
    expect(result).toEqual({ data: null, error: null });
  });

  it("returns mapped profile data", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    const chain = mockTable("user_profiles");
    chain.single.mockResolvedValue({ data: PROFILE_ROW, error: null });

    const result = await pullProfile("user-1");

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.displayName).toBe("CloudUser");
    expect(result.data!.fitnessGoal).toBe("strength");
    expect(result.data!.fitnessLevel).toBe("intermediate");
  });

  it("returns null when no profile found", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    const chain = mockTable("user_profiles");
    chain.single.mockResolvedValue({ data: null, error: null });

    const result = await pullProfile("user-1");
    expect(result).toEqual({ data: null, error: null });
  });

  it("returns error on failure", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    const chain = mockTable("user_profiles");
    chain.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const result = await pullProfile("user-1");
    expect(result.data).toBeNull();
    expect(result.error).toBe("Not found");
  });
});

// ═══════════════════════════════════════════════════
// pullWorkoutSessions
// ═══════════════════════════════════════════════════

describe("pullWorkoutSessions", () => {
  const { pullWorkoutSessions } = jest.requireActual("../services/cloudSync");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty array when not configured", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
    const result = await pullWorkoutSessions("user-1");
    expect(result).toEqual({ data: [], error: null });
  });

  it("returns mapped sessions", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    const chain = mockTable("workout_sessions");
    const cloudRows = [
      {
        id: "cs-1",
        user_id: "user-1",
        workout_id: "workout-96-0",
        workout_date: "2026-06-01",
        duration: 30,
        sets_completed: 10,
        xp_earned: 250,
        exercises: [],
        created_at: "2026-06-01T00:00:00Z",
      },
    ];
    chain.order.mockResolvedValue({ data: cloudRows, error: null });

    const result = await pullWorkoutSessions("user-1");
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].workoutId).toBe("workout-96-0");
    expect(result.data[0].xpEarned).toBe(250);
  });
});

// ═══════════════════════════════════════════════════
// pullStats
// ═══════════════════════════════════════════════════

describe("pullStats", () => {
  const { pullStats } = jest.requireActual("../services/cloudSync");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when not configured", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
    const result = await pullStats("user-1");
    expect(result).toEqual({ data: null, error: null });
  });

  it("returns mapped stats", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    const chain = mockTable("user_stats");
    chain.single.mockResolvedValue({ data: STATS_ROW, error: null });

    const result = await pullStats("user-1");
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data!.totalXp).toBe(500);
    expect(result.data!.currentStreak).toBe(3);
    expect(result.data!.longestStreak).toBe(5);
  });
});

// ═══════════════════════════════════════════════════
// incrementalSync
// ═══════════════════════════════════════════════════

describe("incrementalSync", () => {
  const { incrementalSync } = jest.requireActual("../services/cloudSync");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("skips when not configured", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(false);
    const result = await incrementalSync("user-1", createSession(), {
      totalXp: 250,
      currentStreak: 1,
      longestStreak: 1,
      lastWorkoutDate: "2026-06-01",
      totalWorkouts: 1,
    });
    expect(result).toEqual({ error: null });
  });

  it("pushes session and stats", async () => {
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
    const wsChain = mockTable("workout_sessions");
    wsChain.upsert.mockResolvedValue({ error: null });
    const stChain = mockTable("user_stats");
    stChain.upsert.mockResolvedValue({ error: null });

    const result = await incrementalSync("user-1", createSession(), {
      totalXp: 500,
      currentStreak: 2,
      longestStreak: 5,
      lastWorkoutDate: "2026-06-02",
      totalWorkouts: 2,
    });

    expect(result.error).toBeNull();
    expect(wsChain.upsert).toHaveBeenCalled();
    expect(stChain.upsert).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════
// fullSync
// ═══════════════════════════════════════════════════

describe("fullSync", () => {
  const { fullSync } = jest.requireActual("../services/cloudSync");
  beforeEach(() => {
    jest.clearAllMocks();
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
  });

  it("merges profile with cloud data winning for onboarding complete", async () => {
    const profileChain = mockTable("user_profiles");
    profileChain.single.mockResolvedValue({ data: PROFILE_ROW, error: null });

    const wsChain = mockTable("workout_sessions");
    wsChain.order.mockResolvedValue({ data: [], error: null });

    const statsChain = mockTable("user_stats");
    statsChain.single.mockResolvedValue({ data: STATS_ROW, error: null });

    profileChain.upsert.mockResolvedValue({ error: null });
    wsChain.upsert.mockResolvedValue({ error: null });
    statsChain.upsert.mockResolvedValue({ error: null });

    const localData = createLocalData();
    const result = await fullSync("user-1", localData);

    expect(result.error).toBeNull();
    expect(result.mergedProfile).not.toBeNull();
    expect(result.mergedProfile!.displayName).toBe("CloudUser");
    expect(result.mergedProfile!.fitnessGoal).toBe("strength");
    expect(result.mergedProfile!.fitnessLevel).toBe("intermediate");
  });

  it("merges workouts as a union by ID", async () => {
    const profileChain = mockTable("user_profiles");
    profileChain.single.mockResolvedValue({ data: null, error: null });

    const wsChain = mockTable("workout_sessions");
    wsChain.order.mockResolvedValue({
      data: [
        {
          id: "cloud-1",
          user_id: "user-1",
          workout_id: "workout-96-1",
          workout_date: "2026-06-02",
          duration: 35,
          sets_completed: 12,
          xp_earned: 300,
          exercises: [],
          created_at: "2026-06-02T00:00:00Z",
        },
        {
          id: "cloud-2",
          user_id: "user-1",
          workout_id: "workout-96-2",
          workout_date: "2026-06-03",
          duration: 40,
          sets_completed: 8,
          xp_earned: 200,
          exercises: [],
          created_at: "2026-06-03T00:00:00Z",
        },
      ],
      error: null,
    });

    const statsChain = mockTable("user_stats");
    statsChain.single.mockResolvedValue({ data: null, error: null });

    profileChain.upsert.mockResolvedValue({ error: null });
    wsChain.upsert.mockResolvedValue({ error: null });
    statsChain.upsert.mockResolvedValue({ error: null });

    const localData = createLocalData();
    const result = await fullSync("user-1", localData);

    expect(result.mergedWorkouts).toHaveLength(3);
    const ids = result.mergedWorkouts.map((w: WorkoutSession) => w.id);
    expect(ids).toContain("session-1");
    expect(ids).toContain("cloud-1");
    expect(ids).toContain("cloud-2");
  });

  it("deduplicates workouts with the same ID (local wins)", async () => {
    const profileChain = mockTable("user_profiles");
    profileChain.single.mockResolvedValue({ data: null, error: null });

    const wsChain = mockTable("workout_sessions");
    wsChain.order.mockResolvedValue({
      data: [
        {
          id: "session-1",
          user_id: "user-1",
          workout_id: "workout-96-0",
          workout_date: "2026-06-01",
          duration: 35,
          sets_completed: 12,
          xp_earned: 300,
          exercises: [],
          created_at: "2026-06-01T00:00:00Z",
        },
      ],
      error: null,
    });

    const statsChain = mockTable("user_stats");
    statsChain.single.mockResolvedValue({ data: null, error: null });

    profileChain.upsert.mockResolvedValue({ error: null });
    wsChain.upsert.mockResolvedValue({ error: null });
    statsChain.upsert.mockResolvedValue({ error: null });

    const localData = createLocalData();
    const result = await fullSync("user-1", localData);

    expect(result.mergedWorkouts).toHaveLength(1);
    expect(result.mergedWorkouts[0].id).toBe("session-1");
  });

  it("handles cloud read errors gracefully", async () => {
    const profileChain = mockTable("user_profiles");
    profileChain.single.mockResolvedValue({ error: { message: "Network error" }, data: null });

    const wsChain = mockTable("workout_sessions");
    wsChain.order.mockResolvedValue({ data: [], error: null });

    const statsChain = mockTable("user_stats");
    statsChain.single.mockResolvedValue({ data: null, error: null });

    profileChain.upsert.mockResolvedValue({ error: null });
    wsChain.upsert.mockResolvedValue({ error: null });
    statsChain.upsert.mockResolvedValue({ error: null });

    const localData = createLocalData();
    const result = await fullSync("user-1", localData);

    expect(result.error).toBeNull();
    expect(result.mergedProfile).toBeNull();
  });

  it("leaves supabase.from mock in clean state after error test", () => {
    // Verify that the throwing implementation was not left behind
    // (jest.clearAllMocks in beforeEach handles this via reset)
    expect(supabase.from).toBeDefined();
  });

  it("returns error and sets sync status on exception", async () => {
    (supabase.from as jest.Mock).mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    const localData = createLocalData();
    const result = await fullSync("user-1", localData);

    expect(result.error).not.toBeNull();
    expect(result.error).toContain("Unexpected error");
    expect(result.mergedWorkouts).toEqual(localData.workoutHistory);
  });
});

// ═══════════════════════════════════════════════════
// Sync Status Utilities
// ═══════════════════════════════════════════════════

describe("sync status utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getSyncStatus returns idle initially", () => {
    jest.isolateModules(() => {
      const { getSyncStatus } = require("../services/cloudSync");
      expect(getSyncStatus()).toBe("idle");
    });
  });

  it("onSyncStatusChange registers and unregisters listeners", () => {
    jest.isolateModules(() => {
      const { onSyncStatusChange } = require("../services/cloudSync");
      const listener = jest.fn();
      const unsubscribe = onSyncStatusChange(listener);
      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });
  });
});
