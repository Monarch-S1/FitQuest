import { View, Text, ViewStyle } from "react-native";
import { ReactNode } from "react";
import { useColors, spacing, radii } from "../../tokens";

interface CardProps {
  children: ReactNode;
  /** Optional title shown in a header bar */
  title?: string;
  /** Title suffix (e.g. a button or icon) */
  titleRight?: ReactNode;
  /** Accent variant */
  accent?: "amber" | "green" | "red" | "none";
  /** Visual variant */
  variant?: "default" | "highlight";
  /** Show left accent bar */
  leftAccent?: boolean;
  style?: ViewStyle;
}

/**
 * Unified Card component — replaces SegmentedPanel and HUDModule.
 *
 * Variants:
 * - default: subtle card with bg.card background, no border
 * - accent: colored left accent bar + border color
 * - highlight: brighter background for important info
 *
 * No glossy overlays. No corner notches. Minimal borders.
 */
export function Card({
  children,
  title,
  titleRight,
  accent = "none",
  variant = "default",
  leftAccent = false,
  style,
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

  const bgColor = variant === "highlight" ? colors.bg.highlight : colors.bg.card;

  return (
    <View
      style={{
        backgroundColor: bgColor,
        borderRadius: radii.lg,
        overflow: "hidden",
        ...(variant === "highlight" && {
          shadowColor: colors.accent.DEFAULT,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 4,
        }),
        ...style,
      }}
    >
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
