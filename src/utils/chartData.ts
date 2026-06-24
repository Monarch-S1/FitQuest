import { WorkoutSession } from "../stores/useUserStore";

export interface StreakDay {
  date: string;
  hasWorkout: boolean;
  dayOfWeek: number;
  isToday: boolean;
}

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
