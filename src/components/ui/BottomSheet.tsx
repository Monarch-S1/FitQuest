import { ReactNode, useCallback, useMemo } from "react";
import BottomSheetLib, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useColors, spacing } from "../../tokens";
import * as Haptics from "expo-haptics";

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  snapPoints?: (number | string)[];
  title?: string;
  enablePanDownToClose?: boolean;
  enableBackdropPress?: boolean;
}

/**
 * Enhanced BottomSheet component with gesture support.
 * Replaces basic Modal for richer interactions.
 * 
 * Supports:
 * - Drag to dismiss (swipe down)
 * - Backdrop tap to dismiss
 * - Snap points for intermediate positions
 * - Haptic feedback on open/close
 */
export function BottomSheet({
  visible,
  onDismiss,
  children,
  snapPoints: customSnapPoints,
  title,
  enablePanDownToClose = true,
  enableBackdropPress = true,
}: BottomSheetProps) {
  const colors = useColors();

  // Default snap points: 50% and 90% of screen
  const snapPoints = useMemo(() => customSnapPoints || ["50%", "90%"], [customSnapPoints]);

  const handleDismiss = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);
    onDismiss();
  }, [onDismiss]);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.5}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        onPress={enableBackdropPress ? handleDismiss : undefined}
        pressBehavior="close"
      />
    ),
    [enableBackdropPress, handleDismiss]
  );

  if (!visible) return null;

  return (
    <BottomSheetLib
      snapPoints={snapPoints}
      enablePanDownToClose={enablePanDownToClose}
      onClose={handleDismiss}
      backdropComponent={renderBackdrop}
      handleIndicatorColor={colors.border.subtle}
      handleStyle={{
        paddingVertical: spacing.sm,
      }}
    >
      <BottomSheetView
        style={{
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          paddingBottom: spacing.xxl,
          backgroundColor: colors.bg.primary,
        }}
      >
        {title && (
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.text.primary,
              marginBottom: spacing.md,
              textAlign: "center",
            }}
          >
            {title}
          </Text>
        )}
        {children}
      </BottomSheetView>
    </BottomSheetLib>
  );
}

// Re-export for convenience
import { Text } from "react-native";
export { BottomSheetView };
