import React from "react";
import { act } from "react";
import renderer from "react-test-renderer";
import { SkillDetailSheet } from "../components/skill-tree/SkillDetailSheet";
import { SKILL_TREE } from "../data/skillTree";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    success: "#10B981",
    accent: { DEFAULT: "#F59E0B" },
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

// Find nodes with specific properties for targeted testing
let fullNode: (typeof SKILL_TREE)[0]["nodes"][0] | null = null;
let simpleNode: (typeof SKILL_TREE)[0]["nodes"][0] | null = null;
for (const branch of SKILL_TREE) {
  if (!fullNode) {
    fullNode =
      branch.nodes.find(
        (n) =>
          n.exercise.visualGuide?.checkpoints?.length &&
          n.exercise.biomechanicalNotes,
      ) || null;
  }
  if (!simpleNode) {
    simpleNode =
      branch.nodes.find(
        (n) =>
          !n.exercise.visualGuide?.checkpoints?.length &&
          !n.exercise.biomechanicalNotes,
      ) || null;
  }
}

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
  describe("with full detail node (has checkpoints + biomechanical notes)", () => {
    const node = fullNode!;

    it("renders the exercise name in uppercase", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain(node.exercise.name.toUpperCase());
    });

    it("renders family and difficulty badge", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      const badge = `${node.family.toUpperCase()} · ${node.difficulty.toUpperCase()}`;
      expect(text).toContain(badge);
    });

    it("renders description section", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain("DESCRIPTION");
      expect(text).toContain(node.exercise.description);
    });

    it("renders rep scheme stats labels", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain("SETS");
      expect(text).toContain("REPS");
      expect(text).toContain("REST");
      expect(text).toContain("TEMPO");
    });

    it("renders sets value", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain(String(node.exercise.defaultSets));
    });

    it("renders rep range", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      const repRange = `${node.exercise.repRange[0]}–${node.exercise.repRange[1]}`;
      expect(text).toContain(repRange);
    });

    it("renders rest interval", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain(`${node.exercise.restInterval}s`);
    });

    it("renders tempo", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain(node.exercise.tempo);
    });

    it("renders SKILL PATH section", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain("SKILL PATH");
    });

    it("renders progression path steps", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      for (const step of node.progressionPath) {
        expect(text).toContain(step);
      }
    });

    it("renders ANATOMY NOTE when biomechanicalNotes exist", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain("ANATOMY NOTE");
      expect(text).toContain(node.exercise.biomechanicalNotes!);
    });

    it("renders FORM CHECKPOINTS section", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain("FORM CHECKPOINTS");
    });

    it("renders checkpoint instructions", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      const checkpoints = node.exercise.visualGuide!.checkpoints;
      for (const cp of checkpoints) {
        expect(text).toContain(cp.instruction);
      }
    });

    it("renders CLOSE button", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain("CLOSE");
    });

    it("calls onClose when close button is pressed", () => {
      const onClose = jest.fn();
      let tree: renderer.ReactTestRenderer;
      act(() => {
        tree = renderer.create(<SkillDetailSheet node={node} onClose={onClose} />);
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

  describe("with simple node", () => {
    const node = simpleNode || fullNode!;

    it("renders without crashing", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      expect(tree).toBeDefined();
    });

    it("still renders exercise name", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain(node.exercise.name.toUpperCase());
    });

    it("still renders basic stat labels", () => {
      const tree = renderInAct(<SkillDetailSheet node={node} onClose={() => {}} />);
      const text = getAllText(tree.root);
      expect(text).toContain("SETS");
      expect(text).toContain("REPS");
      expect(text).toContain("REST");
      expect(text).toContain("TEMPO");
    });
  });
});
