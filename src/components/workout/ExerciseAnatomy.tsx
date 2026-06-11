import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Circle, Line, G, Polygon, Text as SvgText, Path } from "react-native-svg";
import { useColors, typography, spacing } from "../../tokens";
import { Exercise, MovementCategory } from "../../data/exercises";

interface ExerciseAnatomyProps {
  exercise: Exercise;
  activeTab: "SETUP" | "EXECUTION" | "SAFETY";
}

interface Joint {
  x: number;
  y: number;
}

interface PoseDefinition {
  joints: Record<string, Joint>;
  connections: [string, string][];
  label: string;
}

const FIGURE_SIZE = 200;

function getPose(category: MovementCategory, _phase: string): PoseDefinition {
  switch (category) {
    case "unilateral_lower_push":
      return {
        joints: {
          head: { x: 100, y: 18 },
          neck: { x: 100, y: 28 },
          shoulder: { x: 100, y: 34 },
          elbow: { x: 85, y: 52 },
          hand: { x: 78, y: 70 },
          hip: { x: 100, y: 60 },
          frontKnee: { x: 92, y: 100 },
          frontFoot: { x: 90, y: 135 },
          backKnee: { x: 115, y: 88 },
          backFoot: { x: 122, y: 110 },
        },
        connections: [
          ["head", "neck"],
          ["neck", "shoulder"],
          ["shoulder", "hip"],
          ["shoulder", "elbow"],
          ["elbow", "hand"],
          ["hip", "frontKnee"],
          ["frontKnee", "frontFoot"],
          ["hip", "backKnee"],
          ["backKnee", "backFoot"],
        ],
        label: "SPLIT SQUAT",
      };
    case "horizontal_pull":
      return {
        joints: {
          head: { x: 100, y: 22 },
          neck: { x: 100, y: 32 },
          shoulder: { x: 100, y: 38 },
          elbow: { x: 95, y: 58 },
          hand: { x: 92, y: 80 },
          hip: { x: 100, y: 70 },
          knee: { x: 100, y: 110 },
          foot: { x: 100, y: 152 },
        },
        connections: [
          ["head", "neck"],
          ["neck", "shoulder"],
          ["shoulder", "hip"],
          ["shoulder", "elbow"],
          ["elbow", "hand"],
          ["hip", "knee"],
          ["knee", "foot"],
        ],
        label: "ROW POSITION",
      };
    case "horizontal_push":
      return {
        joints: {
          head: { x: 160, y: 35 },
          neck: { x: 152, y: 38 },
          shoulder: { x: 145, y: 42 },
          elbow: { x: 132, y: 60 },
          hand: { x: 120, y: 75 },
          hip: { x: 110, y: 50 },
          knee: { x: 75, y: 58 },
          ankle: { x: 45, y: 50 },
          footElevated: { x: 30, y: 42 },
        },
        connections: [
          ["head", "neck"],
          ["neck", "shoulder"],
          ["shoulder", "hip"],
          ["shoulder", "elbow"],
          ["elbow", "hand"],
          ["hip", "knee"],
          ["knee", "ankle"],
          ["ankle", "footElevated"],
        ],
        label: "DECLINE PUSH-UP",
      };
    case "closed_chain_lower_pull":
      return {
        joints: {
          head: { x: 100, y: 20 },
          neck: { x: 100, y: 28 },
          shoulder: { x: 100, y: 34 },
          hand: { x: 100, y: 50 },
          hip: { x: 100, y: 58 },
          knee: { x: 100, y: 88 },
          heel: { x: 100, y: 115 },
        },
        connections: [
          ["head", "neck"],
          ["neck", "shoulder"],
          ["shoulder", "hip"],
          ["shoulder", "hand"],
          ["hip", "knee"],
          ["knee", "heel"],
        ],
        label: "HAMSTRING CURL",
      };
    case "elbow_extension":
      return {
        joints: {
          head: { x: 155, y: 45 },
          neck: { x: 148, y: 48 },
          shoulder: { x: 140, y: 52 },
          elbow: { x: 125, y: 65 },
          hand: { x: 112, y: 72 },
          hip: { x: 105, y: 55 },
          knee: { x: 70, y: 60 },
          foot: { x: 40, y: 58 },
        },
        connections: [
          ["head", "neck"],
          ["neck", "shoulder"],
          ["shoulder", "hip"],
          ["shoulder", "elbow"],
          ["elbow", "hand"],
          ["hip", "knee"],
          ["knee", "foot"],
        ],
        label: "TRICEP EXTENSION",
      };
    case "core_isometric":
      return {
        joints: {
          head: { x: 96, y: 30 },
          neck: { x: 98, y: 38 },
          shoulder: { x: 100, y: 44 },
          hand: { x: 104, y: 60 },
          hip: { x: 100, y: 72 },
          knee: { x: 94, y: 110 },
          ankle: { x: 90, y: 140 },
        },
        connections: [
          ["head", "neck"],
          ["neck", "shoulder"],
          ["shoulder", "hip"],
          ["shoulder", "hand"],
          ["hip", "knee"],
          ["knee", "ankle"],
        ],
        label: "HOLLOW HOLD",
      };
    case "lower_body_pull":
      return {
        joints: {
          head: { x: 100, y: 10 },
          neck: { x: 100, y: 20 },
          shoulder: { x: 100, y: 28 },
          hand: { x: 95, y: 55 },
          hip: { x: 100, y: 48 },
          knee: { x: 100, y: 82 },
          ankle: { x: 100, y: 110 },
          anchor: { x: 100, y: 130 },
        },
        connections: [
          ["head", "neck"],
          ["neck", "shoulder"],
          ["shoulder", "hip"],
          ["shoulder", "hand"],
          ["hip", "knee"],
          ["knee", "ankle"],
          ["ankle", "anchor"],
        ],
        label: "NORDIC CURL",
      };
    case "vertical_push":
      return {
        joints: {
          head: { x: 92, y: 55 },
          neck: { x: 96, y: 48 },
          shoulder: { x: 100, y: 42 },
          elbow: { x: 90, y: 58 },
          hand: { x: 85, y: 72 },
          hip: { x: 100, y: 60 },
          knee: { x: 105, y: 90 },
          ankle: { x: 108, y: 120 },
          footElevated: { x: 112, y: 145 },
        },
        connections: [
          ["head", "neck"],
          ["neck", "shoulder"],
          ["shoulder", "hip"],
          ["shoulder", "elbow"],
          ["elbow", "hand"],
          ["hip", "knee"],
          ["knee", "ankle"],
          ["ankle", "footElevated"],
        ],
        label: "PIKE PUSH-UP",
      };
    case "unilateral_horizontal_pull":
      return {
        joints: {
          head: { x: 80, y: 28 },
          neck: { x: 82, y: 36 },
          shoulder: { x: 86, y: 42 },
          pullingElbow: { x: 70, y: 58 },
          pullingHand: { x: 58, y: 70 },
          otherHand: { x: 100, y: 65 },
          hip: { x: 100, y: 68 },
          knee: { x: 100, y: 108 },
          foot: { x: 100, y: 150 },
        },
        connections: [
          ["head", "neck"],
          ["neck", "shoulder"],
          ["shoulder", "hip"],
          ["shoulder", "pullingElbow"],
          ["pullingElbow", "pullingHand"],
          ["shoulder", "otherHand"],
          ["hip", "knee"],
          ["knee", "foot"],
        ],
        label: "ONE-ARM ROW",
      };
    case "scapular_mobility":
      return {
        joints: {
          head: { x: 80, y: 22 },
          neck: { x: 86, y: 28 },
          shoulder: { x: 92, y: 34 },
          leftElbow: { x: 105, y: 40 },
          leftHand: { x: 118, y: 30 },
          rightElbow: { x: 85, y: 44 },
          rightHand: { x: 72, y: 36 },
          hip: { x: 100, y: 60 },
          knee: { x: 100, y: 95 },
          foot: { x: 100, y: 130 },
        },
        connections: [
          ["head", "neck"],
          ["neck", "shoulder"],
          ["shoulder", "hip"],
          ["shoulder", "leftElbow"],
          ["leftElbow", "leftHand"],
          ["shoulder", "rightElbow"],
          ["rightElbow", "rightHand"],
          ["hip", "knee"],
          ["knee", "foot"],
        ],
        label: "PRONE SWIMMERS",
      };
    case "horizontal_adduction":
      return {
        joints: {
          head: { x: 165, y: 40 },
          neck: { x: 155, y: 44 },
          shoulder: { x: 145, y: 48 },
          leftElbow: { x: 125, y: 30 },
          leftHand: { x: 108, y: 22 },
          rightElbow: { x: 125, y: 70 },
          rightHand: { x: 108, y: 82 },
          hip: { x: 108, y: 55 },
          knee: { x: 65, y: 60 },
          foot: { x: 30, y: 58 },
        },
        connections: [
          ["head", "neck"],
          ["neck", "shoulder"],
          ["shoulder", "hip"],
          ["shoulder", "leftElbow"],
          ["leftElbow", "leftHand"],
          ["shoulder", "rightElbow"],
          ["rightElbow", "rightHand"],
          ["hip", "knee"],
          ["knee", "foot"],
        ],
        label: "CHEST FLY",
      };
    case "dynamic_core":
      return {
        joints: {
          head: { x: 100, y: 12 },
          neck: { x: 100, y: 22 },
          shoulder: { x: 100, y: 28 },
          hand: { x: 100, y: 15 },
          hip: { x: 100, y: 52 },
          knee: { x: 100, y: 90 },
          ankle: { x: 100, y: 125 },
        },
        connections: [
          ["head", "neck"],
          ["neck", "shoulder"],
          ["shoulder", "hip"],
          ["shoulder", "hand"],
          ["hip", "knee"],
          ["knee", "ankle"],
        ],
        label: "DRAGON FLAG",
      };
    default:
      return {
        joints: {
          head: { x: 100, y: 15 },
          neck: { x: 100, y: 25 },
          shoulder: { x: 100, y: 32 },
          elbow: { x: 85, y: 50 },
          hand: { x: 75, y: 65 },
          hip: { x: 100, y: 60 },
          knee: { x: 100, y: 100 },
          foot: { x: 100, y: 145 },
        },
        connections: [
          ["head", "neck"],
          ["neck", "shoulder"],
          ["shoulder", "hip"],
          ["shoulder", "elbow"],
          ["elbow", "hand"],
          ["hip", "knee"],
          ["knee", "foot"],
        ],
        label: "NEUTRAL",
      };
  }
}

