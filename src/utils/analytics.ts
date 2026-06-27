/**
 * Analytics utilities for data aggregation and grouping
 */

export interface WorkoutSession {
  id: string;
  workoutId: string;
  date: string; // YYYY-MM-DD format
  duration: number; // seconds
  setsCompleted: number;
  xpEarned: number;
}

export interface DayStats {
  date: string;
  workoutId?: string;
  duration?: number;
  setsCompleted?: number;
  xpEarned?: number;
  completed: boolean;
}

export interface WeekStats {
  weekStart: string;
  weekEnd: string;
  days: DayStats[];
  totalWorkouts: number;
  totalXp: number;
  totalDuration: number; // seconds
}

/**
 * Get the current ISO week (Mon-Sun)
 */
export function getCurrentWeek(): { start: string; end: string } {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return {
    start: weekStart.toISOString().split("T")[0],
    end: weekEnd.toISOString().split("T")[0],
  };
}

/**
 * Get previous ISO week
 */
export function getPreviousWeek(weekStart: string): { start: string; end: string } {
  const date = new Date(weekStart);
  date.setDate(date.getDate() - 7);
  const start = date.toISOString().split("T")[0];

  const end = new Date(date);
  end.setDate(date.getDate() + 6);

  return {
    start,
    end: end.toISOString().split("T")[0],
  };
}

/**
 * Group workouts by week
 */
export function groupByWeek(sessions: WorkoutSession[]): WeekStats[] {
  const weeks: Record<string, WeekStats> = {};

  sessions.forEach((session) => {
    const date = new Date(session.date);
    const dayOfWeek = date.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - daysFromMonday);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    if (!weeks[weekStartStr]) {
      weeks[weekStartStr] = {
        weekStart: weekStartStr,
        weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        days: generateDayStubs(weekStartStr),
        totalWorkouts: 0,
        totalXp: 0,
        totalDuration: 0,
      };
    }

    const dayStats = weeks[weekStartStr].days.find((d) => d.date === session.date);
    if (dayStats) {
      dayStats.workoutId = session.workoutId;
      dayStats.duration = session.duration;
      dayStats.setsCompleted = session.setsCompleted;
      dayStats.xpEarned = session.xpEarned;
      dayStats.completed = true;
    }

    weeks[weekStartStr].totalWorkouts += 1;
    weeks[weekStartStr].totalXp += session.xpEarned;
    weeks[weekStartStr].totalDuration += session.duration;
  });

  return Object.values(weeks).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}

/**
 * Generate empty day stubs for a week
 */
function generateDayStubs(weekStart: string): DayStats[] {
  const days: DayStats[] = [];
  const startDate = new Date(weekStart);

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push({
      date: date.toISOString().split("T")[0],
      completed: false,
    });
  }

  return days;
}

/**
 * Format week range label (e.g., "Feb 10 — Feb 16")
 */
export function formatWeekLabel(weekStart: string, weekEnd: string): string {
  const startDate = new Date(weekStart + "T00:00:00Z");
  const endDate = new Date(weekEnd + "T00:00:00Z");

  const monthStart = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const monthEnd = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `${monthStart} — ${monthEnd}`;
}

/**
 * Get time period label (This Week, Last Week, etc.)
 */
export function getTimePeriodLabel(weekStart: string): string {
  const currentWeek = getCurrentWeek();

  if (weekStart === currentWeek.start) {
    return "THIS WEEK";
  }

  const prevWeek = getPreviousWeek(currentWeek.start);
  if (weekStart === prevWeek.start) {
    return "LAST WEEK";
  }

  return formatWeekLabel(
    weekStart,
    new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
}

/**
 * Check if today has a completed workout
 */
export function hasWorkoutToday(sessions: WorkoutSession[]): boolean {
  const today = new Date().toISOString().split("T")[0];
  return sessions.some((s) => s.date === today);
}

/**
 * Get last N days with workout data
 */
export function getLastNDaysData(sessions: WorkoutSession[], days: number = 30): DayStats[] {
  const dayMap: Record<string, DayStats> = {};

  // Create stubs for last N days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    dayMap[dateStr] = { date: dateStr, completed: false };
  }

  // Fill in workout data
  sessions.forEach((session) => {
    if (dayMap[session.date]) {
      dayMap[session.date] = {
        date: session.date,
        workoutId: session.workoutId,
        duration: session.duration,
        setsCompleted: session.setsCompleted,
        xpEarned: session.xpEarned,
        completed: true,
      };
    }
  });

  return Object.values(dayMap);
}
