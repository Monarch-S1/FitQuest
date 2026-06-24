import React, { act } from "react";
import renderer from "react-test-renderer";
import { CompletionAnimation } from "../components/workout/CompletionAnimation";
import type { XpBreakdown } from "../utils/xp";

// ── Mocks ─────────────────────────────────────────────────────────────────
// Note: moti is already mocked in __mocks__/moti.js (strips animation props)

const mockPlayLevelUp = jest.fn(() => Promise.resolve());
const mockPlayCompletion = jest.fn(() => Promise.resolve());
const mockCleanup = jest.fn(() => Promise.resolve());

jest.mock("../services/levelUpSound", () => ({
  playLevelUpSound: (...args: any[]) => mockPlayLevelUp(...args),
  playCompletionSound: (...args: any[]) => mockPlayCompletion(...args),
  cleanupSound: (...args: any[]) => mockCleanup(...args),
}));

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B", light: "#FCD34D", dark: "#B45309" },
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { primary: "#070814", elevated: "#0D1021", highlight: "#151A30" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "5": 20 },
  typography: {
    h1: { fontSize: 32, fontFamily: "BebasNeue-Regular" },
    h2: { fontSize: 24, fontFamily: "BebasNeue-Regular" },
    h3: { fontSize: 18, fontFamily: "BebasNeue-Regular" },
    label: { fontSize: 10, fontFamily: "Inter-SemiBold", letterSpacing: 2 },
    body: { fontSize: 14, fontFamily: "Inter-Regular" },
    bodySmall: { fontSize: 11, fontFamily: "Inter-Regular" },
  },
  fonts: {
    body: { regular: "Inter-Regular", semiBold: "Inter-SemiBold", bold: "Inter-Bold" },
    heading: "BebasNeue-Regular",
  },
}));

jest.mock("../components/ui/Button", () => ({
  Button: ({ title, onPress, fullWidth }: any) => {
    const React = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return React.createElement(
      TouchableOpacity,
      { onPress, testID: "continue-button" },
      React.createElement(Text, null, title),
    );
  },
}));

jest.mock("../components/ui/GlossyOverlay", () => ({
  GlossyOverlay: () => {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { testID: "glossy-overlay" });
  },
}));

jest.mock("../components/ui/AchievementSystem", () => ({
  checkAchievements: jest.fn(() => []),
  AchievementBadge: ({ achievement, size }: any) => {
    const React = require("react");
    const { View, Text } = require("react-native");
    return React.createElement(
      View,
      { testID: `achievement-${achievement.id}` },
      React.createElement(Text, null, achievement.title),
    );
  },
}));

jest.mock("../utils/skillUnlocks", () => ({
  // Types only — no runtime exports needed for mocking
}));

// ── Helpers ───────────────────────────────────────────────────────────────

const defaultXpBreakdown: XpBreakdown = {
  base: 100,
  completionBonus: 50,
  streakBonus: 0,
  total: 150,
};

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

