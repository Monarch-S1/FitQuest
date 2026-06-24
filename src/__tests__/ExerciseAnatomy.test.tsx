import React, { act } from "react";
import renderer from "react-test-renderer";
import { ExerciseAnatomy } from "../components/workout/ExerciseAnatomy";
import type { Exercise, MovementCategory } from "../data/exercises";

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock("../tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B", light: "#FCD34D", dark: "#B45309" },
    success: "#10B981",
    error: "#EF4444",
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { primary: "#070814", elevated: "#0D1021" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  typography: {
    label: { fontSize: 10, fontFamily: "Inter-SemiBold", letterSpacing: 2 },
    bodySmall: { fontSize: 11, fontFamily: "Inter-Regular" },
  },
}));

jest.mock("react-native-svg", () => {
  const React = require("react");
  const MockSvg = ({ children, ...props }: any) =>
    React.createElement("view", { ...props, "data-testid": "svg" }, children);
  const MockLine = (props: any) =>
    React.createElement("line", { ...props, "data-testid": "svg-line" });
  const MockCircle = (props: any) =>
    React.createElement("circle", { ...props, "data-testid": "svg-circle" });
  const MockG = ({ children, ...props }: any) =>
    React.createElement("g", { ...props, "data-testid": "svg-g" }, children);
  const MockPolygon = (props: any) =>
    React.createElement("polygon", { ...props, "data-testid": "svg-polygon" });
  const MockText = ({ children, ...props }: any) =>
    React.createElement("text", { ...props, "data-testid": "svg-text" }, children);
  const MockPath = (props: any) =>
    React.createElement("path", { ...props, "data-testid": "svg-path" });
  return {
    __esModule: true,
    default: MockSvg,
    Svg: MockSvg,
    Line: MockLine,
    Circle: MockCircle,
    G: MockG,
    Polygon: MockPolygon,
    Path: MockPath,
    Text: MockText,
  };
});

// ── Test Fixtures ─────────────────────────────────────────────────────────

