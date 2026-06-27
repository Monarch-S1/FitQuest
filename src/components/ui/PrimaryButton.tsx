import { TouchableOpacity, Text, ViewStyle, TextStyle } from "react-native";
import { useRef, useEffect } from "react";
import { Animated } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors, spacing, radii } from "../../tokens";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface PrimaryButtonProps {
  onPress: () => void;
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  withHaptic?: boolean;
  withScale?: boolean;
}

/**
 * Enhanced button with micro-interactions
 * - Scale feedback on press
 * - Haptic response
 * - Loading state
 * - Multiple variants and sizes
 */
export function PrimaryButton({
  onPress,
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  loading = false,
  withHaptic = true,
  withScale = true,
}: PrimaryButtonProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (withScale && !disabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (withScale && !disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 10,
      }).start();
    }
  };

  const handlePress = () => {
    if (disabled || loading) return;

    if (withHaptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onPress();
  };

  // Size configurations
  const sizeConfig: Record<ButtonSize, { height: number; paddingH: number; fontSize: number }> = {
    sm: { height: 32, paddingH: 12, fontSize: 12 },
    md: { height: 40, paddingH: 16, fontSize: 14 },
    lg: { height: 48, paddingH: 20, fontSize: 16 },
  };

  const config = sizeConfig[size];

  // Variant colors
  const getButtonColors = () => {
    if (disabled) {
      return {
        bg: colors.bg.elevated,
        text: colors.text.tertiary,
      };
    }

    switch (variant) {
      case "primary":
        return {
          bg: colors.accent.DEFAULT,
          text: colors.text.primary,
        };
      case "secondary":
        return {
          bg: colors.bg.elevated,
          text: colors.accent.DEFAULT,
          border: colors.accent.DEFAULT,
        };
      case "ghost":
        return {
          bg: "transparent",
          text: colors.accent.DEFAULT,
        };
      case "danger":
        return {
          bg: colors.error,
          text: colors.text.primary,
        };
      default:
        return {
          bg: colors.accent.DEFAULT,
          text: colors.text.primary,
        };
    }
  };

  const buttonColors = getButtonColors();

  return (
    <Animated.View
      style={{
        transform: withScale ? [{ scale: scaleAnim }] : undefined,
        width: fullWidth ? "100%" : "auto",
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.7}
        style={[
          {
            height: config.height,
            paddingHorizontal: config.paddingH,
            backgroundColor: buttonColors.bg,
            borderRadius: radii.lg,
            borderWidth: variant === "secondary" ? 2 : 0,
            borderColor: buttonColors.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        <Text
          style={[
            {
              fontSize: config.fontSize,
              fontWeight: "600",
              color: buttonColors.text,
              fontFamily: "Inter-SemiBold",
            },
            textStyle,
          ]}
        >
          {loading ? "Loading..." : children}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
