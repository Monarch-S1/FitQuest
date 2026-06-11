import "../global.css";
import { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Font from "expo-font";
import * as Updates from "expo-updates";
import { useColors, useThemeMode } from "../src/tokens";
import { ErrorBoundary } from "../src/components/ui/ErrorBoundary";
import { initRestNotifications } from "../src/hooks/useRestNotifications";
import { initSentry } from "../src/services/sentry";

// Initialize crash reporting before anything else
initSentry();

export default function RootLayout() {
  const colors = useColors();

  const themeMode = useThemeMode();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          "BebasNeue-Regular": require("../assets/fonts/BebasNeue-Regular.ttf"),
          "Inter-Regular": require("../assets/fonts/Inter-Regular.ttf"),
          "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.ttf"),
          "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
        });
        setFontsLoaded(true);
      } catch (e) {
        console.warn("Font loading error, using system fonts:", e);
        setFontsLoaded(true); // Still render, just with system fonts
      }
    }
    loadFonts();
  }, []);

  const notifInitRef = useRef(false);

  useEffect(() => {
    if (!notifInitRef.current) {
      notifInitRef.current = true;
      initRestNotifications();
    }
  }, []);

  // Check for OTA updates on launch (skip in dev builds)
  useEffect(() => {
    if (__DEV__) return;
    async function checkForUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        // Silently fail — updates are non-critical
        console.warn("Update check failed:", e);
      }
    }
    checkForUpdates();
  }, []);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
        <Text
          style={{
            color: colors.text.secondary,
            marginTop: 16,
            fontFamily: "sans-serif",
            fontSize: 14,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Loading ARCH
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={themeMode === "dark" ? "light" : "dark"} />
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Auth gate - redirects based on auth state */}
          <Stack.Screen name="index" options={{ animation: "fade" }} />
          {/* Auth screens */}
          <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
          {/* Onboarding */}
          <Stack.Screen name="onboarding" options={{ animation: "slide_from_bottom" }} />
          {/* Main app tabs */}
          <Stack.Screen name="(tabs)" />
          {/* Workout player */}
          <Stack.Screen
            name="workout/[id]"
            options={{
              animation: "slide_from_right",
              presentation: "fullScreenModal",
            }}
          />
          {/* Exercise catalog */}
          <Stack.Screen
            name="exercises/catalog"
            options={{
              animation: "slide_from_right",
              presentation: "fullScreenModal",
            }}
          />
          {/* Privacy Policy */}
          <Stack.Screen
            name="privacy-policy"
            options={{
              animation: "slide_from_right",
              presentation: "fullScreenModal",
            }}
          />
        </Stack>
      </ErrorBoundary>
    </>
  );
}
