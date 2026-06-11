import { useEffect, useRef, useMemo, useState } from "react";
import { View, Text, Animated, Easing, AccessibilityInfo } from "react-native";
import { useColors, typography, spacing } from "../../tokens";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
}

function getLevelTitle(level: number): string {
  if (level <= 3) return "RECRUIT";
  if (level <= 6) return "OPERATIVE";
  if (level <= 10) return "VETERAN";
  if (level <= 15) return "ELITE";
  if (level <= 20) return "COMMANDER";
  return "LEGEND";
}

function getChevrons(level: number): number {
  if (level <= 3) return 1;
  if (level <= 6) return 2;
  if (level <= 10) return 3;
  if (level <= 15) return 4;
  return 5;
}

function getRankColor(level: number): string {
  if (level <= 3) return "#9CA3AF";
  if (level <= 6) return "#06B6D4";
  if (level <= 10) return "#F59E0B";
  if (level <= 15) return "#10B981";
  if (level <= 20) return "#A855F7";
  return "#F59E0B";
}

const PARTICLE_POSITIONS = [
  { x: -1, y: -1, size: 3, delay: 0 },
  { x: 1, y: -1, size: 2, delay: 300 },
  { x: -1, y: 1, size: 2, delay: 600 },
  { x: 1, y: 1, size: 3, delay: 900 },
  { x: 0, y: -1.3, size: 2, delay: 150 },
  { x: 1.3, y: 0, size: 2, delay: 450 },
];

export function LevelBadge({ level, size = "md" }: LevelBadgeProps) {
  const colors = useColors();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub.remove();
  }, []);

  const sizes = {
    sm: { container: 40, fontSize: 16, chevronSize: 10 },
    md: { container: 56, fontSize: 24, chevronSize: 14 },
    lg: { container: 72, fontSize: 32, chevronSize: 18 },
  };
  const s = sizes[size];
  const chevronCount = getChevrons(level);
  const rankColor = getRankColor(level);

  const glowAnim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    if (reduceMotion) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.7, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]),
    ).start();
  }, [glowAnim, reduceMotion]);

  const particleAnims = useMemo(() => PARTICLE_POSITIONS.map(() => new Animated.Value(0)), []);
  useEffect(() => {
    if (reduceMotion) return;
    const animations = particleAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(PARTICLE_POSITIONS[i].delay),
          Animated.timing(anim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0.2, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        ]),
      ),
    );
    Animated.parallel(animations).start();
  }, [particleAnims, reduceMotion]);

  const ringWidth = level >= 10 ? 2.5 : 2;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Level ${level} ${getLevelTitle(level)}`}
      style={{ alignItems: "center" }}
    >
      <View style={{ position: "relative", width: s.container + 24, height: s.container + 24 }}>
        {/* Particles */}
        {!reduceMotion && PARTICLE_POSITIONS.map((particle, i) => {
          const centerX = (s.container + 24) / 2;
          const centerY = (s.container + 24) / 2;
          const px = centerX + particle.x * (s.container / 2 + 10) - particle.size / 2;
          const py = centerY + particle.y * (s.container / 2 + 10) - particle.size / 2;
          return (
            <Animated.View
              key={i}
              style={{
                position: "absolute", left: px, top: py,
                width: particle.size, height: particle.size,
                borderRadius: particle.size / 2,
                backgroundColor: rankColor,
                opacity: particleAnims[i],
              }}
            />
          );
        })}

        {/* Glow ring */}
        <Animated.View
          style={{
            position: "absolute",
            top: (s.container + 24) / 2 - s.container / 2 - 6,
            left: (s.container + 24) / 2 - s.container / 2 - 6,
            width: s.container + 12, height: s.container + 12,
            borderRadius: 6, backgroundColor: "transparent",
            borderWidth: 1, borderColor: rankColor,
            opacity: reduceMotion ? 0.5 : glowAnim,
            shadowColor: rankColor, shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6, shadowRadius: 12, elevation: 8,
          }}
        />

        {/* Main badge */}
        <View
          style={{
            position: "absolute", top: 12, left: 12,
            width: s.container, height: s.container,
            backgroundColor: rankColor,
            alignItems: "center", justifyContent: "center",
            borderRadius: 4,
            shadowColor: rankColor, shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
          }}
        >
          <Text style={{ fontFamily: typography.h1.fontFamily, fontSize: s.fontSize, color: colors.bg.primary, lineHeight: s.fontSize }}>
            {level}
          </Text>
          {[
            { top: -2, left: -2, bt: ringWidth, bl: ringWidth },
            { top: -2, right: -2, bt: ringWidth, br: ringWidth },
            { bottom: -2, left: -2, bb: ringWidth, bl: ringWidth },
            { bottom: -2, right: -2, bb: ringWidth, br: ringWidth },
          ].map((n, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                top: n.top, left: n.left, right: n.right, bottom: n.bottom,
                borderTopWidth: n.bt, borderBottomWidth: n.bb,
                borderLeftWidth: n.bl, borderRightWidth: n.br,
                borderColor: rankColor,
              }}
            />
          ))}
        </View>
      </View>

      {/* Chevrons */}
      <View style={{ flexDirection: "row", gap: 2, marginTop: spacing[1] }}>
        {Array.from({ length: chevronCount }).map((_, i) => (
          <Text key={i} style={{ color: rankColor, fontSize: s.chevronSize, lineHeight: s.chevronSize }}>▲</Text>
        ))}
      </View>

      <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8, marginTop: spacing[0] }}>
        {getLevelTitle(level)}
      </Text>
    </View>
  );
}
