import React, { act } from "react";
import { TouchableOpacity } from "react-native";
import renderer from "react-test-renderer";
import { RepCounterPanel } from "../components/workout/RepCounterPanel";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B", light: "#FCD34D" },
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { primary: "#070814", highlight: "#151A30", elevated: "#0D1021", card: "#0D1021" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, "5": 20 },
  typography: {
    label: { fontSize: 10, fontFamily: "Inter-SemiBold", letterSpacing: 2 },
    h2: { fontSize: 24, fontFamily: "Inter-Bold" },
    h3: { fontSize: 18, fontFamily: "Inter-SemiBold" },
  },
}));

jest.mock("../utils/haptics", () => ({
  hapticPress: jest.fn(),
  hapticSuccess: jest.fn(),
}));

// Mock the useRepCounter hook
const mockUseRepCounter = jest.fn();
jest.mock("../hooks/useRepCounter", () => ({
  useRepCounter: () => mockUseRepCounter(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────

function renderInAct(element: React.ReactElement) {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

function extractText(node: renderer.ReactTestRendererNode): string {
  if (typeof node === "string") return node;
  if (node.children) return node.children.map(extractText).join("");
  return "";
}

function getAllText(instance: renderer.ReactTestInstance): string {
  return extractText(instance);
}

function createDefaultMockState(overrides: any = {}) {
  return {
    count: 0,
    isMonitoring: false,
    isAvailable: true,
    movementAxis: "unknown",
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
    adjustCount: jest.fn(),
    ...overrides,
  };
}

function findAllTouchables(tree: renderer.ReactTestRenderer) {
  return tree.root.findAllByType(TouchableOpacity);
}

// ═══════════════════════════════════════════════════
// RepCounterPanel
// ═══════════════════════════════════════════════════

describe("RepCounterPanel", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUseRepCounter.mockReturnValue(createDefaultMockState());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders AUTO REP COUNTER label", () => {
    mockUseRepCounter.mockReturnValue(createDefaultMockState({ isMonitoring: false }));
    const tree = renderInAct(
      <RepCounterPanel phase="exercise" onSyncCount={jest.fn()} manualCount={0} />,
    );
    act(() => {
      jest.advanceTimersByTime(600);
    });
    const text = getAllText(tree.root);
    expect(text).toContain("AUTO REP COUNTER");
  });

  it("shows OFF indicator when not monitoring", () => {
    mockUseRepCounter.mockReturnValue(createDefaultMockState({ isMonitoring: false }));
    const tree = renderInAct(
      <RepCounterPanel phase="exercise" onSyncCount={jest.fn()} manualCount={0} />,
    );
    act(() => {
      jest.advanceTimersByTime(600);
    });
    const text = getAllText(tree.root);
    expect(text).toContain("OFF");
  });

  it("shows CALIBRATING badge when monitoring but no count yet", () => {
    mockUseRepCounter.mockReturnValue(createDefaultMockState({ isMonitoring: true, count: 0 }));
    const tree = renderInAct(
      <RepCounterPanel phase="exercise" onSyncCount={jest.fn()} manualCount={0} />,
    );
    act(() => {
      jest.advanceTimersByTime(600);
    });
    const text = getAllText(tree.root);
    expect(text).toContain("CALIBRATING");
    expect(text).toContain("LISTENING");
  });

  it("shows AUTO badge and REPS label when calibrated with count", () => {
    mockUseRepCounter.mockReturnValue(
      createDefaultMockState({ isMonitoring: true, count: 5, movementAxis: "vertical" }),
    );
    const tree = renderInAct(
      <RepCounterPanel phase="exercise" onSyncCount={jest.fn()} manualCount={0} />,
    );
    act(() => {
      jest.advanceTimersByTime(600);
    });
    const text = getAllText(tree.root);
    expect(text).toContain("AUTO");
    expect(text).toContain("REPS");
    expect(text).toContain("5");
  });

  it("shows movement axis when calibrated", () => {
    mockUseRepCounter.mockReturnValue(
      createDefaultMockState({ isMonitoring: true, count: 5, movementAxis: "vertical" }),
    );
    const tree = renderInAct(
      <RepCounterPanel phase="exercise" onSyncCount={jest.fn()} manualCount={0} />,
    );
    act(() => {
      jest.advanceTimersByTime(600);
    });
    const text = getAllText(tree.root);
    expect(text).toContain("VERTICAL");
  });

  it("shows UNAVAILABLE badge when sensor unavailable", () => {
    mockUseRepCounter.mockReturnValue(
      createDefaultMockState({ isMonitoring: false, isAvailable: false }),
    );
    const tree = renderInAct(
      <RepCounterPanel phase="exercise" onSyncCount={jest.fn()} manualCount={0} />,
    );
    act(() => {
      jest.advanceTimersByTime(600);
    });
    const text = getAllText(tree.root);
    expect(text).toContain("UNAVAILABLE");
  });

  it("shows +1/-1 buttons when calibrated with count", () => {
    mockUseRepCounter.mockReturnValue(
      createDefaultMockState({ isMonitoring: true, count: 5, movementAxis: "vertical" }),
    );
    const tree = renderInAct(
      <RepCounterPanel phase="exercise" onSyncCount={jest.fn()} manualCount={0} />,
    );
    act(() => {
      jest.advanceTimersByTime(600);
    });

    // Should have adjust buttons
    const touchables = findAllTouchables(tree);
    const adjustButtons = touchables.filter(
      (t) =>
        t.props.accessibilityLabel === "Increase rep count" ||
        t.props.accessibilityLabel === "Decrease rep count",
    );
    expect(adjustButtons.length).toBe(2);
  });

  it("calls adjustCount when +1 or -1 is pressed", () => {
    const adjustCount = jest.fn();
    mockUseRepCounter.mockReturnValue(
      createDefaultMockState({
        isMonitoring: true,
        count: 5,
        movementAxis: "vertical",
        adjustCount,
      }),
    );
    const tree = renderInAct(
      <RepCounterPanel phase="exercise" onSyncCount={jest.fn()} manualCount={0} />,
    );
    act(() => {
      jest.advanceTimersByTime(600);
    });

    const touchables = findAllTouchables(tree);
    const incButton = touchables.find((t) => t.props.accessibilityLabel === "Increase rep count");
    const decButton = touchables.find((t) => t.props.accessibilityLabel === "Decrease rep count");

    act(() => {
      incButton!.props.onPress();
    });
    expect(adjustCount).toHaveBeenCalledWith(1);

    act(() => {
      decButton!.props.onPress();
    });
    expect(adjustCount).toHaveBeenCalledWith(-1);
  });

  it("shows TAP COUNT TO SYNC when count differs from manual", () => {
    mockUseRepCounter.mockReturnValue(
      createDefaultMockState({ isMonitoring: true, count: 5, movementAxis: "vertical" }),
    );
    const tree = renderInAct(
      <RepCounterPanel phase="exercise" onSyncCount={jest.fn()} manualCount={0} />,
    );
    act(() => {
      jest.advanceTimersByTime(600);
    });
    const text = getAllText(tree.root);
    expect(text).toContain("TAP COUNT TO SYNC");
  });

  it("shows SYNCED when count matches manual", () => {
    mockUseRepCounter.mockReturnValue(
      createDefaultMockState({ isMonitoring: true, count: 5, movementAxis: "vertical" }),
    );
    const tree = renderInAct(
      <RepCounterPanel phase="exercise" onSyncCount={jest.fn()} manualCount={5} />,
    );
    act(() => {
      jest.advanceTimersByTime(600);
    });
    const text = getAllText(tree.root);
    expect(text).toContain("SYNCED");
  });

  it("calls onSyncCount when the count display is tapped", () => {
    const onSyncCount = jest.fn();
    mockUseRepCounter.mockReturnValue(
      createDefaultMockState({ isMonitoring: true, count: 5, movementAxis: "vertical" }),
    );
    const tree = renderInAct(
      <RepCounterPanel phase="exercise" onSyncCount={onSyncCount} manualCount={0} />,
    );
    act(() => {
      jest.advanceTimersByTime(600);
    });

    // Find the count display button (it has onPress with onSyncCount)
    // The sync hint button is the one with accessibilityLabel containing "Sync"
    const touchables = findAllTouchables(tree);
    const syncHint = touchables.find(
      (t) => t.props.accessibilityLabel && t.props.accessibilityLabel.includes("Sync 5"),
    );
    expect(syncHint).toBeDefined();
    act(() => {
      syncHint!.props.onPress();
    });
    expect(onSyncCount).toHaveBeenCalledWith(5);
  });

  it("renders without crashing (basic smoke test)", () => {
    const tree = renderInAct(
      <RepCounterPanel phase="exercise" onSyncCount={jest.fn()} manualCount={0} />,
    );
    expect(tree).toBeDefined();
  });
});
