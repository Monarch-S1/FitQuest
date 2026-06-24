import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import * as Linking from "expo-linking";
import { useColors, typography, spacing, fonts } from "../../tokens";
import { GlossyOverlay } from "./GlossyOverlay";
import { hapticPress } from "../../utils/haptics";

type FeedbackType = "bug" | "feature" | "other";

const TYPE_OPTIONS: { key: FeedbackType; label: string; icon: string }[] = [
  { key: "bug", label: "BUG REPORT", icon: "⚠" },
  { key: "feature", label: "FEATURE REQUEST", icon: "★" },
  { key: "other", label: "OTHER", icon: "●" },
];

interface FeedbackSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function FeedbackSheet({ visible, onClose }: FeedbackSheetProps) {
  const colors = useColors();
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    hapticPress();

    const typeLabel = TYPE_OPTIONS.find((o) => o.key === type)?.label ?? "FEEDBACK";
    const subject = encodeURIComponent(`[FitQuest Beta] ${typeLabel}`);
    const body = encodeURIComponent(
      `${message.trim()}\n\n---\nType: ${typeLabel}\nDevice: ${Platform.OS} ${Platform.Version}\nApp Version: 1.0.0`,
    );
    Linking.openURL(`mailto:chamber.enterprise.1@gmail.com?subject=${subject}&body=${body}`);

    // Reset and close
    setMessage("");
    setType("bug");
    onClose();
  }, [type, message, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.bg.primary,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: spacing.lg,
              paddingTop: spacing[5],
              paddingBottom: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border.subtle,
            }}
          >
            <Text
              style={{
                ...typography.label,
                color: colors.accent.DEFAULT,
                fontSize: 10,
              }}
            >
              FEEDBACK
            </Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close feedback"
              style={{
                backgroundColor: colors.bg.elevated,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                borderRadius: 4,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.md,
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: colors.text.secondary,
                  fontSize: 9,
                }}
              >
                CLOSE
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: spacing.lg,
              paddingBottom: spacing[12],
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Type selector */}
            <Text
              style={{
                ...typography.label,
                color: colors.text.secondary,
                fontSize: 9,
                marginBottom: spacing.sm,
              }}
            >
              TYPE
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
              {TYPE_OPTIONS.map((option) => {
                const isSelected = type === option.key;
                const accentColor =
                  option.key === "bug"
                    ? colors.error
                    : option.key === "feature"
                      ? colors.success
                      : colors.accent.DEFAULT;

                return (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setType(option.key)}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      backgroundColor: isSelected ? `${accentColor}15` : colors.bg.elevated,
                      borderWidth: 1,
                      borderColor: isSelected ? accentColor : colors.border.subtle,
                      borderRadius: 4,
                      padding: spacing.sm,
                      alignItems: "center",
                      overflow: "hidden",
                    }}
                  >
                    <GlossyOverlay
                      highlightOpacity={isSelected ? 0.1 : 0.04}
                      showReflection={false}
                    />
                    <Text style={{ fontSize: 16, marginBottom: spacing.xs }}>{option.icon}</Text>
                    <Text
                      style={{
                        ...typography.label,
                        color: isSelected ? accentColor : colors.text.secondary,
                        fontSize: 7,
                        textAlign: "center",
                      }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Message input */}
            <Text
              style={{
                ...typography.label,
                color: colors.text.secondary,
                fontSize: 9,
                marginBottom: spacing.sm,
              }}
            >
              MESSAGE
            </Text>
            <View
              style={{
                backgroundColor: colors.bg.elevated,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                borderRadius: 4,
                minHeight: 160,
                overflow: "hidden",
              }}
            >
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder={
                  type === "bug"
                    ? "Describe the bug: what happened, what you expected, steps to reproduce..."
                    : type === "feature"
                      ? "Describe the feature you'd like to see..."
                      : "Your thoughts..."
                }
                placeholderTextColor={colors.text.tertiary}
                multiline
                textAlignVertical="top"
                maxLength={1000}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  color: colors.text.primary,
                  fontFamily: fonts.body.regular,
                  fontSize: 13,
                  lineHeight: 20,
                }}
              />
            </View>

            {/* Device info hint */}
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.tertiary,
                fontSize: 9,
                marginTop: spacing.sm,
                marginBottom: spacing.lg,
              }}
            >
              Device info ({Platform.OS} {Platform.Version}) will be included automatically.
            </Text>

            {/* Send button */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={!message.trim()}
              activeOpacity={0.8}
              style={{
                backgroundColor: message.trim() ? colors.accent.DEFAULT : colors.bg.elevated,
                borderWidth: 1,
                borderColor: message.trim() ? colors.accent.DEFAULT : colors.border.subtle,
                borderRadius: 4,
                paddingVertical: spacing.md,
                alignItems: "center",
                opacity: message.trim() ? 1 : 0.5,
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: message.trim() ? colors.bg.primary : colors.text.secondary,
                  fontSize: 11,
                  letterSpacing: 2,
                }}
              >
                SEND FEEDBACK
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
