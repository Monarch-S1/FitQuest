import { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { useUserStore, waitForAuthSync } from "../../src/stores/useUserStore";
import { signInWithEmail } from "../../src/services/supabase";
import { useBiometricAuth } from "../../src/hooks/useBiometricAuth";
import { SaveCredentialsModal } from "../../src/components/ui/SaveCredentialsModal";
import { TextInputField } from "../../src/components/form/TextInputField";
import { FormGroup } from "../../src/components/form/FormGroup";
import { ValidationBadge } from "../../src/components/form/ValidationBadge";

export default function LoginScreen() {
  const colors = useColors();

  const router = useRouter();
  const { setAuth } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Email validation
  const validateEmail = useCallback((value: string): boolean | string => {
    if (!value.trim()) {
      return "Email is required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      return "Enter a valid email address";
    }
    return true;
  }, []);

  // Biometric auth
  const {
    isBiometricAvailable,
    biometricType,
    isLoading: biometricLoading,
    retrieveCredentials,
    hasStoredCredentials,
  } = useBiometricAuth();
  const [showBiometricButton, setShowBiometricButton] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const { saveCredentials, isLoading: savingCredentials } = useBiometricAuth();

  // Check if biometric credentials are stored on mount
  useEffect(() => {
    (async () => {
      if (isBiometricAvailable) {
        const hasStored = await hasStoredCredentials();
        setShowBiometricButton(hasStored);
      }
    })();
  }, [isBiometricAvailable, hasStoredCredentials]);

  const handleBiometricLogin = useCallback(async () => {
    setLoading(true);
    setError("");

    const credentials = await retrieveCredentials();
    if (!credentials) {
      setError("Biometric authentication failed or cancelled.");
      setLoading(false);
      return;
    }

    const { data, error: authError } = await signInWithEmail(
      credentials.email,
      credentials.password,
    );
    if (authError) {
      setError("Biometric sign-in failed. Please use your password instead.");
      setLoading(false);
      return;
    }
    if (data?.user) {
      setAuth(data.user.id, data.user.email || credentials.email);
      await waitForAuthSync();
      router.replace("/");
    }
    setLoading(false);
  }, [retrieveCredentials, setAuth, router]);

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
      await waitForAuthSync();

      // Offer to save credentials for biometric auth
      if (isBiometricAvailable) {
        setPendingCredentials({ email: email.trim(), password });
        setShowSaveModal(true);
      } else {
        router.replace("/");
      }
    }
    setLoading(false);
  }, [email, password, setAuth, router, isBiometricAvailable]);

  const handleSaveCredentials = useCallback(async () => {
    if (!pendingCredentials) return;

    await saveCredentials(pendingCredentials.email, pendingCredentials.password);
    setShowSaveModal(false);
    setPendingCredentials(null);
    router.replace("/");
  }, [pendingCredentials, saveCredentials, router]);

  const handleSkipSaveCredentials = useCallback(() => {
    setShowSaveModal(false);
    setPendingCredentials(null);
    router.replace("/");
  }, [router]);

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

        {/* Biometric quick login (if credentials stored) */}
        {showBiometricButton && (
          <TouchableOpacity
            onPress={handleBiometricLogin}
            disabled={biometricLoading || loading}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.accent.DEFAULT,
              borderRadius: 4,
              paddingVertical: spacing.md,
              alignItems: "center",
              opacity: biometricLoading || loading ? 0.6 : 1,
              marginBottom: spacing.md,
            }}
          >
            {biometricLoading ? (
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
                {`SIGN IN WITH ${biometricType?.toUpperCase()}`}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Divider (if biometric available) */}
        {showBiometricButton && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: spacing.lg,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border.subtle }} />
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.secondary,
                marginHorizontal: spacing.md,
              }}
            >
              OR
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border.subtle }} />
          </View>
        )}

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
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            size="md"
            showValidationIcon
          />
        </FormGroup>

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

      {/* Save credentials modal */}
      <SaveCredentialsModal
        visible={showSaveModal}
        isBiometricAvailable={isBiometricAvailable}
        biometricType={biometricType}
        onSave={handleSaveCredentials}
        onDismiss={handleSkipSaveCredentials}
        isLoading={savingCredentials}
      />
    </SafeAreaView>
  );
}
