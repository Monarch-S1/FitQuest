import { View, Text, ViewStyle } from "react-native";
import { ReactNode } from "react";
import {
  useColors,
  spacing,
  radii,
  getShadow,
  glassEffect,
  glassEffectDeep,
  glassEffectLight,
} from "../../tokens";
import { BlurView } from "expo-blur";

type ElevationLevel = "low" | "medium" | "high";
type CardVariant = "solid" | "glass" | "gradient";

interface CardProps {
  children: ReactNode;
  /** Optional title shown in a header bar */
  title?: string;
  /** Title suffix (e.g. a button or icon) */
  titleRight?: ReactNode;
  /** Accent variant */
  accent?: "amber" | "green" | "red" | "none";
  /** Visual variant */
  variant?: CardVariant;
  /** Elevation level for depth hierarchy */
  elevation?: ElevationLevel;
  /** Show left accent bar */
  leftAccent?: boolean;
  style?: ViewStyle;
  /** Blur intensity for glass effect (0-100) */
  blurIntensity?: number;
}

/**
 * Unified Card component — replaces SegmentedPanel and HUDModule.
 *
 * Variants:
 * - solid: Subtle card with bg.card background (default)
 * - glass: Semi-transparent + backdrop blur (premium feel)
 * - gradient: With subtle gradient overlay for visual interest
 *
 * Elevation levels:
 * - low: Cards, list items
 * - medium: Containers, featured content
 * - high: Important alerts, featured sections
 */
export function Card({
  children,
  title,
  titleRight,
  accent = "none",
  variant = "solid",
  elevation = "medium",
  leftAccent = false,
  style,
  blurIntensity = 8,
}: CardProps) {
  const colors = useColors();

  const accentColor =
    accent === "amber"
      ? colors.accent.DEFAULT
      : accent === "green"
        ? colors.success
        : accent === "red"
          ? colors.error
          : colors.border.subtle;

  // Get background color based on variant
  const getBgColor = () => {
    if (variant === "glass") return "rgba(27, 24, 32, 0.7)";
    if (variant === "gradient") return colors.bg.card;
    return colors.bg.card;
  };

  // Get shadow based on elevation
  const getShadowStyle = () => {
    if (variant === "glass") {
      return getShadow(
        elevation === "high" ? "elevation3" : elevation === "medium" ? "elevation2" : "elevation1",
      );
    }
    if (elevation === "high") return getShadow("elevation3");
    if (elevation === "medium") return getShadow("elevation2");
    return getShadow("elevation1");
  };

  // Glass effect background layer
  const glassBackground = variant === "glass" ? glassEffect : {};

  return (
    <View
      style={[
        {
          borderRadius: radii.lg,
          overflow: "hidden",
          backgroundColor: getBgColor(),
          ...getShadowStyle(),
        },
        style,
      ]}
    >
      {/* Blur layer for glass effect */}
      {variant === "glass" && (
        <BlurView
          intensity={blurIntensity}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}

      {/* Left accent bar */}
      {leftAccent && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 2.5,
            height: "100%",
            backgroundColor: accentColor,
            borderTopLeftRadius: radii.lg,
            borderBottomLeftRadius: radii.lg,
            zIndex: 1,
          }}
        />
      )}

      {/* Title bar */}
      {title && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderBottomWidth: titleRight ? 1 : 0,
            borderBottomColor: colors.border.subtle,
            zIndex: 2,
            backgroundColor: variant === "glass" ? "rgba(27, 24, 32, 0.3)" : undefined,
          }}
        >
          <TitleText accent={accent === "none" ? "muted" : accent}>{title.toUpperCase()}</TitleText>
          {titleRight}
        </View>
      )}

      {/* Content */}
      <View
        style={{
          padding: spacing.md,
          paddingLeft: leftAccent ? spacing.md + spacing.xs : spacing.md,
          zIndex: 2,
        }}
      >
        {children}
      </View>
    </View>
  );
}

// ─── Internal title text component ──────────────

function TitleText({
  children,
  accent,
}: {
  children: string;
  accent: "amber" | "green" | "red" | "muted";
}) {
  const colors = useColors();
  const color =
    accent === "muted"
      ? colors.text.secondary
      : accent === "amber"
        ? colors.accent.DEFAULT
        : accent === "green"
          ? colors.success
          : colors.error;

  return (
    <Text
      style={{
        fontFamily: "Inter-SemiBold",
        fontSize: 9,
        letterSpacing: 1,
        textTransform: "uppercase",
        color,
      }}
    >
      {children}
    </Text>
  );
}

// ─── Card sub-components for layout ────────────

/** A row of two side-by-side stat items */
Card.Row = function CardRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", gap: spacing.sm }}>{children}</View>;
};

/** A single stat column within a row */
Card.Stat = function CardStat({
  label,
  value,
  accent = "amber",
}: {
  label: string;
  value: string | number;
  accent?: "amber" | "green" | "red" | "none";
}) {
  const colors = useColors();
  const accentColor =
    accent === "amber"
      ? colors.accent.DEFAULT
      : accent === "green"
        ? colors.success
        : accent === "red"
          ? colors.error
          : colors.text.secondary;

  return (
    <View style={{ flex: 1, alignItems: "center", gap: spacing.xs }}>
      <Text
        style={{
          fontFamily: "Inter-SemiBold",
          fontSize: 8,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: colors.text.secondary,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: "BebasNeue-Regular",
          fontSize: 24,
          letterSpacing: 0.5,
          color: accentColor,
        }}
      >
        {value}
      </Text>
    </View>
  );
};

/** A separator line */
Card.Separator = function CardSeparator() {
  const colors = useColors();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.border.subtle,
        marginVertical: spacing.sm,
      }}
    />
  );
};
