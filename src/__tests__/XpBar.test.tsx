import React, { act } from "react";
import renderer from "react-test-renderer";
import { XpBar } from "../components/ui/XpBar";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B", light: "#FCD34D" },
    text: { primary: "#EDE7D9", secondary: "#9B8E7A" },
    bg: { highlight: "#151A30" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4 },
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

// Helper: render inside act() and return the tree
function renderInAct(element: React.ReactElement) {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

// Helper: extract all text from a rendered tree recursively
function extractText(node: renderer.ReactTestRendererNode): string {
  if (typeof node === "string") return node;
  if (node.children) return node.children.map(extractText).join("");
  return "";
}

function getAllText(instance: renderer.ReactTestInstance): string {
  return extractText(instance);
}

describe("XpBar", () => {
  it("renders level and XP progress text", () => {
    const tree = renderInAct(<XpBar currentXp={50} requiredXp={100} level={5} />);
    const text = getAllText(tree.root);
    expect(text).toContain("LEVEL 5");
    expect(text).toContain("50 / 100");
  });

  it("shows next level when provided", () => {
    const tree = renderInAct(<XpBar currentXp={50} requiredXp={100} level={5} nextLevel={6} />);
    const text = getAllText(tree.root);
    expect(text).toContain("5");
    expect(text).toContain("6");
  });

  it("does not crash with zero requiredXp", () => {
    const tree = renderInAct(<XpBar currentXp={0} requiredXp={0} level={1} />);
    expect(tree).toBeDefined();
  });

  it("handles maxed XP (current = required)", () => {
    const tree = renderInAct(<XpBar currentXp={100} requiredXp={100} level={5} />);
    const text = getAllText(tree.root);
    expect(text).toContain("100 / 100");
  });

  it("handles XP exceeding required (edge case)", () => {
    const tree = renderInAct(<XpBar currentXp={150} requiredXp={100} level={5} />);
    expect(tree).toBeDefined();
  });

  it("renders with animation enabled (default)", () => {
    const tree = renderInAct(<XpBar currentXp={50} requiredXp={100} level={3} animate />);
    expect(tree).toBeDefined();
  });

  it("renders with animation disabled", () => {
    const tree = renderInAct(<XpBar currentXp={75} requiredXp={100} level={3} animate={false} />);
    expect(tree).toBeDefined();
  });

  it("has accessible progressbar role", () => {
    const tree = renderInAct(<XpBar currentXp={30} requiredXp={100} level={2} />);
    const progressBar = tree.root.find((n) => n.props.accessibilityRole === "progressbar");
    expect(progressBar).toBeDefined();
  });

  it("provides accessible label with level and XP info", () => {
    const tree = renderInAct(<XpBar currentXp={30} requiredXp={100} level={4} nextLevel={5} />);
    const progressBar = tree.root.find((n) => n.props.accessibilityRole === "progressbar");
    expect(progressBar.props.accessibilityLabel).toContain("30");
    expect(progressBar.props.accessibilityLabel).toContain("100");
    expect(progressBar.props.accessibilityLabel).toContain("Level 4");
  });

  it("provides accessibilityValue with min, max, now", () => {
    const tree = renderInAct(<XpBar currentXp={30} requiredXp={100} level={2} />);
    const progressBar = tree.root.find((n) => n.props.accessibilityRole === "progressbar");
    expect(progressBar.props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 30,
    });
  });

  it("renders different XP levels without crashing", () => {
    const scenarios = [
      { currentXp: 0, requiredXp: 100, level: 1 },
      { currentXp: 50, requiredXp: 100, level: 5 },
      { currentXp: 99, requiredXp: 100, level: 10 },
      { currentXp: 1000, requiredXp: 2000, level: 15 },
      { currentXp: 5000, requiredXp: 10000, level: 25 },
    ];
    for (const s of scenarios) {
      act(() => {
        const tree = renderer.create(
          <XpBar currentXp={s.currentXp} requiredXp={s.requiredXp} level={s.level} />,
        );
        expect(tree).toBeDefined();
      });
    }
  });

  it("renders without crashing (basic smoke test)", () => {
    const tree = renderInAct(<XpBar currentXp={50} requiredXp={100} level={5} />);
    expect(tree).toBeDefined();
  });
});
