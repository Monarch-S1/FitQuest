import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import * as ImagePicker from "expo-image-picker";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { StatModule } from "../../src/components/ui/StatModule";
import { SegmentedPanel } from "../../src/components/ui/SegmentedPanel";
import { XpBar } from "../../src/components/ui/XpBar";
import { ThemeSwitcher } from "../../src/components/ui/ThemeSwitcher";
import { GlossyOverlay } from "../../src/components/ui/GlossyOverlay";
import { SyncIndicator } from "../../src/components/ui/SyncIndicator";
import { useUserStore, FitnessGoal, FitnessLevel } from "../../src/stores/useUserStore";
import { getProgressionSummary } from "../../src/utils/progression";
import { signOut as supabaseSignOut } from "../../src/services/supabase";

const GOAL_LABELS: Record<FitnessGoal, string> = {
  strength: "Strength",
  muscle_gain: "Muscle Gain",
  endurance: "Endurance",
  general: "General Fitness",
};

const GOAL_OPTIONS: FitnessGoal[] = ["strength", "muscle_gain", "endurance", "general"];

const LEVEL_LABELS: Record<FitnessLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const LEVEL_OPTIONS: FitnessLevel[] = ["beginner", "intermediate", "advanced"];

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

function getAchievements(
  workoutHistoryLength: number,
  level: number,
  streak: number,
): Achievement[] {
  return [
    {
      id: "first-workout",
      name: "First Step",
      description: "Complete your first workout",
      icon: "●",
      unlocked: workoutHistoryLength >= 1,
    },
    {
      id: "week-streak",
      name: "Committed",
      description: "7-day streak",
      icon: "⚡",
      unlocked: streak >= 7,
    },
    {
      id: "month-streak",
      name: "Unstoppable",
      description: "30-day streak",
      icon: "🔥",
      unlocked: streak >= 30,
    },
    {
      id: "level-5",
      name: "Operative",
      description: "Reach Level 5",
      icon: "▲",
      unlocked: level >= 5,
    },
    {
      id: "level-10",
      name: "Veteran",
      description: "Reach Level 10",
      icon: "▲▲",
      unlocked: level >= 10,
    },
    {
      id: "veteran-10",
      name: "Dedicated",
      description: "Complete 10 workouts",
      icon: "✦",
      unlocked: workoutHistoryLength >= 10,
    },
    {
      id: "deloaded",
      name: "Smart Training",
      description: "Complete a deload week",
      icon: "◆",
      unlocked: level >= 10 && workoutHistoryLength >= 20,
    },
  ];
}

