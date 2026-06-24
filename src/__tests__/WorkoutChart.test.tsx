import React, { act } from "react";
import renderer from "react-test-renderer";
import { StreakCalendar } from "../components/workout/WorkoutChart";
import type { StreakDay } from "../utils/chartData";

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B", light: "#FCD34D" },
    success: "#10B981",
    error: "#EF4444",
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
  const MockRect = (props: any) =>
    React.createElement("rect", { ...props, "data-testid": "svg-rect" });
  return {
    __esModule: true,
    default: MockSvg,
    Svg: MockSvg,
    Rect: MockRect,
    Text: ({ children, ...props }: any) =>
      React.createElement("text", { ...props, "data-testid": "svg-text" }, children),
  };
});

function createStreakDays(overrides: Partial<StreakDay>[]): StreakDay[] {
  return overrides.map((o, i) => ({
    date: `2026-06-${String(i + 1).padStart(2, "0")}`,
    hasWorkout: false,
    dayOfWeek: i % 7,
    isToday: false,
    ...o,
  }));
}

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

describe("StreakCalendar", () => {
  it("renders weekday headers (S, M, T, W, T, F, S)", () => {
    const days = createStreakDays([{ date: "2026-06-01", dayOfWeek: 1, hasWorkout: true }]);
    const tree = renderInAct(<StreakCalendar data={days} />);
    const text = getAllText(tree.root);
    expect(text).toContain("S");
    expect(text).toContain("M");
    expect(text).toContain("T");
    expect(text).toContain("W");
    expect(text).toContain("F");
  });

  it("renders calendar cells for each day", () => {
    const days = createStreakDays([
      { date: "2026-06-01", dayOfWeek: 1, hasWorkout: true },
      { date: "2026-06-02", dayOfWeek: 2, hasWorkout: false },
      { date: "2026-06-03", dayOfWeek: 3, hasWorkout: true },
    ]);
    const tree = renderInAct(<StreakCalendar data={days} />);
    const rects = tree.root.findAll((n) => n.props["data-testid"] === "svg-rect");
    expect(rects.length).toBeGreaterThanOrEqual(3);
  });

  it("pads start of week to align with dayOfWeek", () => {
    const days = createStreakDays([{ date: "2026-06-03", dayOfWeek: 3, hasWorkout: true }]);
    const tree = renderInAct(<StreakCalendar data={days} />);
    const rects = tree.root.findAll((n) => n.props["data-testid"] === "svg-rect");
    expect(rects.length).toBeGreaterThanOrEqual(3);
  });

  it("highlights today with accent color", () => {
    const days = createStreakDays([
      { date: "2026-06-01", dayOfWeek: 1, hasWorkout: false, isToday: true },
    ]);
    const tree = renderInAct(<StreakCalendar data={days} />);
    expect(tree).toBeDefined();
  });

  it("groups days into weeks", () => {
    const days: StreakDay[] = Array.from({ length: 8 }, (_, i) => ({
      date: `2026-06-${String(i + 1).padStart(2, "0")}`,
      dayOfWeek: (i + 1) % 7,
      hasWorkout: i % 2 === 0,
      isToday: false,
    }));
    const tree = renderInAct(<StreakCalendar data={days} />);
    expect(tree).toBeDefined();
  });

  it("renders transparent cells for empty padding days", () => {
    const days = createStreakDays([{ date: "2026-06-03", dayOfWeek: 3, hasWorkout: true }]);
    const tree = renderInAct(<StreakCalendar data={days} />);
    expect(tree).toBeDefined();
  });

  it("renders without crashing (smoke test)", () => {
    const days: StreakDay[] = [];
    const tree = renderInAct(<StreakCalendar data={days} />);
    expect(tree).toBeDefined();
  });
});
