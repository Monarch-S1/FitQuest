import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface GlossyOverlayProps {
  /** Height of the top highlight strip */
  highlightHeight?: number;
  /** Opacity of the top highlight (0-1) */
  highlightOpacity?: number;
  /** Show diagonal reflection overlay */
  showReflection?: boolean;
  /** Border radius to match parent card */
  borderRadius?: number;
}

/**
 * Subtle glossy finish overlay for dark-themed cards.
 * Renders absolute-positioned gradient layers that simulate
 * a light source hitting a glass surface.
 *
 * Usage: Place inside a parent View with `position: "relative"` and `overflow: "hidden"`.
 */
export function GlossyOverlay({
  highlightHeight = 1.5,
  highlightOpacity = 0.12,
  showReflection = true,
  borderRadius = 4,
}: GlossyOverlayProps) {
  return (
    <>
      {/* Top-edge highlight — simulates light catching the top edge */}
      <LinearGradient
        colors={[
          `rgba(255, 255, 255, ${highlightOpacity})`,
          `rgba(255, 255, 255, ${highlightOpacity * 0.3})`,
          "transparent",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: highlightHeight,
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
        }}
        pointerEvents="none"
      />

      {/* Diagonal reflection — subtle light sweep from top-left */}
      {showReflection && (
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0.04)",
            "rgba(255, 255, 255, 0.02)",
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.6 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: borderRadius,
          }}
          pointerEvents="none"
        />
      )}
    </>
  );
}
