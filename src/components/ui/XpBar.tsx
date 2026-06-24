import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { useColors, spacing, Label, Body } from "../../tokens";

interface XpBarProps {
  currentXp: number;
  requiredXp: number;
  level: number;
  nextLevel?: number;
  animate?: boolean;
}

export function XpBar({ currentXp, requiredXp, level, nextLevel, animate = true }: XpBarProps) {
  const colors = useColors();

  const progress = requiredXp > 0 ? currentXp / requiredXp : 0;
  const widthValue = useSharedValue(0);
  const glowValue = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      widthValue.value = withDelay(200, withSpring(progress, { damping: 15, stiffness: 60 }));
      glowValue.value = withSequence(
        withDelay(400, withSpring(1, { damping: 10 })),
        withDelay(800, withSpring(0, { damping: 20 })),
      );
    } else {
      widthValue.value = progress;
    }
  }, [progress, animate]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.max(widthValue.value * 100, 0)}%` as any,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowValue.value,
  }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Experience points: ${currentXp} of ${requiredXp} to next level. Level ${level}${nextLevel ? `, advancing to level ${nextLevel}` : ""}`}
      accessibilityValue={{ min: 0, max: requiredXp, now: currentXp }}
      style={{ width: "100%" }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing.xs,
        }}
      >
        <Label variant="secondary">
          LEVEL {level}
          {nextLevel ? ` → ${nextLevel}` : ""}
        </Label>
        <Body variant="secondary" size="sm">
          {currentXp} / {requiredXp} TO NEXT LEVEL
        </Body>
      </View>

      <View
        style={{
          height: 6,
          backgroundColor: colors.bg.highlight,
          borderRadius: 4,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border.subtle,
        }}
      >
        <Animated.View
          style={[
            {
              height: "100%",
              backgroundColor: colors.accent.DEFAULT,
              borderRadius: 4,
            },
            barStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.accent.light,
              opacity: 0.3,
            },
            glowStyle,
          ]}
        />
      </View>
    </View>
  );
}
