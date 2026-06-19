import { View, Text, TouchableOpacity } from "react-native";
import { useColors, useThemeMode, useAccentColor } from "../../tokens/useColors";
import { useUserStore } from "../../stores/useUserStore";
import { ACCENT_LABELS, AccentKey, accentOptions } from "../../tokens/themes";
import { typography, spacing } from "../../tokens";

export function ThemeSwitcher() {
  const colors = useColors();
  const themeMode = useThemeMode();
  const accentColor = useAccentColor();
  const setThemeMode = useUserStore((s) => s.setThemeMode);
  const setAccentColor = useUserStore((s) => s.setAccentColor);

  const accentKeys = Object.keys(accentOptions) as AccentKey[];

  return (
    <View>
      {/* ── Theme Mode Toggle ── */}
      <Text
        style={{
          ...typography.label,
          color: colors.text.secondary,
          fontSize: 9,
          marginBottom: spacing[2],
        }}
      >
        APPEARANCE
      </Text>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.bg.primary,
          borderWidth: 1,
          borderColor: colors.border.subtle,
          borderRadius: 4,
          padding: 2,
          marginBottom: spacing[3],
        }}
      >
        {(["dark", "light"] as const).map((mode) => {
          const isActive = themeMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              onPress={() => setThemeMode(mode)}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: spacing[2],
                alignItems: "center",
                backgroundColor: isActive ? colors.accent.DEFAULT : "transparent",
                borderRadius: 1,
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  fontSize: 9,
                  color: isActive ? colors.bg.primary : colors.text.secondary,
                  letterSpacing: 1.5,
                }}
              >
                {mode === "dark" ? "DARK" : "LIGHT"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Accent Color Picker ── */}
      <Text
        style={{
          ...typography.label,
          color: colors.text.secondary,
          fontSize: 9,
          marginBottom: spacing[2],
        }}
      >
        ACCENT COLOR
      </Text>
      <View style={{ flexDirection: "row", gap: spacing[2] }}>
        {accentKeys.map((key) => {
          const accent = accentOptions[key];
          const isActive = accentColor === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setAccentColor(key)}
              activeOpacity={0.7}
              style={{
                flex: 1,
                alignItems: "center",
                gap: spacing[1],
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  backgroundColor: accent.DEFAULT,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: isActive ? 2 : 0,
                  borderColor: colors.text.primary,
                }}
              >
                {isActive && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#fff",
                      fontWeight: "700",
                    }}
                  >
                    ✓
                  </Text>
                )}
              </View>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: isActive ? colors.accent.DEFAULT : colors.text.secondary,
                  fontSize: 8,
                }}
                numberOfLines={1}
              >
                {ACCENT_LABELS[key]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
