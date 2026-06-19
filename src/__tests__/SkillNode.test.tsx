import React from "react";
import { act } from "react";
import renderer from "react-test-renderer";
import { SkillNode } from "../components/skill-tree/SkillNode";
import { SKILL_TREE_8 } from "../data/skillTree";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    success: "#10B981",
    accent: { DEFAULT: "#F59E0B" },
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { elevated: "#0D1021" },
    border: { subtle: "#1C1F33" },
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

// Get a test node from the 8-branch skill tree
const hpBranch = SKILL_TREE_8.find((b) => b.id === "hp")!;
const testNode = hpBranch.nodes[0];

// Helper: render component inside act()
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

describe("SkillNode", () => {
  it("renders the exercise name in uppercase", () => {
    const tree = renderInAct(
      <SkillNode
        node={testNode}
        isCompleted={false}
        isUnlocked={true}
        isMastered={false}
        isSelected={false}
        onPress={() => {}}
      />,
    );
    const text = getAllText(tree.root);
    expect(text).toContain(testNode.exercise.name.toUpperCase());
  });

  it("shows ★ when mastered", () => {
    const tree = renderInAct(
      <SkillNode
        node={testNode}
        isCompleted={true}
        isUnlocked={true}
        isMastered={true}
        isSelected={false}
        onPress={() => {}}
      />,
    );
    const text = getAllText(tree.root);
    expect(text).toContain("★");
  });

  it("shows ◇ when active (completed but not mastered)", () => {
    const tree = renderInAct(
      <SkillNode
        node={testNode}
        isCompleted={true}
        isUnlocked={true}
        isMastered={false}
        isSelected={false}
        onPress={() => {}}
      />,
    );
    const text = getAllText(tree.root);
    expect(text).toContain("◇");
  });

  it("shows difficulty badge", () => {
    const tree = renderInAct(
      <SkillNode
        node={testNode}
        isCompleted={false}
        isUnlocked={true}
        isMastered={false}
        isSelected={false}
        onPress={() => {}}
      />,
    );
    const text = getAllText(tree.root);
    expect(text).toContain(testNode.difficulty.toUpperCase());
  });

  it("shows rep range", () => {
    const tree = renderInAct(
      <SkillNode
        node={testNode}
        isCompleted={false}
        isUnlocked={true}
        isMastered={false}
        isSelected={false}
        onPress={() => {}}
      />,
    );
    const text = getAllText(tree.root);
    const repText = `${testNode.exercise.repRange[0]}–${testNode.exercise.repRange[1]} reps`;
    expect(text).toContain(repText);
  });

  it("shows correct chevron when selected", () => {
    const tree = renderInAct(
      <SkillNode
        node={testNode}
        isCompleted={false}
        isUnlocked={true}
        isMastered={false}
        isSelected={true}
        onPress={() => {}}
      />,
    );
    const text = getAllText(tree.root);
    expect(text).toContain("▼");
  });

  it("shows correct chevron when not selected", () => {
    const tree = renderInAct(
      <SkillNode
        node={testNode}
        isCompleted={false}
        isUnlocked={true}
        isMastered={false}
        isSelected={false}
        onPress={() => {}}
      />,
    );
    const text = getAllText(tree.root);
    expect(text).toContain("▶");
  });

  it("shows level badge (Lv1, Lv2, etc.)", () => {
    const tree = renderInAct(
      <SkillNode
        node={testNode}
        isCompleted={false}
        isUnlocked={true}
        isMastered={false}
        isSelected={false}
        onPress={() => {}}
      />,
    );
    const text = getAllText(tree.root);
    expect(text).toContain(`Lv${testNode.pathwayLevel}`);
  });

  it("shows state badge (UNLOCKED, ACTIVE, etc.)", () => {
    const tree = renderInAct(
      <SkillNode
        node={testNode}
        isCompleted={true}
        isUnlocked={true}
        isMastered={false}
        isSelected={false}
        onPress={() => {}}
      />,
    );
    const text = getAllText(tree.root);
    expect(text).toContain("ACTIVE");
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <SkillNode
          node={testNode}
          isCompleted={false}
          isUnlocked={true}
          isMastered={false}
          isSelected={false}
          onPress={onPress}
        />,
      );
    });
    act(() => {
      const button = tree!.root.find((n) => {
        return n.props && typeof n.props.onPress === "function";
      });
      button.props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders muscle target badges", () => {
    const tree = renderInAct(
      <SkillNode
        node={testNode}
        isCompleted={false}
        isUnlocked={true}
        isMastered={false}
        isSelected={false}
        onPress={() => {}}
      />,
    );
    const text = getAllText(tree.root);
    const firstMuscle = testNode.exercise.targetMuscles[0].replace(/_/g, " ");
    expect(text.toLowerCase()).toContain(firstMuscle.toLowerCase());
  });

  it("renders without crashing", () => {
    const tree = renderInAct(
      <SkillNode
        node={testNode}
        isCompleted={false}
        isUnlocked={true}
        isMastered={false}
        isSelected={false}
        onPress={() => {}}
      />,
    );
    expect(tree).toBeDefined();
  });

  it("renders different node types without crashing", () => {
    for (const branch of SKILL_TREE_8) {
      for (const node of branch.nodes) {
        act(() => {
          const tree = renderer.create(
            <SkillNode
              node={node}
              isCompleted={false}
              isUnlocked={true}
              isMastered={false}
              isSelected={false}
              onPress={() => {}}
            />,
          );
          expect(tree).toBeDefined();
        });
      }
    }
  });
});
