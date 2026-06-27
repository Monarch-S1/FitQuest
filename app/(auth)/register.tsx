import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { useUserStore, waitForAuthSync } from "../../src/stores/useUserStore";
import { signUpWithEmail } from "../../src/services/supabase";
import { TextInputField } from "../../src/components/form/TextInputField";
import { FormGroup } from "../../src/components/form/FormGroup";
import { ValidationBadge } from "../../src/components/form/ValidationBadge";

export default function RegisterScreen() {
  const colors = useColors();

  const router = useRouter();
  const { setAuth } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Validation functions
  const validateEmail = useCallback((value: string): boolean | string => {
    if (!value.trim()) {
      return "Email is required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      return "Enter a valid email address";
    }
    return true;
  }, []);

  const validatePassword = useCallback((value: string): boolean | string => {
    if (!value) {
      return "Password is required";
    }
    if (value.length < 6) {
      return "Password must be at least 6 characters";
    }
    return true;
  }, []);

  const validateConfirmPassword = useCallback(
    (value: string): boolean | string => {
      if (!value) {
        return "Confirm your password";
      }
      if (value !== password) {
        return "Passwords do not match";
      }
      return true;
    },
    [password],
  );

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

        {/* Error Banner */}
        {error && (
          <ValidationBadge
            type="error"
            message={error}
            visible={!!error}
            onDismiss={() => setError("")}
          />
        )}

        {/* Form Inputs */}
        <FormGroup gap={spacing.md} containerStyle={{ marginBottom: spacing.xl }}>
          <TextInputField
            label="EMAIL"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            onValidate={validateEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            size="md"
            showValidationIcon
          />

          <TextInputField
            label="PASSWORD"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            onValidate={validatePassword}
            secureTextEntry
            size="md"
            showValidationIcon
          />

          <TextInputField
            label="CONFIRM PASSWORD"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onValidate={validateConfirmPassword}
            secureTextEntry
            size="md"
            showValidationIcon
          />
        </FormGroup>

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
