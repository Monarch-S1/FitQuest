-- =============================================================================
-- FitQuest — Row Level Security Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. USER PROFILES
-- Stores display name, fitness goal, level, avatar, and theme preferences.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'FITQUEST OPERATOR',
  fitness_goal TEXT NOT NULL DEFAULT 'general'
    CHECK (fitness_goal IN ('strength', 'muscle_gain', 'endurance', 'general')),
  fitness_level TEXT NOT NULL DEFAULT 'beginner'
    CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  avatar_url TEXT,
  theme_mode TEXT NOT NULL DEFAULT 'dark',
  accent_color TEXT NOT NULL DEFAULT 'amber',
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe to re-run)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

-- Policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Auto-update updated_at on modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. WORKOUT SESSIONS
-- Records each completed workout with XP, duration, and per-exercise data.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id TEXT NOT NULL,
  workout_date DATE NOT NULL,
  duration INTEGER NOT NULL,          -- seconds
  sets_completed INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by user and date
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date
  ON workout_sessions (user_id, workout_date DESC);

-- Enable RLS
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe to re-run)
DROP POLICY IF EXISTS "Users can view own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON workout_sessions;

-- Policies
CREATE POLICY "Users can view own sessions"
  ON workout_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON workout_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON workout_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON workout_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. USER PROGRESS
-- Tracks per-exercise progression (rep ranges, completion rate, trend).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  rep_range INTEGER[2] NOT NULL DEFAULT '{8, 12}',
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  total_reps INTEGER NOT NULL DEFAULT 0,
  average_reps NUMERIC(5,2) NOT NULL DEFAULT 0,
  high_end_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, exercise_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_progress_user
  ON user_progress (user_id);

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe to re-run)
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON user_progress;

-- Policies
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON user_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. USER STATS (aggregated for dashboard)
-- Stores computed stats so the app doesn't recompute on every load.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_workout_date DATE,
  total_workouts INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe to re-run)
DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can upsert own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON user_stats;

-- Policies
CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own stats"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────────────────────

COMMIT;
