import { useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { useColors, typography, spacing } from "../../tokens";
import { parseTempo, TempoPhase } from "../../stores/useWorkoutStore";
import { Tempo } from "../../data/exercises";
import { useDialog } from "../ui/Dialog";

interface TempoTimerProps {
  tempo: Tempo | "isometric";
  isActive: boolean;
  onPhaseComplete?: () => void;
}

/**
 * Simplified tempo display.
 * Shows the tempo pattern (e.g. "3-0-2-0") as compact text
 * with meaningful phase descriptions and an animated progress bar.
 */
export function TempoTimer({ tempo, isActive, onPhaseComplete }: TempoTimerProps) {
  const colors = useColors();
  const dialog = useDialog();

  const showTempoGuide = useCallback(() => {
    dialog.alert({
      title: "WHAT IS TEMPO?",
      message:
        "Tempo is the speed of each rep, written as 4 numbers:\n\n" +
        "3 - 0 - 2 - 0\n" +
        "↓   ↓   ↓   ↓\n" +
        "LOWER · PAUSE · PRESS · PAUSE\n\n" +
        "Examples:\n" +
        '• "3-0-2-0" = Lower for 3s, press for 2s\n' +
        '• "4-1-1-0" = Lower for 4s, pause 1s, press for 1s\n' +
        '• "2-0-1-0" = Lower for 2s, press for 1s (faster)\n' +
        "• ISOMETRIC = Hold a static position for time\n\n" +
        "Slower tempo = more time under tension = harder.\n" +
        "Faster tempo = more explosive = power focus.\n" +
        "The first number (eccentric) is usually the longest.",
    });
  }, [dialog]);

  const phases = parseTempo(tempo, colors.accent.DEFAULT);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      const totalDuration = phases.reduce((sum, p) => sum + p.duration, 0);
      if (totalDuration > 0) {
        progress.value = withRepeat(
          withTiming(1, {
            duration: totalDuration * 1000,
            easing: Easing.linear,
          }),
          -1,
          false,
        );
      }
    } else {
      cancelAnimation(progress);
      progress.value = 0;
    }

    return () => cancelAnimation(progress);
  }, [isActive, tempo]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }));

  if (tempo === "isometric") {
    return (
      <View
        style={{
          backgroundColor: colors.bg.primary,
          borderWidth: 1,
          borderColor: colors.border.subtle,
          borderRadius: 4,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <Text
          style={{
            ...typography.label,
            color: colors.text.secondary,
            fontSize: 8,
            textAlign: "center",
          }}
        >
          ISOMETRIC HOLD
        </Text>
      </View>
    );
  }

  const tempoStr = typeof tempo === "string" ? tempo : "3-0-2-0";
  const activePhases = phases.filter((p) => p.duration > 0);

  return (
    <View
      style={{
        backgroundColor: colors.bg.primary,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        borderRadius: 4,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      {/* Tempo pattern row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.md,
        }}
      >
        <TouchableOpacity
          onPress={showTempoGuide}
          activeOpacity={0.6}
          style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
          accessibilityRole="button"
          accessibilityLabel="What is tempo? Tap for explanation"
        >
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 8,
              letterSpacing: 0.5,
            }}
          >
            TEMPO
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: colors.text.tertiary,
              lineHeight: 12,
            }}
          >
            ⓘ
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: "Inter-SemiBold",
            fontSize: 13,
            color: colors.accent.DEFAULT,
            letterSpacing: 1,
          }}
        >
          {tempoStr}
        </Text>
      </View>

      {/* Phase descriptions */}
      {activePhases.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: spacing.md,
            marginTop: spacing.xs,
          }}
        >
          {activePhases.map((phase, index) => (
            <View key={index} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: phase.color,
                }}
              />
              <Text
                style={{
                  ...typography.label,
                  fontSize: 7,
                  color: phase.color,
                  letterSpacing: 0.3,
                }}
              >
                {phase.label === "LOWER"
                  ? `↓${phase.duration}s`
                  : phase.label === "PRESS"
                    ? `↑${phase.duration}s`
                    : phase.label === "PAUSE" || phase.label === "SQUEEZE"
                      ? `${phase.duration > 0 ? `${phase.duration}s ` : ""}—`
                      : `${phase.duration}s`}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Progress bar */}
      {activePhases.length > 0 && (
        <View
          style={{
            height: 2,
            backgroundColor: colors.bg.highlight,
            borderRadius: 2,
            marginTop: spacing.sm,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={[
              {
                height: "100%",
                backgroundColor: colors.accent.DEFAULT,
                borderRadius: 2,
              },
              indicatorStyle,
            ]}
          />
        </View>
      )}
      <dialog.Dialog />
    </View>
  );
}
