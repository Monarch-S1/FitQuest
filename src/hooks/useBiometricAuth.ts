import { useCallback, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";

export interface BiometricCredentials {
  email: string;
  password: string;
}

/**
 * Biometric authentication using fingerprint/face ID.
 * Securely stores credentials in device keychain after first successful login.
 * 
 * Flow:
 * 1. After successful password login, offer to save credentials
 * 2. On subsequent app launches, offer biometric login
 * 3. Biometric auth retrieves stored credentials automatically
 */
export function useBiometricAuth() {
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check device biometric capability on mount
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = useCallback(async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricAvailable(compatible);

      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        const typeNames = types
          .map((type) => {
            // Map type numbers to readable names
            if (type === LocalAuthentication.AuthenticationType.FINGERPRINT) return "Fingerprint";
            if (type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
              return "Face ID";
            if (type === LocalAuthentication.AuthenticationType.IRIS) return "Iris";
            return "Unknown";
          })
          .join(", ");
        setBiometricType(typeNames);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to check biometric availability");
    }
  }, []);

  const saveCredentials = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (!isBiometricAvailable) return false;

      try {
        setIsLoading(true);
        setError(null);

        // Encrypt and store credentials
        const credentials: BiometricCredentials = { email, password };
        await SecureStore.setItemAsync("fitquest_biometric_credentials", JSON.stringify(credentials));

        return true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to save credentials";
        setError(msg);
        console.warn("Failed to save biometric credentials:", msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isBiometricAvailable],
  );

  const retrieveCredentials = useCallback(async (): Promise<BiometricCredentials | null> => {
    if (!isBiometricAvailable) return null;

    try {
      setIsLoading(true);
      setError(null);

      // First, attempt biometric authentication
      const authResult = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false, // Allow device passcode as fallback
        reason: "Unlock your FitQuest account",
      });

      if (!authResult.success) {
        return null;
      }

      // If auth succeeds, retrieve stored credentials
      const stored = await SecureStore.getItemAsync("fitquest_biometric_credentials");
      if (!stored) return null;

      const credentials: BiometricCredentials = JSON.parse(stored);
      return credentials;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Biometric authentication failed";
      setError(msg);
      console.warn("Biometric authentication error:", msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isBiometricAvailable]);

  const clearCredentials = useCallback(async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync("fitquest_biometric_credentials");
    } catch (e) {
      console.warn("Failed to clear biometric credentials:", e);
    }
  }, []);

  const hasStoredCredentials = useCallback(async (): Promise<boolean> => {
    try {
      const stored = await SecureStore.getItemAsync("fitquest_biometric_credentials");
      return stored !== null;
    } catch {
      return false;
    }
  }, []);

  return {
    // State
    isBiometricAvailable,
    biometricType,
    isLoading,
    error,

    // Actions
    saveCredentials,
    retrieveCredentials,
    clearCredentials,
    hasStoredCredentials,

    // Utilities
    checkBiometricAvailability,
  };
}
