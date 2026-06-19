import React from "react";
import { act } from "react";
import renderer from "react-test-renderer";
import { SKILL_TREE } from "../data/skillTree";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    success: "#10B981",
    warning: "#F59E0B",
    accent: { DEFAULT: "#F59E0B", light: "#FCD34D", dark: "#B45309" },
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { primary: "#070814", elevated: "#0D1021", highlight: "#151A30", surface: "#0A0D1A" },
    border: { subtle: "#1C1F33" },
    error: "#EF4444",
  }),
  typography: {
    h3: { fontFamily: "BebasNeue-Regular", fontSize: 16, letterSpacing: 1 },
    bodySmall: { fontFamily: "Inter-Regular", fontSize: 11, lineHeight: 16 },
    label: { fontFamily: "Inter-SemiBold", fontSize: 10, letterSpacing: 1 },
    body: { fontFamily: "Inter-Regular", fontSize: 13, lineHeight: 20 },
    h1: { fontFamily: "BebasNeue-Regular", fontSize: 32, letterSpacing: 2 },
    h2: { fontFamily: "BebasNeue-Regular", fontSize: 24, letterSpacing: 1.5 },
    display: { fontFamily: "BebasNeue-Regular", fontSize: 36, letterSpacing: 2 },
    subtitle: { fontFamily: "Inter-SemiBold", fontSize: 12, letterSpacing: 1 },
    h4: { fontFamily: "BebasNeue-Regular", fontSize: 14, letterSpacing: 1 },
  },
  spacing: [0, 2, 4, 8, 12, 16, 20, 24, 32, 40],
  fonts: {
    heading: "BebasNeue-Regular",
    body: { regular: "Inter-Regular", semiBold: "Inter-SemiBold", bold: "Inter-Bold" },
  },
}));

// Mock the useUserStore with empty workout history
const mockWorkoutHistory: import("../stores/useUserStore").WorkoutSession[] = [];
jest.mock("../stores/useUserStore", () => ({
  useUserStore: (selector: (state: any) => any) =>
    selector({
      workoutHistory: mockWorkoutHistory,
    }),
}));

// Mock MotiView to render as a regular View (strips animation props)
jest.mock("moti", () => ({
  MotiView: ({ children, ...props }: any) => {
    const React = require("react");
    const { View } = require("react-native");
    const { from, animate, transition, ...viewProps } = props;
    return <View {...viewProps}>{children}</View>;
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

// Helper: extract all text from a rendered tree
function extractText(node: renderer.ReactTestRendererNode): string {
  if (typeof node === "string") return node;
  if (node.children) return node.children.map(extractText).join("");
  return "";
}

function getAllText(instance: renderer.ReactTestInstance): string {
  return extractText(instance);
}

import { SkillTreeView } from "../components/skill-tree/SkillTreeView";

describe("SkillTreeView", () => {
  it("renders all 5 filter tabs (ALL, PUSH, PULL, LEGS, CORE)", () => {
    const tree = renderInAct(<SkillTreeView />);
    const text = getAllText(tree.root);
    expect(text).toContain("ALL");
    expect(text).toContain("PUSH");
    expect(text).toContain("PULL");
    expect(text).toContain("LEGS");
    expect(text).toContain("CORE");
  });

  it("renders branch headers for all 4 families", () => {
    const tree = renderInAct(<SkillTreeView />);
    const text = getAllText(tree.root);
    for (const branch of SKILL_TREE) {
      expect(text).toContain(branch.label);
      expect(text).toContain(branch.description);
    }
  });

  it("renders exercise names for all 4 first-in-branch exercises", () => {
    const tree = renderInAct(<SkillTreeView />);
    const text = getAllText(tree.root);
    for (const branch of SKILL_TREE) {
      if (branch.nodes.length > 0) {
        // Exercise names are rendered in uppercase by SkillNode
        expect(text.toUpperCase()).toContain(branch.nodes[0].exercise.name.toUpperCase());
      }
    }
  });

  it("shows move count per branch", () => {
    const tree = renderInAct(<SkillTreeView />);
    const text = getAllText(tree.root);
    for (const branch of SKILL_TREE) {
      expect(text).toContain(`${branch.nodes.length} MOVES`);
    }
  });

  it("shows legend with MASTERED, ACTIVE, UNLOCKED, LOCKED", () => {
    const tree = renderInAct(<SkillTreeView />);
    const text = getAllText(tree.root);
    expect(text).toContain("MASTERED");
    expect(text).toContain("ACTIVE");
    expect(text).toContain("UNLOCKED");
    expect(text).toContain("LOCKED");
  });

  it("renders without crashing", () => {
    const tree = renderInAct(<SkillTreeView />);
    expect(tree).toBeDefined();
  });

  it("renders many exercise names across the tree", () => {
    const tree = renderInAct(<SkillTreeView />);
    const text = getAllText(tree.root).toUpperCase();
    let visibleCount = 0;
    for (const branch of SKILL_TREE) {
      for (const node of branch.nodes) {
        if (text.includes(node.exercise.name.toUpperCase())) {
          visibleCount++;
        }
      }
    }
    expect(visibleCount).toBeGreaterThanOrEqual(20);
  });
});
