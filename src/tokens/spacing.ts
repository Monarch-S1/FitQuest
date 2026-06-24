/**
 * FitQuest Design Tokens — Spacing
 *
 * New named tiers: xs, sm, md, lg, xl, xxl
 * Legacy numeric keys preserved for backward compatibility.
 */

const newSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Legacy numeric keys for backward compatibility
export const spacing: Record<number, number> & typeof newSpacing = {
  ...newSpacing,
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
};

export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 10,
  xl: 16,
  full: 9999,
} as const;
