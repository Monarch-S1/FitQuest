import { View, Text, ViewStyle } from "react-native";
import { ReactNode } from "react";
import { useColors, typography, spacing } from "../../tokens";

interface HUDModuleProps {
  children: ReactNode;
  label?: string;
  accent?: "amber" | "green" | "red" | "none";
  style?: ViewStyle;
}

export function HUDModule({ children, label, accent = "none", style }: HUDModuleProps) {
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
        borderRadius: 12,
        padding: spacing[3],
        position: "relative",
        ...style,
      }}
    >
      {/* Label tag in top-left */}
      {label && (
        <View
          style={{
            position: "absolute",
            top: -9,
            left: spacing[2],
            backgroundColor: colors.bg.elevated,
            paddingHorizontal: spacing[1],
          }}
        >
          <Text
            style={{
              ...typography.label,
              color: accentColor,
              fontSize: 8,
              letterSpacing: 1.5,
            }}
          >
            {label.toUpperCase()}
          </Text>
        </View>
      )}

      {/* Content */}
      {children}

      {/* Corner markers */}
      <View
        style={{
          position: "absolute",
          top: -1,
          left: -1,
          width: 4,
          height: 4,
          borderTopWidth: 1.5,
          borderLeftWidth: 1.5,
          borderColor: accentColor,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: -1,
          right: -1,
          width: 4,
          height: 4,
          borderTopWidth: 1.5,
          borderRightWidth: 1.5,
          borderColor: accentColor,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -1,
          left: -1,
          width: 4,
          height: 4,
          borderBottomWidth: 1.5,
          borderLeftWidth: 1.5,
          borderColor: accentColor,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -1,
          right: -1,
          width: 4,
          height: 4,
          borderBottomWidth: 1.5,
          borderRightWidth: 1.5,
          borderColor: accentColor,
        }}
      />
    </View>
  );
}
