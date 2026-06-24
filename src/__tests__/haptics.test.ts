/**
 * Tests for haptics utility.
 *
 * Only mocks expo-haptics to prevent real haptic feedback in tests.
 * react-native/AccessibilityInfo uses the default jest-expo mock.
 */

// ── Mocks ─────────────────────────────────────────────────────────────────

const mockImpactAsync = jest.fn(() => Promise.resolve());
const mockNotificationAsync = jest.fn(() => Promise.resolve());
const mockSelectionAsync = jest.fn(() => Promise.resolve());

jest.mock("expo-haptics", () => ({
  impactAsync: (...args: any[]) => mockImpactAsync(...args),
  notificationAsync: (...args: any[]) => mockNotificationAsync(...args),
  selectionAsync: (...args: any[]) => mockSelectionAsync(...args),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

const {
  hapticPress,
  hapticSuccess,
  hapticSelect,
  isReduceMotionEnabled,
} = require("../utils/haptics");

// ═══════════════════════════════════════════════════
// hapticPress
// ═══════════════════════════════════════════════════

describe("hapticPress", () => {
  beforeEach(() => {
    mockImpactAsync.mockClear();
  });

  it("calls Haptics.impactAsync with Light style", () => {
    hapticPress();
    expect(mockImpactAsync).toHaveBeenCalledWith("light");
  });

  it("silently catches errors", () => {
    mockImpactAsync.mockRejectedValueOnce(new Error("haptic failed"));
    expect(() => hapticPress()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════
// hapticSuccess
// ═══════════════════════════════════════════════════

describe("hapticSuccess", () => {
  beforeEach(() => {
    mockNotificationAsync.mockClear();
  });

  it("calls Haptics.notificationAsync with Success type", () => {
    hapticSuccess();
    expect(mockNotificationAsync).toHaveBeenCalledWith("success");
  });

  it("silently catches errors", () => {
    mockNotificationAsync.mockRejectedValueOnce(new Error("notification failed"));
    expect(() => hapticSuccess()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════
// hapticSelect
// ═══════════════════════════════════════════════════

describe("hapticSelect", () => {
  beforeEach(() => {
    mockSelectionAsync.mockClear();
  });

  it("calls Haptics.selectionAsync", () => {
    hapticSelect();
    expect(mockSelectionAsync).toHaveBeenCalled();
  });

  it("silently catches errors", () => {
    mockSelectionAsync.mockRejectedValueOnce(new Error("selection failed"));
    expect(() => hapticSelect()).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════
// isReduceMotionEnabled
// ═══════════════════════════════════════════════════

describe("isReduceMotionEnabled", () => {
  it("returns a boolean", () => {
    const result = isReduceMotionEnabled();
    expect(typeof result).toBe("boolean");
  });
});
