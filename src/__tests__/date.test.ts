/**
 * @jest-environment node
 */

import { getLocalToday, parseLocalDate } from "../utils/date";

// ═══════════════════════════════════════════════════
// getLocalToday
// ═══════════════════════════════════════════════════

describe("getLocalToday", () => {
  it("returns a string in YYYY-MM-DD format", () => {
    const today = getLocalToday();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns the current local date", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    expect(getLocalToday()).toBe(expected);
  });

  it("has zero-padded month and day", () => {
    // Mock a date where month and day need padding (e.g., Jan 5)
    const realDate = global.Date;
    const mockDate = new Date("2026-01-05T12:00:00");
    jest.useFakeTimers({ now: mockDate });

    const today = getLocalToday();
    expect(today).toBe("2026-01-05");
    expect(today).toMatch(/^\d{4}-01-05$/);

    jest.useRealTimers();
    global.Date = realDate;
  });
});

// ═══════════════════════════════════════════════════
// parseLocalDate
// ═══════════════════════════════════════════════════

describe("parseLocalDate", () => {
  it("returns a timestamp (number) for a valid date string", () => {
    const result = parseLocalDate("2026-06-15");
    expect(typeof result).toBe("number");
    expect(result).not.toBeNaN();
  });

  it("parses dates correctly (month - 1 for JS Date)", () => {
    // June 15, 2026 in local timezone
    const ts = parseLocalDate("2026-06-15");
    const d = new Date(ts);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // June = 5
    expect(d.getDate()).toBe(15);
  });

  it("handles January (month 01) correctly", () => {
    const ts = parseLocalDate("2026-01-01");
    const d = new Date(ts);
    expect(d.getMonth()).toBe(0); // January = 0
    expect(d.getDate()).toBe(1);
  });

  it("handles December (month 12) correctly", () => {
    const ts = parseLocalDate("2026-12-25");
    const d = new Date(ts);
    expect(d.getMonth()).toBe(11); // December = 11
    expect(d.getDate()).toBe(25);
  });

  it("produces consistent timestamps for the same date", () => {
    const ts1 = parseLocalDate("2026-06-15");
    const ts2 = parseLocalDate("2026-06-15");
    expect(ts1).toBe(ts2);
  });

  it("produces different timestamps for different dates", () => {
    const ts1 = parseLocalDate("2026-06-15");
    const ts2 = parseLocalDate("2026-06-16");
    expect(ts1).toBeLessThan(ts2);
  });

  it("handles year boundaries correctly", () => {
    const ts = parseLocalDate("2025-01-01");
    const d = new Date(ts);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });
});
