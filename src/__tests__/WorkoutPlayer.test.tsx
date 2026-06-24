import React, { act } from "react";
import renderer from "react-test-renderer";
import WorkoutPlayerScreen from "../../app/workout/[id]";

// ── Mocks (self-contained factories to avoid hoisting issues) ─────────────

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "workout-96-0" }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("../../src/stores/useWorkoutStore", () => {
  const mockState = {
    phase: "idle",
    currentExerciseIndex: 0,
    currentExercise: null,
    exerciseProgress: [],
    restTimer: 0,
    totalDuration: 0,
    currentRepInput: 8,
    startWorkout: jest.fn(),
    completeSet: jest.fn(),
    navigateToExercise: jest.fn(),
    completeWorkout: jest.fn(() => ({ totalSets: 12, totalDuration: 1800, allComplete: true })),
    setCurrentRepInput: jest.fn(),
    reset: jest.fn(),
    tickTimer: jest.fn(),
    startRest: jest.fn(),
  };
  const fn = (selector?: any) => (selector ? selector(mockState) : mockState);
  fn.getState = () => mockState;
  return { useWorkoutStore: fn };
});

jest.mock("../../src/stores/useUserStore", () => {
  const mockState = {
    level: 1,
    totalXp: 0,
    streakData: { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null, isActiveToday: false },
    workoutHistory: [],
    masteredExerciseIds: [],
    fitnessGoal: "general",
    exercisePresets: {},
    addWorkoutSession: jest.fn(),
    markMastered: jest.fn(),
  };
  const fn = (selector?: any) => (selector ? selector(mockState) : mockState);
  fn.getState = () => mockState;
  return { useUserStore: fn };
});

jest.mock("../../src/tokens", () => ({
  useColors: () => ({
    accent: { DEFAULT: "#F59E0B", light: "#FCD34D", dark: "#B45309" },
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    text: { primary: "#EDE7D9", secondary: "#9B8E7A", tertiary: "#5A4F42" },
    bg: { primary: "#070814", elevated: "#0D1021", highlight: "#151A30", card: "#0D1021" },
    border: { subtle: "#1C1F33" },
  }),
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, "5": 20, "12": 48 },
  typography: {
    display: { fontSize: 28, fontFamily: "BebasNeue-Regular", letterSpacing: 1 },
    h1: { fontSize: 32, fontFamily: "BebasNeue-Regular" },
    h2: { fontSize: 24, fontFamily: "BebasNeue-Regular" },
    h3: { fontSize: 18, fontFamily: "BebasNeue-Regular" },
    h4: { fontSize: 16, fontFamily: "BebasNeue-Regular" },
    subtitle: { fontSize: 11, fontFamily: "Inter-SemiBold", letterSpacing: 2 },
    label: { fontSize: 10, fontFamily: "Inter-SemiBold", letterSpacing: 2 },
    body: { fontSize: 14, fontFamily: "Inter-Regular" },
    bodySmall: { fontSize: 11, fontFamily: "Inter-Regular" },
  },
  fonts: {
    body: { regular: "Inter-Regular", semiBold: "Inter-SemiBold", bold: "Inter-Bold" },
    heading: "BebasNeue-Regular",
  },
}));

jest.mock("../../src/hooks/useVoiceCoach", () => ({ useVoiceCoach: () => {} }));
jest.mock("../../src/hooks/useRestNotifications", () => ({ useRestNotifications: () => {} }));

jest.mock("../../src/services/levelUpSound", () => ({
  playLevelUpSound: jest.fn(() => Promise.resolve()),
}));

jest.mock("../../src/utils/xp", () => ({
  calculateWorkoutXp: jest.fn(() => ({
    base: 300,
    completionBonus: 50,
    streakBonus: 0,
    total: 350,
  })),
  XP_PER_SET: 25,
  XP_BONUS_COMPLETION: 50,
  XP_DAILY_MISSION: 100,
  XP_STREAK_BONUS: 10,
}));

jest.mock("../../src/utils/skillUnlocks", () => ({
  extractCompletedIds: jest.fn(() => new Set()),
  findNewUnlocks: jest.fn(() => ({ skillUnlocks: [], classUnlocks: [] })),
}));

jest.mock("../../src/utils/doubleProgression", () => ({
  detectNewMastery: jest.fn(() => []),
}));

jest.mock("../../src/utils/warmup", () => ({
  generateWarmUp: jest.fn(() => []),
  estimateWarmUpDuration: jest.fn(() => 0),
  getWarmUpZoneSummary: jest.fn(() => []),
}));

jest.mock("../../src/data/workouts", () => ({
  getWorkout96ById: jest.fn(() => ({
    id: "workout-96-0",
    name: "THE VANGUARD",
    focus: "HP · VP · AQL · AC",
    exercises: [
      {
        id: "hp1",
        name: "Push-up",
        category: "horizontal_push",
        description: "",
        defaultSets: 3,
        repRange: [8, 15],
        tempo: "2-1-2-0",
        restInterval: 60,
        progressionPathway: "hp",
        targetMuscles: ["chest"],
      },
      {
        id: "vp1",
        name: "Pike Push-up",
        category: "vertical_push",
        description: "",
        defaultSets: 3,
        repRange: [8, 15],
        tempo: "2-1-2-0",
        restInterval: 60,
        progressionPathway: "vp",
        targetMuscles: ["shoulders"],
      },
      {
        id: "aql1",
        name: "Bodyweight Squat",
        category: "unilateral_lower_push",
        description: "",
        defaultSets: 3,
        repRange: [8, 15],
        tempo: "2-1-2-0",
        restInterval: 60,
        progressionPathway: "aql",
        targetMuscles: ["quadriceps"],
      },
      {
        id: "ac1",
        name: "Plank",
        category: "core_isometric",
        description: "",
        defaultSets: 3,
        repRange: [8, 15],
        tempo: "isometric",
        restInterval: 60,
        progressionPathway: "ac",
        targetMuscles: ["core"],
      },
    ],
    recommendedFrequency: "4/week",
  })),
  getWorkoutByIdForGoal: jest.fn(() => undefined),
  getGoalConfig: jest.fn(() => ({ label: "GENERAL FITNESS" })),
  getGoalWorkoutDescription: jest.fn(() => ""),
}));

