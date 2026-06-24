import React, { act } from "react";
import { TouchableOpacity } from "react-native";
import renderer from "react-test-renderer";
import { ExerciseDemo } from "../components/workout/ExerciseDemo";
import type { Exercise } from "../data/exercises";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B", light: "#FCD34D" },
    success: "#10B981",
    error: "#EF4444",
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { primary: "#070814", surface: "#0A0D1A", highlight: "#151A30", elevated: "#0D1021" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  typography: {
    label: { fontSize: 10, fontFamily: "Inter-SemiBold", letterSpacing: 2 },
    bodySmall: { fontSize: 11, fontFamily: "Inter-Regular" },
  },
}));

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn(),
}));

jest.mock("../data/exerciseVideos", () => ({
  exerciseVideoIds: { "test-ex-1": "dQw4w9WgXcQ" },
}));

jest.mock("react-native-webview", () => ({
  WebView: () => {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, { testID: "webview" });
  },
}));

jest.mock("../components/ui/Dialog", () => ({
  useDialog: () => ({
    alert: jest.fn(),
    Dialog: ({ children }: any) => {
      const React = require("react");
      const { View } = require("react-native");
      return React.createElement(View, { testID: "dialog" }, children);
    },
  }),
}));

jest.mock("../services/youtubeSearch", () => ({
  searchExerciseVideo: jest.fn().mockResolvedValue({
    videoId: null,
    title: null,
    channel: null,
    fromCache: false,
  }),
  hasCachedSearchResult: jest.fn().mockResolvedValue(false),
}));

// ── Test Fixtures ─────────────────────────────────────────────────────────

function createExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "test-ex-1",
    name: "Standard Push-up",
    targetMuscles: ["chest", "shoulders", "triceps"],
    category: "horizontal_push",
    description: "A classic bodyweight push-up targeting the chest, shoulders, and triceps.",
    defaultSets: 3,
    repRange: [8, 15],
    tempo: "2-1-2-0",
    restInterval: 60,
    progressionPathway: "Wall → Incline → Standard → Decline → One-Arm",
    ...overrides,
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
// ExerciseDemo
// ═══════════════════════════════════════════════════

