import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { isRunningInExpoGo } from "expo";
import { useWorkoutStore, WorkoutPhase } from "../stores/useWorkoutStore";

// ---------------------------------------------------------------------------
// Lazy expo-notifications loader
//
// expo-notifications has side-effects on import (push token auto-registration)
// that throw on Android in Expo Go (SDK 53+).  We use isRunningInExpoGo() to
// skip the import entirely in that environment.  On development builds and
// production the module loads normally.
//
// Even when the import succeeds we validate that the required functions exist,
// because Metro's async-require can return partial modules.
// ---------------------------------------------------------------------------

type NotifModule = {
  scheduleNotificationAsync: (...args: unknown[]) => Promise<string>;
  cancelScheduledNotificationAsync: (...args: unknown[]) => Promise<void>;
  setNotificationHandler: (...args: unknown[]) => void;
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  setNotificationChannelAsync?: (id: string, options: Record<string, unknown>) => Promise<void>;
  SchedulableTriggerInputTypes?: { TIME_INTERVAL: number };
  AndroidImportance?: { HIGH: number };
};

const REQUIRED_KEYS: (keyof NotifModule)[] = [
  "scheduleNotificationAsync",
  "cancelScheduledNotificationAsync",
  "setNotificationHandler",
  "getPermissionsAsync",
  "requestPermissionsAsync",
  "SchedulableTriggerInputTypes",
];

let notifModule: NotifModule | null = null;
let notifLoadAttempted = false;

async function getNotifModule(): Promise<NotifModule | null> {
  if (!notifLoadAttempted) {
    notifLoadAttempted = true;

    // In Expo Go, expo-notifications cannot be imported at all on Android.
    if (isRunningInExpoGo()) {
      console.log("expo-notifications unavailable in Expo Go – rest notifications disabled");
      return null;
    }

    try {
      const mod = await import("expo-notifications");
      const valid =
        mod != null &&
        REQUIRED_KEYS.every((key) => {
          const val = mod[key];
          return val !== undefined && val !== null;
        });
      if (valid) {
        notifModule = mod as unknown as NotifModule;
      } else {
        console.log("expo-notifications module is incomplete");
      }
    } catch {
      console.log("expo-notifications unavailable (expected in Expo Go)");
    }
  }
  return notifModule;
}

// ---------------------------------------------------------------------------
// Permission management (lazy)
// ---------------------------------------------------------------------------

let permissionRequested = false;

async function ensurePermissions(): Promise<boolean> {
  if (permissionRequested) return true;

  const mod = await getNotifModule();
  if (!mod) return false;

  try {
    const { status: existing } = await mod.getPermissionsAsync();
    if (existing === "granted") {
      permissionRequested = true;
      return true;
    }
    const { status } = await mod.requestPermissionsAsync();
    if (status === "granted") {
      permissionRequested = true;
      return true;
    }
    console.log("Rest notification permissions not granted");
  } catch {
    console.log("Failed to request notification permissions");
  }
  return false;
}

// ---------------------------------------------------------------------------
// Schedule / Cancel helpers
// ---------------------------------------------------------------------------

async function scheduleRestNotification(seconds: number): Promise<string | null> {
  const granted = await ensurePermissions();
  if (!granted) return null;

  const mod = await getNotifModule();
  if (!mod || typeof mod.scheduleNotificationAsync !== "function") return null;

  try {
    const id = await mod.scheduleNotificationAsync({
      content: {
        title: "Rest Complete",
        body: "Your rest period is over — time for your next set!",
        data: { type: "rest_complete" },
        ...(Platform.OS === "android" ? { channelId: "rest-timer" } : {}),
      },
      trigger: {
        type: mod.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 0,
        seconds: Math.max(1, seconds),
      },
    });
    return id;
  } catch {
    return null;
  }
}

async function cancelNotification(id: string) {
  const mod = await getNotifModule();
  if (!mod || typeof mod.cancelScheduledNotificationAsync !== "function") return;
  try {
    await mod.cancelScheduledNotificationAsync(id);
  } catch {
    // Best-effort
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRestNotifications() {
  const notificationIdRef = useRef<string | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const prevPhaseRef = useRef<WorkoutPhase>("idle");

  const handleSchedule = useCallback(async () => {
    const currentId = notificationIdRef.current;
    if (currentId) {
      await cancelNotification(currentId);
      notificationIdRef.current = null;
    }

    const { phase, restTimer } = useWorkoutStore.getState();
    if (phase === "rest" && restTimer > 0) {
      const id = await scheduleRestNotification(restTimer);
      notificationIdRef.current = id;
    }
  }, []);

  const handleCancel = useCallback(async () => {
    const currentId = notificationIdRef.current;
    if (currentId) {
      await cancelNotification(currentId);
      notificationIdRef.current = null;
    }
  }, []);

  // Schedule once when rest STARTS, cancel once when rest ENDS
  useEffect(() => {
    const unsub = useWorkoutStore.subscribe((state) => {
      const prevPhase = prevPhaseRef.current;

      if (prevPhase !== "rest" && state.phase === "rest") {
        handleSchedule();
      } else if (prevPhase === "rest" && state.phase !== "rest") {
        handleCancel();
      }

      prevPhaseRef.current = state.phase;
    });

    return () => {
      unsub();
      handleCancel();
    };
  }, [handleSchedule, handleCancel]);

  // Reschedule when app backgrounds with remaining time
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextState: AppStateStatus) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState === "active" && (nextState === "background" || nextState === "inactive")) {
        const { phase, restTimer } = useWorkoutStore.getState();
        if (phase === "rest" && restTimer > 0) {
          const currentId = notificationIdRef.current;
          if (currentId) {
            await cancelNotification(currentId);
            notificationIdRef.current = null;
          }
          const id = await scheduleRestNotification(restTimer);
          notificationIdRef.current = id;
        }
      }

      if (prevState === "background" && nextState === "active") {
        await handleCancel();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleCancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleCancel();
    };
  }, [handleCancel]);
}

// ---------------------------------------------------------------------------
// App-level initialization
// ---------------------------------------------------------------------------

export async function initRestNotifications() {
  const mod = await getNotifModule();
  if (!mod || typeof mod.setNotificationHandler !== "function") return;

  try {
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === "android" && typeof mod.setNotificationChannelAsync === "function") {
      await mod.setNotificationChannelAsync("rest-timer", {
        name: "Rest Timer",
        importance: mod.AndroidImportance?.HIGH ?? 4,
        vibrationPattern: [0, 250, 100, 250],
        lightColor: "#10B981",
      });
    }
  } catch {
    // Best-effort — silently degrade in unsupported environments
  }
}
