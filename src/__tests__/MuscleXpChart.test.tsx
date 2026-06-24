import React, { act } from "react";
import renderer from "react-test-renderer";
import { MuscleXpChart } from "../components/workout/MuscleXpChart";
import type { MuscleXpHistory } from "../utils/muscleXp";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B" },
    success: "#10B981",
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { primary: "#070814", elevated: "#0D1021", highlight: "#151A30" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  typography: {
    label: { fontSize: 10, fontFamily: "Inter-SemiBold", letterSpacing: 2 },
    bodySmall: { fontSize: 11, fontFamily: "Inter-Regular" },
  },
  fonts: {
    body: { regular: "Inter-Regular", semiBold: "Inter-SemiBold" },
  },
}));

jest.mock("react-native-svg", () => {
  const React = require("react");
  const MockSvg = ({ children, ...props }: any) =>
    React.createElement("view", { ...props, "data-testid": "svg" }, children);
  const MockPath = ({ children, ...props }: any) =>
    React.createElement("view", { ...props, "data-testid": "svg-path" }, children);
  const MockCircle = (props: any) =>
    React.createElement("circle", { ...props, "data-testid": "svg-circle" });
  const MockLine = (props: any) =>
    React.createElement("line", { ...props, "data-testid": "svg-line" });
  const MockG = ({ children, ...props }: any) =>
    React.createElement("g", { ...props, "data-testid": "svg-g" }, children);
  const MockRect = (props: any) =>
    React.createElement("rect", { ...props, "data-testid": "svg-rect" });
  return {
    __esModule: true,
    default: MockSvg,
    Svg: MockSvg,
    Path: MockPath,
    Polyline: MockPath,
    Circle: MockCircle,
    Line: MockLine,
    G: MockG,
    Rect: MockRect,
    Text: ({ children, ...props }: any) =>
      React.createElement("text", { ...props, "data-testid": "svg-text" }, children),
    Defs: ({ children }: any) =>
      React.createElement("view", { "data-testid": "svg-defs" }, children),
    LinearGradient: () => null,
    Stop: () => null,
  };
});

// ── Test Fixtures ─────────────────────────────────────────────────────────

