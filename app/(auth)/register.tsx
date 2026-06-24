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
import { signUpWithEmail } from "../../src/services/supabase";

export default function RegisterScreen() {
  const colors = useColors();

  const router = useRouter();
  const { setAuth } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailRegister = useCallback(async () => {
    if (!email.trim()) {
      setError("Enter your email address");
      return;
    }
    // Basic email format check — must contain @ and a domain
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address (e.g. you@example.com)");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: authError } = await signUpWithEmail(email.trim(), password);
    if (authError) {
      setError(authError.message || "Registration failed. Please try again.");
      setLoading(false);
      return;
    }
    if (!data?.user) {
      // No error but no user either — email confirmation is required
      setError("Account created! Check your email for the confirmation link before signing in.");
      setLoading(false);
      return;
    }
    if (data.user) {
      setAuth(data.user.id, data.user.email || email.trim());
      // Wait for cloud sync to complete before routing — ensures existing
      // users who are signing up with a new device get their profile restored
      await waitForAuthSync();
      // Root gate will route to onboarding or tabs based on sync result
      router.replace("/");
    }
    setLoading(false);
  }, [email, password, confirmPassword, setAuth, router]);

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
            CREATE YOUR ACCOUNT
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
        <View style={{ marginBottom: spacing.md }}>
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
            placeholder="At least 6 characters"
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

        {/* Confirm Password */}
        <View style={{ marginBottom: spacing[5] }}>
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 9,
              marginBottom: spacing.xs,
            }}
          >
            CONFIRM PASSWORD
          </Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
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

        {/* Sign Up Button */}
        <TouchableOpacity
          onPress={handleEmailRegister}
          disabled={loading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Create account"
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
              CREATE ACCOUNT
            </Text>
          )}
        </TouchableOpacity>

        {/* Login link */}
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          style={{ marginTop: spacing.xl, alignItems: "center" }}
          accessibilityRole="link"
          accessibilityLabel="Go to sign in"
        >
          <Text
            style={{
              ...typography.bodySmall,
              color: colors.text.secondary,
              fontSize: 12,
            }}
          >
            Already have an account?{" "}
            <Text style={{ color: colors.accent.DEFAULT, fontFamily: fonts.body.semiBold }}>
              SIGN IN
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
