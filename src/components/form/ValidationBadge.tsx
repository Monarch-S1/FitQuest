import { View, Text, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { useColors, typography, spacing } from "../../tokens";

type ValidationType = "success" | "error" | "warning" | "info";

interface ValidationBadgeProps {
  type: ValidationType;
  message: string;
  visible?: boolean;
  onDismiss?: () => void;
  autoDismissDelay?: number; // in milliseconds
}

/**
 * Inline validation indicator with slide-in animation.
 * Automatically dismisses after autoDismissDelay if provided.
 */
export function ValidationBadge({
  type,
  message,
  visible = true,
  onDismiss,
  autoDismissDelay = 0,
}: ValidationBadgeProps) {
  const colors = useColors();
  const slideAnim = useRef(new Animated.Value(visible ? 0 : -100)).current;
  const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (autoDismissDelay > 0) {
        dismissTimeoutRef.current = setTimeout(() => {
          onDismiss?.();
        }, autoDismissDelay);
      }
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [visible, autoDismissDelay, onDismiss, slideAnim]);

  if (!visible) return null;

  // Color mapping
  const colorMap = {
    success: { bg: colors.success, text: colors.bg.primary },
    error: { bg: colors.error, text: colors.bg.primary },
    warning: { bg: colors.warning, text: colors.bg.primary },
    info: { bg: colors.accent.DEFAULT, text: colors.bg.primary },
  };

  const { bg, text } = colorMap[type];

  // Icon mapping
  const iconMap = {
    success: "✓",
    error: "!",
    warning: "⚠",
    info: "ℹ",
  };

  const icon = iconMap[type];

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        marginBottom: spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: bg,
          borderRadius: 6,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          gap: spacing.sm,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: text,
          }}
        >
          {icon}
        </Text>

        <Text
          style={{
            ...typography.bodySmall,
            color: text,
            flex: 1,
            fontSize: 12,
          }}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
