import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useUserStore } from "../stores/useUserStore";

/**
 * Monitor user inactivity and clear auth after timeout.
 * Tracks app foreground time and resets on user interaction.
 * 
 * Timeout: 15 minutes of background/inactivity
 */
export function useSessionTimeout(timeoutMs: number = 15 * 60 * 1000) {
  const { isAuthenticated, clearAuth } = useUserStore();
  const appStateRef = useRef(AppState.currentState);
  const lastActivityRef = useRef(Date.now());
  const timeoutRefRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen for app state changes (foreground/background)
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
      if (timeoutRefRef.current) {
        clearTimeout(timeoutRefRef.current);
      }
    };
  }, [isAuthenticated]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // App coming to foreground
    if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;

      if (timeSinceLastActivity > timeoutMs) {
        clearAuth();
      }
    }
    // App going to background
    else if (nextAppState.match(/inactive|background/)) {
      lastActivityRef.current = Date.now();
    }

    appStateRef.current = nextAppState;
  };

  return {
    resetActivity: () => {
      lastActivityRef.current = Date.now();
      if (timeoutRefRef.current) {
        clearTimeout(timeoutRefRef.current);
      }
    },
  };
}
