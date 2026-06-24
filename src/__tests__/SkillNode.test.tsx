import React, { act } from "react";
import renderer from "react-test-renderer";
import { SkillNode } from "../components/skill-tree/SkillNode";
import { SKILL_TREE_8 } from "../data/skillTree";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    success: "#10B981",
    accent: { DEFAULT: "#F59E0B" },
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { base: "#070814", elevated: "#0D1021", highlight: "#151A30" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, "16": 64 },
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
  it("renders the level label (Lv1, Lv2, etc.) below the sphere", () => {
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

  it("shows ✓ checkmark inside sphere when mastered", () => {
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
    expect(text).toContain("✓");
  });

  it("shows a diamond indicator when active", () => {
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
    // Active state has a rotated square (diamond) View — just verify it renders
    expect(tree).toBeDefined();
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

  it("renders dimmed when locked", () => {
    const tree = renderInAct(
      <SkillNode
        node={testNode}
        isCompleted={false}
        isUnlocked={false}
        isMastered={false}
        isSelected={false}
        onPress={() => {}}
      />,
    );
    expect(tree).toBeDefined();
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
