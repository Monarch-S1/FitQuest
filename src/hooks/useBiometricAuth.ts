import { useCallback, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";

export interface BiometricCredentials {
  email: string;
  password: string;
}

async function checkHardware(): Promise<{ available: boolean; typeNames: string | null }> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return { available: false, typeNames: null };

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const typeNames = types
    .map((type) => {
      if (type === LocalAuthentication.AuthenticationType.FINGERPRINT) return "Fingerprint";
      if (type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) return "Face ID";
      if (type === LocalAuthentication.AuthenticationType.IRIS) return "Iris";
      return "Unknown";
    })
    .join(", ");
  return { available: true, typeNames };
}

export function useBiometricAuth() {
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkHardware()
      .then((result) => {
        setIsBiometricAvailable(result.available);
        setBiometricType(result.typeNames);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to check biometric availability");
      });
  }, []);

  const saveCredentials = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      if (!isBiometricAvailable) return false;

      try {
        setIsLoading(true);
        setError(null);

        const credentials: BiometricCredentials = { email, password };
        await SecureStore.setItemAsync(
          "fitquest_biometric_credentials",
          JSON.stringify(credentials),
        );

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

      const authResult = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        promptMessage: "Unlock your FitQuest account",
      });

      if (!authResult.success) return null;

      const stored = await SecureStore.getItemAsync("fitquest_biometric_credentials");
      if (!stored) return null;

      return JSON.parse(stored) as BiometricCredentials;
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
    isBiometricAvailable,
    biometricType,
    isLoading,
    error,
    saveCredentials,
    retrieveCredentials,
    clearCredentials,
    hasStoredCredentials,
  };
}
