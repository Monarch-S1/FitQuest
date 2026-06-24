import React, { act } from "react";
import renderer from "react-test-renderer";
import { RecoveryStatus } from "../components/home/RecoveryStatus";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    success: "#10B981",
    accent: { DEFAULT: "#F59E0B" },
    error: "#EF4444",
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { card: "#0D1021", highlight: "#151A30", primary: "#070814" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  Label: ({ children, variant, style }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, { style: [{ color: "#9B8E7A" }, style] }, children);
  },
  Body: ({ children, variant, size, style }: any) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, { style }, children);
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
// RecoveryStatus
// ═══════════════════════════════════════════════════

describe("RecoveryStatus", () => {
  it("shows READY label when status is optimal", () => {
    const tree = renderInAct(<RecoveryStatus status="optimal" />);
    const text = getAllText(tree.root);
    expect(text).toContain("READY");
    expect(text).toContain("You're recovered and ready to train.");
  });

  it("shows MODERATE label when status is moderate", () => {
    const tree = renderInAct(<RecoveryStatus status="moderate" />);
    const text = getAllText(tree.root);
    expect(text).toContain("MODERATE");
    expect(text).toContain("Light training recommended.");
  });

  it("shows CAUTION label when status is caution", () => {
    const tree = renderInAct(<RecoveryStatus status="caution" />);
    const text = getAllText(tree.root);
    expect(text).toContain("CAUTION");
    expect(text).toContain("Consider rest day or light mobility.");
  });

  it("shows days since last workout when provided", () => {
    const tree = renderInAct(<RecoveryStatus status="optimal" daysSinceLastWorkout={2} />);
    const text = getAllText(tree.root);
    expect(text).toContain("2d since last workout");
  });

  it("does not show days since when not provided", () => {
    const tree = renderInAct(<RecoveryStatus status="optimal" />);
    const text = getAllText(tree.root);
    expect(text).not.toContain("d since last workout");
  });

  it("renders without crashing for all status values", () => {
    const statuses = ["optimal", "moderate", "caution"] as const;
    for (const s of statuses) {
      act(() => {
        const tree = renderer.create(<RecoveryStatus status={s} />);
        expect(tree).toBeDefined();
      });
    }
  });

  it("renders without crashing (basic smoke test)", () => {
    const tree = renderInAct(<RecoveryStatus status="optimal" />);
    expect(tree).toBeDefined();
  });
});
