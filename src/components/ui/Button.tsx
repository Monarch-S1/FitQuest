import { TouchableOpacity, View } from "react-native";
import { useColors, spacing, Label } from "../../tokens";
import { hapticPress } from "../../utils/haptics";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
}: ButtonProps) {
  const colors = useColors();

  const sizeStyles = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
    md: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
    lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl },
  };

  const variantStyles = {
    primary: {
      backgroundColor: colors.accent.DEFAULT,
      borderColor: colors.accent.DEFAULT,
    },
    secondary: {
      backgroundColor: "transparent",
      borderColor: colors.border.accent,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
    },
  };

  const labelVariant =
    variant === "secondary" ? "accent" : variant === "ghost" ? "secondary" : undefined;
  const labelCustomColor = variant === "primary" ? colors.bg.primary : undefined;
  const labelFontSize = size === "lg" ? 14 : size === "sm" ? 10 : 12;

  return (
    <TouchableOpacity
      onPress={() => {
        hapticPress();
        onPress();
      }}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled, busy: loading }}
      className={fullWidth ? "w-full" : ""}
      style={{
        borderWidth: variant === "ghost" ? 0 : 1.5,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        opacity: disabled ? 0.4 : 1,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
    >
      {loading && (
        <View className="mr-2">
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              borderWidth: 2,
              borderColor:
                variant === "primary"
                  ? colors.bg.primary
                  : variant === "secondary"
                    ? colors.accent.DEFAULT
                    : colors.text.secondary,
              borderTopColor: "transparent",
            }}
          />
        </View>
      )}
      <Label
        variant={labelVariant}
        style={{
          fontSize: labelFontSize,
          ...(labelCustomColor ? { color: labelCustomColor } : {}),
        }}
      >
        {loading ? "PROCESSING..." : title.toUpperCase()}
      </Label>
    </TouchableOpacity>
  );
}
