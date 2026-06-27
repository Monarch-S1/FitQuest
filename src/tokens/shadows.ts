/**
 * Shadow system for depth hierarchy.
 * Uses elevation levels to create visual layering.
 */

export const shadows = {
  /**
   * Elevation 1: Subtle shadows for cards, list items
   * Use on content that sits on the base layer
   */
  elevation1: {
    ios: {
      shadowColor: "#000000",
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  },

  /**
   * Elevation 2: Medium shadows for modals, containers
   * Use on content floating above the main surface
   */
  elevation2: {
    ios: {
      shadowColor: "#000000",
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
  },

  /**
   * Elevation 3: Pronounced shadows for floating buttons, critical elements
   * Use on content that demands attention
   */
  elevation3: {
    ios: {
      shadowColor: "#000000",
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 20,
    },
    android: {
      elevation: 8,
    },
  },

  /**
   * Elevation 4: Maximum depth for top-level modals, alerts
   * Use on the highest-priority interactive elements
   */
  elevation4: {
    ios: {
      shadowColor: "#000000",
      shadowOpacity: 0.45,
      shadowOffset: { width: 0, height: 16 },
      shadowRadius: 32,
    },
    android: {
      elevation: 16,
    },
  },

  /**
   * No shadow variant
   */
  none: {
    ios: {
      shadowColor: "transparent",
      shadowOpacity: 0,
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 0,
    },
    android: {
      elevation: 0,
    },
  },
};

/**
 * Get platform-specific shadow style
 * Usage: {...getShadow('elevation1')}
 */
export function getShadow(level: keyof typeof shadows) {
  const shadow = shadows[level];
  return {
    ...shadow.ios,
    ...shadow.android,
  };
}

export type ShadowLevel = keyof typeof shadows;
