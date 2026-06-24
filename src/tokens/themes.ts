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
    // New names (preferred)
    base: string;
    card: string;
    highlight: string;
    // Legacy aliases for backward compatibility
    primary: string;
    elevated: string;
    surface: string;
  };
  accent: AccentPalette;
  success: string;
  successGlow: string;
  error: string;
  errorGlow: string;
  warning: string;
  recovery: string;
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
    DEFAULT: "#C9954A",
    light: "#E0BC6A",
    dark: "#A67B32",
    glow: "rgba(201, 149, 74, 0.2)",
  },
  emerald: {
    DEFAULT: "#7A9A6D",
    light: "#9CBA8E",
    dark: "#5E8262",
    glow: "rgba(122, 154, 109, 0.2)",
  },
  cyan: {
    DEFAULT: "#6E9490",
    light: "#8EB0AC",
    dark: "#5A807C",
    glow: "rgba(110, 148, 144, 0.2)",
  },
  rose: {
    DEFAULT: "#C4715A",
    light: "#D9917C",
    dark: "#A85D48",
    glow: "rgba(196, 113, 90, 0.2)",
  },
};

const darkPalette: Omit<ColorPalette, "accent"> = {
  bg: {
    base: "#100E13",
    card: "#1B1820",
    highlight: "#26222E",
    primary: "#100E13",
    elevated: "#1B1820",
    surface: "#1B1820",
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
};

const lightPalette: Omit<ColorPalette, "accent"> = {
  bg: {
    base: "#F2EDE4",
    card: "#F9F5EE",
    highlight: "#EBE5DA",
    primary: "#F2EDE4",
    elevated: "#F9F5EE",
    surface: "#F9F5EE",
  },
  success: "#5E8262",
  successGlow: "rgba(94, 130, 98, 0.15)",
  error: "#A85D48",
  errorGlow: "rgba(168, 93, 72, 0.15)",
  warning: "#A67B32",
  recovery: "#5A807C",
  text: {
    primary: "#2A2520",
    secondary: "#7A7268",
    tertiary: "#A89E93",
    accent: "#C9954A",
  },
  border: {
    subtle: "#E0D9CE",
    accent: "#C9954A",
  },
};

const palettes: Record<ThemeMode, Omit<ColorPalette, "accent">> = {
  dark: darkPalette,
  light: lightPalette,
};

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
