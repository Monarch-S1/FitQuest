import React, { act } from "react";
import { Text } from "react-native";
import renderer from "react-test-renderer";
import { Card } from "../components/ui/Card";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B" },
    success: "#10B981",
    error: "#EF4444",
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { card: "#0D1021", highlight: "#151A30", primary: "#070814" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radii: { lg: 8 },
  getShadow: () => ({
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  }),
  glassEffect: {},
  glassEffectDeep: {},
  glassEffectLight: {},
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

describe("Card", () => {
  it("renders children", () => {
    const tree = renderInAct(
      <Card>
        <Text testID="child">Hello Card</Text>
      </Card>,
    );
    const text = getAllText(tree.root);
    expect(text).toContain("Hello Card");
  });

  it("renders title when provided", () => {
    const tree = renderInAct(<Card title="Test Title">Content</Card>);
    const text = getAllText(tree.root);
    expect(text).toContain("TEST TITLE");
  });

  it("does not render title container when no title provided", () => {
    const tree = renderInAct(<Card>Content</Card>);
    const text = getAllText(tree.root);
    expect(text).toBe("Content");
  });

  it("renders titleRight when provided", () => {
    const tree = renderInAct(
      <Card title="Title" titleRight={<Text>RIGHT</Text>}>
        Content
      </Card>,
    );
    const text = getAllText(tree.root);
    expect(text).toContain("RIGHT");
  });

  it("renders without crashing for all accent variants", () => {
    const accents = ["amber", "green", "red", "none"] as const;
    for (const accent of accents) {
      act(() => {
        const tree = renderer.create(
          <Card title="Title" accent={accent}>
            Content
          </Card>,
        );
        expect(tree).toBeDefined();
      });
    }
  });

  it("renders without crashing for all variant types", () => {
    const variants = ["default", "highlight"] as const;
    for (const variant of variants) {
      act(() => {
        const tree = renderer.create(<Card variant={variant}>Content</Card>);
        expect(tree).toBeDefined();
      });
    }
  });

  it("applies custom style prop", () => {
    const tree = renderInAct(<Card style={{ marginTop: 20 }}>Content</Card>);
    expect(tree).toBeDefined();
  });

  it("renders with leftAccent", () => {
    const tree = renderInAct(
      <Card leftAccent accent="amber">
        Content
      </Card>,
    );
    expect(tree).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════
// Card.Row
// ═══════════════════════════════════════════════════

describe("Card.Row", () => {
  it("renders children in a row layout", () => {
    const tree = renderInAct(
      <Card.Row>
        <Text>A</Text>
        <Text>B</Text>
      </Card.Row>,
    );
    const text = getAllText(tree.root);
    expect(text).toContain("AB");
  });

  it("renders empty row", () => {
    const tree = renderInAct(<Card.Row>{null}</Card.Row>);
    expect(tree).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════
// Card.Stat
// ═══════════════════════════════════════════════════

describe("Card.Stat", () => {
  it("renders label and value", () => {
    const tree = renderInAct(<Card.Stat label="XP" value={150} />);
    const text = getAllText(tree.root);
    expect(text).toContain("XP");
    expect(text).toContain("150");
  });

  it("renders string values", () => {
    const tree = renderInAct(<Card.Stat label="RANK" value="ELITE" />);
    const text = getAllText(tree.root);
    expect(text).toContain("RANK");
    expect(text).toContain("ELITE");
  });

  it("renders without crashing for all accent variants", () => {
    const accents = ["amber", "green", "red", "none"] as const;
    for (const accent of accents) {
      act(() => {
        const tree = renderer.create(<Card.Stat label="TEST" value={0} accent={accent} />);
        expect(tree).toBeDefined();
      });
    }
  });
});

// ═══════════════════════════════════════════════════
// Card.Separator
// ═══════════════════════════════════════════════════

describe("Card.Separator", () => {
  it("renders a separator line", () => {
    const tree = renderInAct(<Card.Separator />);
    expect(tree).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════
// Card — Integration: Combined Layout
// ═══════════════════════════════════════════════════

describe("Card — integration", () => {
  it("renders a complex stat layout", () => {
    const tree = renderInAct(
      <Card title="STATS" accent="amber">
        <Card.Row>
          <Card.Stat label="XP" value={500} />
          <Card.Stat label="LEVEL" value={7} />
          <Card.Stat label="STREAK" value={14} accent="green" />
        </Card.Row>
        <Card.Separator />
        <Card.Stat label="TOTAL" value="ELITE" accent="none" />
      </Card>,
    );
    const text = getAllText(tree.root);
    expect(text).toContain("STATS");
    expect(text).toContain("XP");
    expect(text).toContain("500");
    expect(text).toContain("LEVEL");
    expect(text).toContain("7");
    expect(text).toContain("STREAK");
    expect(text).toContain("14");
    expect(text).toContain("TOTAL");
    expect(text).toContain("ELITE");
  });
});
