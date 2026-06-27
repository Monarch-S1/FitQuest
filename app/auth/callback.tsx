import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../src/services/supabase";
import { useUserStore, waitForAuthSync } from "../../src/stores/useUserStore";
import { useColors, typography } from "../../src/tokens";

export default function AuthCallback() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setAuth } = useUserStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { access_token, refresh_token } = params;

        if (!access_token || !refresh_token) {
          setError("Invalid authentication tokens. Please try again.");
          setTimeout(() => router.replace("/(auth)/login"), 2000);
          return;
        }

        const { data } = await supabase.auth.setSession({
          access_token: access_token as string,
          refresh_token: refresh_token as string,
        });

        if (data.session?.user) {
          setAuth(data.session.user.id, data.session.user.email ?? "");
          // Wait for cloud sync before routing
          await waitForAuthSync();
          router.replace("/");
        } else {
          setError("Failed to establish session. Please try again.");
          setTimeout(() => router.replace("/(auth)/login"), 2000);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Authentication failed";
        setError(msg);
        setTimeout(() => router.replace("/(auth)/login"), 2000);
      }
    })();
  }, []);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.bg.primary,
          padding: 20,
        }}
      >
        <Text
          style={{
            ...typography.body,
            color: colors.error,
            textAlign: "center",
          }}
        >
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.bg.primary,
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
        COMPLETING SIGN-IN
      </Text>
    </View>
  );
}
