import { useState } from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { useColors, typography, spacing } from "../../tokens";
import { voiceCoach } from "../../services/voiceCoach";

interface VoiceCoachToggleProps {
  /** Initial enabled state */
  initialEnabled?: boolean;
  /** Called when toggle state changes */
  onToggle?: (enabled: boolean) => void;
}

/**
 * Small toggle button for the top bar that shows voice coach state.
 * Icon reflects: muted, active (idle), active (speaking).
 */
export function VoiceCoachToggle({ initialEnabled = true, onToggle }: VoiceCoachToggleProps) {
  const colors = useColors();

  const [enabled, setEnabled] = useState(initialEnabled);

  const handlePress = () => {
    const next = !enabled;
    setEnabled(next);
    voiceCoach.setEnabled(next);
    onToggle?.(next);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{
        backgroundColor: enabled ? `${colors.accent.DEFAULT}15` : colors.bg.elevated,
        borderWidth: 1,
        borderColor: enabled ? colors.accent.DEFAULT : colors.border.subtle,
        borderRadius: 4,
        paddingHorizontal: spacing.xs,
        paddingVertical: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
      }}
      accessibilityLabel={enabled ? "Disable voice coach" : "Enable voice coach"}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled }}
    >
      <Text
        style={{
          fontSize: 14,
          lineHeight: 18,
          opacity: enabled ? 1 : 0.4,
        }}
      >
        {enabled ? "🔊" : "🔇"}
      </Text>
      <Text
        style={{
          ...typography.label,
          fontSize: 8,
          color: enabled ? colors.accent.DEFAULT : colors.text.secondary,
        }}
      >
        VOICE
      </Text>
    </TouchableOpacity>
  );
}
