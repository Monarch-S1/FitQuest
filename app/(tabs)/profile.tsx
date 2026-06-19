import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { StatModule } from "../../src/components/ui/StatModule";
import { SegmentedPanel } from "../../src/components/ui/SegmentedPanel";
import { XpBar } from "../../src/components/ui/XpBar";
import { ThemeSwitcher } from "../../src/components/ui/ThemeSwitcher";
import { GlossyOverlay } from "../../src/components/ui/GlossyOverlay";
import { SyncIndicator } from "../../src/components/ui/SyncIndicator";
import { FeedbackSheet } from "../../src/components/ui/FeedbackSheet";
import { useUserStore, FitnessGoal, FitnessLevel } from "../../src/stores/useUserStore";
import { getProgressionSummary } from "../../src/utils/progression";
import { signOut as supabaseSignOut } from "../../src/services/supabase";
import { videoCache } from "../../src/services/videoCache";
import { useDialog } from "../../src/components/ui/Dialog";

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
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
      icon: "▴",
      unlocked: workoutHistoryLength >= 1,
    },
    {
      id: "week-streak",
      name: "Committed",
      description: "7-day streak",
      icon: "▬",
      unlocked: streak >= 7,
    },
    {
      id: "month-streak",
      name: "Unstoppable",
      description: "30-day streak",
      icon: "■",
      unlocked: streak >= 30,
    },
    {
      id: "level-5",
      name: "Operative",
      description: "Reach Level 5",
      icon: "◆",
      unlocked: level >= 5,
    },
    {
      id: "level-10",
      name: "Veteran",
      description: "Reach Level 10",
      icon: "◆◆",
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
  const [showFeedback, setShowFeedback] = useState(false);
  const [cachedVideoCount, setCachedVideoCount] = useState(0);
  const [cachedVideoSize, setCachedVideoSize] = useState(0);

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
      dialog.alert({ title: "Permission needed", message: "Please grant photo library access to set a profile picture." });
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
      dialog.confirm({
        title: "Change Training Program",
        message: `Switching to ${GOAL_LABELS[g]} will update your workout program (rep ranges, sets, rest times). Your XP, streak, and workout history will be preserved. Continue?`,
        confirmLabel: "CHANGE",
        onConfirm: () => updateProfile({ fitnessGoal: g }),
      });
    }}));
    dialog.select({
      title: "Change Goal",
      options: goalNames.map((g) => ({ label: g.text, onPress: g.onPress })),
    });
  }, [updateProfile]);

  const handleChangeLevel = useCallback(() => {
    const levelNames = LEVEL_OPTIONS.map((l) => ({ text: LEVEL_LABELS[l], onPress: () => {
      dialog.confirm({
        title: "Change Level",
        message: `Switching to ${LEVEL_LABELS[l]} will adjust exercise difficulty targets. Your progress will be preserved. Continue?`,
        confirmLabel: "CHANGE",
        onConfirm: () => updateProfile({ fitnessLevel: l }),
      });
    }}));
    dialog.select({
      title: "Change Level",
      options: levelNames.map((l) => ({ label: l.text, onPress: l.onPress })),
    });
  }, [updateProfile]);

  // Load cache info on mount with unmount guard
  const cacheMountedRef = useRef(true);
  useEffect(() => {
    cacheMountedRef.current = true;
    videoCache.getCachedIds().then((ids) => {
      if (cacheMountedRef.current) setCachedVideoCount(ids.length);
    });
    videoCache.getCacheSize().then((size) => {
      if (cacheMountedRef.current) setCachedVideoSize(size);
    });
    return () => {
      cacheMountedRef.current = false;
    };
  }, []);

  const handleClearCache = useCallback(() => {
    dialog.destructive({
      title: "Clear Video Cache",
      message: `Remove ${cachedVideoCount} cached video(s) (${formatBytes(cachedVideoSize)})? You can re-download them later.`,
      actionLabel: "CLEAR",
      onAction: async () => {
        await videoCache.clearAll();
        setCachedVideoCount(0);
        setCachedVideoSize(0);
      },
    });
  }, [cachedVideoCount, cachedVideoSize]);

  const handleOpenFeedback = useCallback(() => {
    setShowFeedback(true);
  }, []);

  const handleSignOut = useCallback(() => {
    dialog.destructive({
      title: "Sign Out",
      message: "Are you sure you want to sign out? Your workout data is stored locally and will be preserved.",
      actionLabel: "SIGN OUT",
      onAction: async () => {
        await supabaseSignOut();
        clearAuth();
      },
    });
  }, [clearAuth]);

  const router = useRouter();
  const dialog = useDialog();

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
            Character
          </Text>
          <Text
            style={{
              ...typography.display,
              color: colors.text.primary,
            }}
          >
            Character Sheet
          </Text>
        </View>

        {/* Identity card */}
        <SegmentedPanel title="IDENTITY" accent="amber">
          {/* Rank Emblem */}
          <View
            style={{
              alignItems: "center",
              paddingVertical: spacing[2],
              marginBottom: spacing[2],
              borderBottomWidth: 1,
              borderBottomColor: colors.border.subtle,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                borderWidth: 2,
                borderColor: colors.accent.DEFAULT,
                backgroundColor: `${colors.accent.DEFAULT}10`,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: spacing[1],
              }}
            >
              <Text style={{ fontFamily: fonts.heading, fontSize: 28, color: colors.accent.DEFAULT }}>
                {level}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: fonts.heading,
                fontSize: 18,
                color: colors.accent.DEFAULT,
                letterSpacing: 2,
              }}
            >
              {rank.toUpperCase()}
            </Text>
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.secondary,
                fontSize: 9,
                marginTop: 1,
              }}
            >
              LEVEL {level} · {totalXp} TOTAL XP
            </Text>
          </View>
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
                Goal
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
                Level
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
          Attributes
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
              Exercise Progression
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
          Trophies
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
            onPress={handleOpenFeedback}
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

        {/* Feedback Modal */}
        <FeedbackSheet visible={showFeedback} onClose={() => setShowFeedback(false)} />
        <dialog.Dialog />

        {/* Storage */}
        <SegmentedPanel title="STORAGE" accent="none" style={{ marginTop: spacing[2] }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: spacing[2],
            }}
          >
            <View>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.primary,
                  fontSize: 12,
                }}
              >
                Cached Videos
              </Text>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.secondary,
                  fontSize: 9,
                  marginTop: 2,
                }}
              >
                {cachedVideoCount} video{cachedVideoCount !== 1 ? "s" : ""} · {formatBytes(cachedVideoSize)}
              </Text>
            </View>
            {cachedVideoCount > 0 ? (
              <TouchableOpacity
                onPress={handleClearCache}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Clear all cached videos"
              >
                <Text
                  style={{
                    ...typography.label,
                    color: colors.error,
                    fontSize: 9,
                  }}
                >
                  CLEAR
                </Text>
              </TouchableOpacity>
            ) : (
              <Text
                style={{
                  ...typography.label,
                  color: colors.text.tertiary,
                  fontSize: 8,
                }}
              >
                NONE CACHED
              </Text>
            )}
          </View>
        </SegmentedPanel>

        {/* Legal */}
        <SegmentedPanel title="LEGAL" accent="none" style={{ marginTop: spacing[2] }}>
          <TouchableOpacity
            onPress={() => router.push("/privacy-policy")}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Privacy Policy"
            accessibilityHint="Opens privacy policy"
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
