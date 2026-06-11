import * as Haptics from "expo-haptics";
import { AccessibilityInfo } from "react-native";

/**
 * Trigger light haptic feedback on button press
 */
export function hapticPress() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/**
 * Trigger medium haptic feedback for important actions (workout complete, level up)
 */
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/**
 * Trigger selection haptic for toggles and switches
 */
export function hapticSelect() {
  Haptics.selectionAsync().catch(() => {});
}

/**
 * Check if reduce motion is enabled (for vestibular accessibility)
 */
let _reduceMotionEnabled = false;
AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
  _reduceMotionEnabled = enabled;
});

// Listen for changes
AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
  _reduceMotionEnabled = enabled;
});

export function isReduceMotionEnabled(): boolean {
  return _reduceMotionEnabled;
}
