import { View, Text, TouchableOpacity } from "react-native";
import { useColors, useThemeMode, useAccentColor } from "../../tokens/useColors";
import { useUserStore } from "../../stores/useUserStore";
import { ACCENT_LABELS, AccentKey, accentOptions } from "../../tokens/themes";
import { spacing, Label, Tag } from "../../tokens";

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
      <Label variant="secondary" style={{ marginBottom: spacing.sm }}>
        APPEARANCE
      </Label>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.bg.base,
          borderWidth: 1,
          borderColor: colors.border.subtle,
          borderRadius: 4,
          padding: 2,
          marginBottom: spacing.md,
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
                paddingVertical: spacing.sm,
                alignItems: "center",
                backgroundColor: isActive ? colors.accent.DEFAULT : "transparent",
                borderRadius: 1,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter-SemiBold",
                  fontSize: 9,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  color: isActive ? colors.bg.primary : colors.text.secondary,
                }}
              >
                {mode === "dark" ? "DARK" : "LIGHT"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Accent Color Picker ── */}
      <Label variant="secondary" style={{ marginBottom: spacing.sm }}>
        ACCENT COLOR
      </Label>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
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
                gap: spacing.xs,
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
                      fontWeight: "700",
                      color: colors.bg.primary,
                    }}
                  >
                    ✓
                  </Text>
                )}
              </View>
              <Tag variant={isActive ? "accent" : "secondary"}>{ACCENT_LABELS[key]}</Tag>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
