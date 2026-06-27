import React, { act } from "react";
import renderer from "react-test-renderer";
import { StreakMilestone, getStreakMilestone } from "../components/home/StreakMilestone";
import type { StreakMilestoneTier } from "../components/home/StreakMilestone";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
  }),
  typography: {
    h1: { fontSize: 28, fontFamily: "BebasNeue-Regular" },
    body: { fontSize: 14, fontFamily: "Inter-Regular" },
    label: { fontSize: 10, fontFamily: "Inter-SemiBold", letterSpacing: 2 },
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
}));

jest.mock("../utils/haptics", () => ({
  hapticSuccess: jest.fn(),
}));

// MotiView is already mocked in __mocks__/moti.js — auto-mocked by Jest

// ── Static Tier for Tests ──────────────────────────────────────────────────

const MILESTONE_TIER: StreakMilestoneTier = {
  days: 7,
  label: "7 DAY STREAK",
  subtitle: "One full week of consistency. You're building the habit.",
  icon: "🔥",
  color: "#F59E0B",
  glowColor: "rgba(245, 158, 11, 0.3)",
  particleColors: ["#F59E0B", "#FBBF24", "#D97706", "#FCD34D"],
};

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

// ═══════════════════════════════════════════════════
// getStreakMilestone (pure utility)
// ═══════════════════════════════════════════════════

describe("getStreakMilestone", () => {
  it("returns milestone for 7 days", () => {
    const result = getStreakMilestone(7);
    expect(result).not.toBeNull();
    expect(result!.label).toBe("7 DAY STREAK");
  });

  it("returns milestone for 14 days", () => {
    const result = getStreakMilestone(14);
    expect(result).not.toBeNull();
    expect(result!.label).toBe("14 DAY STREAK");
  });

  it("returns milestone for 30 days", () => {
    const result = getStreakMilestone(30);
    expect(result).not.toBeNull();
    expect(result!.label).toBe("30 DAY STREAK");
  });

  it("returns null for non-milestone day counts", () => {
    expect(getStreakMilestone(0)).toBeNull();
    expect(getStreakMilestone(1)).toBeNull();
    expect(getStreakMilestone(13)).toBeNull();
    expect(getStreakMilestone(29)).toBeNull();
    expect(getStreakMilestone(31)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════
// StreakMilestone (component)
// ═══════════════════════════════════════════════════

describe("StreakMilestone", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the tier label and subtitle", () => {
    const tree = renderInAct(<StreakMilestone tier={MILESTONE_TIER} onDismiss={jest.fn()} />);
    // Advance past the initial 300ms delay for showContent
    act(() => {
      jest.advanceTimersByTime(350);
    });

    const text = getAllText(tree.root);
    expect(text).toContain("7 DAY STREAK");
    expect(text).toContain("One full week of consistency.");
  });

  it("renders the tier icon", () => {
    const tree = renderInAct(<StreakMilestone tier={MILESTONE_TIER} onDismiss={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(350);
    });
    const text = getAllText(tree.root);
    expect(text).toContain("🔥");
  });

  it("renders a pressable overlay and calls onDismiss on press", () => {
    const onDismiss = jest.fn();
    const tree = renderInAct(<StreakMilestone tier={MILESTONE_TIER} onDismiss={onDismiss} />);
    act(() => {
      jest.advanceTimersByTime(350);
    });

    // Find any node with an onPress handler (the root Pressable)
    const pressableNode = tree.root.find((node) => typeof node.props.onPress === "function");
    expect(pressableNode).toBeDefined();

    act(() => {
      pressableNode.props.onPress();
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("shows TAP ANYWHERE TO CONTINUE hint after delay", () => {
    const tree = renderInAct(<StreakMilestone tier={MILESTONE_TIER} onDismiss={jest.fn()} />);
    // Advance past the content reveal (300ms) + hint delay (1200ms)
    act(() => {
      jest.advanceTimersByTime(1600);
    });

    const text = getAllText(tree.root);
    expect(text).toContain("TAP ANYWHERE TO CONTINUE");
  });

  it("renders without crashing (basic smoke test)", () => {
    const tree = renderInAct(<StreakMilestone tier={MILESTONE_TIER} onDismiss={jest.fn()} />);
    expect(tree).toBeDefined();
    // Unmount to prevent useEffect timeout from firing after test ends
    act(() => {
      tree.unmount();
    });
  });
});
