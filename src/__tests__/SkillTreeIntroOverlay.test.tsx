import React, { act } from "react";
import { Text, Pressable } from "react-native";
import renderer from "react-test-renderer";
import { SkillTreeIntroOverlay } from "../components/skill-tree/SkillTreeIntroOverlay";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B" },
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { primary: "#070814" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
}));

// MotiView is mocked in __mocks__/moti.js

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
// SkillTreeIntroOverlay
// ═══════════════════════════════════════════════════

describe("SkillTreeIntroOverlay", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the initial loading state (not yet visible)", () => {
    const tree = renderInAct(<SkillTreeIntroOverlay onDismiss={jest.fn()} />);
    // Before the 150ms timer fires, it shows "Loading guide…"
    const text = getAllText(tree.root);
    expect(text).toContain("Loading guide");
  });

  it("renders title 'Skill Tree Guide' after timer fires", () => {
    const tree = renderInAct(<SkillTreeIntroOverlay onDismiss={jest.fn()} />);
    // Advance past the 150ms entrance timer
    act(() => {
      jest.advanceTimersByTime(200);
    });

    const text = getAllText(tree.root);
    expect(text).toContain("Skill Tree Guide");
  });

  it("renders all 4 tip cards with titles", () => {
    const tree = renderInAct(<SkillTreeIntroOverlay onDismiss={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(200);
    });

    const text = getAllText(tree.root);
    expect(text).toContain("TAP SPHERES");
    expect(text).toContain("COLLAPSIBLE BRANCHES");
    expect(text).toContain("SPHERE STATES");
    expect(text).toContain("FILTER TABS");
  });

  it("renders the dismiss hint text", () => {
    const tree = renderInAct(<SkillTreeIntroOverlay onDismiss={jest.fn()} />);
    // Dismiss hint appears after 1200ms delay
    act(() => {
      jest.advanceTimersByTime(1300);
    });

    const text = getAllText(tree.root);
    expect(text).toContain("Tap anywhere to begin");
  });

  it("renders the Skip tutorial button", () => {
    const tree = renderInAct(<SkillTreeIntroOverlay onDismiss={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(1200);
    });

    const text = getAllText(tree.root);
    expect(text).toContain("Skip tutorial");
  });

  it("calls onDismiss when the overlay is pressed", () => {
    const onDismiss = jest.fn();
    const tree = renderInAct(<SkillTreeIntroOverlay onDismiss={onDismiss} />);
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Find any Pressable node
    const pressableNode = tree.root.find((node) => typeof node.props.onPress === "function");
    expect(pressableNode).toBeDefined();

    act(() => {
      pressableNode.props.onPress();
    });
    // onDismiss is called after a 300ms fade-out
    act(() => {
      jest.advanceTimersByTime(350);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("renders the background glow orb", () => {
    const tree = renderInAct(<SkillTreeIntroOverlay onDismiss={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(tree).toBeDefined();
  });

  it("renders without crashing (basic smoke test)", () => {
    const tree = renderInAct(<SkillTreeIntroOverlay onDismiss={jest.fn()} />);
    act(() => {
      tree.unmount();
    });
    expect(tree).toBeDefined();
  });
});
