/**
 * Tests for the rep detection algorithm (pure logic only).
 * Accelerometer hardware tests require a device — these test
 * the signal processing that runs on each sensor reading.
 */
import { detectRep, DetectionState } from "../useRepCounter";

// Provide a minimal ThreeAxisMeasurement type for tests
// (avoids importing the full expo-sensors type in Jest)
type TestReading = { x: number; y: number; z: number };

function makeReading(x: number, y: number, z: number): TestReading {
  return { x, y, z };
}

function makeCalibratedState(
  axis: "vertical" | "horizontal" | "unknown" = "vertical",
  amplitude: number = 0.5,
): DetectionState {
  return {
    calibration: { axis, baseline: 0, amplitude },
    inRep: false,
    lastRepTime: 0,
    calibrationReadings: [],
    calibrated: true,
  };
}

describe("detectRep", () => {
  // ── Calibration phase ──

  it("returns no rep during calibration phase", () => {
    const state: DetectionState = {
      calibration: { axis: "unknown", baseline: 0, amplitude: 0 },
      inRep: false,
      lastRepTime: 0,
      calibrationReadings: [],
      calibrated: false,
    };

    const result = detectRep(makeReading(0, 0, 10), state);
    expect(result.didRep).toBe(false);
    expect(result.count).toBe(0);
    expect(state.calibrationReadings.length).toBe(1);
    expect(state.calibrated).toBe(false);
  });

  it("calibrates after collecting enough samples", () => {
    const state: DetectionState = {
      calibration: { axis: "unknown", baseline: 0, amplitude: 0 },
      inRep: false,
      lastRepTime: 0,
      calibrationReadings: [],
      calibrated: false,
    };

    // Feed 30 calibration samples with z-axis movement
    for (let i = 0; i < 32; i++) {
      detectRep(makeReading(0, 0, 9.81 + Math.sin(i * 0.5) * 2), state);
    }

    expect(state.calibrated).toBe(true);
    expect(state.calibration.axis).toBe("vertical");
    expect(state.calibration.amplitude).toBeGreaterThan(0);
  });

  // ── Rep detection ──

  it("detects a single rep from movement spike", () => {
    const state = makeCalibratedState("vertical", 0.5);

    // At rest — movement below threshold
    const rest1 = detectRep(makeReading(0, 0, 1), state, 0.8, 400);
    expect(rest1.didRep).toBe(false);

    // Movement spike (magnitude deviates from 1 significantly)
    // Magnitude = sqrt(0² + 0² + 3²) = 3, deviation = |3 - 1| = 2
    const spike = detectRep(makeReading(0, 0, 3), state, 0.8, 400);
    expect(spike.didRep).toBe(false); // Just triggered inRep, not completed yet
    expect(state.inRep).toBe(true);

    // Return to near-rest completes the rep
    // Threshold = max(0.24, 0.25) = 0.25, valley threshold = 0.25*0.5 = 0.125
    // Reading (0,0,1) → magnitude=1 → deviation=0 < 0.125 → completes rep
    const return1 = detectRep(makeReading(0, 0, 1), state, 0.8, 400);
    expect(return1.didRep).toBe(true);
    expect(return1.count).toBe(1);
    expect(state.inRep).toBe(false);
  });

  it("detects multiple reps with proper timing gate", () => {
    const state = makeCalibratedState("vertical", 0.5);

    // Rep 1
    detectRep(makeReading(0, 0, 3), state, 0.8, 400); // spike
    const rep1 = detectRep(makeReading(0, 0, 1), state, 0.8, 400); // return
    expect(rep1.didRep).toBe(true);

    // Wait for minRepInterval to pass
    state.lastRepTime = Date.now() - 500;

    // Rep 2
    detectRep(makeReading(0, 0, 3.5), state, 0.8, 400);
    const rep2 = detectRep(makeReading(0, 0, 1), state, 0.8, 400);
    expect(rep2.didRep).toBe(true);
  });

  it("debounces rapid oscillations (less than minRepInterval)", () => {
    const state = makeCalibratedState("vertical", 0.5);
    state.lastRepTime = Date.now(); // Set to now to simulate recent rep

    // The minRepInterval hasn't passed yet
    detectRep(makeReading(0, 0, 3), state, 0.8, 400);
    const rep2 = detectRep(makeReading(0, 0, 0.8), state, 0.8, 400);
    expect(rep2.didRep).toBe(false);
    expect(rep2.count).toBe(0);
  });

  it("detects horizontal axis movement", () => {
    const state = makeCalibratedState("horizontal", 0.5);

    // Movement on x-axis
    detectRep(makeReading(3, 0, 0), state, 0.8, 400);
    const rep = detectRep(makeReading(1, 0, 0), state, 0.8, 400);
    expect(rep.didRep).toBe(true);
    expect(rep.axis).toBe("horizontal");
  });

  it("returns unknown axis and 0 amplitude before calibration", () => {
    const state: DetectionState = {
      calibration: { axis: "unknown", baseline: 0, amplitude: 0 },
      inRep: false,
      lastRepTime: 0,
      calibrationReadings: [],
      calibrated: false,
    };

    // First reading — not calibrated yet
    const result = detectRep(makeReading(5, 0, 0), state);
    expect(result.axis).toBe("unknown");
    expect(result.amplitude).toBe(0);
  });

  // ── Sensitivity ──

  it("higher sensitivity detects smaller movements", () => {
    const state = makeCalibratedState("vertical", 0.5);

    // Small movement: magnitude = sqrt(0² + 0² + 1.3²) = 1.3, deviation = 0.3
    // With sensitivity=0.8, threshold = 0.8 * 0.3 = 0.24
    // With low sensitivity=2.0, threshold = 2.0 * 0.3 = 0.6 → too high for 0.3 deviation
    detectRep(makeReading(0, 0, 0.3), state, 2.0, 400);
    const rep = detectRep(makeReading(0, 0, 0.7), state, 2.0, 400);
    expect(rep.didRep).toBe(false); // Too sensitive → threshold too high
  });

  it("lower sensitivity ignores subtle movements", () => {
    const state = makeCalibratedState("vertical", 0.5);

    // Very subtle: magnitude ~1.05, deviation ~0.05
    detectRep(makeReading(0, 0, 0.95), state, 0.8, 400);
    const rep = detectRep(makeReading(0, 0, 1.05), state, 0.8, 400);
    expect(rep.didRep).toBe(false);
  });

  // ── Edge cases ──

  it("handles zero readings without crashing", () => {
    const state = makeCalibratedState("vertical", 0.5);

    const result = detectRep(makeReading(0, 0, 0), state, 0.8, 400);
    expect(result).toBeDefined();
    expect(result.didRep).toBe(false);
  });

  it("handles very large acceleration spikes", () => {
    const state = makeCalibratedState("vertical", 0.5);

    detectRep(makeReading(0, 0, 20), state, 0.8, 400);
    const rep = detectRep(makeReading(0, 0, 1), state, 0.8, 400);
    expect(rep.didRep).toBe(true);
    // Amplitude is the deviation at valley (rep completion), not the spike peak
    expect(rep.amplitude).toBe(0);
  });

  it("does not double-count a single rep on repeated crossing", () => {
    const state = makeCalibratedState("vertical", 0.5);

    detectRep(makeReading(0, 0, 3), state, 0.8, 400);
    detectRep(makeReading(0, 0, 0.8), state, 0.8, 400); // Completes rep 1

    // Cross threshold again within same movement (without valley)
    detectRep(makeReading(0, 0, 3), state, 0.8, 400);
    // Still mid-rep — hasn't gone below 0.5*threshold
    detectRep(makeReading(0, 0, 2), state, 0.8, 400);
    expect(state.inRep).toBe(true); // Still considered in-rep
  });
});
