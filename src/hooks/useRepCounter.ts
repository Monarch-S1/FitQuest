/**
 * useRepCounter — Accelerometer-based automatic rep detection
 *
 * Uses the phone's accelerometer to detect movement oscillations
 * during exercises like push-ups, squats, rows, and holds.
 *
 * Algorithm: Peak detection on the dominant axis using a sliding window.
 * A "rep" is counted when acceleration crosses a threshold in the
 * primary movement direction, then crosses back.
 *
 * Works best when the phone is in a pocket or on the floor nearby.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Accelerometer, AccelerometerMeasurement } from "expo-sensors";

export interface RepCounterState {
  /** Detected rep count */
  count: number;
  /** Whether the counter is actively monitoring */
  isMonitoring: boolean;
  /** Whether the accelerometer is available on this device */
  isAvailable: boolean;
  /** Direction of detected movement: "vertical", "horizontal", "unknown" */
  movementAxis: RepAxis;
}

export type RepAxis = "vertical" | "horizontal" | "unknown";

interface UseRepCounterOptions {
  /** Update interval in ms. Default 100 (10 readings/second) */
  updateInterval?: number;
  /** Sensitivity threshold for motion detection. Lower = more sensitive. Default 1.2 */
  sensitivity?: number;
  /** Minimum time between reps in ms (debounce). Default 600 */
  minRepInterval?: number;
}

// ── Calibration ─────────────────────────────────

interface CalibrationData {
  /** Dominant movement axis */
  axis: RepAxis;
  /** Baseline acceleration on the dominant axis (at rest) */
  baseline: number;
  /** Detected movement amplitude */
  amplitude: number;
}

/**
 * Detect the dominant movement axis from a series of readings
 */
function calibrateAxis(readings: AccelerometerMeasurement[]): CalibrationData {
  if (readings.length < 10) {
    return { axis: "unknown", baseline: 0, amplitude: 0 };
  }

  // Calculate variance on each axis
  const avg = (vals: number[]) => vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = (vals: number[], mean: number) =>
    vals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / vals.length;

  const xVals = readings.map((r) => r.x);
  const yVals = readings.map((r) => r.y);
  const zVals = readings.map((r) => r.z);

  const xVar = variance(xVals, avg(xVals));
  const yVar = variance(yVals, avg(yVals));
  const zVar = variance(zVals, avg(zVals));

  // Find the axis with highest variance (most movement)
  const maxVar = Math.max(xVar, yVar, zVar);

  if (maxVar < 0.05) {
    // Very little movement detected
    return { axis: "unknown", baseline: 0, amplitude: 0 };
  }

  if (maxVar === xVar) {
    return {
      axis: "horizontal",
      baseline: avg(xVals),
      amplitude: Math.sqrt(xVar),
    };
  }
  if (maxVar === zVar) {
    return {
      axis: "vertical",
      baseline: avg(zVals),
      amplitude: Math.sqrt(zVar),
    };
  }
  return {
    axis: "vertical",
    baseline: avg(yVals),
    amplitude: Math.sqrt(yVar),
  };
}

// ── Rep Detection ──────────────────────────────

export interface DetectionState {
  /** Current calibration */
  calibration: CalibrationData;
  /** Whether we are currently "mid-rep" (past the peak threshold) */
  inRep: boolean;
  /** Timestamp of last completed rep */
  lastRepTime: number;
  /** Calibration buffer */
  calibrationReadings: AccelerometerMeasurement[];
  /** Whether calibration is complete */
  calibrated: boolean;
}

const CALIBRATION_SAMPLES = 30; // ~3 seconds at 10Hz

/**
 * Core rep detection logic — exported for testing.
 *
 * NOTE: This function mutates `state` directly for performance reasons.
 * The DetectionState is managed via useRef in the hook, avoiding React
 * re-renders on every accelerometer reading. The mutations update:
 * - state.calibrationReadings (during calibration phase)
 * - state.calibration, state.calibrated (when calibration completes)
 * - state.inRep, state.lastRepTime (during rep detection)
 */
