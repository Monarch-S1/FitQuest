import { useEffect, useState, useMemo } from "react";
import { View, Text } from "react-native";
import { MotiView } from "moti";
import { useColors, typography, spacing, fonts } from "../../tokens";
import { Button } from "../ui/Button";
import { XpBreakdown } from "../../utils/xp";
import { checkAchievements, AchievementBadge } from "../ui/AchievementSystem";
import { GlossyOverlay } from "../ui/GlossyOverlay";

interface CompletionAnimationProps {
  xpBreakdown: XpBreakdown;
  level: number;
  newLevel: number;
  duration: number;
  workoutName: string;
  onContinue: () => void;
  /** Context for checking which achievements to show */
  achievementContext?: {
    totalWorkouts: number;
    currentStreak: number;
    longestStreak: number;
    level: number;
    totalXp: number;
    lastWorkoutXp?: number;
    lastWorkoutDuration?: number;
    lastWorkoutAllComplete?: boolean;
    muscleLevels?: Record<string, number>;
  };
}

export function CompletionAnimation({
  xpBreakdown,
  level,
  newLevel,
  duration,
  workoutName,
  onContinue,
  achievementContext,
}: CompletionAnimationProps) {
  const colors = useColors();
  const [showContent, setShowContent] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const leveledUp = newLevel > level;

  // Check for newly unlocked achievements
  const unlockedAchievements = useMemo(() => {
    if (!achievementContext) return [];
    return checkAchievements(achievementContext);
  }, [achievementContext]);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 600);
    const achieveTimer = setTimeout(() => setShowAchievements(true), 1800);
    return () => {
      clearTimeout(timer);
      clearTimeout(achieveTimer);
    };
  }, []);

  // Pre-compute particle positions — more particles for a celebration feel
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        translateY: -400 - Math.random() * 300,
        translateX: (Math.random() - 0.5) * 100,
        duration: 1200 + Math.random() * 1500,
        left: `${5 + Math.random() * 90}%`,
        size: 3 + Math.random() * 8,
        color: [colors.accent.DEFAULT, colors.success, colors.accent.dark, colors.accent.light, colors.warning][i % 5],
        rotation: Math.random() * 360,
      })),
    [],
  );

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  // Compute XP per minute for the stat
  const xpPerMin = duration > 0 ? Math.round((xpBreakdown.total / duration) * 60) : 0;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg.primary,
        justifyContent: "center",
        alignItems: "center",
        padding: spacing[6],
      }}
    >
      {/* Background glow effect */}
      {showContent && (
        <MotiView
          from={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.15, scale: 3 }}
          transition={{ type: "timing", duration: 2000 }}
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: leveledUp ? colors.accent.DEFAULT : colors.success,
          }}
        />
      )}

      {/* Background particles */}
      {showContent && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          {particles.map((p, i) => (
            <MotiView
              key={i}
              from={{ translateY: 0, opacity: 1, scale: 1, rotate: "0deg" }}
              animate={{
                translateY: p.translateY,
                translateX: p.translateX,
                opacity: 0,
                scale: 0,
                rotate: `${p.rotation}deg`,
              }}
              transition={{
                type: "timing",
                duration: p.duration,
                delay: i * 80,
              }}
              style={{
                position: "absolute",
                bottom: "25%",
                left: p.left as any,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: 1,
              }}
            />
          ))}
        </View>
      )}

      <MotiView
        from={{ opacity: 0, scale: 0.5, translateY: 50 }}
        animate={{
          opacity: showContent ? 1 : 0,
          scale: showContent ? 1 : 0.5,
          translateY: showContent ? 0 : 50,
        }}
        transition={{ type: "spring", damping: 12, stiffness: 80 }}
        style={{ alignItems: "center", width: "100%" }}
      >
        {/* Animated completion badge */}
        <MotiView
          from={{ scale: 0, rotate: "-180deg" }}
          animate={{ scale: 1, rotate: "0deg" }}
          transition={{ type: "spring", damping: 10, stiffness: 100, delay: 200 }}
        >
          <View
            style={{
              width: 88,
              height: 88,
              backgroundColor: `${colors.success}15`,
              borderWidth: 2,
              borderColor: colors.success,
              borderRadius: 4,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: spacing[4],
              shadowColor: colors.success,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 40 }}>✦</Text>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 400, type: "spring", damping: 15 }}
        >
          <Text
            style={{
              ...typography.h1,
              color: colors.text.primary,
              fontSize: 32,
              textAlign: "center",
              letterSpacing: 2,
            }}
          >
            MISSION COMPLETE
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 550 }}
        >
          <Text
            style={{
              ...typography.body,
              color: colors.text.secondary,
              marginTop: spacing[1],
              textAlign: "center",
            }}
          >
            {workoutName}
          </Text>
        </MotiView>

        {/* Stats row with staggered animation */}
        <View
          style={{
            flexDirection: "row",
            gap: spacing[5],
            marginTop: spacing[5],
          }}
        >
          <MotiView
            from={{ opacity: 0, translateY: 20, scale: 0.8 }}
            animate={{ opacity: showContent ? 1 : 0, translateY: showContent ? 0 : 20, scale: 1 }}
            transition={{ delay: 350, type: "spring", damping: 15 }}
            style={{ alignItems: "center" }}
          >
            <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
              DURATION
            </Text>
            <Text style={{ ...typography.h2, color: colors.text.primary }}>
              {minutes}:{seconds.toString().padStart(2, "0")}
            </Text>
          </MotiView>

          <View style={{ width: 1, height: 40, backgroundColor: colors.border.subtle, alignSelf: "center" }} />

          <MotiView
            from={{ opacity: 0, translateY: 20, scale: 0.8 }}
            animate={{ opacity: showContent ? 1 : 0, translateY: showContent ? 0 : 20, scale: 1 }}
            transition={{ delay: 500, type: "spring", damping: 15 }}
            style={{ alignItems: "center" }}
          >
            <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
              XP EARNED
            </Text>
            <Text style={{ ...typography.h2, color: colors.accent.DEFAULT }}>
              +{xpBreakdown.total}
            </Text>
          </MotiView>

          <View style={{ width: 1, height: 40, backgroundColor: colors.border.subtle, alignSelf: "center" }} />

          <MotiView
            from={{ opacity: 0, translateY: 20, scale: 0.8 }}
            animate={{ opacity: showContent ? 1 : 0, translateY: showContent ? 0 : 20, scale: 1 }}
            transition={{ delay: 650, type: "spring", damping: 15 }}
            style={{ alignItems: "center" }}
          >
            <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
              XP/MIN
            </Text>
            <Text style={{ ...typography.h2, color: colors.text.primary }}>
              {xpPerMin}
            </Text>
          </MotiView>
        </View>

        {/* XP Breakdown */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: showContent ? 1 : 0, translateY: showContent ? 0 : 20 }}
          transition={{ delay: 700, type: "spring", damping: 15 }}
          style={{
            width: "100%",
            backgroundColor: colors.bg.elevated,
            borderWidth: 1,
            borderColor: colors.border.subtle,
            borderRadius: 4,
            padding: spacing[3],
            marginTop: spacing[4],
            overflow: "hidden",
          }}
        >
          <GlossyOverlay highlightOpacity={0.1} showReflection={false} />
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 8,
              marginBottom: spacing[2],
            }}
          >
            XP BREAKDOWN
          </Text>
          <View style={{ gap: spacing[1] }}>
            <Row label="Base (sets)" value={`+${xpBreakdown.base}`} />
            <Row label="Completion bonus" value={`+${xpBreakdown.completionBonus}`} />
            {xpBreakdown.streakBonus > 0 && (
              <Row
                label="Streak bonus"
                value={`+${xpBreakdown.streakBonus}`}
                color={colors.accent.DEFAULT}
              />
            )}
            <View
              style={{
                height: 1,
                backgroundColor: colors.border.subtle,
                marginVertical: spacing[1],
              }}
            />
            <Row label="TOTAL" value={`+${xpBreakdown.total}`} color={colors.accent.DEFAULT} bold />
          </View>
        </MotiView>

        {/* Level up indicator */}
        {leveledUp && (
          <MotiView
            from={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 900, type: "spring", damping: 10 }}
            style={{
              backgroundColor: `${colors.accent.DEFAULT}15`,
              borderWidth: 1.5,
              borderColor: colors.accent.DEFAULT,
              borderRadius: 4,
              padding: spacing[3],
              marginTop: spacing[4],
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[2],
              shadowColor: colors.accent.DEFAULT,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
              overflow: "hidden",
            }}
          >
            <GlossyOverlay highlightOpacity={0.12} showReflection={false} />
            <MotiView
              from={{ rotate: "0deg" }}
              animate={{ rotate: "360deg" }}
              transition={{ type: "timing", duration: 1500, repeat: -1 }}
            >
              <Text style={{ fontSize: 28 }}>▲</Text>
            </MotiView>
            <View>
              <Text style={{ ...typography.label, color: colors.accent.DEFAULT, fontSize: 10 }}>
                LEVEL UP!
              </Text>
              <Text style={{ ...typography.h3, color: colors.text.primary }}>
                LEVEL {level} → LEVEL {newLevel}
              </Text>
            </View>
          </MotiView>
        )}

        {/* Achievement badges */}
        {showAchievements && unlockedAchievements.length > 0 && (
          <View style={{ width: "100%", marginTop: spacing[4] }}>
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: colors.accent.DEFAULT,
                  fontSize: 9,
                  marginBottom: spacing[2],
                  textAlign: "center",
                }}
              >
                ACHIEVEMENTS UNLOCKED
              </Text>
            </MotiView>
            <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing[3], flexWrap: "wrap" }}>
              {unlockedAchievements.map((achievement, i) => (
                <MotiView
                  key={achievement.id}
                  from={{ opacity: 0, scale: 0, rotate: "-30deg" }}
                  animate={{ opacity: 1, scale: 1, rotate: "0deg" }}
                  transition={{
                    delay: i * 200,
                    type: "spring",
                    damping: 10,
                    stiffness: 120,
                  }}
                >
                  <AchievementBadge achievement={achievement} size="md" />
                </MotiView>
              ))}
            </View>
          </View>
        )}

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: showContent ? 1 : 0 }}
          transition={{ delay: 1100 }}
          style={{ marginTop: spacing[6], width: "100%" }}
        >
          <Button title="CONTINUE" onPress={onContinue} fullWidth />
        </MotiView>
      </MotiView>
    </View>
  );
}

function Row({
  label,
  value,
  color,
  bold = false,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  const colors = useColors();
  const resolvedColor = color ?? colors.text.secondary;

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text
        style={{
          ...typography.bodySmall,
          color: colors.text.secondary,
          fontSize: 11,
          fontFamily: bold ? fonts.body.semiBold : fonts.body.regular,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          ...typography.bodySmall,
          color: resolvedColor,
          fontSize: 11,
          fontFamily: bold ? fonts.body.bold : fonts.body.semiBold,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
