import { View, Text, ViewStyle } from "react-native";
import { useColors, typography, spacing } from "../../tokens";
import { GlossyOverlay } from "./GlossyOverlay";

interface StatModuleProps {
  icon?: string;
  label: string;
  value: string | number;
  subValue?: string;
  accent?: "amber" | "green" | "red" | "none";
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

export function StatModule({
  icon,
  label,
  value,
  subValue,
  accent = "amber",
  size = "md",
  style,
}: StatModuleProps) {
  const colors = useColors();

  const accentColor = {
    amber: colors.accent.DEFAULT,
    green: colors.success,
    red: colors.error,
    none: colors.border.subtle,
  };

  const sizes = {
    sm: { padding: spacing[2], minHeight: 60 },
    md: { padding: spacing[3], minHeight: 80 },
    lg: { padding: spacing[4], minHeight: 100 },
  };

  return (
    <View
      style={{
        backgroundColor: colors.bg.elevated,
        borderWidth: 1,
        borderColor: accentColor[accent],
        borderRadius: 10,
        padding: sizes[size].padding,
        minHeight: sizes[size].minHeight,
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Glossy finish */}
      <GlossyOverlay highlightOpacity={0.1} showReflection={false} />

      {/* Top accent line */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: accentColor[accent],
        }}
      />

      <View style={{ flex: 1, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[1] }}>
          {icon && <Text style={{ fontSize: 14 }}>{icon}</Text>}
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 10,
            }}
          >
            {label}
          </Text>
        </View>

        <Text
          style={{
            ...typography.stat,
            color: colors.text.primary,
            fontSize: size === "lg" ? 36 : size === "sm" ? 20 : 28,
            marginTop: spacing[1],
          }}
        >
          {value}
        </Text>

        {subValue && (
          <Text
            style={{
              ...typography.bodySmall,
              color: accentColor[accent],
              marginTop: spacing[0],
            }}
          >
            {subValue}
          </Text>
        )}
      </View>

      {/* Corner decorations */}
      <View
        style={{
          position: "absolute",
          top: -1,
          left: -1,
          width: 6,
          height: 6,
          borderTopWidth: 2,
          borderLeftWidth: 2,
          borderColor: accentColor[accent],
        }}
      />
      <View
        style={{
          position: "absolute",
          top: -1,
          right: -1,
          width: 6,
          height: 6,
          borderTopWidth: 2,
          borderRightWidth: 2,
          borderColor: accentColor[accent],
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -1,
          left: -1,
          width: 6,
          height: 6,
          borderBottomWidth: 2,
          borderLeftWidth: 2,
          borderColor: accentColor[accent],
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -1,
          right: -1,
          width: 6,
          height: 6,
          borderBottomWidth: 2,
          borderRightWidth: 2,
          borderColor: accentColor[accent],
        }}
      />
    </View>
  );
}
