import React, { act } from "react";
import { TouchableOpacity } from "react-native";
import renderer from "react-test-renderer";
import { WorkoutCard } from "../components/ui/WorkoutCard";
import type { WorkoutDay } from "../data/exercises";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B" },
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { card: "#0D1021", highlight: "#151A30", primary: "#070814", elevated: "#0D1021" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  H4: ({ children, variant, style }: any) => {
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
  Tag: ({ children, variant, style }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, { style: [{ fontSize: 9 }, style] }, children);
  },
}));

jest.mock("../utils/haptics", () => ({
  hapticPress: jest.fn(),
}));

// ── Test Fixtures ─────────────────────────────────────────────────────────

function createWorkout(overrides: Partial<WorkoutDay> = {}): WorkoutDay {
  return {
    id: "workout-96-0",
    name: "THE VANGUARD",
    focus: "HP · VP · AQL · AC",
    exercises: [
      {
        id: "ex1",
        name: "Pike Push-up",
        targetMuscles: ["shoulders"],
        category: "vertical_push",
        description: "",
        defaultSets: 3,
        repRange: [6, 12],
        tempo: "3-1-2-0",
        restInterval: 90,
        progressionPathway: "VP pathway",
      },
      {
        id: "ex2",
        name: "Doorway Row",
        targetMuscles: ["lats"],
        category: "horizontal_pull",
        description: "",
        defaultSets: 3,
        repRange: [8, 15],
        tempo: "2-1-2-0",
        restInterval: 60,
        progressionPathway: "HPLL pathway",
      },
      {
        id: "ex3",
        name: "Bulgarian Split Squat",
        targetMuscles: ["quadriceps", "glutes"],
        category: "unilateral_lower_push",
        description: "",
        defaultSets: 3,
        repRange: [8, 12],
        tempo: "3-0-2-0",
        restInterval: 90,
        progressionPathway: "AQL pathway",
      },
    ],
    recommendedFrequency: "4 days/week",
    ...overrides,
  };
}

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
// WorkoutCard
// ═══════════════════════════════════════════════════

describe("WorkoutCard", () => {
  it("renders workout name and focus", () => {
    const workout = createWorkout();
    const tree = renderInAct(<WorkoutCard workout={workout} onPress={jest.fn()} />);
    const text = getAllText(tree.root);
    expect(text).toContain("THE VANGUARD");
    expect(text).toContain("HP · VP · AQL · AC");
  });

  it("shows exercise names in the preview list", () => {
    const workout = createWorkout();
    const tree = renderInAct(<WorkoutCard workout={workout} onPress={jest.fn()} />);
    const text = getAllText(tree.root);
    expect(text).toContain("Pike Push-up");
    expect(text).toContain("Doorway Row");
    expect(text).toContain("Bulgarian Split Squat");
  });

  it("shows the exercise count badge", () => {
    const workout = createWorkout();
    const tree = renderInAct(<WorkoutCard workout={workout} onPress={jest.fn()} />);
    const text = getAllText(tree.root);
    expect(text).toContain("3 EX");
  });

  it("shows estimated duration", () => {
    const workout = createWorkout();
    const tree = renderInAct(<WorkoutCard workout={workout} onPress={jest.fn()} />);
    const text = getAllText(tree.root);
    // Estimated minutes should be displayed
    expect(text).toContain("min");
  });

  it("shows PREVIEW → when not active", () => {
    const workout = createWorkout();
    const tree = renderInAct(
      <WorkoutCard workout={workout} onPress={jest.fn()} isActive={false} />,
    );
    const text = getAllText(tree.root);
    expect(text).toContain("PREVIEW →");
    expect(text).not.toContain("RECOMMENDED");
  });

  it("shows ★ RECOMMENDED when active", () => {
    const workout = createWorkout();
    const tree = renderInAct(<WorkoutCard workout={workout} onPress={jest.fn()} isActive={true} />);
    const text = getAllText(tree.root);
    expect(text).toContain("★ RECOMMENDED");
    expect(text).not.toContain("PREVIEW →");
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const workout = createWorkout();
    const tree = renderInAct(<WorkoutCard workout={workout} onPress={onPress} />);
    const touchable = tree.root.findByType(TouchableOpacity);
    act(() => {
      touchable.props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows +N overflow when more than 4 exercises", () => {
    const workout = createWorkout({
      exercises: Array.from({ length: 6 }, (_, i) => ({
        id: `ex${i}`,
        name: `Exercise ${i + 1}`,
        targetMuscles: ["chest"] as any,
        category: "horizontal_push" as any,
        description: "",
        defaultSets: 3,
        repRange: [8, 12] as [number, number],
        tempo: "3-1-2-0" as any,
        restInterval: 60,
        progressionPathway: "test",
      })),
    });
    const tree = renderInAct(<WorkoutCard workout={workout} onPress={jest.fn()} />);
    const text = getAllText(tree.root);
    expect(text).toContain("+2");
  });

  it("has accessibilityRole button", () => {
    const workout = createWorkout();
    const tree = renderInAct(<WorkoutCard workout={workout} onPress={jest.fn()} />);
    const touchable = tree.root.findByType(TouchableOpacity);
    expect(touchable.props.accessibilityRole).toBe("button");
  });

  it("provides accessibilityLabel with workout info", () => {
    const workout = createWorkout();
    const tree = renderInAct(<WorkoutCard workout={workout} onPress={jest.fn()} />);
    const touchable = tree.root.findByType(TouchableOpacity);
    const label = touchable.props.accessibilityLabel;
    expect(label).toContain("THE VANGUARD");
    expect(label).toContain("3 exercises");
    expect(label).toContain("minutes");
  });

  it("marks accessibilityState as selected when active", () => {
    const workout = createWorkout();
    const tree = renderInAct(<WorkoutCard workout={workout} onPress={jest.fn()} isActive={true} />);
    const touchable = tree.root.findByType(TouchableOpacity);
    expect(touchable.props.accessibilityState.selected).toBe(true);
  });

  it("renders without crashing (basic smoke test)", () => {
    const workout = createWorkout();
    const tree = renderInAct(<WorkoutCard workout={workout} onPress={jest.fn()} />);
    expect(tree).toBeDefined();
  });
});
