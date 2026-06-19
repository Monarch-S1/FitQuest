import React from "react";
import { act } from "react";
import renderer from "react-test-renderer";
import { SkillDetailSheet } from "../components/skill-tree/SkillDetailSheet";
import { SKILL_TREE_8 } from "../data/skillTree";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    success: "#10B981",
    accent: { DEFAULT: "#F59E0B" },
    warning: "#F59E0B",
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { primary: "#070814", elevated: "#0D1021", highlight: "#151A30" },
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

jest.mock("../components/ui/Button", () => ({
  Button: ({ title, onPress }: { title: string; onPress: () => void }) => {
    const React = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return (
      <TouchableOpacity onPress={onPress} accessibilityRole="button">
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
}));

// Use the first node from the HP branch (Wall Push-up) — it's simple with no checkpoints
const hpBranch = SKILL_TREE_8.find((b) => b.id === "hp")!;
const testNode = hpBranch.nodes[0];

// The AC branch has some nodes with rectus_abdominis target and reasonable detail
const acBranch = SKILL_TREE_8.find((b) => b.id === "ac")!;
const acNode = acBranch.nodes[4]; // AC5 - Hollow Body Hold, one of the most detailed

// Helper: render component inside act() and return the tree
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

describe("SkillDetailSheet", () => {
  describe("with HP branch node", () => {
    const node = testNode;

    it("renders the exercise name in uppercase", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} nodeState="unlocked" onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain(node.exercise.name.toUpperCase());
    });

    it("renders pathway ID and level in header", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} nodeState="unlocked" onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain(node.pathwayId.toUpperCase());
      expect(text).toContain(`Lv${node.pathwayLevel}`);
    });

    it("renders description section", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} nodeState="unlocked" onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain("DESCRIPTION");
      expect(text).toContain(node.exercise.description);
    });

    it("renders rep scheme stat labels", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} nodeState="unlocked" onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain("SETS");
      expect(text).toContain("REPS");
      expect(text).toContain("REST");
      expect(text).toContain("TEMPO");
    });

    it("renders sets value", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} nodeState="unlocked" onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain(String(node.exercise.defaultSets));
    });

    it("renders rep range", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} nodeState="unlocked" onClose={() => {}} />);
      const text = getAllText(tree.root);
      const repRange = `${node.exercise.repRange[0]}–${node.exercise.repRange[1]}`;
      expect(text).toContain(repRange);
    });

    it("renders rest interval", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} nodeState="unlocked" onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain(`${node.exercise.restInterval}s`);
    });

    it("renders tempo", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} nodeState="unlocked" onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain(node.exercise.tempo);
    });

    it("renders SKILL PATH section", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} nodeState="unlocked" onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain("SKILL PATH");
    });

    it("renders OVERLOAD MECHANISM section", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} nodeState="unlocked" onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain("OVERLOAD MECHANISM");
    });

    it("renders state badge", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} nodeState="unlocked" onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain("UNLOCKED");
    });

    it("renders CLOSE button", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} nodeState="unlocked" onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain("CLOSE");
    });

    it("calls onClose when close button is pressed", () => {
      const onClose = jest.fn();
      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(<SkillDetailSheet node={node} nodeState="unlocked" onClose={onClose} />);
      });
      act(() => {
        const closeButton = tree!.root.find((n) => {
          return (
            n.props &&
            typeof n.props.onPress === "function" &&
            n.props.accessibilityRole === "button"
          );
        });
        closeButton.props.onPress();
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("with AC branch node (has hard prerequisites)", () => {
    const node = acNode;

    it("renders without crashing", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} nodeState="active" onClose={() => {}} />);
      expect(tree).toBeDefined();
    });

    it("renders exercise name", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} nodeState="active" onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain(node.exercise.name.toUpperCase());
    });

    it("renders basic stat labels", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} nodeState="active" onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain("SETS");
      expect(text).toContain("REPS");
      expect(text).toContain("REST");
      expect(text).toContain("TEMPO");
    });
  });
});
