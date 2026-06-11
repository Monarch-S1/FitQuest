import { useEffect } from "react";
import { View, Text } from "react-native";
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

interface TempoTimerProps {
  tempo: Tempo | "isometric";
  isActive: boolean;
  onPhaseComplete?: () => void;
}

export function TempoTimer({ tempo, isActive, onPhaseComplete }: TempoTimerProps) {
  const colors = useColors();

  const phases = parseTempo(tempo);
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

  const nonZeroPhases = phases.filter((p) => p.duration > 0);

  return (
    <View
      style={{
        backgroundColor: colors.bg.primary,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        borderRadius: 4,
        padding: spacing[3],
      }}
    >
      <Text
        style={{
          ...typography.label,
          color: colors.text.secondary,
          fontSize: 8,
          marginBottom: spacing[2],
          textAlign: "center",
        }}
      >
        REP TEMPO
      </Text>

      {/* Tempo phases */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: spacing[2],
        }}
      >
        {phases.map((phase, index) => (
          <View
            key={index}
            style={{
              alignItems: "center",
              opacity: phase.duration === 0 ? 0.3 : 1,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                backgroundColor: `${phase.color}15`,
                borderWidth: 1.5,
                borderColor: phase.color,
                borderRadius: 4,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  ...typography.h4,
                  color: phase.color,
                  fontSize: 16,
                  lineHeight: 16,
                }}
              >
                {phase.duration}
              </Text>
            </View>
            <Text
              style={{
                ...typography.label,
                color: phase.color,
                fontSize: 7,
                marginTop: spacing[1],
                letterSpacing: 0.5,
              }}
            >
              {phase.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Progress bar */}
      {nonZeroPhases.length > 0 && (
        <View
          style={{
            height: 3,
            backgroundColor: colors.bg.highlight,
            borderRadius: 4,
            marginTop: spacing[3],
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={[
              {
                height: "100%",
                backgroundColor: colors.accent.DEFAULT,
                borderRadius: 4,
              },
              indicatorStyle,
            ]}
          />
        </View>
      )}
    </View>
  );
}
