import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, Text } from "react-native";
import { useUserStore } from "../src/stores/useUserStore";
import { useColors, typography } from "../src/tokens";

export default function Index() {
  const colors = useColors();

  const { isAuthenticated, onboardingComplete } = useUserStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand persist to rehydrate from AsyncStorage
    if (useUserStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useUserStore.persist.onFinishHydration(() => {
        setHydrated(true);
      });
      return unsub;
    }
  }, []);

  if (!hydrated) {
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
            ...typography.label,
            color: colors.text.secondary,
            fontSize: 10,
            marginTop: 16,
            letterSpacing: 2,
          }}
        >
          INITIALIZING FITQUEST
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  if (!onboardingComplete) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
