import { getLocalToday } from "./date";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  isActiveToday: boolean;
}

export function calculateStreak(
  workoutDates: string[],
  today: string = getLocalToday(),
): StreakData {
  if (workoutDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null, isActiveToday: false };
  }

  const sorted = [...new Set(workoutDates)].sort().reverse();
  const todayDate = new Date(today);
  const isActiveToday = sorted[0] === today;

  let currentStreak = 0;
  if (isActiveToday || sorted[0] === getDateString(addDays(todayDate, -1))) {
    currentStreak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prevDate = new Date(sorted[i - 1]);
      const currDate = new Date(sorted[i]);
      const diffDays = daysBetween(prevDate, currDate);
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1]);
    const currDate = new Date(sorted[i]);
    const diffDays = daysBetween(prevDate, currDate);
    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak,
    lastWorkoutDate: sorted[0],
    isActiveToday,
  };
}

function getDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round(Math.abs(a.getTime() - b.getTime()) / msPerDay);
}
