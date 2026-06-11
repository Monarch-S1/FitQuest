import { View, Text, ViewStyle } from "react-native";
import { ReactNode } from "react";
import { useColors, typography, spacing } from "../../tokens";
import { GlossyOverlay } from "./GlossyOverlay";

interface SegmentedPanelProps {
  title?: string;
  children: ReactNode;
  accent?: "amber" | "green" | "red" | "none";
  style?: ViewStyle;
  titleRight?: ReactNode;
}

export function SegmentedPanel({
  title,
  children,
  accent = "none",
  style,
  titleRight,
}: SegmentedPanelProps) {
  const colors = useColors();

  const accentColor =
    accent === "amber"
      ? colors.accent.DEFAULT
      : accent === "green"
        ? colors.success
        : accent === "red"
          ? colors.error
          : colors.border.subtle;

  return (
    <View
      style={{
        backgroundColor: colors.bg.elevated,
        borderWidth: 1,
        borderColor: accentColor,
        borderRadius: 4,
        marginBottom: spacing[3],
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Title bar with segmented border */}
      {title && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            borderBottomWidth: 1,
            borderBottomColor: accentColor,
            backgroundColor: colors.bg.primary,
          }}
        >
          <Text
            style={{
              ...typography.label,
              color: accent === "none" ? colors.text.secondary : accentColor,
              fontSize: 10,
            }}
          >
            {title.toUpperCase()}
          </Text>
          {titleRight}
        </View>
      )}

      {/* Glossy finish */}
      <GlossyOverlay highlightOpacity={0.06} showReflection={false} />

      {/* Content */}
      <View style={{ padding: spacing[3] }}>{children}</View>

      {/* Corner notches */}
      <View
        style={{
          position: "absolute",
          top: -1,
          left: -1,
          width: 5,
          height: 5,
          borderTopWidth: 2,
          borderLeftWidth: 2,
          borderColor: accentColor,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: -1,
          right: -1,
          width: 5,
          height: 5,
          borderTopWidth: 2,
          borderRightWidth: 2,
          borderColor: accentColor,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -1,
          left: -1,
          width: 5,
          height: 5,
          borderBottomWidth: 2,
          borderLeftWidth: 2,
          borderColor: accentColor,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -1,
          right: -1,
          width: 5,
          height: 5,
          borderBottomWidth: 2,
          borderRightWidth: 2,
          borderColor: accentColor,
        }}
      />
    </View>
  );
}
