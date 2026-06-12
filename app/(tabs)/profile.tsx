import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { useUserStore, FitnessGoal, FitnessLevel } from "../../src/stores/useUserStore";
import { getProgressionSummary } from "../../src/utils/progression";
import { signOut as supabaseSignOut } from "../../src/services/supabase";
import { videoCache } from "../../src/services/videoCache";
import { ThemeSwitcher } from "../../src/components/ui/ThemeSwitcher";
import { FeedbackSheet } from "../../src/components/ui/FeedbackSheet";
import { SyncIndicator } from "../../src/components/ui/SyncIndicator";
import { XpBar } from "../../src/components/ui/XpBar";
import { Animated, Easing } from "react-native";

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

function getAchievements(workoutHistoryLength: number, level: number, streak: number): Achievement[] {
  return [
    { id: "first-workout", name: "First Step", description: "Complete your first workout", icon: "●", unlocked: workoutHistoryLength >= 1 },
    { id: "week-streak", name: "Committed", description: "7-day streak", icon: "⚡", unlocked: streak >= 7 },
    { id: "month-streak", name: "Unstoppable", description: "30-day streak", icon: "🔥", unlocked: streak >= 30 },
    { id: "level-5", name: "Operative", description: "Reach Level 5", icon: "▲", unlocked: level >= 5 },
    { id: "level-10", name: "Veteran", description: "Reach Level 10", icon: "▲▲", unlocked: level >= 10 },
    { id: "veteran-10", name: "Dedicated", description: "Complete 10 workouts", icon: "✦", unlocked: workoutHistoryLength >= 10 },
    { id: "deloaded", name: "Smart Training", description: "Complete a deload week", icon: "◆", unlocked: level >= 10 && workoutHistoryLength >= 20 },
  ];
}

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    level, totalXp, streakData, xpProgress, workoutHistory,
    displayName, email, fitnessGoal, fitnessLevel,
    isAuthenticated, avatarUri, updateProfile, clearAuth,
  } = useUserStore();

  const [showEditName, setShowEditName] = useState(false);
  const [editName, setEditName] = useState(displayName);
  const [showFeedback, setShowFeedback] = useState(false);
  const [cachedVideoCount, setCachedVideoCount] = useState(0);
  const [cachedVideoSize, setCachedVideoSize] = useState(0);

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
    level <= 3 ? "Recruit" : level <= 6 ? "Operative" : level <= 10 ? "Veteran" : level <= 15 ? "Elite" : "Commander";

  const handleSaveName = useCallback(() => {
    if (editName.trim()) {
      updateProfile({ displayName: editName.trim() });
      setShowEditName(false);
    }
  }, [editName, updateProfile]);

  const handlePickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      updateProfile({ avatarUri: result.assets[0].uri });
    }
  }, [updateProfile]);

  const handleChangeGoal = useCallback(() => {
    Alert.alert("Change Goal", "Select your new training goal:", [
      ...GOAL_OPTIONS.map((g) => ({ text: GOAL_LABELS[g], onPress: () => {
        Alert.alert("Change Training Program", `Switching to ${GOAL_LABELS[g]} will update your workout program. Continue?`, [
          { text: "Cancel", style: "cancel" },
          { text: "CHANGE", onPress: () => updateProfile({ fitnessGoal: g }) },
        ]);
      }})),
      { text: "Cancel", style: "cancel" },
    ], { cancelable: true });
  }, [updateProfile]);

  const handleChangeLevel = useCallback(() => {
    Alert.alert("Change Level", "Select your current fitness level:", [
      ...LEVEL_OPTIONS.map((l) => ({ text: LEVEL_LABELS[l], onPress: () => {
        Alert.alert("Change Level", `Switching to ${LEVEL_LABELS[l]} will adjust exercise difficulty. Continue?`, [
          { text: "Cancel", style: "cancel" },
          { text: "CHANGE", onPress: () => updateProfile({ fitnessLevel: l }) },
        ]);
      }})),
      { text: "Cancel", style: "cancel" },
    ], { cancelable: true });
  }, [updateProfile]);

  const cacheMountedRef = useRef(true);
  useEffect(() => {
    cacheMountedRef.current = true;
    videoCache.getCachedIds().then((ids) => { if (cacheMountedRef.current) setCachedVideoCount(ids.length); });
    videoCache.getCacheSize().then((size) => { if (cacheMountedRef.current) setCachedVideoSize(size); });
    return () => { cacheMountedRef.current = false; };
  }, []);

  const handleClearCache = useCallback(() => {
    Alert.alert("Clear Video Cache", `Remove ${cachedVideoCount} cached video(s) (${formatBytes(cachedVideoSize)})?`, [
      { text: "Cancel", style: "cancel" },
      { text: "CLEAR", style: "destructive", onPress: async () => { await videoCache.clearAll(); setCachedVideoCount(0); setCachedVideoSize(0); } },
    ]);
  }, [cachedVideoCount, cachedVideoSize]);

  const handleSignOut = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "SIGN OUT", style: "destructive", onPress: async () => { await supabaseSignOut(); clearAuth(); } },
    ]);
  }, [clearAuth]);

  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <Animated.ScrollView style={{ flex: 1, opacity: fadeIn }} contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[12] }} showsVerticalScrollIndicator={false}>
        <SyncIndicator />
        {/* Avatar & Identity */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7}>
            <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: colors.accent.DEFAULT, backgroundColor: colors.bg.surface, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {avatarUri ? <Image source={{ uri: avatarUri }} style={{ width: 96, height: 96, borderRadius: 48 }} /> : <Text style={{ fontSize: 40, color: colors.accent.DEFAULT }}>+</Text>}
            </View>
          </TouchableOpacity>
          <View style={{ marginTop: 16, alignItems: "center" }}>
            {showEditName ? (
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput value={editName} onChangeText={setEditName} autoFocus onSubmitEditing={handleSaveName} style={{ backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.accent.DEFAULT, borderRadius: 8, padding: 8, color: colors.text.primary, fontFamily: fonts.body.semiBold, fontSize: 16, minWidth: 120, textAlign: "center" }} />
                <TouchableOpacity onPress={handleSaveName}><Text style={{ fontFamily: fonts.body.bold, fontSize: 10, color: colors.accent.DEFAULT }}>SAVE</Text></TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setShowEditName(true)}>
                <Text style={{ fontFamily: fonts.heading, fontSize: 24, fontWeight: "900", color: colors.text.primary, textTransform: "uppercase" }}>{displayName || "ATHLETE"}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ backgroundColor: colors.accent.DEFAULT, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginTop: 8 }}>
            <Text style={{ fontFamily: fonts.body.bold, fontSize: 10, fontWeight: "bold", color: colors.bg.primary, textTransform: "uppercase", letterSpacing: 1 }}>
              LVL {level} — {rank.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Goal & Level badges */}
        <View style={{ flexDirection: "row", gap: spacing[2], marginBottom: 16 }}>
          <TouchableOpacity onPress={handleChangeGoal} activeOpacity={0.7} style={{ flex: 1, backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.accent.DEFAULT, borderRadius: 8, padding: 12, alignItems: "center" }}>
            <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 7, color: colors.text.secondary, textTransform: "uppercase", letterSpacing: 1 }}>GOAL · TAP TO CHANGE</Text>
            <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 10, color: colors.accent.DEFAULT, marginTop: 4 }}>{GOAL_LABELS[fitnessGoal]}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChangeLevel} activeOpacity={0.7} style={{ flex: 1, backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.success, borderRadius: 8, padding: 12, alignItems: "center" }}>
            <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 7, color: colors.text.secondary, textTransform: "uppercase", letterSpacing: 1 }}>LEVEL · TAP TO CHANGE</Text>
            <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 10, color: colors.success, marginTop: 4 }}>{LEVEL_LABELS[fitnessLevel]}</Text>
          </TouchableOpacity>
        </View>

        {/* Compact Stats Row */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 24, paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border.subtle, marginBottom: 24 }}>
          {[
            { label: "Workouts", value: String(workoutHistory.length), icon: "🏋️" },
            { label: "Streak", value: String(streakData.currentStreak), icon: "🔥" },
            { label: "XP", value: totalXp >= 1000 ? `${(totalXp / 1000).toFixed(1)}K` : String(totalXp), icon: "⚡" },
          ].map((stat) => (
            <View key={stat.label} style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 14 }}>{stat.icon}</Text>
              <Text style={{ fontFamily: fonts.body.bold, fontSize: 14, color: colors.text.primary, marginTop: 2 }}>{stat.value}</Text>
              <Text style={{ fontFamily: fonts.body.regular, fontSize: 10, color: colors.text.secondary }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Theme */}
        <View style={{ backgroundColor: colors.bg.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border.subtle }}>
          <Text style={{ fontFamily: fonts.body.bold, fontSize: 10, fontWeight: "bold", color: colors.accent.DEFAULT, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>THEME</Text>
          <ThemeSwitcher />
        </View>

        {/* Exercise Progression */}
        {progressionSummary.exercisesInProgress.length > 0 && (
          <>
            <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 11, fontWeight: "bold", color: colors.text.secondary, textTransform: "uppercase", letterSpacing: 1, marginTop: 8, marginBottom: 12 }}>EXERCISE PROGRESSION</Text>
            {progressionSummary.exercisesReady.length > 0 && (
              <View style={{ backgroundColor: colors.bg.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.success }}>
                <Text style={{ fontFamily: fonts.body.bold, fontSize: 10, fontWeight: "bold", color: colors.success, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  READY TO PROGRESS ({progressionSummary.exercisesReady.length})
                </Text>
                {progressionSummary.exercisesReady.map((ex) => (
                  <View key={ex.exerciseId} style={{ paddingVertical: 8 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 11, color: colors.text.primary, flex: 1 }}>{ex.exerciseName}</Text>
                      <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 9, color: colors.success }}>{ex.highEndPercentage}% UPPER RANGE</Text>
                    </View>
                    <Text style={{ fontFamily: fonts.body.regular, fontSize: 9, color: colors.text.secondary, marginTop: 2 }}>
                      Avg {ex.averageReps} reps · {ex.sessionsCompleted} sessions
                    </Text>
                    <View style={{ height: 1, backgroundColor: colors.border.subtle, marginTop: 8 }} />
                  </View>
                ))}
              </View>
            )}
            <View style={{ backgroundColor: colors.bg.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border.subtle }}>
              <Text style={{ fontFamily: fonts.body.bold, fontSize: 10, fontWeight: "bold", color: colors.text.secondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>IN PROGRESS</Text>
              {progressionSummary.exercisesInProgress.slice(0, 8).map((ex, i, arr) => (
                <View key={ex.exerciseId}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontFamily: fonts.body.regular, fontSize: 11, color: colors.text.primary }}>{ex.exerciseName}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontFamily: fonts.body.regular, fontSize: 9, color: colors.text.secondary }}>Rep range: {ex.repRange[0]}-{ex.repRange[1]}</Text>
                      {ex.recentTrend !== "unknown" && (
                        <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 7, color: ex.recentTrend === "up" ? colors.success : ex.recentTrend === "down" ? colors.error : colors.text.secondary }}>
                          {ex.recentTrend === "up" ? "▲" : ex.recentTrend === "down" ? "▼" : "◆"}
                        </Text>
                      )}
                    </View>
                  </View>
                  {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: colors.border.subtle, marginVertical: 8 }} />}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Achievements */}
        <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 11, fontWeight: "bold", color: colors.text.secondary, textTransform: "uppercase", letterSpacing: 1, marginTop: 8, marginBottom: 12 }}>ACHIEVEMENTS</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[2] }}>
          {achievements.map((a) => (
            <View key={a.id} style={{ width: "31%", backgroundColor: a.unlocked ? "#10B98115" : colors.bg.surface, borderWidth: 1, borderColor: a.unlocked ? colors.success : colors.border.subtle, borderRadius: 8, padding: 8, alignItems: "center", opacity: a.unlocked ? 1 : 0.5 }}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>{a.unlocked ? a.icon : "○"}</Text>
              <Text style={{ fontFamily: fonts.body.semiBold, fontSize: 7, color: a.unlocked ? colors.success : colors.text.secondary, textAlign: "center" }} numberOfLines={2}>{a.name.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        {/* Feedback */}
        <TouchableOpacity onPress={() => setShowFeedback(true)} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.border.subtle, marginTop: 16 }}>
          <Text style={{ fontSize: 18, marginRight: 16 }}>💬</Text>
          <Text style={{ flex: 1, fontFamily: fonts.body.regular, fontSize: 14, color: colors.text.primary }}>Send Feedback / Report Bug</Text>
          <Text style={{ fontSize: 16, color: colors.text.secondary }}>›</Text>
        </TouchableOpacity>
        <FeedbackSheet visible={showFeedback} onClose={() => setShowFeedback(false)} />

        {/* Storage */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.border.subtle }}>
          <Text style={{ fontSize: 18, marginRight: 16 }}>📹</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 14, color: colors.text.primary }}>Video Cache</Text>
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 10, color: colors.text.secondary, marginTop: 2 }}>
              {cachedVideoCount} video{cachedVideoCount !== 1 ? "s" : ""} · {formatBytes(cachedVideoSize)}
            </Text>
          </View>
          {cachedVideoCount > 0 ? (
            <TouchableOpacity onPress={handleClearCache}><Text style={{ fontFamily: fonts.body.bold, fontSize: 9, color: colors.error }}>CLEAR</Text></TouchableOpacity>
          ) : (
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 8, color: colors.text.tertiary }}>NONE</Text>
          )}
        </View>

        {/* Privacy */}
        <TouchableOpacity activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.border.subtle }}>
          <Text style={{ fontSize: 18, marginRight: 16 }}>🔒</Text>
          <Text style={{ flex: 1, fontFamily: fonts.body.regular, fontSize: 14, color: colors.text.primary }}>Privacy Policy</Text>
          <Text style={{ fontSize: 16, color: colors.text.secondary }}>›</Text>
        </TouchableOpacity>

        {/* Sign Out */}
        {isAuthenticated && (
          <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7} style={{ marginTop: 32, borderWidth: 1, borderColor: colors.error, borderRadius: 12, padding: 16, alignItems: "center" }}>
            <Text style={{ fontFamily: fonts.body.bold, fontSize: 12, fontWeight: "bold", color: colors.error, letterSpacing: 2, textTransform: "uppercase" }}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
