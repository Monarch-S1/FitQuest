import { useState, useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { useColors, typography } from "../../tokens";
import { getSyncStatus, onSyncStatusChange, type SyncStatus } from "../../services/cloudSync";
import { isSupabaseConfigured } from "../../services/supabase";

/**
 * Small indicator that shows cloud sync status.
 * Only visible when syncing or on error — fades in/out.
 */
export function SyncIndicator() {
  const colors = useColors();
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus);
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Don't show if Supabase isn't configured
    if (!isSupabaseConfigured()) return;

    const unsubscribe = onSyncStatusChange((newStatus) => {
      setStatus(newStatus);
      setVisible(newStatus !== "idle");
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? 200 : 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!isSupabaseConfigured()) return null;

  const dotColor =
    status === "syncing"
      ? colors.accent.DEFAULT
      : status === "error"
        ? colors.error
        : colors.success;

  const label =
    status === "syncing" ? "SYNCING" : status === "error" ? "SYNC ERROR" : "SYNCED";

  return (
    <Animated.View
      style={{
        opacity,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        position: "absolute",
        top: 12,
        right: 0,
      }}
      pointerEvents="none"
    >
      <View
        style={{
          width: 5,
          height: 5,
          borderRadius: 3,
          backgroundColor: dotColor,
        }}
      />
      <Text
        style={{
          ...typography.label,
          color: dotColor,
          fontSize: 7,
          letterSpacing: 1,
        }}
      >
        {label}
      </Text>
    </Animated.View>
  );
}
