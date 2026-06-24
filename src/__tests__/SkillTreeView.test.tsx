import React, { act } from "react";
import renderer from "react-test-renderer";
import { SKILL_TREE, SkillBranch } from "../data/skillTree";

import { SkillTreeView } from "../components/skill-tree/SkillTreeView";

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
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, "16": 64, "8": 32 },
}));

// Mock react-native-svg since it's a native module
jest.mock("react-native-svg", () => {
  const React = require("react");
  const MockPath = ({ children, ...props }: any) =>
    React.createElement("View", { ...props, testID: "svg-path" }, children);
  const MockSvg = ({ children, ...props }: any) =>
    React.createElement("View", { ...props, testID: "svg" }, children);
  return {
    __esModule: true,
    default: MockSvg,
    Svg: MockSvg,
    Path: MockPath,
  };
});

// Mock the useUserStore with empty workout history
const mockWorkoutHistory: import("../stores/useUserStore").WorkoutSession[] = [];
jest.mock("../stores/useUserStore", () => ({
  useUserStore: (selector: (state: any) => any) =>
    selector({
      workoutHistory: mockWorkoutHistory,
      masteredExerciseIds: [],
    }),
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

  it("renders branch headers with labels and descriptions", () => {
    const tree = renderInAct(<SkillTreeView />);
    const text = getAllText(tree.root);
    for (const branch of SKILL_TREE) {
      expect(text).toContain(branch.label);
      expect(text).toContain(branch.description);
    }
  });

  it("shows level labels (Lv1, Lv2, etc.) for first-in-branch exercises", () => {
    const tree = renderInAct(<SkillTreeView />);
    const text = getAllText(tree.root);
    for (const branch of SKILL_TREE) {
      if (branch.nodes.length > 0) {
        expect(text).toContain(`Lv${branch.nodes[0].pathwayLevel}`);
      }
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

  it("renders level labels across multiple branches", () => {
    const tree = renderInAct(<SkillTreeView />);
    const text = getAllText(tree.root).toUpperCase();
    let levelLabelCount = 0;
    for (const branch of SKILL_TREE) {
      for (const node of branch.nodes) {
        if (text.includes(`LV${node.pathwayLevel}`)) {
          levelLabelCount++;
        }
      }
    }
    expect(levelLabelCount).toBeGreaterThanOrEqual(8);
  });
});
