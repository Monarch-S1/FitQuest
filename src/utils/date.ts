/**
 * Shared date utilities for consistent local-time date handling.
 * Avoids new Date("YYYY-MM-DD") being interpreted as UTC.
 */

/** Get today's date in local timezone as YYYY-MM-DD */
export function getLocalToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Parse a YYYY-MM-DD date string as local midnight.
 * Avoids new Date("YYYY-MM-DD") being interpreted as UTC.
 */
export function parseLocalDate(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}