jest.mock("../../src/components/ui/Card", () => ({
  Card: ({ children, title }: any) => {
    const React2 = require("react");
    const { View, Text } = require("react-native");
    return React2.createElement(
      View,
      { testID: "card" },
      title ? React2.createElement(Text, null, title) : null,
      children,
    );
  },
}));

jest.mock("../../src/components/ui/Button", () => ({
  Button: ({ title, onPress }: any) => {
    const React2 = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return React2.createElement(
      TouchableOpacity,
      { onPress, testID: `btn-${title.toLowerCase().replace(/\s+/g, "-")}` },
      React2.createElement(Text, null, title),
    );
  },
}));

jest.mock("../../src/components/ui/HUDModule", () => ({
  HUDModule: ({ children, label }: any) => {
    const React2 = require("react");
    const { View, Text } = require("react-native");
    return React2.createElement(
      View,
      { testID: "hud" },
      React2.createElement(Text, null, label),
      children,
    );
  },
}));

jest.mock("../../src/components/workout/CompletionAnimation", () => ({
  __esModule: true,
  CompletionAnimation: () => {
    const React2 = require("react");
    const { View } = require("react-native");
    return React2.createElement(View, { testID: "completion" });
  },
}));

jest.mock("../../src/components/workout/ExerciseDemo", () => ({
  ExerciseDemo: () => {
    const React2 = require("react");
    const { View } = require("react-native");
    return React2.createElement(View, { testID: "ex-demo" });
  },
}));

jest.mock("../../src/components/workout/TempoTimer", () => ({
  TempoTimer: () => {
    const React2 = require("react");
    const { View } = require("react-native");
    return React2.createElement(View, { testID: "tempo" });
  },
}));

jest.mock("../../src/components/ui/GlossyOverlay", () => ({
  GlossyOverlay: () => {
    const React2 = require("react");
    const { View } = require("react-native");
    return React2.createElement(View, { testID: "glossy" });
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
// WorkoutPlayerScreen
// ═══════════════════════════════════════════════════

describe("WorkoutPlayerScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Workout Not Found ──

  it("renders 'Workout not found' when workout is null", () => {
    jest.mocked(require("../../src/data/workouts").getWorkout96ById).mockReturnValueOnce(undefined);
    jest
      .mocked(require("../../src/data/workouts").getWorkoutByIdForGoal)
      .mockReturnValueOnce(undefined);

    const tree = renderInAct(<WorkoutPlayerScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("Workout not found");
  });

  it("renders GO BACK button when workout is not found", () => {
    jest.mocked(require("../../src/data/workouts").getWorkout96ById).mockReturnValueOnce(undefined);
    jest
      .mocked(require("../../src/data/workouts").getWorkoutByIdForGoal)
      .mockReturnValueOnce(undefined);

    const tree = renderInAct(<WorkoutPlayerScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("GO BACK");
  });

  // ── Preview Mode ──

  it("renders WORKOUT PREVIEW header", () => {
    const tree = renderInAct(<WorkoutPlayerScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("WORKOUT PREVIEW");
  });

  it("renders the workout name", () => {
    const tree = renderInAct(<WorkoutPlayerScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("THE VANGUARD");
  });

  it("renders the workout focus", () => {
    const tree = renderInAct(<WorkoutPlayerScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("HP · VP");
  });

  it("renders OVERVIEW card with EXERCISES count", () => {
    const tree = renderInAct(<WorkoutPlayerScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("OVERVIEW");
    expect(text).toContain("EXERCISES");
    expect(text).toContain("4");
  });

  it("renders OVERVIEW card with EST. TIME", () => {
    const tree = renderInAct(<WorkoutPlayerScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("EST. TIME");
  });

  it("renders OVERVIEW card with WARM-UP info", () => {
    const tree = renderInAct(<WorkoutPlayerScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("WARM-UP");
  });

  it("renders OVERVIEW card with MUSCLES count", () => {
    const tree = renderInAct(<WorkoutPlayerScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("MUSCLES");
  });

  it("renders all exercise names in the exercise list", () => {
    const tree = renderInAct(<WorkoutPlayerScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("Push-up");
    expect(text).toContain("Pike Push-up");
    expect(text).toContain("Bodyweight Squat");
    expect(text).toContain("Plank");
  });

  it("renders EXERCISES section header", () => {
    const tree = renderInAct(<WorkoutPlayerScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("EXERCISES");
  });

  it("renders exercise details (sets, reps, tempo, rest)", () => {
    const tree = renderInAct(<WorkoutPlayerScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("3 SETS");
    expect(text).toContain("60s REST");
  });

  it("renders START WORKOUT button", () => {
    const tree = renderInAct(<WorkoutPlayerScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("START WORKOUT");
  });

  it("renders TARGET MUSCLES card", () => {
    const tree = renderInAct(<WorkoutPlayerScreen />);
    const text = getAllText(tree.root);
    expect(text).toContain("TARGET MUSCLES");
  });

  it("renders without crashing (smoke test)", () => {
    const tree = renderInAct(<WorkoutPlayerScreen />);
    expect(tree).toBeDefined();
  });
});
