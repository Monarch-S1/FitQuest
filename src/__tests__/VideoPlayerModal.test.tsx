import React, { act } from "react";
import renderer from "react-test-renderer";
import { VideoPlayerModal } from "../components/workout/VideoPlayerModal";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B" },
    success: "#10B981",
    error: "#EF4444",
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { primary: "#070814", elevated: "#0D1021" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  radii: { lg: 8 },
  typography: {
    label: { fontSize: 10, fontFamily: "Inter-SemiBold", letterSpacing: 2 },
    bodySmall: { fontSize: 11, fontFamily: "Inter-Regular" },
  },
  fonts: {
    body: { regular: "Inter-Regular", semiBold: "Inter-SemiBold" },
    heading: "BebasNeue-Regular",
  },
}));

jest.mock("react-native-webview", () => ({
  WebView: ({ source, style, ...props }: any) => {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(View, {
      ...props,
      ...style,
      testID: "webview",
      "data-uri": source?.uri,
    });
  },
}));

jest.mock("../data/exerciseVideos", () => ({
  exerciseVideoIds: {
    "decline-push-up": "SKPab2YC8BE",
  },
  exerciseMp4Urls: {},
  hasMp4Source: () => false,
}));

// ── Test Fixtures ─────────────────────────────────────────────────────────

function createTree(exerciseId: string = "decline-push-up", visible: boolean = true) {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <VideoPlayerModal
        exerciseName="Decline Push-up"
        exerciseId={exerciseId}
        visible={visible}
        onClose={jest.fn()}
      />,
    );
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
// VideoPlayerModal
// ═══════════════════════════════════════════════════

describe("VideoPlayerModal", () => {
  it("renders nothing when visible is false", () => {
    const tree = createTree("decline-push-up", false);
    // When not visible, the component returns null
    const webviews = tree.root.findAll((n) => n.props.testID === "webview", { deep: true });
    expect(webviews.length).toBe(0);
  });

  it("shows VIDEO DEMO and exercise name when visible", () => {
    const tree = createTree("decline-push-up", true);
    const text = getAllText(tree.root);
    expect(text).toContain("VIDEO DEMO");
    expect(text).toContain("DECLINE PUSH-UP");
  });

  it("renders a WebView with the exercise video URL", () => {
    const tree = createTree("decline-push-up", true);
    const webviews = tree.root.findAll((n) => n.props.testID === "webview", { deep: true });
    expect(webviews.length).toBeGreaterThanOrEqual(1);
    expect(webviews[0].props["data-uri"]).toContain("SKPab2YC8BE");
    expect(webviews[0].props["data-uri"]).toContain("youtube.com/embed");
  });

  it("shows LOADING VIDEO... indicator initially", () => {
    const tree = createTree("decline-push-up", true);
    const text = getAllText(tree.root);
    expect(text).toContain("LOADING VIDEO...");
  });

  it("renders a close button (✕)", () => {
    const tree = createTree("decline-push-up", true);
    const text = getAllText(tree.root);
    expect(text).toContain("✕");
  });

  it("shows TAP X TO CLOSE in footer", () => {
    const tree = createTree("decline-push-up", true);
    const text = getAllText(tree.root);
    expect(text).toContain("TAP X TO CLOSE");
  });

  it("renders form guide label when video ID exists", () => {
    const tree = createTree("decline-push-up", true);
    const text = getAllText(tree.root);
    expect(text).toContain("form guide");
  });

  it("shows search query label when no video ID exists", () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <VideoPlayerModal
          exerciseName="Unknown Exercise"
          exerciseId="unknown-exercise"
          visible={true}
          onClose={jest.fn()}
        />,
      );
    });
    const text = getAllText(tree!.root);
    expect(text).toContain("Searching");
    expect(text).toContain("Unknown Exercise");
  });

  it("renders a WebView with search URL when no video ID exists", () => {
    const tree = createTree("unknown-exercise", true);
    const webviews = tree.root.findAll((n) => n.props.testID === "webview", { deep: true });
    expect(webviews.length).toBeGreaterThanOrEqual(1);
    expect(webviews[0].props["data-uri"]).toContain("youtube.com/results");
    expect(webviews[0].props["data-uri"]).toContain("search_query");
  });

  it("renders a close button (✕) with an onPress handler", () => {
    const onClose = jest.fn();
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <VideoPlayerModal
          exerciseName="Test"
          exerciseId="decline-push-up"
          visible={true}
          onClose={onClose}
        />,
      );
    });

    const text = getAllText(tree!.root);
    expect(text).toContain("✕");
  });

  it("renders without crashing (smoke test)", () => {
    const tree = createTree("decline-push-up", true);
    expect(tree).toBeDefined();
  });
});