export function detectRep(
  reading: AccelerometerMeasurement,
  state: DetectionState,
  sensitivity: number = 0.8,
  minRepInterval: number = 400,
): { count: number; didRep: boolean; axis: RepAxis; amplitude: number } {
  // Always use total acceleration magnitude to detect movement
  // This is more reliable across different exercises
  const magnitude = Math.sqrt(
    reading.x * reading.x + reading.y * reading.y + reading.z * reading.z,
  );
  // Gravity is ~9.81 m/s² or ~1g. Magnitude deviation from 1 indicates movement.
  const deviation = Math.abs(magnitude - 1);

  // Not calibrated yet — collect samples
  if (!state.calibrated) {
    state.calibrationReadings.push(reading);
    if (state.calibrationReadings.length >= CALIBRATION_SAMPLES) {
      state.calibration = calibrateAxis(state.calibrationReadings);
      state.calibrated = true;
    }
    return { count: 0, didRep: false, axis: "unknown", amplitude: 0 };
  }

  const threshold = Math.max(sensitivity * 0.4, state.calibration.amplitude * 0.6);

  // Peak detection: deviation crosses threshold
  if (!state.inRep && deviation > threshold) {
    state.inRep = true;
    return { count: 0, didRep: false, axis: state.calibration.axis, amplitude: deviation };
  }

  // Valley detection: deviation drops back below threshold (rep completed)
  if (state.inRep && deviation < threshold * 0.6) {
    state.inRep = false;
    const now = Date.now();
    if (now - state.lastRepTime >= minRepInterval) {
      state.lastRepTime = now;
      return { count: 1, didRep: true, axis: state.calibration.axis, amplitude: deviation };
    }
  }

  return { count: 0, didRep: false, axis: state.calibration.axis, amplitude: deviation };
}

// ── Hook ────────────────────────────────────────

export function useRepCounter(options: UseRepCounterOptions = {}): RepCounterState & {
  /** Start monitoring — begins accelerometer subscription with calibration */
  start: () => void;
  /** Stop monitoring — unsubscribes from accelerometer */
  stop: () => void;
  /** Reset the counter to 0 with fresh calibration */
  reset: () => void;
  /** Manually adjust count by delta (e.g., +1/-1 for corrections) */
  adjustCount: (delta: number) => void;
} {
  const { updateInterval = 100, sensitivity = 1.2, minRepInterval = 600 } = options;

  const [count, setCount] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [movementAxis, setMovementAxis] = useState<RepAxis>("unknown");

  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const detectionStateRef = useRef<DetectionState>({
    calibration: { axis: "unknown", baseline: 0, amplitude: 0 },
    inRep: false,
    lastRepTime: 0,
    calibrationReadings: [],
    calibrated: false,
  });

  // Check availability on mount
  useEffect(() => {
    Accelerometer.isAvailableAsync().then(setIsAvailable);
  }, []);

  const start = useCallback(() => {
    if (subscriptionRef.current) return;

    // Reset detection state for fresh calibration
    detectionStateRef.current = {
      calibration: { axis: "unknown", baseline: 0, amplitude: 0 },
      inRep: false,
      lastRepTime: 0,
      calibrationReadings: [],
      calibrated: false,
    };

    Accelerometer.setUpdateInterval(updateInterval);

    subscriptionRef.current = Accelerometer.addListener((reading) => {
      const result = detectRep(reading, detectionStateRef.current, sensitivity, minRepInterval);

      if (result.didRep) {
        setCount((c) => c + 1);
      }
      // Read latest axis from ref to avoid creating a dep on movementAxis state
      const latestAxis = detectionStateRef.current.calibration.axis;
      setMovementAxis((prev) => (prev !== latestAxis ? latestAxis : prev));
    });

    setIsMonitoring(true);
  }, [updateInterval, sensitivity, minRepInterval]);

  const stop = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  const reset = useCallback(() => {
    setCount(0);
    detectionStateRef.current = {
      calibration: { axis: "unknown", baseline: 0, amplitude: 0 },
      inRep: false,
      lastRepTime: 0,
      calibrationReadings: [],
      calibrated: false,
    };
    setMovementAxis("unknown");
  }, []);

  const adjustCount = useCallback((delta: number) => {
    setCount((c) => Math.max(0, c + delta));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, []);

  return {
    count,
    isMonitoring,
    isAvailable,
    movementAxis,
    start,
    stop,
    reset,
    adjustCount,
  };
}
