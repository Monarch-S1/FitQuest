import { WorkoutSession } from "../stores/useUserStore";

export interface ChartPoint {
  label: string;
  value: number;
  date: string;
}

export interface ChartData {
  points: ChartPoint[];
  maxValue: number;
  unit: string;
}

export interface StreakDay {
  date: string;
  hasWorkout: boolean;
  dayOfWeek: number;
  isToday: boolean;
}

export interface WeekdayCount {
  day: string;
  count: number;
  percentage: number;
}

/** Format a date string to a short label like "Jan 15" */
function formatLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${month} ${d.getDate()}`;
}

/** Group sessions by date, combining multiple sessions on the same day */
function groupByDate(history: WorkoutSession[]): Map<string, WorkoutSession[]> {
  const map = new Map<string, WorkoutSession[]>();
  for (const session of history) {
    const existing = map.get(session.date) || [];
    existing.push(session);
    map.set(session.date, existing);
  }
  return map;
}

/** Get volume (total sets) per session date */
export function getVolumeData(history: WorkoutSession[], maxPoints: number = 20): ChartData {
  const byDate = groupByDate(history);
  const sorted = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-maxPoints);

  const points: ChartPoint[] = sorted.map(([date, sessions]) => ({
    label: formatLabel(date),
    value: sessions.reduce((sum, s) => sum + s.setsCompleted, 0),
    date,
  }));

  const maxValue = points.length > 0 ? Math.max(...points.map((p) => p.value)) : 0;

  return { points, maxValue, unit: "sets" };
}

/** Get XP earned per session date */
export function getXpData(history: WorkoutSession[], maxPoints: number = 20): ChartData {
  const byDate = groupByDate(history);
  const sorted = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-maxPoints);

  const points: ChartPoint[] = sorted.map(([date, sessions]) => ({
    label: formatLabel(date),
    value: sessions.reduce((sum, s) => sum + s.xpEarned, 0),
    date,
  }));

  const maxValue = points.length > 0 ? Math.max(...points.map((p) => p.value)) : 0;

  return { points, maxValue, unit: "xp" };
}

/** Get workout duration per individual session (in minutes) */
export function getDurationData(history: WorkoutSession[], maxPoints: number = 20): ChartData {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date)).slice(-maxPoints);

  // Track how many sessions we've seen per date for disambiguation
  const dateCounts = new Map<string, number>();

  const points: ChartPoint[] = sorted.map((session) => {
    const count = dateCounts.get(session.date) || 0;
    dateCounts.set(session.date, count + 1);
    const base = formatLabel(session.date);
    return {
      label: count > 0 ? `${base} #${count + 1}` : base,
      value: Math.round(session.duration / 60),
      date: session.date,
    };
  });

  const maxValue = points.length > 0 ? Math.max(...points.map((p) => p.value)) : 0;

  return { points, maxValue, unit: "min" };
}

/** Get streak calendar data for the last N days */
export function getStreakCalendar(history: WorkoutSession[], days: number = 56): StreakDay[] {
  const workoutDates = new Set(history.map((s) => s.date));
  const result: StreakDay[] = [];

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    result.push({
      date: dateStr,
      hasWorkout: workoutDates.has(dateStr),
      dayOfWeek: d.getDay(),
      isToday: i === 0,
    });
  }

  return result;
}

/** Get workout count by weekday (for consistency analysis) */
export function getWorkoutByWeekday(history: WorkoutSession[]): WeekdayCount[] {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const counts = new Array(7).fill(0);

  const uniqueDates = new Set(history.map((s) => s.date));
  for (const dateStr of uniqueDates) {
    const d = new Date(dateStr + "T12:00:00");
    counts[d.getDay()]++;
  }

  const maxCount = Math.max(...counts, 1);

  return dayNames.map((day, i) => ({
    day,
    count: counts[i],
    percentage: Math.round((counts[i] / maxCount) * 100),
  })) as (WeekdayCount & { percentage: number })[];
}

export interface HistorySummary {
  totalWorkouts: number;
  totalXp: number;
  totalSets: number;
  averageDurationMin: number;
  averageSetsPerWorkout: number;
  longestStreak: number;
}
