import React, { act } from "react";
import { TouchableOpacity } from "react-native";
import renderer from "react-test-renderer";
import { VoiceCoachToggle } from "../components/workout/VoiceCoachToggle";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B" },
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { primary: "#070814", elevated: "#0D1021", highlight: "#151A30" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  typography: {
    label: { fontSize: 10, fontFamily: "Inter-SemiBold", letterSpacing: 2 },
  },
}));

jest.mock("../services/voiceCoach", () => ({
  voiceCoach: { setEnabled: jest.fn() },
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
// VoiceCoachToggle
// ═══════════════════════════════════════════════════

describe("VoiceCoachToggle", () => {
  it("shows 🔊 emoji when enabled (default)", () => {
    const tree = renderInAct(<VoiceCoachToggle />);
    const text = getAllText(tree.root);
    expect(text).toContain("🔊");
    expect(text).not.toContain("🔇");
  });

  it("shows VOICE label when enabled", () => {
    const tree = renderInAct(<VoiceCoachToggle />);
    const text = getAllText(tree.root);
    expect(text).toContain("VOICE");
  });

  it("shows 🔇 emoji when disabled via initialEnabled", () => {
    const tree = renderInAct(<VoiceCoachToggle initialEnabled={false} />);
    const text = getAllText(tree.root);
    expect(text).toContain("🔇");
    expect(text).not.toContain("🔊");
  });

  it("toggles state when pressed", () => {
    const tree = renderInAct(<VoiceCoachToggle />);
    // Initially enabled (🔊)
    let text = getAllText(tree.root);
    expect(text).toContain("🔊");

    // Press to disable
    const touchable = tree.root.findByType(TouchableOpacity);
    act(() => {
      touchable.props.onPress();
    });

    text = getAllText(tree.root);
    expect(text).toContain("🔇");
  });

  it("calls onToggle with new state when pressed", () => {
    const onToggle = jest.fn();
    const tree = renderInAct(<VoiceCoachToggle onToggle={onToggle} />);
    const touchable = tree.root.findByType(TouchableOpacity);

    act(() => {
      touchable.props.onPress();
    });
    expect(onToggle).toHaveBeenCalledWith(false);

    act(() => {
      touchable.props.onPress();
    });
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("calls voiceCoach.setEnabled when toggled", () => {
    const { voiceCoach } = require("../services/voiceCoach");
    const tree = renderInAct(<VoiceCoachToggle />);
    const touchable = tree.root.findByType(TouchableOpacity);

    act(() => {
      touchable.props.onPress();
    });
    expect(voiceCoach.setEnabled).toHaveBeenCalledWith(false);
  });

  it("has accessibilityRole switch", () => {
    const tree = renderInAct(<VoiceCoachToggle />);
    const touchable = tree.root.findByType(TouchableOpacity);
    expect(touchable.props.accessibilityRole).toBe("switch");
  });

  it("has accessibilityState checked when enabled", () => {
    const tree = renderInAct(<VoiceCoachToggle initialEnabled={true} />);
    const touchable = tree.root.findByType(TouchableOpacity);
    expect(touchable.props.accessibilityState.checked).toBe(true);
  });

  it("has accessibilityState unchecked when disabled", () => {
    const tree = renderInAct(<VoiceCoachToggle initialEnabled={false} />);
    const touchable = tree.root.findByType(TouchableOpacity);
    expect(touchable.props.accessibilityState.checked).toBe(false);
  });

  it("renders without crashing (basic smoke test)", () => {
    const tree = renderInAct(<VoiceCoachToggle />);
    expect(tree).toBeDefined();
  });
});