function advanceTimers(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

// ═══════════════════════════════════════════════════
// CompletionAnimation
// ═══════════════════════════════════════════════════

describe("CompletionAnimation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPlayLevelUp.mockClear();
    mockPlayCompletion.mockClear();
    mockCleanup.mockClear();
    (require("../components/ui/AchievementSystem").checkAchievements as jest.Mock).mockReturnValue(
      [],
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders MISSION COMPLETE text", () => {
    const tree = renderInAct(
      <CompletionAnimation
        xpBreakdown={defaultXpBreakdown}
        level={1}
        newLevel={1}
        duration={1800}
        workoutName="THE VANGUARD"
        onContinue={jest.fn()}
      />,
    );

    // Show content appears after 600ms
    advanceTimers(600);
    const text = getAllText(tree.root);
    expect(text).toContain("MISSION COMPLETE");
  });

  it("renders the workout name", () => {
    const tree = renderInAct(
      <CompletionAnimation
        xpBreakdown={defaultXpBreakdown}
        level={1}
        newLevel={1}
        duration={1800}
        workoutName="THE VANGUARD"
        onContinue={jest.fn()}
      />,
    );

    advanceTimers(600);
    const text = getAllText(tree.root);
    expect(text).toContain("THE VANGUARD");
  });

  it("renders DURATION stat with formatted time", () => {
    // 1800 seconds = 30:00
    const tree = renderInAct(
      <CompletionAnimation
        xpBreakdown={defaultXpBreakdown}
        level={1}
        newLevel={1}
        duration={1800}
        workoutName="Test"
        onContinue={jest.fn()}
      />,
    );

    advanceTimers(600);
    const text = getAllText(tree.root);
    expect(text).toContain("DURATION");
    expect(text).toContain("30:00");
  });

  it("renders XP EARNED with total value", () => {
    const tree = renderInAct(
      <CompletionAnimation
        xpBreakdown={{ base: 100, completionBonus: 50, streakBonus: 0, total: 150 }}
        level={1}
        newLevel={1}
        duration={1800}
        workoutName="Test"
        onContinue={jest.fn()}
      />,
    );

    advanceTimers(600);
    const text = getAllText(tree.root);
    expect(text).toContain("XP EARNED");
    expect(text).toContain("+150");
  });

  it("renders XP BREAKDOWN with base and completion bonus", () => {
    const tree = renderInAct(
      <CompletionAnimation
        xpBreakdown={defaultXpBreakdown}
        level={1}
        newLevel={1}
        duration={1800}
        workoutName="Test"
        onContinue={jest.fn()}
      />,
    );

    advanceTimers(600);
    const text = getAllText(tree.root);
    expect(text).toContain("XP BREAKDOWN");
    expect(text).toContain("Base (sets)");
    expect(text).toContain("+100");
    expect(text).toContain("Completion bonus");
    expect(text).toContain("+50");
    expect(text).toContain("TOTAL");
    expect(text).toContain("+150");
  });

  it("shows streak bonus when > 0", () => {
    const tree = renderInAct(
      <CompletionAnimation
        xpBreakdown={{ base: 100, completionBonus: 50, streakBonus: 25, total: 175 }}
        level={1}
        newLevel={1}
        duration={1800}
        workoutName="Test"
        onContinue={jest.fn()}
      />,
    );

    advanceTimers(600);
    const text = getAllText(tree.root);
    expect(text).toContain("Streak bonus");
    expect(text).toContain("+25");
  });

  it("does not show streak bonus when 0", () => {
    const tree = renderInAct(
      <CompletionAnimation
        xpBreakdown={defaultXpBreakdown}
        level={1}
        newLevel={1}
        duration={1800}
        workoutName="Test"
        onContinue={jest.fn()}
      />,
    );

    advanceTimers(600);
    const text = getAllText(tree.root);
    expect(text).not.toContain("Streak bonus");
  });

  it("shows LEVEL UP section when newLevel > level", () => {
    const tree = renderInAct(
      <CompletionAnimation
        xpBreakdown={defaultXpBreakdown}
        level={1}
        newLevel={3}
        duration={1800}
        workoutName="Test"
        onContinue={jest.fn()}
      />,
    );

    advanceTimers(1000);
    const text = getAllText(tree.root);
    expect(text).toContain("LEVEL UP!");
    expect(text).toContain("LEVEL 1 → 3");
    expect(text).toContain("New abilities unlocked");
  });

  it("does not show LEVEL UP when newLevel equals level", () => {
    const tree = renderInAct(
      <CompletionAnimation
        xpBreakdown={defaultXpBreakdown}
        level={1}
        newLevel={1}
        duration={1800}
        workoutName="Test"
        onContinue={jest.fn()}
      />,
    );

    advanceTimers(1000);
    const text = getAllText(tree.root);
    expect(text).not.toContain("LEVEL UP!");
  });

  it("calls playCompletionSound on mount when no level up", () => {
    renderInAct(
      <CompletionAnimation
        xpBreakdown={defaultXpBreakdown}
        level={1}
        newLevel={1}
        duration={1800}
        workoutName="Test"
        onContinue={jest.fn()}
      />,
    );

    expect(mockPlayCompletion).toHaveBeenCalledTimes(1);
    expect(mockPlayLevelUp).not.toHaveBeenCalled();
  });

  it("calls playLevelUpSound on mount when leveling up", () => {
    renderInAct(
      <CompletionAnimation
        xpBreakdown={defaultXpBreakdown}
        level={1}
        newLevel={2}
        duration={1800}
        workoutName="Test"
        onContinue={jest.fn()}
      />,
    );

    expect(mockPlayLevelUp).toHaveBeenCalledTimes(1);
    expect(mockPlayCompletion).not.toHaveBeenCalled();
  });

  it("calls cleanupSound on unmount", () => {
    const tree = renderInAct(
      <CompletionAnimation
        xpBreakdown={defaultXpBreakdown}
        level={1}
        newLevel={1}
        duration={1800}
        workoutName="Test"
        onContinue={jest.fn()}
      />,
    );

    act(() => {
      tree.unmount();
    });

    // Timer cleanup happens during unmount
    advanceTimers(10);
    expect(mockCleanup).toHaveBeenCalled();
  });

  it("calls onContinue when CONTINUE button is pressed", () => {
    const onContinue = jest.fn();
    const tree = renderInAct(
      <CompletionAnimation
        xpBreakdown={defaultXpBreakdown}
        level={1}
        newLevel={1}
        duration={1800}
        workoutName="Test"
        onContinue={onContinue}
      />,
    );

    advanceTimers(600);

    const continueBtn = tree.root.find((n) => n.props.testID === "continue-button");
    act(() => {
      continueBtn.props.onPress();
    });

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("shows XP/MIN stat", () => {
    // 150 XP / 30 min = 5 XP/min
    const tree = renderInAct(
      <CompletionAnimation
        xpBreakdown={defaultXpBreakdown}
        level={1}
        newLevel={1}
        duration={1800}
        workoutName="Test"
        onContinue={jest.fn()}
      />,
    );

    advanceTimers(600);
    const text = getAllText(tree.root);
    expect(text).toContain("XP/MIN");
  });

  it("shows CLASS UNLOCKED section when newClassUnlocks provided", () => {
    const tree = renderInAct(
      <CompletionAnimation
        xpBreakdown={defaultXpBreakdown}
        level={1}
        newLevel={1}
        duration={1800}
        workoutName="Test"
        onContinue={jest.fn()}
        newClassUnlocks={[
          {
            classDef: {
              id: "test-class",
              name: "IRON LEGACY",
              description: "Advanced leg day",
              icon: "🦵",
              accent: "#10B981",
              focus: ["Legs", "Core"],
              difficulty: "intermediate",
              requirements: [],
            },
            conditions: [],
          },
        ]}
      />,
    );

    // Skill/class unlocks appear at 1300ms
    advanceTimers(1400);
    const text = getAllText(tree.root);
    expect(text).toContain("CLASS UNLOCKED");
    expect(text).toContain("IRON LEGACY");
    expect(text).toContain("NEW");
  });

  it("shows NEW SKILLS UNLOCKED section when newSkillUnlocks provided", () => {
    const tree = renderInAct(
      <CompletionAnimation
        xpBreakdown={defaultXpBreakdown}
        level={1}
        newLevel={1}
        duration={1800}
        workoutName="Test"
        onContinue={jest.fn()}
        newSkillUnlocks={[
          {
            node: {
              id: "skill-1",
              exercise: {
                id: "archer-push-up",
                name: "Archer Push-up",
                category: "horizontal_push",
                description: "",
                defaultSets: 3,
                repRange: [5, 10],
                tempo: "2-1-2-0",
                restInterval: 90,
                progressionPathway: "hp",
                targetMuscles: ["chest", "shoulders"],
              },
              prerequisites: [],
              pathwayLevel: 2,
              difficulty: "intermediate",
              branchId: "push",
              position: { row: 0, col: 1 },
            },
            branchLabel: "PUSH",
            branchIcon: "💪",
            branchAccent: "#F59E0B",
          },
        ]}
      />,
    );

    advanceTimers(1400);
    const text = getAllText(tree.root);
    expect(text).toContain("NEW SKILLS UNLOCKED");
    expect(text).toContain("ARCHER PUSH-UP");
    expect(text).toContain("PUSH");
    expect(text).toContain("INTERMEDIATE");
  });

  it("renders without crashing (smoke test)", () => {
    const tree = renderInAct(
      <CompletionAnimation
        xpBreakdown={defaultXpBreakdown}
        level={1}
        newLevel={1}
        duration={1800}
        workoutName="Test"
        onContinue={jest.fn()}
      />,
    );

    advanceTimers(2000);
    expect(tree).toBeDefined();
  });
});
