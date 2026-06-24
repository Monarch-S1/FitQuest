import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { useUserStore, waitForAuthSync } from "../../src/stores/useUserStore";
import { signInWithEmail } from "../../src/services/supabase";

export default function LoginScreen() {
  const colors = useColors();

  const router = useRouter();
  const { setAuth } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = useCallback(async () => {
    if (!email.trim()) {
      setError("Enter your email address");
      return;
    }
    if (!password.trim()) {
      setError("Enter your password");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: authError } = await signInWithEmail(email.trim(), password);
    if (authError) {
      setError(authError.message || "Authentication failed. Please check your credentials.");
      setLoading(false);
      return;
    }
    if (data?.user) {
      setAuth(data.user.id, data.user.email || email.trim());
      // Wait for cloud sync to complete before routing — ensures existing
      // users have their onboardingComplete flag and workout history restored
      await waitForAuthSync();
      router.replace("/");
    }
    setLoading(false);
  }, [email, password, setAuth, router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={{ alignItems: "center", marginBottom: spacing.xxl }}>
          <Text
            style={{
              ...typography.h1,
              color: colors.accent.DEFAULT,
              fontSize: 56,
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
            GAMIFIED FITNESS SYSTEM
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <View
            style={{
              backgroundColor: `${colors.error}15`,
              borderWidth: 1,
              borderColor: colors.error,
              borderRadius: 4,
              padding: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.error,
                fontSize: 11,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          </View>
        ) : null}

        {/* Email */}
        <View style={{ marginBottom: spacing.md }}>
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 9,
              marginBottom: spacing.xs,
            }}
          >
            EMAIL
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.text.secondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={{
              backgroundColor: colors.bg.elevated,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 4,
              padding: spacing.md,
              color: colors.text.primary,
              fontFamily: fonts.body.regular,
              fontSize: 14,
            }}
          />
        </View>

        {/* Password */}
        <View style={{ marginBottom: spacing[5] }}>
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 9,
              marginBottom: spacing.xs,
            }}
          >
            PASSWORD
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={colors.text.secondary}
            secureTextEntry
            style={{
              backgroundColor: colors.bg.elevated,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 4,
              padding: spacing.md,
              color: colors.text.primary,
              fontFamily: fonts.body.regular,
              fontSize: 14,
            }}
          />
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          onPress={handleEmailLogin}
          disabled={loading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Sign in with email"
          accessibilityState={{ disabled: loading }}
          style={{
            backgroundColor: colors.accent.DEFAULT,
            borderRadius: 4,
            paddingVertical: spacing.md,
            alignItems: "center",
            opacity: loading ? 0.6 : 1,
            marginBottom: spacing.md,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.bg.primary} />
          ) : (
            <Text
              style={{
                ...typography.label,
                color: colors.bg.primary,
                fontSize: 12,
                letterSpacing: 2,
              }}
            >
              SIGN IN
            </Text>
          )}
        </TouchableOpacity>

        {/* Register link */}
        <TouchableOpacity
          onPress={() => router.push("/(auth)/register")}
          style={{ marginTop: spacing.xl, alignItems: "center" }}
          accessibilityRole="link"
          accessibilityLabel="Create a new account"
        >
          <Text
            style={{
              ...typography.bodySmall,
              color: colors.text.secondary,
              fontSize: 12,
            }}
          >
            Don’t have an account?{" "}
            <Text style={{ color: colors.accent.DEFAULT, fontFamily: fonts.body.semiBold }}>
              CREATE ONE
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
