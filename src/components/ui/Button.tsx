import { TouchableOpacity, Text, View } from "react-native";
import { useColors, typography, spacing } from "../../tokens";
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
    sm: { paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
    md: { paddingVertical: spacing[3], paddingHorizontal: spacing[6] },
    lg: { paddingVertical: spacing[4], paddingHorizontal: spacing[8] },
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

  const textColors = {
    primary: colors.bg.primary,
    secondary: colors.accent.DEFAULT,
    ghost: colors.text.secondary,
  };

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
              borderColor: textColors[variant],
              borderTopColor: "transparent",
            }}
          />
        </View>
      )}
      <Text
        style={{
          ...typography.label,
          color: textColors[variant],
          fontSize: size === "lg" ? 14 : size === "sm" ? 10 : 12,
        }}
      >
        {loading ? "PROCESSING..." : title.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}
