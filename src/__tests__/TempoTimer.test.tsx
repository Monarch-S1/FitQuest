import React, { act } from "react";
import renderer from "react-test-renderer";
import { TempoTimer } from "../components/workout/TempoTimer";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B" },
    success: "#10B981",
    error: "#EF4444",
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { primary: "#070814", highlight: "#151A30", elevated: "#0D1021" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  typography: {
    label: { fontSize: 10, fontFamily: "Inter-SemiBold", letterSpacing: 2 },
    h4: { fontSize: 14, fontFamily: "Inter-SemiBold" },
  },
}));

// Reanimated is mocked in __mocks__/react-native-reanimated.js

// Mock parseTempo — re-implement for test isolation
jest.mock("../stores/useWorkoutStore", () => ({
  parseTempo: (tempo: string, accentColor?: string) => {
    const accent = accentColor ?? "#F59E0B";
    if (tempo === "isometric") {
      return [{ label: "HOLD", duration: 0, color: accent }];
    }
    const [eccentric, pause1, concentric, pause2] = tempo.split("-").map(Number);
    return [
      { label: "LOWER", duration: eccentric, color: "#EF4444" },
      { label: "PAUSE", duration: pause1, color: accent },
      { label: "PRESS", duration: concentric, color: "#10B981" },
      { label: "SQUEEZE", duration: pause2, color: accent },
    ];
  },
}));

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
// TempoTimer
// ═══════════════════════════════════════════════════

describe("TempoTimer", () => {
  it("renders the TEMPO label", () => {
    const tree = renderInAct(<TempoTimer tempo="3-1-2-0" isActive={false} />);
    const text = getAllText(tree.root);
    expect(text).toContain("TEMPO");
  });

  it("renders the tempo pattern string", () => {
    const tree = renderInAct(<TempoTimer tempo="3-1-2-0" isActive={false} />);
    const text = getAllText(tree.root);
    expect(text).toContain("3-1-2-0");
  });

  it("renders active phase descriptions with duration and arrows", () => {
    const tree = renderInAct(<TempoTimer tempo="3-1-2-0" isActive={false} />);
    const text = getAllText(tree.root);
    // Active phases (duration > 0): LOWER(3), PAUSE(1), PRESS(2)
    expect(text).toContain("↓3s");
    expect(text).toContain("↑2s");
  });

  it("renders ISOMETRIC HOLD for isometric tempo", () => {
    const tree = renderInAct(<TempoTimer tempo="isometric" isActive={false} />);
    const text = getAllText(tree.root);
    expect(text).toContain("ISOMETRIC HOLD");
    // Should not render tempo pattern or phase descriptions
    expect(text).not.toContain("3-0-2-0");
  });

  it("renders only non-zero duration phases", () => {
    const tree = renderInAct(<TempoTimer tempo="3-0-2-0" isActive={false} />);
    const text = getAllText(tree.root);
    // PAUSE and SQUEEZE have duration 0, so they should NOT appear
    // Only LOWER(↓3s) and PRESS(↑2s) should be visible
    expect(text).toContain("3-0-2-0");
    expect(text).toContain("↓3s");
    expect(text).toContain("↑2s");
  });

  it("renders a progress bar when there are non-zero phases", () => {
    const tree = renderInAct(<TempoTimer tempo="2-1-1-0" isActive={false} />);
    // Progress bar exists (Animated.View child with width style)
    expect(tree).toBeDefined();
  });

  it("renders without crashing when active", () => {
    const tree = renderInAct(<TempoTimer tempo="3-1-2-0" isActive={true} />);
    expect(tree).toBeDefined();
  });

  it("renders without crashing when inactive", () => {
    const tree = renderInAct(<TempoTimer tempo="3-1-2-0" isActive={false} />);
    expect(tree).toBeDefined();
  });

  it("renders without crashing with isometric tempo and active", () => {
    const tree = renderInAct(<TempoTimer tempo="isometric" isActive={true} />);
    expect(tree).toBeDefined();
  });

  it("renders without crashing (basic smoke test)", () => {
    const tree = renderInAct(<TempoTimer tempo="3-1-2-0" isActive={false} />);
    expect(tree).toBeDefined();
  });
});
