import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { useUserStore, FitnessGoal, FitnessLevel } from "../../src/stores/useUserStore";
import { signOut as supabaseSignOut } from "../../src/services/supabase";
import { videoCache } from "../../src/services/videoCache";
import { Animated, Easing } from "react-native";

const GOAL_LABELS: Record<FitnessGoal, string> = {
  strength: "Strength",
  muscle_gain: "Muscle Gain",
  endurance: "Endurance",
  general: "General Fitness",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    level, totalXp, streakData, workoutHistory,
    displayName, email, fitnessGoal, fitnessLevel,
    isAuthenticated, avatarUri, updateProfile, clearAuth,
  } = useUserStore();

  const [editName, setEditName] = useState(displayName);
  const [showEditName, setShowEditName] = useState(false);
  const [cachedVideoCount, setCachedVideoCount] = useState(0);
  const [cachedVideoSize, setCachedVideoSize] = useState(0);

  const rank =
    level <= 3 ? "Recruit" :
    level <= 6 ? "Operative" :
    level <= 10 ? "Veteran" :
    level <= 15 ? "Elite" : "Commander";

  // Load cache info
  const cacheMountedRef = useRef(true);
  useEffect(() => {
    cacheMountedRef.current = true;
    videoCache.getCachedIds().then((ids) => {
      if (cacheMountedRef.current) setCachedVideoCount(ids.length);
    });
    videoCache.getCacheSize().then((size) => {
      if (cacheMountedRef.current) setCachedVideoSize(size);
    });
    return () => { cacheMountedRef.current = false; };
  }, []);

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

  const handleClearCache = useCallback(() => {
    Alert.alert(
      "Clear Video Cache",
      `Remove ${cachedVideoCount} cached video(s) (${formatBytes(cachedVideoSize)})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "CLEAR",
          style: "destructive",
          onPress: async () => {
            await videoCache.clearAll();
            setCachedVideoCount(0);
            setCachedVideoSize(0);
          },
        },
      ],
    );
  }, [cachedVideoCount, cachedVideoSize]);

  const handleSignOut = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "SIGN OUT",
        style: "destructive",
        onPress: async () => {
          await supabaseSignOut();
          clearAuth();
        },
      },
    ]);
  }, [clearAuth]);

  // Fade-in
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const SETTINGS_ITEMS = [
    { label: "Account Settings", icon: "👤" },
    { label: "Notifications", icon: "🔔" },
    { label: "Video Cache", icon: "📹", badge: cachedVideoCount > 0 ? `${cachedVideoCount}` : undefined },
    { label: "App Theme", icon: "🎨" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F1115" }}>
      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeIn }}
        contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[12] }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar & Identity ── */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 3,
                borderColor: "#F59E0B",
                backgroundColor: "#1A1D24",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: 96, height: 96, borderRadius: 48 }} />
              ) : (
                <Text style={{ fontSize: 40, color: "#F59E0B" }}>+</Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Name */}
          <View style={{ marginTop: 16, alignItems: "center" }}>
            {showEditName ? (
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                  onSubmitEditing={handleSaveName}
                  style={{
                    backgroundColor: "#1A1D24",
                    borderWidth: 1,
                    borderColor: "#F59E0B",
                    borderRadius: 8,
                    padding: 8,
                    color: "#F3F4F6",
                    fontFamily: fonts.body.semiBold,
                    fontSize: 16,
                    minWidth: 120,
                    textAlign: "center",
                  }}
                />
                <TouchableOpacity onPress={handleSaveName}>
                  <Text style={{ fontFamily: fonts.body.bold, fontSize: 10, color: "#F59E0B" }}>
                    SAVE
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setShowEditName(true)}>
                <Text
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: 24,
                    fontWeight: "900",
                    color: "#F3F4F6",
                    textTransform: "uppercase",
                  }}
                >
                  {displayName || "ATHLETE"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Level Badge */}
          <View
            style={{
              backgroundColor: "#F59E0B",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 999,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 10,
                fontWeight: "bold",
                color: "#0F1115",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              LVL {level} — {rank.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Compact Stats Row ── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 24,
            paddingVertical: 24,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: "#2D3139",
            marginBottom: 32,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 14 }}>🏋️</Text>
            <Text style={{ fontFamily: fonts.body.bold, fontSize: 14, color: "#F3F4F6", marginTop: 2 }}>
              {workoutHistory.length}
            </Text>
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 10, color: "#9CA3AF" }}>
              Workouts
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 14 }}>🔥</Text>
            <Text style={{ fontFamily: fonts.body.bold, fontSize: 14, color: "#F3F4F6", marginTop: 2 }}>
              {streakData.currentStreak}
            </Text>
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 10, color: "#9CA3AF" }}>
              Streak
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 14 }}>⚡</Text>
            <Text style={{ fontFamily: fonts.body.bold, fontSize: 14, color: "#F3F4F6", marginTop: 2 }}>
              {totalXp >= 1000 ? `${(totalXp / 1000).toFixed(1)}K` : totalXp}
            </Text>
            <Text style={{ fontFamily: fonts.body.regular, fontSize: 10, color: "#9CA3AF" }}>
              XP
            </Text>
          </View>
        </View>

        {/* ── Settings List ── */}
        {SETTINGS_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            activeOpacity={0.7}
            onPress={() => {
              if (item.label === "Video Cache") handleClearCache();
              if (item.label === "App Theme") router.push("/profile");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 20,
              borderBottomWidth: 1,
              borderBottomColor: "#2D3139",
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 16 }}>{item.icon}</Text>
            <Text
              style={{
                flex: 1,
                fontFamily: fonts.body.regular,
                fontSize: 14,
                color: "#F3F4F6",
              }}
            >
              {item.label}
            </Text>
            {item.badge && (
              <View
                style={{
                  backgroundColor: "#F59E0B",
                  borderRadius: 999,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  marginRight: 8,
                }}
              >
                <Text style={{ fontFamily: fonts.body.bold, fontSize: 10, color: "#0F1115" }}>
                  {item.badge}
                </Text>
              </View>
            )}
            <Text style={{ fontSize: 16, color: "#9CA3AF" }}>›</Text>
          </TouchableOpacity>
        ))}

        {/* ── Sign Out ── */}
        {isAuthenticated && (
          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.7}
            style={{
              marginTop: 32,
              borderWidth: 1,
              borderColor: "#EF4444",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body.bold,
                fontSize: 12,
                fontWeight: "bold",
                color: "#EF4444",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
