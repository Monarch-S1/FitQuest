import { useEffect, useState, useMemo, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { MotiView } from "moti";
import { useColors, typography, spacing, fonts } from "../../tokens";
import { Button } from "../ui/Button";
import { XpBreakdown } from "../../utils/xp";
import { checkAchievements, AchievementBadge } from "../ui/AchievementSystem";
import { GlossyOverlay } from "../ui/GlossyOverlay";
import { playLevelUpSound, playCompletionSound, cleanupSound } from "../../services/levelUpSound";
import { NewSkillUnlock, NewClassUnlock } from "../../utils/skillUnlocks";

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
  /** Newly unlocked skill tree exercises from this workout */
  newSkillUnlocks?: NewSkillUnlock[];
  /** Newly unlocked workout classes from this workout */
  newClassUnlocks?: NewClassUnlock[];
}

export function CompletionAnimation({
  xpBreakdown,
  level,
  newLevel,
  duration,
  workoutName,
  onContinue,
  achievementContext,
  newSkillUnlocks,
  newClassUnlocks,
}: CompletionAnimationProps) {
  const colors = useColors();
  const [showContent, setShowContent] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSkillUnlocks, setShowSkillUnlocks] = useState(false);
  const [flashVisible, setFlashVisible] = useState(true);
  const leveledUp = newLevel > level;

  // Screen flash animation value
  const flashOpacity = useRef(new Animated.Value(1)).current;

  // Check for newly unlocked achievements
  const unlockedAchievements = useMemo(() => {
    if (!achievementContext) return [];
    return checkAchievements(achievementContext);
  }, [achievementContext]);

  useEffect(() => {
    // Play the appropriate sound
    if (leveledUp) {
      playLevelUpSound();
    } else {
      playCompletionSound();
    }

    // Screen flash: bright white/gold that fades to transparent
    Animated.timing(flashOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => setFlashVisible(false));

    const timer = setTimeout(() => setShowContent(true), 600);
    const achieveTimer = setTimeout(() => setShowAchievements(true), 1800);
    const skillTimer = setTimeout(() => setShowSkillUnlocks(true), 1300);
    return () => {
      clearTimeout(timer);
      clearTimeout(achieveTimer);
      clearTimeout(skillTimer);
      cleanupSound();
    };
  }, []);

  // Pre-compute particles — explosive radial burst + rising particles
  const burstParticles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const distance = 80 + Math.random() * 180;
        const isStar = i % 3 === 0;
        const isCircle = i % 3 === 1;
        return {
          translateX: Math.cos(angle) * distance,
          translateY: Math.sin(angle) * distance,
          duration: 600 + Math.random() * 400,
          size: isStar ? 6 : isCircle ? 4 + Math.random() * 4 : 3 + Math.random() * 3,
          color: [
            colors.accent.DEFAULT,
            colors.accent.light,
            colors.success,
            colors.warning,
            "#FFFFFF",
            colors.accent.dark,
          ][i % 6],
          rotation: Math.random() * 720,
          borderRadius: isCircle ? 50 : isStar ? 2 : 0,
        };
      }),
    [],
  );

  // Rising sparkle particles
  const sparkles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        translateY: -300 - Math.random() * 200,
        translateX: (Math.random() - 0.5) * 120,
        duration: 1000 + Math.random() * 1200,
        left: `${5 + Math.random() * 90}%`,
        size: 2 + Math.random() * 5,
        color: [
          colors.accent.DEFAULT,
          colors.accent.light,
          colors.success,
          colors.warning,
          "#FFFFFF",
        ][i % 5],
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
        padding: spacing.xl,
      }}
    >
      {/* Screen flash — bright white overlay that fades instantly */}
      {flashVisible && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: leveledUp ? "#FFD700" : "#FFFFFF",
            opacity: flashOpacity,
            zIndex: 100,
          }}
        />
      )}

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

      {/* Explosive radial burst particles (from center, immediate) */}
      {showContent && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {burstParticles.map((p, i) => (
            <MotiView
              key={`burst-${i}`}
              from={{ translateX: 0, translateY: 0, opacity: 1, scale: 1.2, rotate: "0deg" }}
              animate={{
                translateX: p.translateX,
                translateY: p.translateY,
                opacity: 0,
                scale: 0.3,
                rotate: `${p.rotation}deg`,
              }}
              transition={{
                type: "timing",
                duration: p.duration,
                delay: i * 30,
              }}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.borderRadius,
              }}
            />
          ))}
        </View>
      )}

      {/* Rising sparkle particles */}
      {showContent && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          {sparkles.map((p, i) => (
            <MotiView
              key={`sparkle-${i}`}
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
                delay: i * 60 + 200,
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
        {/* Animated completion badge — larger, with glow pulse */}
        <MotiView
          from={{ scale: 0, rotate: "-180deg" }}
          animate={{ scale: 1, rotate: "0deg" }}
          transition={{ type: "spring", damping: 10, stiffness: 100, delay: 200 }}
        >
          <MotiView
            from={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{
              type: "timing",
              duration: 800,
              delay: 300,
              loop: true,
              repeatReverse: true,
            }}
            style={{
              position: "absolute",
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              borderWidth: 2,
              borderColor: leveledUp ? colors.accent.DEFAULT : colors.success,
              borderRadius: 6,
            }}
          />
          <View
            style={{
              width: leveledUp ? 100 : 88,
              height: leveledUp ? 100 : 88,
              backgroundColor: `${"#FFD700"}20`,
              borderWidth: 2.5,
              borderColor: leveledUp ? "#FFD700" : colors.success,
              borderRadius: 4,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: spacing.lg,
              shadowColor: leveledUp ? "#FFD700" : colors.success,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            <MotiView
              animate={{ rotate: "360deg" }}
              transition={{ type: "timing", duration: 4000, loop: true }}
            >
              <Text style={{ fontSize: leveledUp ? 48 : 40 }}>{leveledUp ? "★" : "✦"}</Text>
            </MotiView>
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

        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 550 }}>
          <Text
            style={{
              ...typography.body,
              color: colors.text.secondary,
              marginTop: spacing.xs,
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

          <View
            style={{
              width: 1,
              height: 40,
              backgroundColor: colors.border.subtle,
              alignSelf: "center",
            }}
          />

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

          <View
            style={{
              width: 1,
              height: 40,
              backgroundColor: colors.border.subtle,
              alignSelf: "center",
            }}
          />

          <MotiView
            from={{ opacity: 0, translateY: 20, scale: 0.8 }}
            animate={{ opacity: showContent ? 1 : 0, translateY: showContent ? 0 : 20, scale: 1 }}
            transition={{ delay: 650, type: "spring", damping: 15 }}
            style={{ alignItems: "center" }}
          >
            <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
              XP/MIN
            </Text>
            <Text style={{ ...typography.h2, color: colors.text.primary }}>{xpPerMin}</Text>
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
            padding: spacing.md,
            marginTop: spacing.lg,
            overflow: "hidden",
          }}
        >
          <GlossyOverlay highlightOpacity={0.1} showReflection={false} />
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 8,
              marginBottom: spacing.sm,
            }}
          >
            XP BREAKDOWN
          </Text>
          <View style={{ gap: spacing.xs }}>
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
                marginVertical: spacing.xs,
              }}
            />
            <Row label="TOTAL" value={`+${xpBreakdown.total}`} color={colors.accent.DEFAULT} bold />
          </View>
        </MotiView>

        {/* Level up indicator — more dramatic */}
        {leveledUp && (
          <MotiView
            from={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 900, type: "spring", damping: 10, stiffness: 150 }}
            style={{
              backgroundColor: `${colors.accent.DEFAULT}18`,
              borderWidth: 2,
              borderColor: "#FFD700",
              borderRadius: 4,
              padding: spacing.lg,
              marginTop: spacing[5],
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              shadowColor: "#FFD700",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
              overflow: "hidden",
            }}
          >
            <GlossyOverlay highlightOpacity={0.15} showReflection={true} />
            <MotiView
              from={{ rotate: "0deg", scale: 1 }}
              animate={{ rotate: "360deg", scale: 1.1 }}
              transition={{
                type: "timing",
                duration: 1500,
                loop: true,
              }}
            >
              <Text style={{ fontSize: 36 }}>★</Text>
            </MotiView>
            <View>
              <Text
                style={{ ...typography.label, color: "#FFD700", fontSize: 12, letterSpacing: 2 }}
              >
                LEVEL UP!
              </Text>
              <Text style={{ ...typography.h2, color: colors.text.primary }}>
                LEVEL {level} → {newLevel}
              </Text>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.secondary,
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                New abilities unlocked
              </Text>
            </View>
          </MotiView>
        )}

        {/* Class unlock notifications — appear before skills */}
        {showSkillUnlocks && newClassUnlocks && newClassUnlocks.length > 0 && (
          <View style={{ width: "100%", marginTop: spacing.lg }}>
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: colors.success,
                  fontSize: 9,
                  marginBottom: spacing.sm,
                  textAlign: "center",
                }}
              >
                ★ CLASS UNLOCKED
              </Text>
            </MotiView>
            {newClassUnlocks.map((unlock, i) => (
              <MotiView
                key={unlock.classDef.id}
                from={{ opacity: 0, scale: 0.8, translateY: 20 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                transition={{
                  delay: i * 200,
                  type: "spring",
                  damping: 12,
                  stiffness: 100,
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: `${unlock.classDef.accent}15`,
                  borderWidth: 2,
                  borderColor: unlock.classDef.accent,
                  borderRadius: 4,
                  padding: spacing.lg,
                  gap: spacing.md,
                  marginBottom: spacing.sm,
                  overflow: "hidden",
                }}
              >
                <GlossyOverlay highlightOpacity={0.15} showReflection={true} />
                <MotiView
                  from={{ scale: 0, rotate: "-180deg" }}
                  animate={{ scale: 1, rotate: "0deg" }}
                  transition={{ delay: i * 200 + 300, type: "spring", damping: 10 }}
                >
                  <Text style={{ fontSize: 36 }}>{unlock.classDef.icon}</Text>
                </MotiView>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.h3, color: unlock.classDef.accent, fontSize: 16 }}>
                    {unlock.classDef.name}
                  </Text>
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: colors.text.secondary,
                      fontSize: 11,
                      lineHeight: 16,
                      marginTop: spacing.xs,
                    }}
                  >
                    {unlock.classDef.description}
                  </Text>
                  <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
                    {unlock.classDef.focus.slice(0, 3).map((f) => (
                      <View
                        key={f}
                        style={{
                          backgroundColor: `${unlock.classDef.accent}15`,
                          borderRadius: 1,
                          paddingHorizontal: spacing.xs,
                          paddingVertical: 1,
                        }}
                      >
                        <Text
                          style={{
                            ...typography.bodySmall,
                            color: unlock.classDef.accent,
                            fontSize: 7,
                          }}
                        >
                          {f}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                <MotiView
                  from={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 200 + 500, type: "spring", damping: 8 }}
                >
                  <View
                    style={{
                      backgroundColor: colors.success,
                      borderRadius: 4,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.label,
                        color: colors.bg.primary,
                        fontSize: 8,
                        letterSpacing: 1,
                      }}
                    >
                      NEW
                    </Text>
                  </View>
                </MotiView>
              </MotiView>
            ))}
          </View>
        )}

        {/* Skill unlock notifications */}
        {showSkillUnlocks && newSkillUnlocks && newSkillUnlocks.length > 0 && (
          <View style={{ width: "100%", marginTop: spacing.lg }}>
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
                  marginBottom: spacing.sm,
                  textAlign: "center",
                }}
              >
                NEW SKILLS UNLOCKED
              </Text>
            </MotiView>
            <View style={{ gap: spacing.sm }}>
              {newSkillUnlocks.map((unlock, i) => (
                <MotiView
                  key={unlock.node.exercise.id}
                  from={{ opacity: 0, translateX: -20, scale: 0.9 }}
                  animate={{ opacity: 1, translateX: 0, scale: 1 }}
                  transition={{
                    delay: i * 150,
                    type: "spring",
                    damping: 14,
                    stiffness: 100,
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: `${unlock.branchAccent}12`,
                    borderWidth: 1,
                    borderColor: `${unlock.branchAccent}35`,
                    borderRadius: 4,
                    padding: spacing.md,
                    gap: spacing.sm,
                    overflow: "hidden",
                  }}
                >
                  <GlossyOverlay highlightOpacity={0.1} showReflection={false} />
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: `${unlock.branchAccent}15`,
                      borderWidth: 1,
                      borderColor: `${unlock.branchAccent}40`,
                      borderRadius: 4,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{unlock.branchIcon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...typography.label,
                        color: unlock.branchAccent,
                        fontSize: 9,
                      }}
                    >
                      {unlock.branchLabel} · {unlock.node.difficulty.toUpperCase()}
                    </Text>
                    <Text
                      style={{
                        ...typography.body,
                        color: colors.text.primary,
                        fontSize: 13,
                        fontFamily: fonts.body.semiBold,
                        marginTop: 1,
                      }}
                      numberOfLines={1}
                    >
                      {unlock.node.exercise.name.toUpperCase()}
                    </Text>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.secondary,
                        fontSize: 9,
                        marginTop: 1,
                      }}
                      numberOfLines={1}
                    >
                      {unlock.node.exercise.repRange[0]}–{unlock.node.exercise.repRange[1]} reps ·{" "}
                      {unlock.node.exercise.defaultSets} sets
                    </Text>
                  </View>
                  <MotiView
                    from={{ scale: 0, rotate: "-90deg" }}
                    animate={{ scale: 1, rotate: "0deg" }}
                    transition={{
                      delay: i * 150 + 300,
                      type: "spring",
                      damping: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        backgroundColor: `${unlock.branchAccent}20`,
                        borderWidth: 1,
                        borderColor: unlock.branchAccent,
                        borderRadius: 4,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 12, color: unlock.branchAccent }}>★</Text>
                    </View>
                  </MotiView>
                </MotiView>
              ))}
            </View>
          </View>
        )}

        {/* Achievement badges */}
        {showAchievements && unlockedAchievements.length > 0 && (
          <View style={{ width: "100%", marginTop: spacing.lg }}>
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
                  marginBottom: spacing.sm,
                  textAlign: "center",
                }}
              >
                ACHIEVEMENTS UNLOCKED
              </Text>
            </MotiView>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: spacing.md,
                flexWrap: "wrap",
              }}
            >
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
          style={{ marginTop: spacing.xl, width: "100%" }}
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
