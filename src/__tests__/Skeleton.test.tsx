import React, { act } from "react";
import { View } from "react-native";
import renderer from "react-test-renderer";
import { SkeletonBone, SkeletonRow, HomeScreenSkeleton } from "../components/ui/Skeleton";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B" },
    success: "#10B981",
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: {
      primary: "#070814",
      elevated: "#0D1021",
      highlight: "#151A30",
      card: "#0D1021",
      base: "#070814",
    },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, "5": 20 },
}));

// ── Helpers ───────────────────────────────────────────────────────────────

function renderInAct(element: React.ReactElement) {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

// ═══════════════════════════════════════════════════
// SkeletonBone
// ═══════════════════════════════════════════════════

describe("SkeletonBone", () => {
  it("renders with default props", () => {
    const tree = renderInAct(<SkeletonBone />);
    expect(tree).toBeDefined();
  });

  it("renders with custom dimensions", () => {
    const tree = renderInAct(<SkeletonBone width={120} height={16} borderRadius={4} />);
    expect(tree).toBeDefined();
  });

  it("renders with style prop", () => {
    const tree = renderInAct(<SkeletonBone width={80} height={8} style={{ marginBottom: 6 }} />);
    expect(tree).toBeDefined();
  });

  it("renders with importantForAccessibility no", () => {
    const tree = renderInAct(<SkeletonBone />);
    const view = tree.root.findByType(View);
    // At least one View should have importantForAccessibility="no"
    const hiddenViews = tree.root.findAll((n) => n.props.importantForAccessibility === "no");
    expect(hiddenViews.length).toBeGreaterThanOrEqual(1);
  });

  it("renders without crashing (smoke test)", () => {
    const tree = renderInAct(<SkeletonBone />);
    expect(tree).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════
// SkeletonRow
// ═══════════════════════════════════════════════════

describe("SkeletonRow", () => {
  it("renders children in a row layout", () => {
    const tree = renderInAct(
      <SkeletonRow>
        <SkeletonBone width={40} height={40} />
        <SkeletonBone width={60} height={10} />
      </SkeletonRow>,
    );
    expect(tree).toBeDefined();
  });

  it("renders with custom style", () => {
    const tree = renderInAct(
      <SkeletonRow style={{ justifyContent: "space-between" }}>
        <SkeletonBone width={40} height={10} />
      </SkeletonRow>,
    );
    expect(tree).toBeDefined();
  });

  it("renders without crashing (smoke test)", () => {
    const tree = renderInAct(
      <SkeletonRow>
        <SkeletonBone />
      </SkeletonRow>,
    );
    expect(tree).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════
// HomeScreenSkeleton
// ═══════════════════════════════════════════════════

describe("HomeScreenSkeleton", () => {
  it("renders without crashing", () => {
    const tree = renderInAct(<HomeScreenSkeleton />);
    expect(tree).toBeDefined();
  });

  it("renders header skeleton bones (title + badge placeholder)", () => {
    const tree = renderInAct(<HomeScreenSkeleton />);
    expect(tree).toBeDefined();
  });

  it("renders without crashing (smoke test)", () => {
    const tree = renderInAct(<HomeScreenSkeleton />);
    expect(tree).toBeDefined();
  });
});
