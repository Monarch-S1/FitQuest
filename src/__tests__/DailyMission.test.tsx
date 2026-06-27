import React, { act } from "react";
import renderer from "react-test-renderer";
import { DailyMission } from "../components/home/DailyMission";

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
  H4: ({ children, variant, style }: any) => {
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

jest.mock("../components/ui/Button", () => ({
  Button: ({ title, onPress, size, fullWidth }: any) => {
    const React = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return React.createElement(
      TouchableOpacity,
      { onPress, testID: "button" },
      React.createElement(Text, null, title),
    );
  },
}));

jest.mock("../utils/xp", () => ({
  calculateDailyMissionXp: () => 100,
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
// DailyMission
// ═══════════════════════════════════════════════════

describe("DailyMission", () => {
  it("renders the mission text", () => {
    const tree = renderInAct(<DailyMission mission="Complete 10 sets of push-ups" />);
    const text = getAllText(tree.root);
    expect(text).toContain("Complete 10 sets of push-ups");
  });

  it("shows TODAY'S MISSION label when incomplete", () => {
    const tree = renderInAct(<DailyMission mission="Test" isComplete={false} />);
    const text = getAllText(tree.root);
    expect(text).toContain("TODAY'S MISSION");
    expect(text).not.toContain("MISSION COMPLETE");
  });

  it("shows MISSION COMPLETE label when complete", () => {
    const tree = renderInAct(<DailyMission mission="Test" isComplete={true} />);
    const text = getAllText(tree.root);
    expect(text).toContain("MISSION COMPLETE");
    expect(text).not.toContain("TODAY'S MISSION");
  });

  it("shows the completed checkmark when complete", () => {
    const tree = renderInAct(<DailyMission mission="Test" isComplete={true} />);
    const text = getAllText(tree.root);
    expect(text).toContain("Completed today");
    expect(text).toContain("✓");
  });

  it("renders start button when not complete and onStart is provided", () => {
    const onStart = jest.fn();
    const tree = renderInAct(<DailyMission mission="Test" onStart={onStart} isComplete={false} />);
    const button = tree.root.find((n) => n.props.testID === "button");
    expect(button).toBeDefined();
    act(() => button.props.onPress());
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("does not render start button when onStart is missing", () => {
    const tree = renderInAct(<DailyMission mission="Test" isComplete={false} />);
    const buttons = tree.root.findAll((n) => n.props.testID === "button");
    expect(buttons.length).toBe(0);
  });

  it("does not render start button when isComplete is true", () => {
    const tree = renderInAct(<DailyMission mission="Test" onStart={jest.fn()} isComplete={true} />);
    const buttons = tree.root.findAll((n) => n.props.testID === "button");
    expect(buttons.length).toBe(0);
  });

  it("renders with default xpReward when not specified", () => {
    const tree = renderInAct(<DailyMission mission="Test" />);
    const text = getAllText(tree.root);
    expect(text).toContain("+100");
  });

  it("renders with custom xpReward", () => {
    const tree = renderInAct(<DailyMission mission="Test" xpReward={250} />);
    const text = getAllText(tree.root);
    expect(text).toContain("+250");
  });

  it("renders without crashing (basic smoke test)", () => {
    const tree = renderInAct(<DailyMission mission="Test" />);
    expect(tree).toBeDefined();
  });
});