export function ExerciseAnatomy({ exercise, activeTab }: ExerciseAnatomyProps) {
  const colors = useColors();

  const pose = useMemo(() => getPose(exercise.category, activeTab), [exercise.category, activeTab]);
  const activeColor = activeTab === "SAFETY" ? colors.error : colors.accent.DEFAULT;
  const vs = exercise.visualGuide?.visuals || [];

  return (
    <View style={{ width: "100%", height: FIGURE_SIZE, position: "relative" }}>
      <Svg width="100%" height={FIGURE_SIZE} viewBox={`0 0 ${FIGURE_SIZE} ${FIGURE_SIZE}`}>
        {/* Grid crosshairs */}
        <Line
          x1={0}
          y1={FIGURE_SIZE / 2}
          x2={FIGURE_SIZE}
          y2={FIGURE_SIZE / 2}
          stroke={colors.border.subtle}
          strokeWidth={0.5}
          opacity={0.3}
        />
        <Line
          x1={FIGURE_SIZE / 2}
          y1={0}
          x2={FIGURE_SIZE / 2}
          y2={FIGURE_SIZE}
          stroke={colors.border.subtle}
          strokeWidth={0.5}
          opacity={0.3}
        />

        {/* Skeleton connections */}
        {pose.connections.map(([fromId, toId], i) => {
          const from = pose.joints[fromId];
          const to = pose.joints[toId];
          if (!from || !to) return null;
          return (
            <Line
              key={`bone-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={colors.text.primary}
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={0.7}
            />
          );
        })}

        {/* Joint nodes */}
        {Object.entries(pose.joints).map(([name, joint]) => {
          const isPrimaryJoint = vs.some(
            (v) => v.primaryJoint.toLowerCase() === name.toLowerCase(),
          );
          return (
            <Circle
              key={`joint-${name}`}
              cx={joint.x}
              cy={joint.y}
              r={isPrimaryJoint ? 4 : 2.5}
              fill={isPrimaryJoint ? activeColor : colors.text.primary}
              opacity={isPrimaryJoint ? 0.9 : 0.5}
            />
          );
        })}

        {/* Head */}
        <Circle
          cx={pose.joints.head?.x || 100}
          cy={pose.joints.head?.y || 15}
          r={8}
          fill="none"
          stroke={colors.text.primary}
          strokeWidth={2}
          opacity={0.6}
        />

        {/* Biomechanical annotations */}
        {vs.map((visual, i) => {
          const jointName = visual.primaryJoint.toLowerCase();
          const jointEntry = Object.entries(pose.joints).find(
            ([name]) => name.toLowerCase() === jointName,
          );
          if (!jointEntry) return null;

          const joint = jointEntry[1];

          switch (visual.type) {
            case "angle": {
              return (
                <G key={`v-${i}`}>
                  <Circle
                    cx={joint.x}
                    cy={joint.y}
                    r={14}
                    fill="none"
                    stroke={activeColor}
                    strokeWidth={1}
                    strokeDasharray="2,3"
                    opacity={0.6}
                  />
                  {visual.targetAngle && (
                    <SvgText
                      x={joint.x + 18}
                      y={joint.y + 3}
                      fill={activeColor}
                      fontSize={7}
                      opacity={0.9}
                    >
                      {`${visual.targetAngle}°`}
                    </SvgText>
                  )}
                </G>
              );
            }
            case "vector": {
              if (!visual.direction) return null;
              const arrowLength = 28;
              let dx = 0;
              let dy = 0;
              switch (visual.direction) {
                case "up":
                  dy = -arrowLength;
                  break;
                case "down":
                  dy = arrowLength;
                  break;
                case "lateral":
                  dx = arrowLength;
                  break;
                case "pull":
                  dx = -arrowLength;
                  break;
                case "push":
                  dx = arrowLength;
                  break;
                case "hold":
                  dy = -arrowLength * 0.5;
                  break;
              }
              const endX = joint.x + dx;
              const endY = joint.y + dy;
              return (
                <G key={`v-${i}`}>
                  <Line
                    x1={joint.x}
                    y1={joint.y}
                    x2={endX}
                    y2={endY}
                    stroke={activeColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                  <Polygon
                    points={`${endX},${endY} ${endX - 5},${endY - 5 * Math.sign((dy || 1) + (dx || 1))} ${endX + 5},${endY - 5 * Math.sign((dy || 1) + (dx || 1))}`}
                    fill={activeColor}
                    opacity={0.9}
                  />
                </G>
              );
            }
            case "isometric": {
              return (
                <Circle
                  key={`v-${i}`}
                  cx={joint.x}
                  cy={joint.y}
                  r={10}
                  fill="none"
                  stroke={colors.success}
                  strokeWidth={1.5}
                  opacity={0.5}
                />
              );
            }
            default:
              return null;
          }
        })}

        {/* Pose label */}
        <SvgText x={8} y={FIGURE_SIZE - 8} fill={activeColor} fontSize={7} opacity={0.8}>
          {`${pose.label} · ${activeTab}`}
        </SvgText>
      </Svg>
    </View>
  );
}
