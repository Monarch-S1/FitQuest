/**
 * FitQuest Design Tokens — Colors
 *
 * Warm, calming palette inspired by the Solo Leveling system UI —
 * deep charcoals, sepia stone, parchment text, and muted bronze accents.
 * Designed for tranquility and readability, not visual noise.
 *
 * Legacy keys (primary, elevated, surface) are preserved as aliases
 * for backward compatibility during the redesign migration.
 */

export const colors = {
  bg: {
    // New names (preferred)
    base: "#100E13",
    card: "#1B1820",
    highlight: "#26222E",
    // Legacy aliases
    primary: "#100E13",
    elevated: "#1B1820",
    surface: "#1B1820",
  },
  accent: {
    DEFAULT: "#C9954A",
    light: "#E0BC6A",
    dark: "#A67B32",
    glow: "rgba(201, 149, 74, 0.2)",
  },
  success: "#7A9A6D",
  successGlow: "rgba(122, 154, 109, 0.2)",
  error: "#C4715A",
  errorGlow: "rgba(196, 113, 90, 0.2)",
  warning: "#D4A853",
  recovery: "#6E9490",
  text: {
    primary: "#EDE8DC",
    secondary: "#9C9285",
    tertiary: "#655D53",
    accent: "#C9954A",
  },
  border: {
    subtle: "#2A2730",
    accent: "#C9954A",
  },
} as const;
