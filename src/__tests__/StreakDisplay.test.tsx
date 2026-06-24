import React, { act } from "react";
import renderer from "react-test-renderer";
import { StreakDisplay } from "../components/home/StreakDisplay";
import type { StreakData } from "../utils/streak";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B" },
    success: "#10B981",
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { base: "#070814", card: "#0D1021", highlight: "#151A30", primary: "#070814" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  H3: ({ children, variant, style }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, { style }, children);
  },
  Label: ({ children, variant, style }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, { style: [{ color: "#9B8E7A" }, style] }, children);
  },
  Body: ({ children, variant, size, style }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, { style }, children);
  },
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

function createStreak(overrides: Partial<StreakData> = {}): StreakData {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
    isActiveToday: false,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════
// StreakDisplay
// ═══════════════════════════════════════════════════

describe("StreakDisplay", () => {
  it("shows the current streak number", () => {
    const streak = createStreak({ currentStreak: 5, longestStreak: 10 });
    const tree = renderInAct(<StreakDisplay streak={streak} />);
    const text = getAllText(tree.root);
    expect(text).toContain("5");
    expect(text).toContain("DAY STREAK");
  });

  it("shows the longest streak as Best", () => {
    const streak = createStreak({ currentStreak: 3, longestStreak: 15 });
    const tree = renderInAct(<StreakDisplay streak={streak} />);
    const text = getAllText(tree.root);
    expect(text).toContain("Best: 15");
  });

  it("shows zero streak correctly", () => {
    const streak = createStreak({ currentStreak: 0, longestStreak: 5 });
    const tree = renderInAct(<StreakDisplay streak={streak} />);
    const text = getAllText(tree.root);
    expect(text).toContain("0");
    expect(text).not.toContain("🔥");
    expect(text).not.toContain("⚡");
  });

  it("shows lightning icon for 3+ day streak (burning)", () => {
    const streak = createStreak({ currentStreak: 3, longestStreak: 3 });
    const tree = renderInAct(<StreakDisplay streak={streak} />);
    const text = getAllText(tree.root);
    expect(text).toContain("⚡");
    expect(text).not.toContain("🔥");
  });

  it("shows fire icon for 7+ day streak (on fire)", () => {
    const streak = createStreak({ currentStreak: 7, longestStreak: 15 });
    const tree = renderInAct(<StreakDisplay streak={streak} />);
    const text = getAllText(tree.root);
    expect(text).toContain("🔥");
  });

  it("shows fire icon for very long streaks", () => {
    const streak = createStreak({ currentStreak: 30, longestStreak: 30 });
    const tree = renderInAct(<StreakDisplay streak={streak} />);
    const text = getAllText(tree.root);
    expect(text).toContain("🔥");
  });

  it("shows TRAINED TODAY when active today", () => {
    const streak = createStreak({ currentStreak: 5, isActiveToday: true });
    const tree = renderInAct(<StreakDisplay streak={streak} />);
    const text = getAllText(tree.root);
    expect(text).toContain("TRAINED TODAY ✓");
    expect(text).not.toContain("TRAIN TODAY →");
  });

  it("shows TRAIN TODAY when not active today", () => {
    const streak = createStreak({ currentStreak: 5, isActiveToday: false });
    const tree = renderInAct(<StreakDisplay streak={streak} />);
    const text = getAllText(tree.root);
    expect(text).toContain("TRAIN TODAY →");
    expect(text).not.toContain("TRAINED TODAY ✓");
  });

  it("renders without crashing (basic smoke test)", () => {
    const streak = createStreak();
    const tree = renderInAct(<StreakDisplay streak={streak} />);
    expect(tree).toBeDefined();
  });
});
