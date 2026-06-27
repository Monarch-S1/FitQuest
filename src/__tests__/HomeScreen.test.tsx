import React, { act } from "react";
import renderer from "react-test-renderer";

import HomeScreen from "../../app/(tabs)/index";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B", light: "#FCD34D" },
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: {
      base: "#070814",
      card: "#0D1021",
      highlight: "#151A30",
      primary: "#070814",
      elevated: "#0D1021",
    },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, "5": 20 },
  Display: ({ children, style }: any) => {
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

jest.mock("../stores/useUserStore", () => ({
  useUserStore: (selector?: (state: any) => any) => {
    const mockState = {
      level: 1,
      totalXp: 0,
      streakData: {
        currentStreak: 0,
        longestStreak: 0,
        lastWorkoutDate: null,
        isActiveToday: false,
      },
      recoveryStatus: "optimal",
      xpProgress: { currentXp: 0, requiredXp: 100, progress: 0 },
      workoutHistory: [],
      lastShownMilestone: 0,
      setLastShownMilestone: jest.fn(),
      isHydrated: true,
      fitnessGoal: "general" as const,
      masteredExerciseIds: [],
    };
    return selector ? selector(mockState) : mockState;
  },
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("../components/ui/XpBar", () => ({
  XpBar: ({ currentXp, requiredXp, level, nextLevel }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, null, `LEVEL ${level} ${currentXp} / ${requiredXp}`);
  },
}));

jest.mock("../components/ui/LevelBadge", () => ({
  LevelBadge: ({ level, size }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, { testID: "level-badge" }, `LEVEL ${level}`);
  },
}));

jest.mock("../components/ui/Card", () => ({
  Card: ({ children, title, style }: any) => {
    const React = require("react");
    const { View, Text } = require("react-native");
    return React.createElement(
      View,
      { style },
      title ? React.createElement(Text, null, title) : null,
      children,
    );
  },
}));

jest.mock("../components/ui/WorkoutCard", () => ({
  WorkoutCard: ({ workout, onPress, isActive }: any) => {
    const React = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return React.createElement(
      TouchableOpacity,
      { onPress, testID: "workout-card" },
      React.createElement(Text, null, workout.name),
    );
  },
}));

jest.mock("../components/home/DailyMission", () => ({
  DailyMission: ({ mission, isComplete, onStart }: any) => {
    const React = require("react");
    const { View, Text, TouchableOpacity } = require("react-native");
    return React.createElement(
      View,
      null,
      React.createElement(Text, null, mission),
      onStart
        ? React.createElement(TouchableOpacity, { testID: "start-mission", onPress: onStart })
        : null,
    );
  },
}));

jest.mock("../components/ui/SyncIndicator", () => ({
  SyncIndicator: () => {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { testID: "sync-indicator" });
  },
}));

jest.mock("../components/ui/Skeleton", () => ({
  HomeScreenSkeleton: () => {
    const React = require("react");
    const { View, Text } = require("react-native");
    return React.createElement(
      View,
      { testID: "skeleton" },
      React.createElement(Text, null, "Loading..."),
    );
  },
}));

jest.mock("../components/home/StreakMilestone", () => ({
  StreakMilestone: ({ tier, onDismiss }: any) => {
    const React = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return React.createElement(
      TouchableOpacity,
      { testID: "milestone", onPress: onDismiss },
      React.createElement(Text, null, tier.label),
    );
  },
  getStreakMilestone: jest.fn(() => null),
}));

jest.mock("../data/workouts", () => ({
  getWorkouts96: () => [
    {
      id: "workout-96-0",
      name: "THE VANGUARD",
      focus: "Push",
      exercises: [
        {
          id: "e1",
          name: "Push-up",
          targetMuscles: ["chest"],
          category: "horizontal_push",
          description: "",
          defaultSets: 3,
          repRange: [8, 15],
          tempo: "2-1-2-0",
          restInterval: 60,
          progressionPathway: "test",
        },
      ],
      recommendedFrequency: "4/week",
    },
    {
      id: "workout-96-1",
      name: "THE SHADOW",
      focus: "Pull",
      exercises: [
        {
          id: "e2",
          name: "Row",
          targetMuscles: ["lats"],
          category: "horizontal_pull",
          description: "",
          defaultSets: 3,
          repRange: [8, 15],
          tempo: "2-1-2-0",
          restInterval: 60,
          progressionPathway: "test",
        },
      ],
      recommendedFrequency: "4/week",
    },
  ],
}));

jest.mock("../utils/recommendations", () => ({
  getTrainingInsights: () => [],
  getRecommendation: () => ({
    recommendedId: "workout-96-0",
    recommendedName: "THE VANGUARD",
    confidence: "high",
    reasoning: "Recommended based on your training history.",
  }),
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

// ═══════════════════════════════════════════════════
// HomeScreen
// ═══════════════════════════════════════════════════

describe("HomeScreen", () => {
  it("renders SYSTEM ONLINE and FitQuest title", () => {
    const tree = renderInAct(<HomeScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("SYSTEM ONLINE");
    expect(text).toContain("FitQuest");
  });

  it("renders XP bar with level info", () => {
    const tree = renderInAct(<HomeScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("LEVEL 1");
    expect(text).toContain("0 / 100");
  });

  it("renders the LevelBadge", () => {
    const tree = renderInAct(<HomeScreen />);
    const badge = tree.root.find((n) => n.props.testID === "level-badge");
    expect(badge).toBeDefined();
  });

  it("renders the SyncIndicator", () => {
    const tree = renderInAct(<HomeScreen />);
    const indicator = tree.root.find((n) => n.props.testID === "sync-indicator");
    expect(indicator).toBeDefined();
  });

  it("renders DAY STREAK stats card", () => {
    const tree = renderInAct(<HomeScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("DAY STREAK");
    expect(text).toContain("0");
  });

  it("renders TOTAL XP stats card", () => {
    const tree = renderInAct(<HomeScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("TOTAL XP");
    expect(text).toContain("0");
  });

  it("renders readiness/recovery status", () => {
    const tree = renderInAct(<HomeScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("OPTIMAL");
  });

  it("shows welcome banner when workout history is empty", () => {
    const tree = renderInAct(<HomeScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("WELCOME TO FITQUEST");
    expect(text).toContain("Complete your first workout");
  });

  it("renders the daily mission", () => {
    const tree = renderInAct(<HomeScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("Complete today's recommended workout");
  });

  it("renders the featured workout section", () => {
    const tree = renderInAct(<HomeScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("FEATURED QUEST");
  });

  it("renders the ALL WORKOUTS section when workouts exist", () => {
    const tree = renderInAct(<HomeScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("ALL WORKOUTS");
  });

  it("renders workout cards", () => {
    const tree = renderInAct(<HomeScreen />);
    const cards = tree.root.findAll((n) => n.props.testID === "workout-card");
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  it("renders QUEST LOG section", () => {
    const tree = renderInAct(<HomeScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("QUEST LOG");
    expect(text).toContain("4 days/week");
    expect(text).toContain("Double progression method");
  });

  it("renders the start mission button", () => {
    const tree = renderInAct(<HomeScreen />);
    const startButton = tree.root.find((n) => n.props.testID === "start-mission");
    expect(startButton).toBeDefined();
  });

  it("does not show streak milestone when getStreakMilestone returns null", () => {
    const tree = renderInAct(<HomeScreen />);
    const milestones = tree.root.findAll((n) => n.props.testID === "milestone");
    expect(milestones.length).toBe(0);
  });

  it("renders without crashing (basic smoke test)", () => {
    const tree = renderInAct(<HomeScreen />);
    expect(tree).toBeDefined();
  });
});
