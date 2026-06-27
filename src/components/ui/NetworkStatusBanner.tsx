import { Animated, View, Text } from "react-native";
import { useEffect, useRef } from "react";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { useColors, typography, spacing } from "../../tokens";

/**
 * Network status banner that slides in when device goes offline.
 * Automatically hides when connection is restored.
 */
export function NetworkStatusBanner() {
  const colors = useColors();
  const { isOffline } = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOffline) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isOffline, slideAnim]);

  const bannerHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 48],
  });

  if (!isOffline) return null;

  return (
    <Animated.View
      style={{
        height: bannerHeight,
        backgroundColor: colors.error,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.error,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: spacing.md,
        }}
      >
        <Text
          style={{
            ...typography.bodySmall,
            color: colors.bg.primary,
            fontSize: 12,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          No internet connection — data will sync when online
        </Text>
      </View>
    </Animated.View>
  );
}