function createExercise(category: MovementCategory, overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "test-exercise",
    name: "Test Exercise",
    category,
    description: "A test exercise",
    defaultSets: 3,
    repRange: [8, 15],
    tempo: "2-1-2-0",
    restInterval: 60,
    progressionPathway: "hp",
    targetMuscles: ["chest"],
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
// ExerciseAnatomy
// ═══════════════════════════════════════════════════

describe("ExerciseAnatomy", () => {
  it("renders an SVG element", () => {
    const exercise = createExercise("horizontal_push");
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="SETUP" />);
    const svg = tree.root.find((n) => n.props["data-testid"] === "svg");
    expect(svg).toBeDefined();
  });

  it("renders the correct pose label for horizontal_push", () => {
    const exercise = createExercise("horizontal_push");
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="SETUP" />);
    const text = getAllText(tree.root);
    expect(text).toContain("DECLINE PUSH-UP");
  });

  it("renders the correct pose label for horizontal_pull", () => {
    const exercise = createExercise("horizontal_pull");
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="SETUP" />);
    const text = getAllText(tree.root);
    expect(text).toContain("ROW POSITION");
  });

  it("renders the correct pose label for vertical_push", () => {
    const exercise = createExercise("vertical_push");
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="SETUP" />);
    const text = getAllText(tree.root);
    expect(text).toContain("PIKE PUSH-UP");
  });

  it("renders skeleton connections as Line elements", () => {
    const exercise = createExercise("horizontal_push");
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="SETUP" />);
    const lines = tree.root.findAll((n) => n.props["data-testid"] === "svg-line");
    // At minimum: 2 grid lines + 8 skeleton connections = 10
    expect(lines.length).toBeGreaterThanOrEqual(10);
  });

  it("renders joint nodes as Circle elements", () => {
    const exercise = createExercise("horizontal_push");
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="SETUP" />);
    const circles = tree.root.findAll((n) => n.props["data-testid"] === "svg-circle");
    // Head circle + 9 joint circles = 10
    expect(circles.length).toBeGreaterThanOrEqual(8);
  });

  it("shows active tab label in pose label text", () => {
    const exercise = createExercise("horizontal_push");
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="EXECUTION" />);
    const text = getAllText(tree.root);
    expect(text).toContain("EXECUTION");
  });

  it("shows SETUP tab in label", () => {
    const exercise = createExercise("horizontal_push");
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="SETUP" />);
    const text = getAllText(tree.root);
    expect(text).toContain("SETUP");
  });

  it("shows SAFETY tab in label", () => {
    const exercise = createExercise("horizontal_push");
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="SAFETY" />);
    const text = getAllText(tree.root);
    expect(text).toContain("SAFETY");
  });

  it("renders grid crosshairs (horizontal and vertical lines)", () => {
    const exercise = createExercise("horizontal_push");
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="SETUP" />);
    const lines = tree.root.findAll((n) => n.props["data-testid"] === "svg-line");
    // Grid lines: 2 (horizontal + vertical center lines), so lines >= 2 + connections
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  it("renders the head circle", () => {
    const exercise = createExercise("horizontal_push");
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="SETUP" />);
    const circles = tree.root.findAll(
      (n) => n.props["data-testid"] === "svg-circle" && n.props.r && n.props.fill === "none",
      { deep: true },
    );
    // Head circle has fill="none" (unfilled)
    expect(circles.length).toBeGreaterThanOrEqual(1);
  });

  it("renders angle annotation circles when visualGuide has angle type", () => {
    const exercise = createExercise("horizontal_push", {
      visualGuide: {
        visuals: [
          {
            type: "angle",
            primaryJoint: "elbow",
            targetAngle: 90,
            description: "Keep elbow at 90°",
          },
        ],
        setupSteps: [],
        executionCues: [],
        safetyNotes: [],
      },
    });
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="EXECUTION" />);
    // Angle annotation creates a Circle with dashed stroke + SvgText for the angle
    const text = getAllText(tree.root);
    expect(text).toContain("90°");
  });

  it("renders vector arrow annotations when visualGuide has vector type", () => {
    const exercise = createExercise("horizontal_push", {
      visualGuide: {
        visuals: [
          {
            type: "vector",
            primaryJoint: "shoulder",
            direction: "up",
            description: "Push upward",
          },
        ],
        setupSteps: [],
        executionCues: [],
        safetyNotes: [],
      },
    });
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="EXECUTION" />);
    // Vector creates a G with Line + Polygon (arrowhead)
    const gs = tree.root.findAll((n) => n.props["data-testid"] === "svg-g");
    expect(gs.length).toBeGreaterThanOrEqual(1);
  });

  it("renders isometric annotation circles when visualGuide has isometric type", () => {
    const exercise = createExercise("horizontal_push", {
      visualGuide: {
        visuals: [
          {
            type: "isometric",
            primaryJoint: "hip",
            description: "Stay stable",
          },
        ],
        setupSteps: [],
        executionCues: [],
        safetyNotes: [],
      },
    });
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="EXECUTION" />);
    // Isometric annotation adds an unfilled Circle + the head circle is also unfilled
    const circles = tree.root.findAll(
      (n) => n.props["data-testid"] === "svg-circle" && n.props.fill === "none",
      { deep: true },
    );
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  it("uses default NEUTRAL pose for unrecognized categories", () => {
    const exercise = createExercise("unrecognized" as MovementCategory);
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="SETUP" />);
    const text = getAllText(tree.root);
    expect(text).toContain("NEUTRAL");
  });

  it("renders a unique pose for each major category", () => {
    const categories: MovementCategory[] = [
      "horizontal_push",
      "horizontal_pull",
      "vertical_push",
      "unilateral_lower_push",
      "closed_chain_lower_pull",
      "elbow_extension",
      "core_isometric",
      "lower_body_pull",
      "unilateral_horizontal_pull",
      "scapular_mobility",
      "horizontal_adduction",
      "dynamic_core",
    ];

    const labels = categories.map((cat) => {
      const exercise = createExercise(cat);
      const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="SETUP" />);
      return getAllText(tree.root).split("·")[0].trim();
    });

    // All labels should be unique
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(categories.length);
  });

  it("renders without crashing (smoke test)", () => {
    const exercise = createExercise("horizontal_push");
    const tree = renderInAct(<ExerciseAnatomy exercise={exercise} activeTab="SETUP" />);
    expect(tree).toBeDefined();
  });
});
