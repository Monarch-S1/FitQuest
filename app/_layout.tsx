import "../global.css";
import { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as Updates from "expo-updates";
import { useColors, useThemeMode } from "../src/tokens";
import { ErrorBoundary } from "../src/components/ui/ErrorBoundary";
import { initRestNotifications } from "../src/hooks/useRestNotifications";
import { initSentry } from "../src/services/sentry";

// Keep the native splash screen visible while we load fonts and initialize
SplashScreen.preventAutoHideAsync();

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
      } catch (e) {
        console.warn("Font loading error, using system fonts:", e);
      } finally {
        setFontsLoaded(true);
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

  // Hide the native splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Keep the splash screen visible while fonts load — no intermediate loading screen needed
  if (!fontsLoaded) {
    return null;
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
          {/* Auth callback for email confirmation / OAuth */}
          <Stack.Screen name="auth/callback" options={{ animation: "fade" }} />
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
          {/* Skill Tree */}
          <Stack.Screen
            name="skills/skill-tree"
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
