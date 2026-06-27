/**
 * Visual effects system for enhanced UI polish.
 * Includes glass morphism, gradient overlays, and layering effects.
 */

import { ViewStyle } from "react-native";

/**
 * Glass morphism effect: semi-transparent background with subtle blur.
 * Use for elevated surfaces, modals, floating elements.
 */
export const glassEffect = {
  backgroundColor: "rgba(27, 24, 32, 0.8)", // Elevated bg at 80% opacity
  borderColor: "rgba(201, 149, 74, 0.2)", // Accent border at 20% opacity
  borderWidth: 1,
} as ViewStyle;

/**
 * Deep glass effect: more opaque for important modals
 */
export const glassEffectDeep = {
  backgroundColor: "rgba(27, 24, 32, 0.95)", // Elevated bg at 95% opacity
  borderColor: "rgba(201, 149, 74, 0.3)",
  borderWidth: 1,
} as ViewStyle;

/**
 * Light glass effect: subtle, almost transparent for overlays
 */
export const glassEffectLight = {
  backgroundColor: "rgba(27, 24, 32, 0.6)", // Elevated bg at 60% opacity
  borderColor: "rgba(201, 149, 74, 0.1)",
  borderWidth: 1,
} as ViewStyle;

/**
 * Layer effect: combines shadow + slight scale transform for depth
 * Use with shadows.elevation2+ for maximum effect
 */
export const layerEffect = {
  transform: [{ scale: 0.98 }],
} as ViewStyle;

/**
 * Gradient overlay style (requires LinearGradient component)
 * Used for visual interest on cards and headers
 */
export const gradientOverlayBronze = {
  colors: ["rgba(201, 149, 74, 0.1)", "rgba(201, 149, 74, 0)"],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

export const gradientOverlayAccent = {
  colors: ["rgba(201, 149, 74, 0.15)", "rgba(201, 149, 74, 0.05)"],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 0 },
};

/**
 * Backdrop blur intensity values for glass morphism
 */
export const backdropBlur = {
  light: 4,
  medium: 8,
  heavy: 12,
  extreme: 20,
} as const;

/**
 * Glow effect for important elements
 * iOS: shadow-based; Android: elevation-based
 */
export const glowEffect = {
  ios: {
    shadowColor: "#C9954A", // Accent color
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
  },
  android: {
    elevation: 8,
  },
};
