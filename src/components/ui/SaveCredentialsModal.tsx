import { useState } from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { useColors, typography, spacing } from "../../tokens";

interface SaveCredentialsModalProps {
  visible: boolean;
  isBiometricAvailable: boolean;
  biometricType: string | null;
  onSave: () => void;
  onDismiss: () => void;
  isLoading: boolean;
}

/**
 * Modal that prompts user to save credentials for biometric login.
 * Shows after successful password authentication.
 */
export function SaveCredentialsModal({
  visible,
  isBiometricAvailable,
  biometricType,
  onSave,
  onDismiss,
  isLoading,
}: SaveCredentialsModalProps) {
  const colors = useColors();

  if (!visible || !isBiometricAvailable) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: spacing.lg,
        }}
      >
        <View
          style={{
            backgroundColor: colors.bg.elevated,
            borderRadius: 12,
            padding: spacing.xl,
            minWidth: 280,
          }}
        >
          <Text
            style={{
              ...typography.h3,
              color: colors.text.primary,
              marginBottom: spacing.md,
            }}
          >
            Enable {biometricType}?
          </Text>

          <Text
            style={{
              ...typography.body,
              color: colors.text.secondary,
              marginBottom: spacing.lg,
              lineHeight: 20,
            }}
          >
            Sign in faster next time with {biometricType}. Your credentials are securely stored on
            your device.
          </Text>

          <View
            style={{
              flexDirection: "row",
              gap: spacing.md,
            }}
          >
            <TouchableOpacity
              onPress={onDismiss}
              disabled={isLoading}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                alignItems: "center",
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: colors.text.secondary,
                  fontSize: 12,
                }}
              >
                NOT NOW
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSave}
              disabled={isLoading}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                backgroundColor: colors.accent.DEFAULT,
                borderRadius: 6,
                alignItems: "center",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: colors.bg.primary,
                  fontSize: 12,
                }}
              >
                ENABLE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
