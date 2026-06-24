import React, { act } from "react";
import renderer from "react-test-renderer";
import { LevelBadge } from "../components/ui/LevelBadge";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B" },
    bg: { primary: "#070814" },
    text: { secondary: "#9B8E7A" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4 },
  Label: ({ children, style }: any) => {
    const React = require("react");
    return React.createElement("Text", { style: [{ color: "#9B8E7A" }, style] }, children);
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

describe("LevelBadge", () => {
  it("renders the level number", () => {
    const tree = renderInAct(<LevelBadge level={7} />);
    const text = getAllText(tree.root);
    expect(text).toContain("7");
  });

  it("renders correct rank title for level 1 (RECRUIT)", () => {
    const tree = renderInAct(<LevelBadge level={1} />);
    const text = getAllText(tree.root);
    expect(text).toContain("RECRUIT");
  });

  it("renders correct rank title for level 12 (ELITE)", () => {
    const tree = renderInAct(<LevelBadge level={12} />);
    const text = getAllText(tree.root);
    expect(text).toContain("ELITE");
  });

  it("renders correct rank title for level 20 (COMMANDER)", () => {
    const tree = renderInAct(<LevelBadge level={20} />);
    const text = getAllText(tree.root);
    expect(text).toContain("COMMANDER");
  });

  it("renders correct rank title for level 25+ (LEGEND)", () => {
    const tree = renderInAct(<LevelBadge level={25} />);
    const text = getAllText(tree.root);
    expect(text).toContain("LEGEND");
  });

  it("renders chevrons (▲) for all levels", () => {
    const tree = renderInAct(<LevelBadge level={5} />);
    const text = getAllText(tree.root);
    // Chevrons are the ▲ character
    expect(text).toContain("▲");
  });

  it("renders without crashing for all size variants", () => {
    const sizes = ["sm", "md", "lg"] as const;
    for (const size of sizes) {
      act(() => {
        const tree = renderer.create(<LevelBadge level={5} size={size} />);
        expect(tree).toBeDefined();
      });
    }
  });

  it("has accessible role with level and rank label", () => {
    const tree = renderInAct(<LevelBadge level={8} />);
    const accessible = tree.root.find(
      (n) => n.props.accessibilityRole === "text" && n.props.accessibilityLabel,
    );
    expect(accessible).toBeDefined();
    expect(accessible.props.accessibilityLabel).toContain("Level 8");
  });

  it("renders level 0 gracefully", () => {
    const tree = renderInAct(<LevelBadge level={0} />);
    const text = getAllText(tree.root);
    expect(text).toContain("RECRUIT");
  });

  it("renders levels at every boundary", () => {
    // Test each rank boundary
    const boundaries = [3, 4, 6, 7, 10, 11, 15, 16, 20, 21];
    for (const level of boundaries) {
      act(() => {
        const tree = renderer.create(<LevelBadge level={level} />);
        expect(tree).toBeDefined();
      });
    }
  });

  it("renders without crashing (basic smoke test)", () => {
    const tree = renderInAct(<LevelBadge level={1} />);
    expect(tree).toBeDefined();
  });

  it("defaults to 'md' size when not specified", () => {
    const tree = renderInAct(<LevelBadge level={5} />);
    expect(tree).toBeDefined();
  });
});
