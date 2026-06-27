import { View, Text, ViewStyle, LinearGradientPoint } from "react-native";
import { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useColors, spacing, radii, getShadow } from "../../tokens";

interface GradientCardProps {
  children: ReactNode;
  title?: string;
  titleRight?: ReactNode;
  /** Colors for the gradient background */
  colors: string[];
  /** Start point of gradient */
  start?: LinearGradientPoint;
  /** End point of gradient */
  end?: LinearGradientPoint;
  /** Elevation level for shadow depth */
  elevation?: "low" | "medium" | "high";
  /** Accent bar on the left */
  leftAccent?: boolean;
  style?: ViewStyle;
}

/**
 * Gradient card for featured content, achievements, and highlights.
 * Uses LinearGradient for eye-catching visual hierarchy.
 */
export function GradientCard({
  children,
  title,
  titleRight,
  colors: gradientColors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  elevation = "medium",
  leftAccent = false,
  style,
}: GradientCardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        {
          borderRadius: radii.lg,
          overflow: "hidden",
          ...getShadow(
            elevation === "high"
              ? "elevation3"
              : elevation === "medium"
                ? "elevation2"
                : "elevation1",
          ),
        },
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={start}
        end={end}
        style={{
          padding: spacing.md,
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
              backgroundColor: colors.accent.DEFAULT,
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
              marginBottom: spacing.sm,
              paddingLeft: leftAccent ? spacing.sm : 0,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter-SemiBold",
                fontSize: 11,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: colors.text.primary,
                fontWeight: "600",
              }}
            >
              {title.toUpperCase()}
            </Text>
            {titleRight}
          </View>
        )}

        {/* Content */}
        <View
          style={{
            paddingLeft: leftAccent ? spacing.sm : 0,
          }}
        >
          {children}
        </View>
      </LinearGradient>
    </View>
  );
}
