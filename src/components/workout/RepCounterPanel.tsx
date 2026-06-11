import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useColors, typography, spacing } from "../../tokens";
import { hapticPress, hapticSuccess } from "../../utils/haptics";
import { useRepCounter, RepAxis } from "../../hooks/useRepCounter";
import { WorkoutPhase } from "../../stores/useWorkoutStore";

interface RepCounterPanelProps {
  /** Current workout phase — auto-starts/stops based on this */
  phase: WorkoutPhase;
  /** Called when user taps the auto count to sync it as the manual rep input */
  onSyncCount: (count: number) => void;
  /** Current manual rep input value (to show sync state) */
  manualCount: number;
}

/**
 * Compact panel showing auto-detected rep count from accelerometer.
 * Features:
 *  - AUTO badge with colored status
 *  - Calibration indicator (CALIBRATING… / calibrated / unavailable)
 *  - Movement axis label
 *  - Start/stop/reset controls
 *  - +1/-1 quick adjustment buttons
 *  - Tap count to sync to manual input
 */
export function RepCounterPanel({ phase, onSyncCount, manualCount }: RepCounterPanelProps) {
  const colors = useColors();

  const { count, isMonitoring, isAvailable, movementAxis, start, stop, reset, adjustCount } =
    useRepCounter();

  // Track whether the availability check has completed
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  // Track calibration timeout — transitions the badge after ~3.5s even with no motion
  const [calibrationGrace, setCalibrationGrace] = useState(false);
  const calibrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track exercise identity to detect exercise changes
  const exercisePhaseRef = useRef<WorkoutPhase | null>(null);

  // Track previous count for haptic feedback on each new rep
  const prevCountRef = useRef(0);
  const calibratedRef = useRef(false);

  // Haptic feedback on rep detected
  useEffect(() => {
    if (count > prevCountRef.current && isMonitoring) {
      // New rep detected — light tap
      hapticPress();
    }
    prevCountRef.current = count;
  }, [count, isMonitoring]);

  // Haptic feedback on calibration complete
  useEffect(() => {
    const isCalibrated = isMonitoring && (count > 0 || calibrationGrace);
    if (isCalibrated && !calibratedRef.current) {
      // Just calibrated — success notification
      hapticSuccess();
    }
    calibratedRef.current = isCalibrated;
  }, [isMonitoring, count, calibrationGrace]);

  // Auto-start/stop based on phase and reset count on exercise entry
  useEffect(() => {
    // Phase just transitioned TO exercise (from idle or rest)
    if (phase === "exercise" && exercisePhaseRef.current !== "exercise") {
      reset(); // Reset count for new exercise
      calibrationTimerRef.current = setTimeout(() => {
        setCalibrationGrace(true);
      }, 3500);
      setCalibrationGrace(false);
      calibratedRef.current = false;
      start();
    } else if (phase !== "exercise") {
      stop();
      if (calibrationTimerRef.current) {
        clearTimeout(calibrationTimerRef.current);
        calibrationTimerRef.current = null;
      }
    }

    exercisePhaseRef.current = phase;

    return () => {
      stop();
      if (calibrationTimerRef.current) {
        clearTimeout(calibrationTimerRef.current);
        calibrationTimerRef.current = null;
      }
    };
  }, [phase, start, stop, reset]);

  // Track availability check completion
  useEffect(() => {
    if (!availabilityChecked) {
      // Wait a tick for the async check to settle
      const t = setTimeout(() => setAvailabilityChecked(true), 500);
      return () => clearTimeout(t);
    }
  }, [availabilityChecked]);

  // Determine calibration status
  const isCalibrating = isMonitoring && count === 0 && !calibrationGrace;
  const isCalibrated = isMonitoring && (count > 0 || calibrationGrace);
  const showUnavailable = availabilityChecked && !isAvailable;

  const showCalibrating = isMonitoring && !isCalibrated && !showUnavailable;

  return (
    <View
      style={{
        backgroundColor: colors.bg.highlight,
        borderWidth: 1,
        borderColor: isMonitoring ? colors.accent.DEFAULT : colors.border.subtle,
        borderRadius: 4,
        padding: spacing[3],
      }}
    >
      {/* Header row: label + badges */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing[2],
        }}
      >
        {/* Label */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}>
          <Text
            style={{
              ...typography.label,
              fontSize: 8,
              color: colors.text.secondary,
            }}
          >
            AUTO REP COUNTER
          </Text>
          {/* AUTO badge */}
          {isMonitoring && (
            <View
              style={{
                backgroundColor: isCalibrated
                  ? `${colors.success}20`
                  : `${colors.accent.DEFAULT}20`,
                borderWidth: 1,
                borderColor: isCalibrated ? colors.success : colors.accent.DEFAULT,
                borderRadius: 4,
                paddingHorizontal: spacing[1],
                paddingVertical: 1,
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  fontSize: 7,
                  color: isCalibrated ? colors.success : colors.accent.DEFAULT,
                }}
              >
                AUTO
              </Text>
            </View>
          )}
        </View>

        {/* Right side: status info */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}>
          {/* Calibration indicator */}
          {showCalibrating && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[1] }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.accent.DEFAULT,
                  opacity: 0.8,
                }}
              />
              <Text
                style={{
                  ...typography.label,
                  fontSize: 7,
                  color: colors.accent.DEFAULT,
                }}
              >
                CALIBRATING
              </Text>
            </View>
          )}

          {/* Axis indicator */}
          {isCalibrated && movementAxis !== "unknown" && (
            <View
              style={{
                backgroundColor: `${colors.text.secondary}15`,
                borderRadius: 4,
                paddingHorizontal: spacing[1],
                paddingVertical: 1,
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  fontSize: 7,
                  color: colors.text.secondary,
                }}
              >
                {movementAxis.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Unavailable badge */}
          {showUnavailable && (
            <View
              style={{
                backgroundColor: `${colors.warning}20`,
                borderWidth: 1,
                borderColor: colors.warning,
                borderRadius: 4,
                paddingHorizontal: spacing[1],
                paddingVertical: 1,
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  fontSize: 7,
                  color: colors.warning,
                }}
              >
                UNAVAILABLE
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Counter row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing[3],
          marginBottom: spacing[2],
        }}
      >
        {/* Quick adjust -1 */}
        {isCalibrated && (
          <TouchableOpacity
            onPress={() => adjustCount(-1)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Decrease rep count"
            style={{
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.bg.elevated,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 4,
            }}
          >
            <Text
              style={{ color: colors.text.secondary, fontSize: 16, fontFamily: "Inter-Regular" }}
            >
              −
            </Text>
          </TouchableOpacity>
        )}

        {/* Auto count — tap to sync */}
        <TouchableOpacity
          onPress={() => {
            if (count > 0) {
              onSyncCount(count);
            }
          }}
          disabled={count === 0}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={count > 0 ? `Sync ${count} auto-detected reps to manual input` : "Auto rep counter, no reps detected"}
          accessibilityState={{ disabled: count === 0 }}
          style={{
            minWidth: 64,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: count > 0 ? `${colors.success}10` : colors.bg.elevated,
            borderWidth: 1.5,
            borderColor:
              count > 0
                ? colors.success
                : showCalibrating
                  ? colors.accent.DEFAULT
                  : colors.border.subtle,
            borderRadius: 4,
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[1],
          }}
        >
          {showCalibrating ? (
            <Text
              style={{
                ...typography.h3,
                color: colors.accent.DEFAULT,
                fontSize: 18,
                opacity: 0.6,
              }}
            >
              —
            </Text>
          ) : (
            <Text
              style={{
                ...typography.h2,
                color: count > 0 ? colors.success : colors.text.secondary,
                fontSize: 24,
                fontVariant: ["tabular-nums"] as any,
              }}
            >
              {count}
            </Text>
          )}
          <Text
            style={{
              ...typography.label,
              fontSize: 7,
              color: count > 0 ? colors.success : colors.text.secondary,
              marginTop: -spacing[0],
            }}
          >
            {isMonitoring ? (showCalibrating ? "LISTENING" : "REPS") : "OFF"}
          </Text>
        </TouchableOpacity>

        {/* Quick adjust +1 */}
        {isCalibrated && (
          <TouchableOpacity
            onPress={() => adjustCount(1)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Increase rep count"
            style={{
              width: 32,
              height: 32,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.bg.elevated,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 4,
            }}
          >
            <Text
              style={{ color: colors.text.secondary, fontSize: 16, fontFamily: "Inter-Regular" }}
            >
              +
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sync hint */}
      {count > 0 && (
        <TouchableOpacity
          onPress={() => onSyncCount(count)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={count !== manualCount ? `Sync ${count} reps` : "Reps synced"}
          style={{
            alignItems: "center",
            paddingVertical: spacing[0],
          }}
        >
          <Text
            style={{
              ...typography.label,
              fontSize: 7,
              color: colors.text.secondary,
              opacity: count !== manualCount ? 1 : 0.4,
            }}
          >
            {count !== manualCount ? `TAP COUNT TO SYNC → ${count} REPS` : "SYNCED ✓"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