function createHistory(
  points: { totalXp: number; level: number; date: string }[],
): MuscleXpHistory {
  return {
    zone: "chest",
    name: "Chest",
    points: points.map((p) => ({
      sessionId: `s-${p.date}`,
      date: p.date,
      xpGained: 0,
      ...p,
    })),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function renderInAct(element: React.ReactElement) {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
}

function extractText(node: renderer.ReactTestRendererNode): string {
  if (typeof node === "string") return node;
  if (node.children) return node.children.map(extractText).join("");
  return "";
}

function getAllText(instance: renderer.ReactTestInstance): string {
  return extractText(instance);
}

// ═══════════════════════════════════════════════════
// MuscleXpChart
// ═══════════════════════════════════════════════════

describe("MuscleXpChart", () => {
  it("shows empty state when less than 2 data points", () => {
    const history = createHistory([{ totalXp: 50, level: 1, date: "2026-06-01" }]);
    const tree = renderInAct(<MuscleXpChart history={history} accent="#F59E0B" />);
    const text = getAllText(tree.root);
    expect(text).toContain("Complete more sessions to see XP trend");
  });

  it("shows XP PROGRESSION header with data", () => {
    const history = createHistory([
      { totalXp: 50, level: 1, date: "2026-06-01" },
      { totalXp: 100, level: 2, date: "2026-06-03" },
    ]);
    const tree = renderInAct(<MuscleXpChart history={history} accent="#F59E0B" />);
    const text = getAllText(tree.root);
    expect(text).toContain("XP PROGRESSION");
    expect(text).toContain("2 SESSIONS");
  });

  it("renders SVG element when 2+ data points", () => {
    const history = createHistory([
      { totalXp: 50, level: 1, date: "2026-06-01" },
      { totalXp: 100, level: 2, date: "2026-06-03" },
    ]);
    const tree = renderInAct(<MuscleXpChart history={history} accent="#F59E0B" />);
    const svg = tree.root.find((n) => n.props["data-testid"] === "svg");
    expect(svg).toBeDefined();
  });

  it("renders grid lines as SVG Line elements", () => {
    const history = createHistory([
      { totalXp: 50, level: 1, date: "2026-06-01" },
      { totalXp: 100, level: 2, date: "2026-06-03" },
    ]);
    const tree = renderInAct(<MuscleXpChart history={history} accent="#F59E0B" />);
    const lines = tree.root.findAll((n) => n.props["data-testid"] === "svg-line");
    // Y-axis has 4 grid lines (yTicks=3 + 1)
    expect(lines.length).toBeGreaterThanOrEqual(3);
  });

  it("renders data dots as Circle elements", () => {
    const history = createHistory([
      { totalXp: 50, level: 1, date: "2026-06-01" },
      { totalXp: 100, level: 2, date: "2026-06-03" },
    ]);
    const tree = renderInAct(<MuscleXpChart history={history} accent="#F59E0B" />);
    const circles = tree.root.findAll((n) => n.props["data-testid"] === "svg-circle");
    // Each data point has 2 circles (outer + inner)
    expect(circles.length).toBe(4);
  });

  it("renders a data line (Polyline)", () => {
    const history = createHistory([
      { totalXp: 50, level: 1, date: "2026-06-01" },
      { totalXp: 100, level: 2, date: "2026-06-03" },
    ]);
    const tree = renderInAct(<MuscleXpChart history={history} accent="#F59E0B" />);
    const paths = tree.root.findAll((n) => n.props["data-testid"] === "svg-path");
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it("renders x-axis date labels", () => {
    const history = createHistory([
      { totalXp: 50, level: 1, date: "2026-06-01" },
      { totalXp: 100, level: 2, date: "2026-06-03" },
    ]);
    const tree = renderInAct(<MuscleXpChart history={history} accent="#F59E0B" />);
    // X-axis labels are rendered for first and last points
    // At minimum, there should be some SVG text elements
    const texts = tree.root.findAll((n) => n.props["data-testid"] === "svg-text");
    expect(texts.length).toBeGreaterThanOrEqual(1);
  });

  it("shows level change annotation when level increases", () => {
    const history = createHistory([
      { totalXp: 50, level: 1, date: "2026-06-01" },
      { totalXp: 300, level: 3, date: "2026-06-03" },
    ]);
    const tree = renderInAct(<MuscleXpChart history={history} accent="#F59E0B" />);
    const text = getAllText(tree.root);
    expect(text).toContain("LV.3");
  });

  it("does not show level annotation when level stays the same", () => {
    const history = createHistory([
      { totalXp: 50, level: 1, date: "2026-06-01" },
      { totalXp: 80, level: 1, date: "2026-06-03" },
    ]);
    const tree = renderInAct(<MuscleXpChart history={history} accent="#F59E0B" />);
    const text = getAllText(tree.root);
    expect(text).not.toContain("LV.");
  });

  it("handles multiple data points with level ups at different points", () => {
    const history = createHistory([
      { totalXp: 0, level: 1, date: "2026-06-01" },
      { totalXp: 50, level: 1, date: "2026-06-03" },
      { totalXp: 120, level: 2, date: "2026-06-05" },
      { totalXp: 250, level: 3, date: "2026-06-07" },
      { totalXp: 400, level: 4, date: "2026-06-09" },
    ]);
    const tree = renderInAct(<MuscleXpChart history={history} accent="#F59E0B" />);
    const text = getAllText(tree.root);
    // Each level up should be annotated (at indices 2, 3, 4 — points 3, 4, 5)
    expect(text).toContain("LV.2");
    expect(text).toContain("LV.3");
    expect(text).toContain("LV.4");
    // Only 3 level-ups, not the starting level
    const lvCount = (text.match(/LV\./g) || []).length;
    expect(lvCount).toBe(3);
  });

  it("renders with custom accent color", () => {
    const history = createHistory([
      { totalXp: 50, level: 1, date: "2026-06-01" },
      { totalXp: 100, level: 2, date: "2026-06-03" },
    ]);
    const tree = renderInAct(<MuscleXpChart history={history} accent="#10B981" />);
    expect(tree).toBeDefined();
  });

  it("renders without crashing (basic smoke test)", () => {
    const history = createHistory([
      { totalXp: 50, level: 1, date: "2026-06-01" },
      { totalXp: 100, level: 2, date: "2026-06-03" },
    ]);
    const tree = renderInAct(<MuscleXpChart history={history} accent="#F59E0B" />);
    expect(tree).toBeDefined();
  });
});