export default function ProfileScreen() {
  const colors = useColors();

  const {
    level,
    totalXp,
    streakData,
    xpProgress,
    workoutHistory,
    displayName,
    email,
    fitnessGoal,
    fitnessLevel,
    isAuthenticated,
    avatarUri,
    updateProfile,
    clearAuth,
  } = useUserStore();
  const [showEditName, setShowEditName] = useState(false);
  const [editName, setEditName] = useState(displayName);

  // Sync editName when displayName changes externally (e.g., onboarding completion)
  const prevDisplayNameRef = useRef(displayName);
  useEffect(() => {
    if (prevDisplayNameRef.current !== displayName && !showEditName) {
      setEditName(displayName);
      prevDisplayNameRef.current = displayName;
    }
  }, [displayName, showEditName]);

  const progressionSummary = useMemo(() => getProgressionSummary(workoutHistory), [workoutHistory]);

  const achievements = useMemo(
    () => getAchievements(workoutHistory.length, level, streakData.currentStreak),
    [workoutHistory.length, level, streakData.currentStreak],
  );

  const rank =
    level <= 3
      ? "Recruit"
      : level <= 6
        ? "Operative"
        : level <= 10
          ? "Veteran"
          : level <= 15
            ? "Elite"
            : "Commander";

  const handleSaveName = useCallback(() => {
    if (editName.trim()) {
      updateProfile({ displayName: editName.trim() });
      setShowEditName(false);
    }
  }, [editName, updateProfile]);

  const handlePickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant photo library access to set a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateProfile({ avatarUri: result.assets[0].uri });
    }
  }, [updateProfile]);

  const handleChangeGoal = useCallback(() => {
    const goalNames = GOAL_OPTIONS.map((g) => ({ text: GOAL_LABELS[g], onPress: () => {
      Alert.alert(
        "Change Training Program",
        `Switching to ${GOAL_LABELS[g]} will update your workout program (rep ranges, sets, rest times). Your XP, streak, and workout history will be preserved. Continue?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "CHANGE", onPress: () => updateProfile({ fitnessGoal: g }) },
        ],
      );
    }}));
    Alert.alert("Change Goal", "Select your new training goal:", [
      ...goalNames.map((g) => ({ text: g.text, onPress: g.onPress })),
      { text: "Cancel", style: "cancel" },
    ], { cancelable: true });
  }, [updateProfile]);

  const handleChangeLevel = useCallback(() => {
    const levelNames = LEVEL_OPTIONS.map((l) => ({ text: LEVEL_LABELS[l], onPress: () => {
      Alert.alert(
        "Change Level",
        `Switching to ${LEVEL_LABELS[l]} will adjust exercise difficulty targets. Your progress will be preserved. Continue?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "CHANGE", onPress: () => updateProfile({ fitnessLevel: l }) },
        ],
      );
    }}));
    Alert.alert("Change Level", "Select your current fitness level:", [
      ...levelNames.map((l) => ({ text: l.text, onPress: l.onPress })),
      { text: "Cancel", style: "cancel" },
    ], { cancelable: true });
  }, [updateProfile]);

  const handleSendFeedback = useCallback(() => {
    Alert.alert("Send Feedback", "Choose how to send your feedback:", [
      { text: "Cancel", style: "cancel" },
      {
        text: "EMAIL",
        onPress: () => {
          const subject = encodeURIComponent("[ARCH Beta] Feedback");
          const body = encodeURIComponent(`\n\n---\nDevice: ${Platform.OS} ${Platform.Version}\nApp Version: 1.0.0`);
          Linking.openURL(`mailto:chamber.enterprise.1@gmail.com?subject=${subject}&body=${body}`);
        },
      },
    ], { cancelable: true });
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? Your workout data is stored locally and will be preserved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "SIGN OUT",
          style: "destructive",
          onPress: async () => {
            await supabaseSignOut();
            clearAuth();
          },
        },
      ],
    );
  }, [clearAuth]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing[4],
          paddingBottom: spacing[12],
        }}
      >
        {/* Header */}
        <View style={{ marginBottom: spacing[4], position: "relative" }}>
          <SyncIndicator />
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 10,
              marginBottom: spacing[1],
            }}
          >
            PROFILE · COMMANDER
          </Text>
          <Text
            style={{
              ...typography.display,
              color: colors.text.primary,
            }}
          >
            PROFILE
          </Text>
        </View>

        {/* Identity card */}
        <SegmentedPanel title="IDENTITY" accent="amber">
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing[4],
            }}
          >
            {/* Avatar */}
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Change profile picture">
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  borderWidth: 2,
                  borderColor: colors.accent.DEFAULT,
                  backgroundColor: colors.bg.elevated,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={{ width: 72, height: 72, borderRadius: 36 }}
                  />
                ) : (
                  <Text style={{ fontSize: 28, color: colors.text.secondary }}>+</Text>
                )}
              </View>
              <View
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: colors.accent.DEFAULT,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: colors.bg.elevated,
                }}
              >
                <Text style={{ fontSize: 10, color: colors.bg.primary }}>✎</Text>
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              {showEditName ? (
                <View style={{ flexDirection: "row", gap: spacing[2], alignItems: "center" }}>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    autoFocus
                    onSubmitEditing={handleSaveName}
                    style={{
                      flex: 1,
                      backgroundColor: colors.bg.elevated,
                      borderWidth: 1,
                      borderColor: colors.accent.DEFAULT,
                      borderRadius: 4,
                      padding: spacing[2],
                      color: colors.text.primary,
                      fontFamily: fonts.body.semiBold,
                      fontSize: 16,
                    }}
                  />
                  <TouchableOpacity onPress={handleSaveName} accessibilityRole="button" accessibilityLabel="Save name">
                    <Text
                      style={{ ...typography.label, color: colors.accent.DEFAULT, fontSize: 9 }}
                    >
                      SAVE
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setShowEditName(true)} accessibilityRole="button" accessibilityLabel="Edit display name" accessibilityHint="Double tap to edit your name">
                  <Text
                    style={{
                      ...typography.h2,
                      color: colors.text.primary,
                      fontSize: 24,
                    }}
                  >
                    {displayName}
                  </Text>
                </TouchableOpacity>
              )}
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.secondary,
                  marginTop: spacing[1],
                }}
              >
                Rank: {rank}
              </Text>
              {email ? (
                <Text
                  style={{
                    ...typography.bodySmall,
                    color: colors.text.secondary,
                    fontSize: 9,
                    marginTop: 1,
                  }}
                >
                  {email}
                </Text>
              ) : null}
              <View style={{ marginTop: spacing[2] }}>
                <XpBar
                  currentXp={xpProgress.currentXp}
                  requiredXp={xpProgress.requiredXp}
                  level={level}
                  nextLevel={level + 1}
                />
              </View>
            </View>
          </View>

          {/* Goal & Level badges — tappable to change */}
          <View
            style={{
              flexDirection: "row",
              gap: spacing[2],
              marginTop: spacing[3],
            }}
          >
            <TouchableOpacity
              onPress={handleChangeGoal}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Goal: ${GOAL_LABELS[fitnessGoal]}. Tap to change.`}
              style={{
                flex: 1,
                backgroundColor: colors.bg.primary,
                borderWidth: 1,
                borderColor: colors.accent.DEFAULT,
                borderRadius: 4,
                padding: spacing[2],
                overflow: "hidden",
              }}
            >
              <GlossyOverlay highlightOpacity={0.1} showReflection={false} />
              <Text
                style={{
                  ...typography.label,
                  color: colors.text.secondary,
                  fontSize: 7,
                }}
              >
                GOAL · TAP TO CHANGE
              </Text>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.accent.DEFAULT,
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                {GOAL_LABELS[fitnessGoal]}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleChangeLevel}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Level: ${LEVEL_LABELS[fitnessLevel]}. Tap to change.`}
              style={{
                flex: 1,
                backgroundColor: colors.bg.primary,
                borderWidth: 1,
                borderColor: colors.success,
                borderRadius: 4,
                padding: spacing[2],
                overflow: "hidden",
              }}
            >
              <GlossyOverlay highlightOpacity={0.1} showReflection={false} />
              <Text
                style={{
                  ...typography.label,
                  color: colors.text.secondary,
                  fontSize: 7,
                }}
              >
                LEVEL · TAP TO CHANGE
              </Text>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.success,
                  fontSize: 10,
                  marginTop: 2,
                }}
              >
                {LEVEL_LABELS[fitnessLevel]}
              </Text>
            </TouchableOpacity>
          </View>
        </SegmentedPanel>

        {/* ── Theme Settings ── */}
        <SegmentedPanel title="THEME" accent="amber" style={{ marginTop: spacing[2] }}>
          <ThemeSwitcher />
        </SegmentedPanel>

        {/* Stats Grid */}
        <Text
          style={{
            ...typography.subtitle,
            color: colors.text.secondary,
            fontSize: 11,
            marginTop: spacing[2],
            marginBottom: spacing[3],
          }}
        >
          STATISTICS
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[2] }}>
          <View style={{ width: "31%" }}>
            <StatModule label="TOTAL XP" value={totalXp} accent="amber" size="sm" />
          </View>
          <View style={{ width: "31%" }}>
            <StatModule label="WORKOUTS" value={workoutHistory.length} accent="green" size="sm" />
          </View>
          <View style={{ width: "31%" }}>
            <StatModule
              label="STREAK"
              value={streakData.currentStreak}
              accent={streakData.currentStreak >= 3 ? "green" : "amber"}
              size="sm"
              subValue={`Best: ${streakData.longestStreak}`}
            />
          </View>
        </View>

        {/* Exercise Progression */}
        {progressionSummary.exercisesInProgress.length > 0 && (
          <>
            <Text
              style={{
                ...typography.subtitle,
                color: colors.text.secondary,
                fontSize: 11,
                marginTop: spacing[2],
                marginBottom: spacing[3],
              }}
            >
              EXERCISE PROGRESSION
            </Text>
            {progressionSummary.exercisesReady.length > 0 && (
              <SegmentedPanel
                title={`READY TO PROGRESS (${progressionSummary.exercisesReady.length})`}
                accent="green"
                style={{ marginBottom: spacing[2] }}
              >
                {progressionSummary.exercisesReady.map((ex) => (
                  <View key={ex.exerciseId}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            ...typography.bodySmall,
                            color: colors.text.primary,
                            fontFamily: fonts.body.semiBold,
                            fontSize: 11,
                          }}
                        >
                          {ex.exerciseName}
                        </Text>
                        <Text
                          style={{
                            ...typography.bodySmall,
                            color: colors.text.secondary,
                            fontSize: 9,
                            marginTop: 2,
                          }}
                        >
                          Avg {ex.averageReps} reps · {ex.sessionsCompleted} sessions
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end", marginLeft: spacing[2] }}>
                        <Text
                          style={{
                            ...typography.label,
                            color: colors.success,
                            fontSize: 7,
                          }}
                        >
                          {ex.highEndPercentage}% UPPER RANGE
                        </Text>
                        <Text
                          style={{
                            ...typography.bodySmall,
                            color: colors.text.secondary,
                            fontSize: 8,
                            marginTop: 2,
                          }}
                          numberOfLines={1}
                        >
                          Next: {ex.nextProgression.split("→")[0]?.trim() || "Advanced variation"}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        height: 1,
                        backgroundColor: colors.border.subtle,
                        marginVertical: spacing[1],
                      }}
                    />
                  </View>
                ))}
              </SegmentedPanel>
            )}
            <SegmentedPanel title="IN PROGRESS" accent="none" style={{ marginBottom: spacing[2] }}>
              {progressionSummary.exercisesInProgress.slice(0, 8).map((ex, i, arr) => (
                <View key={ex.exerciseId}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.primary,
                        fontSize: 11,
                      }}
                    >
                      {ex.exerciseName}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing[1],
                      }}
                    >
                      <Text
                        style={{
                          ...typography.bodySmall,
                          color: colors.text.secondary,
                          fontSize: 9,
                        }}
                      >
                        Rep range: {ex.repRange[0]}-{ex.repRange[1]}
                      </Text>
                      {ex.recentTrend !== "unknown" && (
                        <Text
                          style={{
                            ...typography.label,
                            fontSize: 7,
                            color:
                              ex.recentTrend === "up"
                                ? colors.success
                                : ex.recentTrend === "down"
                                  ? colors.error
                                  : colors.text.secondary,
                          }}
                        >
                          {ex.recentTrend === "up" ? "▲" : ex.recentTrend === "down" ? "▼" : "◆"}
                        </Text>
                      )}
                    </View>
                  </View>
                  {i < arr.length - 1 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: colors.border.subtle,
                        marginVertical: spacing[1],
                      }}
                    />
                  )}
                </View>
              ))}
            </SegmentedPanel>
          </>
        )}

        {/* Recent Activity */}
        <SegmentedPanel title="RECENT ACTIVITY" accent="none" style={{ marginTop: spacing[2] }}>
          {workoutHistory.length === 0 ? (
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.secondary,
                fontSize: 12,
                textAlign: "center",
                padding: spacing[4],
              }}
            >
              No workouts recorded yet. Complete your first training session to see activity here.
            </Text>
          ) : (
            <View style={{ gap: spacing[2] }}>
              {[...workoutHistory]
                .reverse()
                .slice(0, 5)
                .map((session) => (
                  <View
                    key={session.id}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: colors.bg.primary,
                      padding: spacing[2],
                      borderWidth: 1,
                      borderColor: colors.border.subtle,
                      borderRadius: 4,
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          ...typography.bodySmall,
                          color: colors.text.primary,
                          fontSize: 11,
                          fontFamily: fonts.body.semiBold,
                        }}
                      >
                        {session.workoutId.toUpperCase()}
                      </Text>
                      <Text
                        style={{
                          ...typography.bodySmall,
                          color: colors.text.secondary,
                          fontSize: 9,
                        }}
                      >
                        {session.date}
                      </Text>
                    </View>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.accent.DEFAULT,
                        fontSize: 11,
                      }}
                    >
                      +{session.xpEarned} XP
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </SegmentedPanel>

        {/* Achievements */}
        <Text
          style={{
            ...typography.subtitle,
            color: colors.text.secondary,
            fontSize: 11,
            marginTop: spacing[2],
            marginBottom: spacing[3],
          }}
        >
          ACHIEVEMENTS
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[2] }}>
          {achievements.map((achievement) => (
            <View
              key={achievement.id}
              style={{
                width: "31%",
                backgroundColor: achievement.unlocked ? `${colors.success}15` : colors.bg.elevated,
                borderWidth: 1,
                borderColor: achievement.unlocked ? colors.success : colors.border.subtle,
                borderRadius: 4,
                padding: spacing[2],
                alignItems: "center",
                opacity: achievement.unlocked ? 1 : 0.5,
              }}
            >
              <Text style={{ fontSize: 20, marginBottom: spacing[1] }}>
                {achievement.unlocked ? achievement.icon : "○"}
              </Text>
              <Text
                style={{
                  ...typography.label,
                  color: achievement.unlocked ? colors.success : colors.text.secondary,
                  fontSize: 7,
                  textAlign: "center",
                }}
                numberOfLines={2}
              >
                {achievement.name.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>

        {/* Feedback */}
        <SegmentedPanel title="SUPPORT" accent="amber" style={{ marginTop: spacing[4] }}>
          <TouchableOpacity
            onPress={handleSendFeedback}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Send feedback or report a bug"
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: spacing[2],
            }}
          >
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.primary,
                fontSize: 12,
              }}
            >
              Send Feedback / Report Bug
            </Text>
            <Text
              style={{
                ...typography.label,
                color: colors.accent.DEFAULT,
                fontSize: 9,
              }}
            >
              →
            </Text>
          </TouchableOpacity>
        </SegmentedPanel>

        {/* Legal */}
        <SegmentedPanel title="LEGAL" accent="none" style={{ marginTop: spacing[2] }}>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://<your-github-username>.github.io/arch/")}
            activeOpacity={0.7}
            accessibilityRole="link"
            accessibilityLabel="Privacy Policy"
            accessibilityHint="Opens privacy policy in browser"
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: spacing[2],
            }}
          >
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.primary,
                fontSize: 12,
              }}
            >
              Privacy Policy
            </Text>
            <Text
              style={{
                ...typography.label,
                color: colors.text.secondary,
                fontSize: 9,
              }}
            >
              VIEW →
            </Text>
          </TouchableOpacity>
        </SegmentedPanel>

        {/* Sign Out */}
        {isAuthenticated && (
          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Sign out of your account"
            style={{
              marginTop: spacing[4],
              borderWidth: 1,
              borderColor: colors.error,
              borderRadius: 4,
              padding: spacing[3],
              alignItems: "center",
            }}
          >
            <Text
              style={{
                ...typography.label,
                color: colors.error,
                fontSize: 10,
                letterSpacing: 2,
              }}
            >
              SIGN OUT
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
