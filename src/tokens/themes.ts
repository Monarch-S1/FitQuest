export type ThemeMode = "dark" | "light";
export type AccentKey = "amber" | "emerald" | "cyan" | "rose";

export interface AccentPalette {
  DEFAULT: string;
  light: string;
  dark: string;
  glow: string;
}

export interface ColorPalette {
  bg: {
    primary: string;
    elevated: string;
    highlight: string;
    surface: string;
  };
  accent: AccentPalette;
  success: string;
  successGlow: string;
  error: string;
  errorGlow: string;
  warning: string;
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
  };
  border: {
    subtle: string;
    accent: string;
  };
}

export const accentOptions: Record<AccentKey, AccentPalette> = {
  amber: {
    DEFAULT: "#F59E0B",
    light: "#FBBF24",
    dark: "#D97706",
    glow: "rgba(245, 158, 11, 0.25)",
  },
  emerald: {
    DEFAULT: "#10B981",
    light: "#34D399",
    dark: "#059669",
    glow: "rgba(16, 185, 129, 0.25)",
  },
  cyan: {
    DEFAULT: "#06B6D4",
    light: "#22D3EE",
    dark: "#0891B2",
    glow: "rgba(6, 182, 212, 0.25)",
  },
  rose: {
    DEFAULT: "#F43F5E",
    light: "#FB7185",
    dark: "#E11D48",
    glow: "rgba(244, 63, 94, 0.25)",
  },
};

const darkPalette: Omit<ColorPalette, "accent"> = {
  bg: {
    primary: "#080A0F",
    elevated: "#10131A",
    highlight: "#181C26",
    surface: "#0C0F16",
  },
  success: "#10B981",
  successGlow: "rgba(16, 185, 129, 0.2)",
  error: "#EF4444",
  errorGlow: "rgba(239, 68, 68, 0.2)",
  warning: "#F59E0B",
  text: {
    primary: "#F3F4F6",
    secondary: "#9CA3AF",
    tertiary: "#4B5563",
    accent: "#F59E0B",
  },
  border: {
    subtle: "#1E2130",
    accent: "#F59E0B",
  },
};

const lightPalette: Omit<ColorPalette, "accent"> = {
  bg: {
    primary: "#F9FAFB",
    elevated: "#FFFFFF",
    highlight: "#F3F4F6",
    surface: "#F0F0F5",
  },
  success: "#059669",
  successGlow: "rgba(5, 150, 105, 0.15)",
  error: "#DC2626",
  errorGlow: "rgba(220, 38, 38, 0.15)",
  warning: "#D97706",
  text: {
    primary: "#111827",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    accent: "#D97706",
  },
  border: {
    subtle: "#E5E7EB",
    accent: "#D97706",
  },
};

const palettes: Record<ThemeMode, Omit<ColorPalette, "accent">> = {
  dark: darkPalette,
  light: lightPalette,
};

/** Merge the base palette with the chosen accent colors */
export function getColors(mode: ThemeMode, accentKey: AccentKey): ColorPalette {
  const base = palettes[mode];
  const accent = accentOptions[accentKey];
  return {
    ...base,
    accent,
    text: {
      ...base.text,
      accent: accent.DEFAULT,
    },
    border: {
      ...base.border,
      accent: accent.DEFAULT,
    },
  };
}

export const ACCENT_LABELS: Record<AccentKey, string> = {
  amber: "Amber",
  emerald: "Emerald",
  cyan: "Cyan",
  rose: "Rose",
};
