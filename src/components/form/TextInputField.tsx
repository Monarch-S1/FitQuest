import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput as RNTextInput,
  TextInputProps,
  Animated,
  ViewStyle,
} from "react-native";
import { useColors, typography, spacing, getShadow } from "../../tokens";
import * as Haptics from "expo-haptics";

export type ValidationState = "default" | "focused" | "error" | "success";

interface TextInputFieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  placeholder?: string;
  error?: string | null;
  success?: string | null;
  onValidate?: (value: string) => boolean | string; // Returns true if valid, string if error
  variant?: "default" | "dense";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  showValidationIcon?: boolean;
  containerStyle?: ViewStyle;
}

/**
 * Enhanced TextInput component with validation states, animations, and feedback.
 * Provides visual hierarchy and user feedback for form interactions.
 */
export function TextInputField({
  label,
  placeholder,
  error: externalError,
  success: externalSuccess,
  onValidate,
  variant = "default",
  size = "md",
  disabled = false,
  showValidationIcon = true,
  containerStyle,
  onChangeText,
  value = "",
  ...props
}: TextInputFieldProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [animProgress] = useState(new Animated.Value(0));

  const error = externalError || internalError;
  const hasError = !!error;
  const hasSuccess = !!externalSuccess && !hasError;

  const getValidationState = useCallback((): ValidationState => {
    if (hasError) return "error";
    if (hasSuccess) return "success";
    if (focused) return "focused";
    return "default";
  }, [hasError, hasSuccess, focused]);

  const validationState = getValidationState();

  // Get colors based on state
  const getBorderColor = () => {
    switch (validationState) {
      case "error":
        return colors.error;
      case "success":
        return colors.success;
      case "focused":
        return colors.accent.DEFAULT;
      default:
        return colors.border.subtle;
    }
  };

  const getBackgroundColor = () => {
    if (disabled) return colors.bg.highlight;
    return focused ? colors.bg.highlight : colors.bg.elevated;
  };

  // Sizes
  const sizes = {
    sm: {
      height: 32,
      paddingH: spacing.sm,
      paddingV: spacing.xs,
      fontSize: 12,
    },
    md: {
      height: 44,
      paddingH: spacing.md,
      paddingV: spacing.sm,
      fontSize: 14,
    },
    lg: {
      height: 56,
      paddingH: spacing.md,
      paddingV: spacing.md,
      fontSize: 16,
    },
  };

  const sizeConfig = sizes[size];

  const handleChangeText = useCallback(
    (text: string) => {
      // Call external handler
      if (onChangeText) {
        onChangeText(text);
      }

      // Validate if validator provided
      if (onValidate && text.trim()) {
        const result = onValidate(text);
        if (result === true) {
          setInternalError(null);
          // Trigger success haptic
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (typeof result === "string") {
          setInternalError(result);
          // Trigger error haptic
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } else {
        setInternalError(null);
      }
    },
    [onChangeText, onValidate],
  );

  const handleFocus = useCallback(() => {
    setFocused(true);
    Haptics.selectionAsync();
  }, []);

  const handleBlur = useCallback(() => {
    setFocused(false);
  }, []);

  return (
    <View style={containerStyle}>
      {/* Label */}
      {label && (
        <Text
          style={{
            ...typography.label,
            color: focused ? colors.accent.DEFAULT : colors.text.secondary,
            fontSize: 11,
            marginBottom: spacing.xs,
            fontWeight: focused ? "600" : "500",
          }}
        >
          {label}
        </Text>
      )}

      {/* Input Container */}
      <View
        style={{
          position: "relative",
          borderWidth: 2,
          borderColor: getBorderColor(),
          borderRadius: 8,
          backgroundColor: getBackgroundColor(),
          height: sizeConfig.height,
          paddingHorizontal: sizeConfig.paddingH,
          paddingVertical: sizeConfig.paddingV,
          flexDirection: "row",
          alignItems: "center",
          opacity: disabled ? 0.5 : 1,
          ...getShadow(focused ? "elevation2" : "elevation1"),
        }}
      >
        <RNTextInput
          {...props}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          editable={!disabled}
          style={{
            flex: 1,
            fontSize: sizeConfig.fontSize,
            color: colors.text.primary,
            fontFamily: "Inter-Regular",
            padding: 0,
            margin: 0,
          }}
        />

        {/* Validation Icon */}
        {showValidationIcon && (
          <View
            style={{
              marginLeft: spacing.sm,
              width: 20,
              height: 20,
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor:
                validationState === "success"
                  ? colors.success
                  : validationState === "error"
                    ? colors.error
                    : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color:
                  validationState === "success" || validationState === "error"
                    ? colors.bg.primary
                    : "transparent",
              }}
            >
              {validationState === "success" ? "✓" : validationState === "error" ? "!" : ""}
            </Text>
          </View>
        )}
      </View>

      {/* Error/Success Message */}
      {(error || externalSuccess) && (
        <Text
          style={{
            ...typography.bodySmall,
            color: hasError ? colors.error : colors.success,
            fontSize: 11,
            marginTop: spacing.xs,
            fontWeight: "500",
          }}
        >
          {hasError ? `⚠ ${error}` : `✓ ${externalSuccess}`}
        </Text>
      )}
    </View>
  );
}
