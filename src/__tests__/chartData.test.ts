/**
 * @jest-environment node
 */

import { getStreakCalendar } from "../utils/chartData";
import { WorkoutSession } from "../stores/useUserStore";

function createSession(overrides: Partial<WorkoutSession> & { id?: string }): WorkoutSession {
  return {
    id: overrides.id ?? "s1",
    date: "2026-06-01",
    duration: 1800,
    setsCompleted: 6,
    xpEarned: 150,
    workoutId: "workout-96-0",
    exercises: [],
    ...overrides,
  };
}

describe("getStreakCalendar", () => {
  it("returns the requested number of days", () => {
    const result = getStreakCalendar([], 7);
    expect(result).toHaveLength(7);
  });

  it("marks days with workouts as hasWorkout=true", () => {
    const mockNow = new Date("2026-06-21T12:00:00Z");
    jest.useFakeTimers({ now: mockNow });

    const sessions = [createSession({ date: "2026-06-20" })];
    const result = getStreakCalendar(sessions, 7);

    const trainedDay = result.find((d) => d.date === "2026-06-20");
    expect(trainedDay?.hasWorkout).toBe(true);

    const otherDays = result.filter((d) => d.date !== "2026-06-20");
    expect(otherDays.every((d) => !d.hasWorkout)).toBe(true);

    jest.useRealTimers();
  });

  it("marks the last day as isToday", () => {
    const mockNow = new Date("2026-06-21T12:00:00Z");
    jest.useFakeTimers({ now: mockNow });

    const result = getStreakCalendar([], 3);

    expect(result).toHaveLength(3);
    expect(result[2].isToday).toBe(true);
    expect(result[0].isToday).toBe(false);
    expect(result[1].isToday).toBe(false);

    jest.useRealTimers();
  });

  it("sets correct dayOfWeek for each day (0=Sun, 6=Sat)", () => {
    const mockNow = new Date("2026-06-21T12:00:00Z");
    jest.useFakeTimers({ now: mockNow });

    const result = getStreakCalendar([], 1);

    expect(result).toHaveLength(1);
    expect(result[0].dayOfWeek).toBe(0);
    expect(result[0].date).toBe("2026-06-21");

    jest.useRealTimers();
  });

  it("defaults to 56 days when no days parameter given", () => {
    const result = getStreakCalendar([]);
    expect(result.length).toBeGreaterThanOrEqual(55);
    expect(result.length).toBeLessThanOrEqual(57);
  });
});