describe("ExerciseDemo", () => {
  it("renders VIDEO and GUIDE tab buttons", () => {
    const exercise = createExercise();
    const tree = renderInAct(<ExerciseDemo exercise={exercise} />);
    const text = getAllText(tree.root);
    expect(text).toContain("▶ VIDEO");
    expect(text).toContain("≡ GUIDE");
  });

  it("shows the VIDEO tab as active by default with curated video prompt", () => {
    const exercise = createExercise();
    const tree = renderInAct(<ExerciseDemo exercise={exercise} />);
    const text = getAllText(tree.root);
    // Default active tab shows the VIDEO area with curated video CTA
    expect(text).toContain("WATCH FORM VIDEO");
  });

  it("switches to GUIDE tab when tapped", () => {
    const exercise = createExercise();
    const tree = renderInAct(<ExerciseDemo exercise={exercise} />);

    // Find GUIDE tab button and press it
    const tabButtons = tree.root.findAllByType(TouchableOpacity);
    // Tab buttons are the first two TouchableOpacity elements
    const guideTab = tabButtons.find((btn) => {
      const text = getAllText(btn);
      return text.includes("GUIDE");
    });

    act(() => {
      guideTab?.props.onPress();
    });

    const text = getAllText(tree.root);
    // GUIDE tab should show form checkpoints
    expect(text).toContain("Core stabilization");
    expect(text).toContain("Tempo compliance");
    expect(text).toContain("Joint safety");
  });

  it("renders form checkpoints with instructions and focus points in GUIDE tab", () => {
    const exercise = createExercise();
    const tree = renderInAct(<ExerciseDemo exercise={exercise} />);

    const tabButtons = tree.root.findAllByType(TouchableOpacity);
    const guideTab = tabButtons.find((btn) => getAllText(btn).includes("GUIDE"));
    act(() => {
      guideTab?.props.onPress();
    });

    const text = getAllText(tree.root);
    expect(text).toContain("Assume standard posture");
    expect(text).toContain("Execute the movement smoothly");
    expect(text).toContain("Perform with perfect form");
  });

  it("renders biomechanical notes when present in GUIDE tab", () => {
    const exercise = createExercise({
      biomechanicalNotes: "Focus on scapular retraction during the descent phase.",
    });
    const tree = renderInAct(<ExerciseDemo exercise={exercise} />);

    const tabButtons = tree.root.findAllByType(TouchableOpacity);
    const guideTab = tabButtons.find((btn) => getAllText(btn).includes("GUIDE"));
    act(() => {
      guideTab?.props.onPress();
    });

    const text = getAllText(tree.root);
    expect(text).toContain("BIOMECHANICS");
    expect(text).toContain("scapular retraction");
  });

  it("does not render biomechanical notes when absent", () => {
    const exercise = createExercise();
    const tree = renderInAct(<ExerciseDemo exercise={exercise} />);

    const tabButtons = tree.root.findAllByType(TouchableOpacity);
    const guideTab = tabButtons.find((btn) => getAllText(btn).includes("GUIDE"));
    act(() => {
      guideTab?.props.onPress();
    });

    const text = getAllText(tree.root);
    expect(text).not.toContain("BIOMECHANICS");
  });

  it("renders SKILL PATH section in GUIDE tab", () => {
    const exercise = createExercise();
    const tree = renderInAct(<ExerciseDemo exercise={exercise} />);

    const tabButtons = tree.root.findAllByType(TouchableOpacity);
    const guideTab = tabButtons.find((btn) => getAllText(btn).includes("GUIDE"));
    act(() => {
      guideTab?.props.onPress();
    });

    const text = getAllText(tree.root);
    expect(text).toContain("SKILL PATH");
    expect(text).toContain("Wall → Incline → Standard → Decline → One-Arm");
  });

  it("shows FINDING VIDEO... for exercises without video IDs (initial state)", () => {
    const exercise = createExercise({ id: "no-video-id" });
    const tree = renderInAct(<ExerciseDemo exercise={exercise} />);
    // Initial state shows FINDING VIDEO... before search promise resolves
    const text = getAllText(tree.root);
    expect(text).toContain("FINDING VIDEO...");
  });

  it("shows SEARCH ON YOUTUBE fallback when search API fails", async () => {
    const exercise = createExercise({ id: "no-video-id" });
    const tree = renderInAct(<ExerciseDemo exercise={exercise} />);
    // Wait for the async search promise to resolve and state to update
    await act(async () => {
      await Promise.resolve();
    });
    const text = getAllText(tree.root);
    expect(text).toContain("SEARCH ON YOUTUBE");
  });

  it("renders with visual guide checkpoints in GUIDE tab", () => {
    const exercise = createExercise({
      visualGuide: {
        checkpoints: [
          {
            phase: "SETUP",
            instruction: "Place hands shoulder-width apart",
            focusPoint: "Hand placement",
          },
          { phase: "EXECUTION", instruction: "Lower chest to ground", focusPoint: "Depth" },
        ],
        visuals: [],
      },
    });
    const tree = renderInAct(<ExerciseDemo exercise={exercise} />);

    const tabButtons = tree.root.findAllByType(TouchableOpacity);
    const guideTab = tabButtons.find((btn) => getAllText(btn).includes("GUIDE"));
    act(() => {
      guideTab?.props.onPress();
    });

    const text = getAllText(tree.root);
    expect(text).toContain("Hand placement");
    expect(text).toContain("Depth");
  });

  it("renders without crashing (basic smoke test)", () => {
    const exercise = createExercise();
    const tree = renderInAct(<ExerciseDemo exercise={exercise} />);
    expect(tree).toBeDefined();
  });
});
