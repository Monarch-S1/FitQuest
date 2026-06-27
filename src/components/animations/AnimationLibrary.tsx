/**
 * Animation components and utilities for micro-interactions
 * Provides reusable animated effects for enhanced UX
 */

import { Animated, View, ViewStyle } from "react-native";
import { useEffect, useRef, useMemo, useState } from "react";
import { useColors } from "../../tokens";

/**
 * CountUpNumber — Animated number counter
 * Used for XP increments, level-ups, stats
 */
interface CountUpNumberProps {
  from: number;
  to: number;
  duration?: number;
  style?: ViewStyle;
  onComplete?: () => void;
}

export function CountUpNumber({ from, to, duration = 600, style, onComplete }: CountUpNumberProps) {
  const animValue = useMemo(() => new Animated.Value(from), [from]);
  const [displayText, setDisplayText] = useState(from);

  useEffect(() => {
    animValue.resetAnimation();
    Animated.timing(animValue, {
      toValue: to,
      duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) onComplete?.();
    });

    const listener = animValue.addListener(({ value }) => {
      setDisplayText(Math.floor(value));
    });

    return () => animValue.removeListener(listener);
  }, [to, duration, animValue, onComplete]);

  return (
    <Animated.Text
      style={[
        style,
        {
          fontSize: 24,
          fontWeight: "600",
        },
      ]}
    >
      {displayText}
    </Animated.Text>
  );
}

/**
 * ProgressRing — Animated progress ring (circular progress)
 * Used for workout completion, level progress
 */
interface ProgressRingProps {
  progress: number; // 0-1
  radius?: number;
  strokeWidth?: number;
  duration?: number;
  color?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  radius = 40,
  strokeWidth = 4,
  duration = 500,
  color,
  children,
}: ProgressRingProps) {
  const colors = useColors();
  const ringColor = color || colors.accent.DEFAULT;
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: progress,
      duration,
      useNativeDriver: false,
    }).start();
  }, [progress, duration, animValue]);

  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View
      style={{
        width: radius * 2,
        height: radius * 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          borderWidth: strokeWidth,
          borderColor: ringColor,
          opacity: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          }),
        }}
      />
      <View
        style={{
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
}

/**
 * ShakeView — Shake animation for attention
 * Used for errors, warnings, invalid input
 */
interface ShakeViewProps {
  intensity?: number; // 1-10
  duration?: number;
  children: React.ReactNode;
  style?: ViewStyle;
  trigger?: boolean;
}

export function ShakeView({
  intensity = 5,
  duration = 500,
  children,
  style,
  trigger = true,
}: ShakeViewProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger) return;

    const shakes = 5;
    const shakeDistance = intensity;
    const timings = [];

    for (let i = 0; i < shakes; i++) {
      timings.push(
        Animated.timing(shakeAnim, {
          toValue: i % 2 === 0 ? shakeDistance : -shakeDistance,
          duration: duration / shakes,
          useNativeDriver: true,
        }),
      );
    }

    timings.push(
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: duration / 5,
        useNativeDriver: true,
      }),
    );

    Animated.sequence(timings).start();
  }, [trigger, intensity, duration, shakeAnim]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateX: shakeAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * PulseView — Pulsing animation for loading/emphasis
 * Used for loading states, attention-seeking
 */
interface PulseViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number; // 0.5-1
  duration?: number;
  delay?: number;
}

export function PulseView({
  children,
  style,
  intensity = 0.7,
  duration = 1200,
  delay = 0,
}: PulseViewProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: intensity,
          duration: duration / 2,
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim, intensity, duration, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: pulseAnim,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * ScalePopView — Scale pop entrance animation
 * Used for alerts, success messages, achievements
 */
interface ScalePopViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
  delay?: number;
  overshoot?: number; // 1-10 for bounce effect
}

export function ScalePopView({
  children,
  style,
  duration = 300,
  delay = 0,
  overshoot = 3,
}: ScalePopViewProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, {
        toValue: 1,
        overshootClamping: false,
        useNativeDriver: true,
        speed: 12,
        bounciness: overshoot,
      }),
    ]).start();
  }, [scaleAnim, delay, overshoot]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/**
 * SlideInView — Slide-in entrance animation
 * Used for modals, bottom sheets, cards
 */
interface SlideInViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  direction?: "left" | "right" | "up" | "down";
  duration?: number;
  delay?: number;
  distance?: number; // pixels
}

export function SlideInView({
  children,
  style,
  direction = "up",
  duration = 300,
  delay = 0,
  distance = 100,
}: SlideInViewProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, delay, duration]);

  const getTransform = () => {
    switch (direction) {
      case "left":
        return {
          translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-distance, 0] }),
        };
      case "right":
        return {
          translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }),
        };
      case "down":
        return {
          translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-distance, 0] }),
        };
      case "up":
      default:
        return {
          translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }),
        };
    }
  };

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [getTransform()],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
