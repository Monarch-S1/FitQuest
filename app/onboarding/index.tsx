import { useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { useUserStore, FitnessGoal, FitnessLevel } from "../../src/stores/useUserStore";
import { GlossyOverlay } from "../../src/components/ui/GlossyOverlay";

const GOALS: { id: FitnessGoal; label: string; description: string; icon: string }[] = [
  {
    id: "strength",
    label: "STRENGTH",
    description: "Build raw pushing & pulling power. Low reps, high tension.",
    icon: "▲",
  },
  {
    id: "muscle_gain",
    label: "MUSCLE GAIN",
    description: "Hypertrophy-focused. Moderate reps with mechanical tension.",
    icon: "●",
  },
  {
    id: "endurance",
    label: "ENDURANCE",
    description: "Build muscular stamina. High reps, minimal rest.",
    icon: "◆",
  },
  {
    id: "general",
    label: "GENERAL FITNESS",
    description: "Balanced training for overall health and capability.",
    icon: "◈",
  },
];

const LEVELS: { id: FitnessLevel; label: string; description: string }[] = [
  {
    id: "beginner",
    label: "BEGINNER",
    description: "New to bodyweight training. Focus on fundamentals and form.",
  },
  {
    id: "intermediate",
    label: "INTERMEDIATE",
    description: "Can perform basic movements. Ready for progression.",
  },
  {
    id: "advanced",
    label: "ADVANCED",
    description: "Proficient in advanced variations. Push your limits.",
  },
];

type Step = "welcome" | "name" | "goal" | "level" | "rep_counter" | "quest_intro" | "complete";

export default function OnboardingScreen() {
  const colors = useColors();

  const router = useRouter();
  const { completeOnboarding } = useUserStore();
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<FitnessGoal | null>(null);
  const [level, setLevel] = useState<FitnessLevel | null>(null);

  const handleStart = useCallback(() => {
    setStep("name");
  }, []);

  const handleNameSubmit = useCallback(() => {
    if (!name.trim()) return;
    setStep("goal");
  }, [name]);

  const handleGoalSelect = useCallback((id: FitnessGoal) => {
    setGoal(id);
    // Animate to next step
    setTimeout(() => setStep("level"), 200);
  }, []);

  const handleLevelSelect = useCallback((id: FitnessLevel) => {
    setLevel(id);
    setTimeout(() => setStep("rep_counter"), 200);
  }, []);

  const handleFinish = useCallback(() => {
    if (name.trim() && goal && level) {
      completeOnboarding(name.trim(), goal, level);
      router.replace("/(tabs)");
    }
  }, [name, goal, level, completeOnboarding, router]);

  const handleRepCounterNext = useCallback(() => {
    setStep("quest_intro");
  }, []);

  const handleQuestIntroNext = useCallback(() => {
    setStep("complete");
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step indicator */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: spacing.sm,
            marginBottom: spacing.xxl,
          }}
        >
          {(["welcome", "name", "goal", "level", "rep_counter", "quest_intro"] as Step[]).map(
            (s) => (
              <View
                key={s}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    step === s
                      ? colors.accent.DEFAULT
                      : ["name", "goal", "level", "rep_counter", "quest_intro", "complete"].indexOf(
                            step,
                          ) >=
                          [
                            "welcome",
                            "name",
                            "goal",
                            "level",
                            "rep_counter",
                            "quest_intro",
                          ].indexOf(s)
                        ? colors.success
                        : colors.border.subtle,
                }}
              />
            ),
          )}
        </View>

        {/* Step: Welcome */}
        {step === "welcome" && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400 }}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  ...typography.h1,
                  color: colors.accent.DEFAULT,
                  fontSize: 64,
                  letterSpacing: 4,
                }}
              >
                FitQuest
              </Text>
              <Text
                style={{
                  ...typography.label,
                  color: colors.text.secondary,
                  fontSize: 10,
                  marginTop: spacing.sm,
                  letterSpacing: 3,
                }}
              >
                WELCOME, ATHLETE
              </Text>
              <Text
                style={{
                  ...typography.body,
                  color: colors.text.secondary,
                  fontSize: 13,
                  lineHeight: 20,
                  textAlign: "center",
                  marginTop: spacing.xl,
                  maxWidth: 300,
                }}
              >
                Your personal gamified fitness system. Track workouts, build strength, and level up
                — one rep at a time.
              </Text>
              <TouchableOpacity
                onPress={handleStart}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Begin setup"
                style={{
                  backgroundColor: colors.accent.DEFAULT,
                  borderRadius: 4,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing[10],
                  alignItems: "center",
                  marginTop: spacing.xxl,
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    color: colors.bg.primary,
                    fontSize: 12,
                    letterSpacing: 2,
                  }}
                >
                  BEGIN SETUP
                </Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        )}

        {/* Step: Name */}
        {step === "name" && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400 }}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <View>
              <Text
                style={{
                  ...typography.label,
                  color: colors.accent.DEFAULT,
                  fontSize: 9,
                  marginBottom: spacing.sm,
                }}
              >
                STEP 1 OF 3
              </Text>
              <Text
                style={{
                  ...typography.h2,
                  color: colors.text.primary,
                  fontSize: 28,
                  marginBottom: spacing.sm,
                }}
              >
                WHAT&apos;S YOUR NAME?
              </Text>
              <Text
                style={{
                  ...typography.body,
                  color: colors.text.secondary,
                  fontSize: 12,
                  lineHeight: 18,
                  marginBottom: spacing[5],
                }}
              >
                This is how FitQuest will address you on your training journey.
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.text.secondary}
                autoFocus
                onSubmitEditing={handleNameSubmit}
                returnKeyType="next"
                style={{
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1,
                  borderColor: name.trim() ? colors.accent.DEFAULT : colors.border.subtle,
                  borderRadius: 4,
                  padding: spacing.md,
                  color: colors.text.primary,
                  fontFamily: fonts.heading,
                  fontSize: 24,
                  letterSpacing: 1,
                }}
              />
              <TouchableOpacity
                onPress={handleNameSubmit}
                disabled={!name.trim()}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Continue to next step"
                accessibilityState={{ disabled: !name.trim() }}
                style={{
                  backgroundColor: name.trim() ? colors.accent.DEFAULT : colors.border.subtle,
                  borderRadius: 4,
                  paddingVertical: spacing.md,
                  alignItems: "center",
                  marginTop: spacing.lg,
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    color: name.trim() ? colors.bg.primary : colors.text.secondary,
                    fontSize: 11,
                    letterSpacing: 2,
                  }}
                >
                  CONTINUE
                </Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        )}

        {/* Step: Goal */}
        {step === "goal" && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400 }}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <Text
              style={{
                ...typography.label,
                color: colors.accent.DEFAULT,
                fontSize: 9,
                marginBottom: spacing.sm,
              }}
            >
              STEP 2 OF 3
            </Text>
            <Text
              style={{
                ...typography.h2,
                color: colors.text.primary,
                fontSize: 28,
                marginBottom: spacing[5],
              }}
            >
              WHAT&apos;S YOUR GOAL?
            </Text>

            <View style={{ gap: spacing.sm }}>
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => handleGoalSelect(g.id)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityLabel={`${g.label}: ${g.description}`}
                  accessibilityState={{ selected: goal === g.id }}
                  style={{
                    backgroundColor:
                      goal === g.id ? `${colors.accent.DEFAULT}10` : colors.bg.elevated,
                    borderWidth: 1,
                    borderColor: goal === g.id ? colors.accent.DEFAULT : colors.border.subtle,
                    borderRadius: 4,
                    padding: spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    overflow: "hidden",
                  }}
                >
                  <GlossyOverlay highlightOpacity={0.08} showReflection={false} />
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      backgroundColor:
                        goal === g.id ? `${colors.accent.DEFAULT}15` : colors.bg.primary,
                      borderWidth: 1,
                      borderColor: goal === g.id ? colors.accent.DEFAULT : colors.border.subtle,
                      borderRadius: 4,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{g.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...typography.label,
                        color: goal === g.id ? colors.accent.DEFAULT : colors.text.primary,
                        fontSize: 10,
                      }}
                    >
                      {g.label}
                    </Text>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.secondary,
                        fontSize: 9,
                        lineHeight: 14,
                        marginTop: 2,
                      }}
                    >
                      {g.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </MotiView>
        )}

        {/* Step: Level */}
        {step === "level" && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400 }}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <Text
              style={{
                ...typography.label,
                color: colors.accent.DEFAULT,
                fontSize: 9,
                marginBottom: spacing.sm,
              }}
            >
              STEP 3 OF 3
            </Text>
            <Text
              style={{
                ...typography.h2,
                color: colors.text.primary,
                fontSize: 28,
                marginBottom: spacing[5],
              }}
            >
              WHAT&apos;S YOUR LEVEL?
            </Text>

            <View style={{ gap: spacing.sm }}>
              {LEVELS.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  onPress={() => handleLevelSelect(l.id)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityLabel={`${l.label}: ${l.description}`}
                  accessibilityState={{ selected: level === l.id }}
                  style={{
                    backgroundColor:
                      level === l.id ? `${colors.accent.DEFAULT}10` : colors.bg.elevated,
                    borderWidth: 1,
                    borderColor: level === l.id ? colors.accent.DEFAULT : colors.border.subtle,
                    borderRadius: 4,
                    padding: spacing.lg,
                    overflow: "hidden",
                  }}
                >
                  <GlossyOverlay highlightOpacity={0.08} showReflection={false} />
                  <Text
                    style={{
                      ...typography.label,
                      color: level === l.id ? colors.accent.DEFAULT : colors.text.primary,
                      fontSize: 11,
                      marginBottom: spacing.xs,
                    }}
                  >
                    {l.label}
                  </Text>
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: colors.text.secondary,
                      fontSize: 10,
                      lineHeight: 15,
                    }}
                  >
                    {l.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </MotiView>
        )}

        {/* Step: Rep Counter */}
        {step === "rep_counter" && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400 }}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <Text
              style={{
                ...typography.label,
                color: colors.accent.DEFAULT,
                fontSize: 9,
                marginBottom: spacing.sm,
              }}
            >
              BONUS FEATURE
            </Text>
            <Text
              style={{
                ...typography.h2,
                color: colors.text.primary,
                fontSize: 28,
                marginBottom: spacing.sm,
              }}
            >
              AUTO REP COUNTER
            </Text>
            <Text
              style={{
                ...typography.body,
                color: colors.text.secondary,
                fontSize: 12,
                lineHeight: 18,
                marginBottom: spacing.lg,
              }}
            >
              FitQuest can count your reps automatically using your phone&apos;s motion sensors. No
              tapping required.
            </Text>

            <View style={{ gap: spacing.sm }}>
              {/* Tip 1 */}
              <View
                style={{
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                  padding: spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  overflow: "hidden",
                }}
              >
                <GlossyOverlay highlightOpacity={0.08} showReflection={false} />
                <View
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: `${colors.accent.DEFAULT}15`,
                    borderWidth: 1,
                    borderColor: colors.accent.DEFAULT,
                    borderRadius: 4,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 14 }}>📱</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      ...typography.label,
                      color: colors.text.primary,
                      fontSize: 9,
                    }}
                  >
                    PLACE YOUR PHONE
                  </Text>
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: colors.text.secondary,
                      fontSize: 9,
                      lineHeight: 14,
                      marginTop: 2,
                    }}
                  >
                    Keep your phone in a pocket or on the floor nearby. Works best with rhythmic
                    exercises.
                  </Text>
                </View>
              </View>

              {/* Tip 2 */}
              <View
                style={{
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                  padding: spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  overflow: "hidden",
                }}
              >
                <GlossyOverlay highlightOpacity={0.08} showReflection={false} />
                <View
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: `${colors.accent.DEFAULT}15`,
                    borderWidth: 1,
                    borderColor: colors.accent.DEFAULT,
                    borderRadius: 4,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 14 }}>🎯</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      ...typography.label,
                      color: colors.text.primary,
                      fontSize: 9,
                    }}
                  >
                    CALIBRATION
                  </Text>
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: colors.text.secondary,
                      fontSize: 9,
                      lineHeight: 14,
                      marginTop: 2,
                    }}
                  >
                    Stay still for ~3 seconds at the start of each exercise. FitQuest calibrates to
                    detect your movement axis.
                  </Text>
                </View>
              </View>

              {/* Tip 3 */}
              <View
                style={{
                  backgroundColor: colors.bg.elevated,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                  padding: spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  overflow: "hidden",
                }}
              >
                <GlossyOverlay highlightOpacity={0.08} showReflection={false} />
                <View
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: `${colors.accent.DEFAULT}15`,
                    borderWidth: 1,
                    borderColor: colors.accent.DEFAULT,
                    borderRadius: 4,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 14 }}>👆</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      ...typography.label,
                      color: colors.text.primary,
                      fontSize: 9,
                    }}
                  >
                    SYNC & ADJUST
                  </Text>
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: colors.text.secondary,
                      fontSize: 9,
                      lineHeight: 14,
                      marginTop: 2,
                    }}
                  >
                    Tap the auto count to sync it as your manual rep input. Use +/- to fine-tune if
                    detection is off.
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleRepCounterNext}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Continue"
              style={{
                backgroundColor: colors.accent.DEFAULT,
                borderRadius: 4,
                paddingVertical: spacing.md,
                alignItems: "center",
                marginTop: spacing[5],
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: colors.bg.primary,
                  fontSize: 11,
                  letterSpacing: 2,
                }}
              >
                GOT IT
              </Text>
            </TouchableOpacity>
          </MotiView>
        )}

        {/* Step: Quest Intro */}
        {step === "quest_intro" && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400 }}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <Text
              style={{
                ...typography.label,
                color: colors.accent.DEFAULT,
                fontSize: 9,
                marginBottom: spacing.sm,
                letterSpacing: 1.5,
              }}
            >
              QUEST SYSTEM
            </Text>
            <Text
              style={{
                ...typography.h2,
                color: colors.text.primary,
                fontSize: 28,
                marginBottom: spacing.xs,
              }}
            >
              YOUR JOURNEY AWAITS
            </Text>
            <Text
              style={{
                ...typography.body,
                color: colors.text.secondary,
                fontSize: 12,
                lineHeight: 18,
                marginBottom: spacing.lg,
              }}
            >
              FitQuest organizes your training into 4 daily quests, each targeting different
              movement pathways. Complete quests to earn XP, level up, and unlock the skill tree.
            </Text>

            {/* ── 4 Quest Cards ── */}
            <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
              {/* Quest 1: Iron Gate */}
              <MotiView
                from={{ opacity: 0, translateX: -15 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: "timing", duration: 350, delay: 150 }}
              >
                <View
                  style={{
                    backgroundColor: `${colors.accent.DEFAULT}08`,
                    borderWidth: 1,
                    borderColor: `${colors.accent.DEFAULT}18`,
                    borderRadius: 4,
                    padding: spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      backgroundColor: "#EF444415",
                      borderWidth: 1,
                      borderColor: "#EF444425",
                      borderRadius: 4,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "#EF4444" }}>⚔</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...typography.label,
                        color: "#EF4444",
                        fontSize: 9,
                        letterSpacing: 1.2,
                      }}
                    >
                      THE VANGUARD
                    </Text>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.secondary,
                        fontSize: 8,
                        lineHeight: 13,
                        marginTop: 1,
                      }}
                    >
                      Horizontal Push · Vertical Push · Anterior Legs · Core Flexion
                    </Text>
                  </View>
                </View>
              </MotiView>

              {/* Quest 2: Deep Sanctum */}
              <MotiView
                from={{ opacity: 0, translateX: -15 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: "timing", duration: 350, delay: 220 }}
              >
                <View
                  style={{
                    backgroundColor: `${colors.accent.DEFAULT}08`,
                    borderWidth: 1,
                    borderColor: `${colors.accent.DEFAULT}18`,
                    borderRadius: 4,
                    padding: spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      backgroundColor: "#3B82F615",
                      borderWidth: 1,
                      borderColor: "#3B82F625",
                      borderRadius: 4,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "#3B82F6" }}>⬇</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...typography.label,
                        color: "#3B82F6",
                        fontSize: 9,
                        letterSpacing: 1.2,
                      }}
                    >
                      THE SHADOW
                    </Text>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.secondary,
                        fontSize: 8,
                        lineHeight: 13,
                        marginTop: 1,
                      }}
                    >
                      Horizontal Pull · Vertical Pull · Posterior Legs · Core Extension
                    </Text>
                  </View>
                </View>
              </MotiView>

              {/* Quest 3: Ashen Trial */}
              <MotiView
                from={{ opacity: 0, translateX: -15 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: "timing", duration: 350, delay: 290 }}
              >
                <View
                  style={{
                    backgroundColor: `${colors.accent.DEFAULT}08`,
                    borderWidth: 1,
                    borderColor: `${colors.accent.DEFAULT}18`,
                    borderRadius: 4,
                    padding: spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      backgroundColor: "#10B98115",
                      borderWidth: 1,
                      borderColor: "#10B98125",
                      borderRadius: 4,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "#10B981" }}>⬍</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...typography.label,
                        color: "#10B981",
                        fontSize: 9,
                        letterSpacing: 1.2,
                      }}
                    >
                      THE TEMPEST
                    </Text>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.secondary,
                        fontSize: 8,
                        lineHeight: 13,
                        marginTop: 1,
                      }}
                    >
                      Horizontal Push · Vertical Push · Horizontal Pull · Vertical Pull
                    </Text>
                  </View>
                </View>
              </MotiView>

              {/* Quest 4: Monarch's Will */}
              <MotiView
                from={{ opacity: 0, translateX: -15 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: "timing", duration: 350, delay: 360 }}
              >
                <View
                  style={{
                    backgroundColor: `${colors.accent.DEFAULT}08`,
                    borderWidth: 1,
                    borderColor: `${colors.accent.DEFAULT}18`,
                    borderRadius: 4,
                    padding: spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      backgroundColor: "#F59E0B15",
                      borderWidth: 1,
                      borderColor: "#F59E0B25",
                      borderRadius: 4,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "#F59E0B" }}>◈</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...typography.label,
                        color: "#F59E0B",
                        fontSize: 9,
                        letterSpacing: 1.2,
                      }}
                    >
                      THE COLOSSUS
                    </Text>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.secondary,
                        fontSize: 8,
                        lineHeight: 13,
                        marginTop: 1,
                      }}
                    >
                      Anterior Legs · Posterior Legs · Core Flexion · Core Extension
                    </Text>
                  </View>
                </View>
              </MotiView>
            </View>

            {/* ── Progression Summary ── */}
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 350, delay: 430 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: spacing.sm,
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.bg.elevated,
                    borderRadius: 4,
                    padding: spacing.sm,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border.subtle,
                    overflow: "hidden",
                  }}
                >
                  <Text style={{ fontSize: 16, marginBottom: 2 }}>⚔</Text>
                  <Text
                    style={{
                      ...typography.label,
                      color: colors.text.primary,
                      fontSize: 8,
                      letterSpacing: 0.5,
                      textAlign: "center",
                    }}
                  >
                    COMPLETE QUESTS
                  </Text>
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: colors.text.secondary,
                      fontSize: 7,
                      textAlign: "center",
                      marginTop: 1,
                    }}
                  >
                    4 exercises per session
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.bg.elevated,
                    borderRadius: 4,
                    padding: spacing.sm,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border.subtle,
                    overflow: "hidden",
                  }}
                >
                  <Text style={{ fontSize: 16, marginBottom: 2 }}>✦</Text>
                  <Text
                    style={{
                      ...typography.label,
                      color: colors.text.primary,
                      fontSize: 8,
                      letterSpacing: 0.5,
                      textAlign: "center",
                    }}
                  >
                    EARN XP
                  </Text>
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: colors.text.secondary,
                      fontSize: 7,
                      textAlign: "center",
                      marginTop: 1,
                    }}
                  >
                    Level up your profile
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.bg.elevated,
                    borderRadius: 4,
                    padding: spacing.sm,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.border.subtle,
                    overflow: "hidden",
                  }}
                >
                  <Text style={{ fontSize: 16, marginBottom: 2 }}>◎</Text>
                  <Text
                    style={{
                      ...typography.label,
                      color: colors.text.primary,
                      fontSize: 8,
                      letterSpacing: 0.5,
                      textAlign: "center",
                    }}
                  >
                    MASTER SKILLS
                  </Text>
                  <Text
                    style={{
                      ...typography.bodySmall,
                      color: colors.text.secondary,
                      fontSize: 7,
                      textAlign: "center",
                      marginTop: 1,
                    }}
                  >
                    Unlock the skill tree
                  </Text>
                </View>
              </View>
            </MotiView>

            <TouchableOpacity
              onPress={handleQuestIntroNext}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Continue to final step"
              style={{
                backgroundColor: colors.accent.DEFAULT,
                borderRadius: 4,
                paddingVertical: spacing.md,
                alignItems: "center",
                marginTop: spacing[5],
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: colors.bg.primary,
                  fontSize: 11,
                  letterSpacing: 2,
                }}
              >
                CONTINUE
              </Text>
            </TouchableOpacity>
          </MotiView>
        )}

        {/* Step: Complete */}
        {step === "complete" && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 400 }}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: `${colors.success}15`,
                  borderWidth: 2,
                  borderColor: colors.success,
                  borderRadius: 4,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: spacing.lg,
                }}
              >
                <Text style={{ fontSize: 28, color: colors.success }}>✦</Text>
              </View>
              <Text
                style={{
                  ...typography.h2,
                  color: colors.text.primary,
                  fontSize: 28,
                  textAlign: "center",
                }}
              >
                READY, {name.toUpperCase().split(" ")[0]}
              </Text>
              <Text
                style={{
                  ...typography.body,
                  color: colors.text.secondary,
                  fontSize: 13,
                  lineHeight: 20,
                  textAlign: "center",
                  marginTop: spacing.md,
                  maxWidth: 280,
                }}
              >
                Your profile is set. You&apos;re focused on{" "}
                {GOALS.find((g) => g.id === goal)?.label.toLowerCase()} at a {level} level.
              </Text>
              <TouchableOpacity
                onPress={handleFinish}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Enter FitQuest"
                style={{
                  backgroundColor: colors.accent.DEFAULT,
                  borderRadius: 4,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing[10],
                  alignItems: "center",
                  marginTop: spacing.xxl,
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    color: colors.bg.primary,
                    fontSize: 12,
                    letterSpacing: 2,
                  }}
                >
                  ENTER FITQUEST
                </Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
