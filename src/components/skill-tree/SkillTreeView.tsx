/**
 * SkillTreeView — Connected Sphere Skill Tree
 *
 * Game-inspired "spheres connected by progression lines" design:
 * - Each branch renders 12 nodes in a zigzag two-column grid
 * - SVG bezier/stepped connection lines between spheres
 * - Cross-pathway prerequisite arcs between branches (e.g. AC5 → VP10)
 * - Inline expandable detail panels (no separate overlay)
 * - Filterable by family (ALL, PUSH, PULL, LEGS, CORE)
 * - Branch progress bars and mastery summary
 *
 * Spheres sized by state:
 *   Locked: 24dp  ·  Unlocked: 28dp  ·  Active: 34dp  ·  Mastered: 42dp
 *
 * Design influenced by: Path of Exile passive tree, FFX Sphere Grid,
 * God of War skill tree, Skyrim perk constellation.
 *
 * v2 improvements:
 * - Collapsible branches (start expanded, tap header to collapse/reduce overwhelm)
 * - overflow: hidden on content container to prevent SVG bleed (fixes random line bug)
 * - Stronger branch headers with muscle group info and unlock callout
 * - memo-bounded SVG re-renders for performance
 */

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useColors, spacing } from "../../tokens";
import {
  getSkillTree8,
  SkillBranch,
  SkillNode as SkillNodeData,
  computeNodeStates,
} from "../../data/skillTree";
import { ParentFamily } from "../../data/pathways";
import { SkillNode } from "./SkillNode";
import { useUserStore } from "../../stores/useUserStore";
import { extractCompletedIds, getUnlockSummary } from "../../utils/skillUnlocks";
import { useSkillTreeSounds } from "../../hooks/useSkillTreeSounds";
import { SkillTreeIntroOverlay } from "./SkillTreeIntroOverlay";
import { useDialog } from "../ui/Dialog";

// ── Pathway abbreviation lookup ────────────────

const PATHWAY_LABELS: Record<string, string> = {
  HP: "Horizontal Push",
  VP: "Vertical Push",
  HPLL: "Horizontal Pull",
  VPLL: "Vertical Pull",
  AQL: "Anterior Chain Legs",
  HPL: "Posterior Chain Legs",
  AC: "Anterior Core",
  PLC: "Posterior & Lateral Core",
};

// ── Family filter configuration ────────────────

type FamilyFilter = "all" | ParentFamily;

const FAMILY_FILTERS: {
  key: FamilyFilter;
  label: string;
  icon: string;
  count: (treeSize: number) => number;
}[] = [
  { key: "all", label: "ALL", icon: "✦", count: () => 96 },
  { key: "push", label: "PUSH", icon: "⬆", count: () => 24 },
  { key: "pull", label: "PULL", icon: "⬇", count: () => 24 },
  { key: "legs", label: "LEGS", icon: "⬍", count: () => 24 },
  { key: "core", label: "CORE", icon: "◈", count: () => 24 },
];

function getFamilyAccent(family: ParentFamily): string {
  const map: Record<ParentFamily, string> = {
    push: "#EF4444",
    pull: "#3B82F6",
    legs: "#10B981",
    core: "#F59E0B",
  };
  return map[family];
}

const ROW_HEIGHT = 44;
const ROW_GAP = 4;
const SPHERE_CONTAINER_SIZE = 44;

/** Calculate sphere center X positions based on container width */
function getSpherePositions(containerWidth: number) {
  const leftX = containerWidth * 0.185;
  const rightX = containerWidth * 0.815;
  return { leftX, rightX };
}

// ── Branch Header (collapsible, with muscle group summary) ─────

function BranchHeader({
  branch,
  nodeStates,
  isExpanded,
  onToggle,
}: {
  branch: SkillBranch;
  nodeStates: Map<string, string>;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const colors = useColors();
  const total = branch.nodes.length;
  const mastered = branch.nodes.filter((n) => nodeStates.get(n.exercise.id) === "mastered").length;
  const active = branch.nodes.filter((n) => nodeStates.get(n.exercise.id) === "active").length;

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${branch.label}: ${mastered} of ${total} mastered. Tap to ${isExpanded ? "collapse" : "expand"}.`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
      }}
    >
      {/* Collapse indicator */}
      <Text
        style={{
          fontFamily: "Inter-Regular",
          fontSize: 8,
          color: branch.accent,
          opacity: 0.5,
          marginRight: spacing.xs,
          width: 12,
          textAlign: "center",
        }}
      >
        {isExpanded ? "▼" : "▶"}
      </Text>

      {/* Pathway icon */}
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: `${branch.accent}12`,
          borderWidth: 1,
          borderColor: `${branch.accent}25`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing.sm,
        }}
      >
        <Text style={{ fontSize: 13, color: branch.accent }}>{branch.icon}</Text>
      </View>

      {/* Label + primary muscles */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Text
            style={{
              fontFamily: "Inter-SemiBold",
              fontSize: 11,
              color: branch.accent,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {branch.label}
          </Text>
          <Text
            style={{
              fontFamily: "Inter-Regular",
              fontSize: 6,
              color: branch.accent,
              opacity: 0.5,
              letterSpacing: 0.5,
            }}
            numberOfLines={1}
          >
            {branch.description}
          </Text>
        </View>
      </View>

      {/* Mastered count badge */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          backgroundColor: `${branch.accent}10`,
          borderRadius: 3,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
        }}
      >
        <Text
          style={{
            fontFamily: "Inter-SemiBold",
            fontSize: 8,
            color: colors.success,
            letterSpacing: 0.5,
          }}
        >
          {mastered}
        </Text>
        <Text
          style={{
            fontFamily: "Inter-Regular",
            fontSize: 6,
            color: colors.text.secondary,
            letterSpacing: 0.3,
          }}
        >
          /{total}
        </Text>
      </View>

      {/* Active indicator dot */}
      {active > 0 && (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: branch.accent,
            marginLeft: spacing.xs,
            opacity: 0.7,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

// ── Branch Progress ────────────────────────────

function BranchProgress({
  branch,
  nodeStates,
}: {
  branch: SkillBranch;
  nodeStates: Map<string, string>;
}) {
  const colors = useColors();
  const total = branch.nodes.length;
  const mastered = branch.nodes.filter((n) => nodeStates.get(n.exercise.id) === "mastered").length;
  const pct = total > 0 ? (mastered / total) * 100 : 0;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.sm,
      }}
    >
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: `${branch.accent}15`,
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${pct}%` as any,
            height: "100%",
            backgroundColor: branch.accent,
            borderRadius: 1,
          }}
        />
      </View>
      <Text
        style={{
          fontFamily: "Inter-Regular",
          fontSize: 7,
          color: colors.text.secondary,
          letterSpacing: 0.5,
        }}
      >
        {mastered}✦{total}
      </Text>
    </View>
  );
}

// ── Zigzag Connection Lines ────────────────────

interface LineCoords {
  fromId: string;
  toId: string;
  pathD: string;
  sourceState: string;
  accent: string;
}

function calculateConnections(
  nodes: SkillNodeData[],
  nodeStates: Map<string, string>,
  containerWidth: number,
  detailPanelShifts: Map<number, number>,
  branchAccent: string,
): LineCoords[] {
  if (containerWidth <= 0 || nodes.length < 2) return [];

  const { leftX, rightX } = getSpherePositions(containerWidth);
  const lines: LineCoords[] = [];

  let currentY = 0;

  for (let row = 0; row < 6; row++) {
    const idx1 = row * 2;
    const idx2 = row * 2 + 1;
    if (idx2 >= nodes.length) break;

    const centerY = currentY + ROW_HEIGHT / 2;
    const node1 = nodes[idx1];
    const node2 = nodes[idx2];
    const state1 = nodeStates.get(node1.exercise.id) ?? "locked";
    const state2 = nodeStates.get(node2.exercise.id) ?? "locked";

    // Horizontal: left → right within row
    lines.push({
      fromId: node1.exercise.id,
      toId: node2.exercise.id,
      pathD: `M ${leftX} ${centerY} L ${rightX} ${centerY}`,
      sourceState: state1,
      accent: branchAccent,
    });

    // Stepped: right → next row left
    if (row < 5 && idx2 + 1 < nodes.length) {
      const nextIdx1 = (row + 1) * 2;
      if (nextIdx1 >= nodes.length) break;

      const nextY = currentY + ROW_HEIGHT + ROW_GAP;
      const panelShift = detailPanelShifts.get(row) ?? 0;
      const shiftedNextY = nextY + panelShift;

      const nextCenterY = shiftedNextY + ROW_HEIGHT / 2;
      const midY = (centerY + nextCenterY) / 2;

      lines.push({
        fromId: node2.exercise.id,
        toId: nodes[nextIdx1].exercise.id,
        pathD: `M ${rightX} ${centerY} L ${rightX} ${midY} L ${leftX} ${midY} L ${leftX} ${nextCenterY}`,
        sourceState: state2,
        accent: branchAccent,
      });

      currentY = shiftedNextY;
    } else {
      currentY += ROW_HEIGHT;
    }
  }

  return lines;
}

// ── Inline Detail Panel ────────────────────────

function InlineDetailPanel({
  node,
  nodeState,
  onClose,
  onLayout,
}: {
  node: SkillNodeData;
  nodeState: string;
  onClose: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const colors = useColors();
  const { exercise } = node;
  const hasCheckpoints = exercise.visualGuide?.checkpoints?.length;

  const stateLabel =
    nodeState === "mastered"
      ? "★ MASTERED"
      : nodeState === "active"
        ? "✦ ACTIVE"
        : nodeState === "unlocked"
          ? "· UNLOCKED"
          : "· LOCKED";

  const stateColor =
    nodeState === "mastered"
      ? colors.success
      : nodeState === "active"
        ? node.accent
        : nodeState === "unlocked"
          ? colors.text.secondary
          : colors.text.tertiary;

  return (
    <View
      onLayout={onLayout}
      style={{
        backgroundColor: `${node.accent}08`,
        borderLeftWidth: 1,
        borderLeftColor: `${node.accent}30`,
        borderRadius: 4,
        marginVertical: spacing.sm,
        marginLeft: spacing.lg,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: `${node.accent}15`,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Text
            style={{
              fontFamily: "Inter-SemiBold",
              fontSize: 7,
              color: colors.text.secondary,
              letterSpacing: 0.8,
            }}
          >
            {node.pathwayId.toUpperCase()} Lv{node.pathwayLevel}
          </Text>
          <View
            style={{
              backgroundColor: `${stateColor}20`,
              borderRadius: 2,
              paddingHorizontal: spacing.xs,
              paddingVertical: 1,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter-SemiBold",
                fontSize: 7,
                color: stateColor,
                letterSpacing: 0.5,
              }}
            >
              {stateLabel}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Close detail"
        >
          <Text style={{ fontFamily: "Inter-Regular", fontSize: 9, color: colors.text.tertiary }}>
            ✕
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ maxHeight: 240 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: `${node.accent}10`,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontFamily: "Inter-SemiBold", fontSize: 13, color: colors.text.primary }}
            >
              {exercise.name}
            </Text>
          </View>
          <StatBlock label="SETS" value={String(exercise.defaultSets)} color={node.accent} />
          <StatBlock
            label="REPS"
            value={`${exercise.repRange[0]}–${exercise.repRange[1]}`}
            color={colors.text.primary}
          />
          <StatBlock label="REST" value={`${exercise.restInterval}s`} color={colors.text.primary} />
          <StatBlock
            label="TEMPO"
            value={exercise.tempo === "isometric" ? "STATIC" : exercise.tempo}
            color={colors.text.primary}
          />
        </View>

        <View
          style={{
            padding: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: `${node.accent}10`,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter-Regular",
              fontSize: 11,
              color: colors.text.secondary,
              lineHeight: 17,
            }}
          >
            {exercise.description}
          </Text>
          {exercise.biomechanicalNotes && (
            <View
              style={{
                marginTop: spacing.sm,
                backgroundColor: `${colors.accent.DEFAULT}08`,
                borderLeftWidth: 2,
                borderLeftColor: colors.accent.DEFAULT,
                padding: spacing.sm,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter-SemiBold",
                  fontSize: 7,
                  color: colors.accent.DEFAULT,
                  letterSpacing: 0.5,
                  marginBottom: 2,
                }}
              >
                ANATOMY NOTE
              </Text>
              <Text
                style={{
                  fontFamily: "Inter-Regular",
                  fontSize: 10,
                  color: colors.text.secondary,
                  lineHeight: 15,
                }}
              >
                {exercise.biomechanicalNotes}
              </Text>
            </View>
          )}
        </View>

        {hasCheckpoints && (
          <View
            style={{
              padding: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: `${node.accent}10`,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter-SemiBold",
                fontSize: 8,
                color: colors.accent.DEFAULT,
                letterSpacing: 0.5,
                marginBottom: spacing.sm,
              }}
            >
              FORM CHECKPOINTS
            </Text>
            {exercise.visualGuide!.checkpoints.map((cp, idx) => {
              const phaseColor =
                cp.phase === "SETUP" ? "#3B82F6" : cp.phase === "EXECUTION" ? "#10B981" : "#EF4444";
              return (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    marginBottom: spacing.xs,
                    backgroundColor: `${phaseColor}08`,
                    borderRadius: 3,
                    padding: spacing.sm,
                  }}
                >
                  <View
                    style={{
                      width: 2,
                      backgroundColor: phaseColor,
                      borderRadius: 1,
                      marginRight: spacing.sm,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                      <Text
                        style={{
                          fontFamily: "Inter-SemiBold",
                          fontSize: 7,
                          color: phaseColor,
                          letterSpacing: 0.5,
                        }}
                      >
                        {cp.phase}
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter-Regular",
                          fontSize: 7,
                          color: colors.text.secondary,
                          opacity: 0.5,
                        }}
                      >
                        ·
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter-Regular",
                          fontSize: 7,
                          color: colors.text.secondary,
                        }}
                      >
                        {cp.focusPoint}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: "Inter-Regular",
                        fontSize: 10,
                        color: colors.text.primary,
                        lineHeight: 16,
                        marginTop: 1,
                      }}
                    >
                      {cp.instruction}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View
          style={{
            padding: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: `${node.accent}10`,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter-SemiBold",
              fontSize: 8,
              color: colors.accent.DEFAULT,
              letterSpacing: 0.5,
              marginBottom: spacing.sm,
            }}
          >
            SKILL PATH
          </Text>
          <View
            style={{
              backgroundColor: `${node.accent}12`,
              borderRadius: 3,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                fontFamily: "Inter-Regular",
                fontSize: 9,
                color: node.accent,
                letterSpacing: 0.3,
              }}
            >
              Lv {Math.max(1, node.pathwayLevel - 1)} → Lv {node.pathwayLevel} → Lv{" "}
              {Math.min(12, node.pathwayLevel + 1)}
            </Text>
          </View>
          {exercise.overloadMechanism && (
            <View
              style={{
                marginTop: spacing.sm,
                backgroundColor: `${node.accent}08`,
                borderLeftWidth: 2,
                borderLeftColor: node.accent,
                padding: spacing.sm,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter-SemiBold",
                  fontSize: 7,
                  color: node.accent,
                  letterSpacing: 0.5,
                  marginBottom: 2,
                }}
              >
                OVERLOAD MECHANISM
              </Text>
              <Text
                style={{
                  fontFamily: "Inter-Regular",
                  fontSize: 10,
                  color: colors.text.secondary,
                  lineHeight: 15,
                }}
              >
                {exercise.overloadMechanism}
              </Text>
            </View>
          )}
        </View>

        {node.hardPrerequisites.length > 0 && (
          <View style={{ padding: spacing.md }}>
            <Text
              style={{
                fontFamily: "Inter-SemiBold",
                fontSize: 8,
                color: colors.accent.DEFAULT,
                letterSpacing: 0.5,
                marginBottom: spacing.sm,
              }}
            >
              REQUIRED TO UNLOCK
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {node.hardPrerequisites.map((prereqId) => (
                <View
                  key={prereqId}
                  style={{
                    backgroundColor: "#F59E0B15",
                    borderRadius: 2,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter-Regular",
                      fontSize: 8,
                      color: "#F59E0B",
                      letterSpacing: 0.3,
                    }}
                  >
                    {prereqId}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: spacing.sm }} />
      </ScrollView>
    </View>
  );
}

function StatBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text
        style={{
          fontFamily: "Inter-SemiBold",
          fontSize: 7,
          color,
          letterSpacing: 0.5,
          marginBottom: 1,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontFamily: "Inter-SemiBold", fontSize: 11, color, letterSpacing: 0.5 }}>
        {value}
      </Text>
    </View>
  );
}

// ── Branch Grid — Sphere Grid with SVG Lines ───

function BranchGrid({
  branch,
  nodeStates,
  selectedNodeId,
  onNodePress,
  onCloseDetail,
}: {
  branch: SkillBranch;
  nodeStates: Map<string, string>;
  selectedNodeId: string | null;
  onNodePress: (node: SkillNodeData) => void;
  onCloseDetail: () => void;
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [detailPanelHeights, setDetailPanelHeights] = useState<Map<number, number>>(new Map());

  const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const handleDetailLayout = useCallback((row: number, e: LayoutChangeEvent) => {
    setDetailPanelHeights((prev) => {
      const next = new Map(prev);
      next.set(row, e.nativeEvent.layout.height + ROW_GAP);
      return next;
    });
  }, []);

  const connections = useMemo(
    () =>
      calculateConnections(
        branch.nodes,
        nodeStates,
        containerWidth,
        detailPanelHeights,
        branch.accent,
      ),
    [branch.nodes, nodeStates, containerWidth, detailPanelHeights, branch.accent],
  );

  const rows: { left: SkillNodeData; right: SkillNodeData }[] = [];
  for (let i = 0; i < branch.nodes.length; i += 2) {
    if (i + 1 < branch.nodes.length) {
      rows.push({ left: branch.nodes[i], right: branch.nodes[i + 1] });
    }
  }

  const svgHeight = useMemo(() => {
    let h = 0;
    for (let i = 0; i < rows.length; i++) {
      h += ROW_HEIGHT;
      if (i > 0) h += ROW_GAP;
      h += detailPanelHeights.get(i) ?? 0;
    }
    return h + 8;
  }, [rows.length, detailPanelHeights]);

  return (
    <View
      onLayout={handleContainerLayout}
      style={{ position: "relative", paddingVertical: spacing.xs }}
    >
      {containerWidth > 0 && svgHeight > 0 && (
        <Svg
          width={containerWidth}
          height={svgHeight}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {connections.map((line, i) => {
            const opacity =
              line.sourceState === "mastered"
                ? 1
                : line.sourceState === "active"
                  ? 0.7
                  : line.sourceState === "unlocked"
                    ? 0.4
                    : 0.12;
            const dash =
              line.sourceState === "locked" || line.sourceState === "unlocked" ? "4,4" : undefined;

            return (
              <Path
                key={`line-${i}`}
                d={line.pathD}
                stroke={line.accent}
                strokeWidth={1.5}
                strokeDasharray={dash}
                strokeLinecap="round"
                opacity={opacity}
              />
            );
          })}
        </Svg>
      )}

      {rows.map((row, rowIndex) => {
        const leftState = nodeStates.get(row.left.exercise.id) ?? "locked";
        const rightState = nodeStates.get(row.right.exercise.id) ?? "locked";
        const { leftX, rightX } = getSpherePositions(containerWidth || 343);

        return (
          <View key={`row-${rowIndex}`}>
            <View style={{ position: "relative", height: ROW_HEIGHT }}>
              <View
                style={{
                  position: "absolute",
                  left: leftX - SPHERE_CONTAINER_SIZE / 2,
                  top: (ROW_HEIGHT - SPHERE_CONTAINER_SIZE) / 2,
                }}
              >
                <SkillNode
                  node={row.left}
                  isCompleted={leftState === "active" || leftState === "mastered"}
                  isUnlocked={
                    leftState === "unlocked" || leftState === "active" || leftState === "mastered"
                  }
                  isMastered={leftState === "mastered"}
                  isSelected={selectedNodeId === row.left.exercise.id}
                  onPress={() => onNodePress(row.left)}
                  animationDelay={rowIndex * 2 * 30}
                />
              </View>
              <View
                style={{
                  position: "absolute",
                  left: rightX - SPHERE_CONTAINER_SIZE / 2,
                  top: (ROW_HEIGHT - SPHERE_CONTAINER_SIZE) / 2,
                }}
              >
                <SkillNode
                  node={row.right}
                  isCompleted={rightState === "active" || rightState === "mastered"}
                  isUnlocked={
                    rightState === "unlocked" ||
                    rightState === "active" ||
                    rightState === "mastered"
                  }
                  isMastered={rightState === "mastered"}
                  isSelected={selectedNodeId === row.right.exercise.id}
                  onPress={() => onNodePress(row.right)}
                  animationDelay={(rowIndex * 2 + 1) * 30}
                />
              </View>
            </View>

            {(selectedNodeId === row.left.exercise.id ||
              selectedNodeId === row.right.exercise.id) && (
              <InlineDetailPanel
                node={selectedNodeId === row.left.exercise.id ? row.left : row.right}
                nodeState={selectedNodeId === row.left.exercise.id ? leftState : rightState}
                onClose={onCloseDetail}
                onLayout={(e) => handleDetailLayout(rowIndex, e)}
              />
            )}

            {rowIndex < rows.length - 1 &&
              selectedNodeId !== row.left.exercise.id &&
              selectedNodeId !== row.right.exercise.id && <View style={{ height: ROW_GAP }} />}
          </View>
        );
      })}
    </View>
  );
}

// ── Main Component ─────────────────────────────

export function SkillTreeView() {
  const colors = useColors();
  const dialog = useDialog();
  const [treeReady, setTreeReady] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FamilyFilter>("all");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const [contentWidth, setContentWidth] = useState(0);
  const initialAutoExpandDone = useRef(false);
  const workoutHistory = useUserStore((state) => state.workoutHistory);
  const masteredExerciseIds = useUserStore((state) => state.masteredExerciseIds ?? []);
  const masteredIds = useMemo(() => new Set(masteredExerciseIds), [masteredExerciseIds]);

  useEffect(() => {
    getSkillTree8();
    setTreeReady(true);
  }, []);

  const completedExercises = useMemo(() => extractCompletedIds(workoutHistory), [workoutHistory]);

  const nodeStates = useMemo(
    () => (treeReady ? computeNodeStates(completedExercises, masteredIds) : new Map()),
    [completedExercises, masteredIds, treeReady],
  );

  const summary = useMemo(
    () =>
      treeReady
        ? getUnlockSummary(completedExercises, masteredIds)
        : { total: 96, mastered: 0, active: 0, unlocked: 0, locked: 96 },
    [completedExercises, masteredIds, treeReady],
  );

  // Fire sound effects when nodes transition between states
  useSkillTreeSounds(nodeStates, treeReady);

  const hasSeenIntro = useUserStore((state) => state.hasSeenSkillTreeIntro);
  const markIntroSeen = useUserStore((state) => state.markSkillTreeIntroSeen);

  const filteredBranches = useMemo(() => {
    if (!treeReady) return [];
    const tree = getSkillTree8();
    if (activeFilter === "all") return tree;
    return tree.filter((b) => b.parentFamily === activeFilter);
  }, [activeFilter, treeReady]);

  const handleNodePress = useCallback((node: SkillNodeData) => {
    setSelectedNodeId((prev) => (prev === node.exercise.id ? null : node.exercise.id));
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleContentLayout = useCallback((e: LayoutChangeEvent) => {
    setContentWidth(e.nativeEvent.layout.width);
  }, []);

  const handleToggleBranch = useCallback((id: string) => {
    setExpandedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const showPathwayKey = useCallback(() => {
    dialog.alert({
      title: "PATHWAY KEY",
      message:
        Object.entries(PATHWAY_LABELS)
          .map(([abbr, full]) => `${abbr}  =  ${full}`)
          .join("\n") +
        "\n\n" +
        "Push  =  Pectorals, Deltoids, Triceps\n" +
        "Pull  =  Lats, Rhomboids, Biceps\n" +
        "Legs  =  Quads, Glutes, Hamstrings\n" +
        "Core  =  Abdominals, Obliques, Lower Back",
    });
  }, [dialog]);

  useEffect(() => {
    if (!treeReady || initialAutoExpandDone.current) return;
    initialAutoExpandDone.current = true;

    const tree = getSkillTree8();
    const next = new Set<string>();
    for (const branch of tree) {
      const hasActivity = branch.nodes.some((n) => {
        const state = nodeStates.get(n.exercise.id);
        return state === "active" || state === "mastered";
      });
      if (hasActivity) {
        next.add(branch.id);
      }
    }
    // If nothing is active, expand first branch of each family
    if (next.size === 0 && tree.length > 0) {
      next.add(tree[0].id);
      if (tree[1]) next.add(tree[1].id);
    }

    setExpandedBranches(next);
  }, [treeReady, nodeStates]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      {/* Mastery summary bar */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: spacing.md,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          backgroundColor: colors.bg.elevated,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        <StarStat label="TOTAL" value={summary.total.toString()} color={colors.text.secondary} />
        <StarStat label="MASTERED" value={summary.mastered.toString()} color={colors.success} />
        <StarStat label="ACTIVE" value={summary.active.toString()} color={colors.accent.DEFAULT} />
        <StarStat label="LOCKED" value={summary.locked.toString()} color={colors.text.tertiary} />
      </View>

      {/* Filter tabs + pathway key */}
      <View
        style={{
          flexDirection: "row",
          gap: spacing.xs,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          backgroundColor: colors.bg.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
          alignItems: "center",
        }}
      >
        {FAMILY_FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          const accentColor = f.key === "all" ? colors.text.secondary : getFamilyAccent(f.key);

          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => {
                setActiveFilter(f.key);
                setSelectedNodeId(null);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${f.label}`}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: spacing.sm,
                backgroundColor: isActive ? `${accentColor}10` : "transparent",
                borderWidth: 1,
                borderColor: isActive ? `${accentColor}30` : "transparent",
                borderRadius: 3,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter-SemiBold",
                  fontSize: 7,
                  color: isActive ? accentColor : colors.text.tertiary,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        {/* Pathway abbreviations key */}
        <TouchableOpacity
          onPress={showPathwayKey}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel="Show pathway abbreviation key"
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderWidth: 1,
            borderColor: colors.border.subtle,
            borderRadius: 3,
            backgroundColor: colors.bg.elevated,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.text.tertiary }}>?</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable tree */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: spacing[16],
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View onLayout={handleContentLayout} style={{ position: "relative" }}>
          {!treeReady ? (
            <LoadingSkeleton />
          ) : filteredBranches.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Branch containers with collapsible nodes */}
              {filteredBranches.map((branch) => {
                const isExpanded = expandedBranches.has(branch.id);
                return (
                  <View
                    key={branch.id}
                    style={{
                      marginBottom: spacing.lg,
                      backgroundColor: `${branch.accent}03`,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: `${branch.accent}08`,
                      overflow: "hidden",
                    }}
                  >
                    <BranchHeader
                      branch={branch}
                      nodeStates={nodeStates}
                      isExpanded={isExpanded}
                      onToggle={() => handleToggleBranch(branch.id)}
                    />

                    {isExpanded && (
                      <>
                        <BranchProgress branch={branch} nodeStates={nodeStates} />
                        <BranchGrid
                          branch={branch}
                          nodeStates={nodeStates}
                          selectedNodeId={selectedNodeId}
                          onNodePress={handleNodePress}
                          onCloseDetail={handleCloseDetail}
                        />
                      </>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {/* Legend */}
          {treeReady && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: spacing.lg,
                paddingVertical: spacing.lg,
                borderTopWidth: 1,
                borderTopColor: colors.border.subtle,
                marginTop: spacing.sm,
              }}
            >
              <LegendDot color={colors.success} label="MASTERED" />
              <LegendDot color={colors.accent.DEFAULT} label="ACTIVE" />
              <LegendDot color={colors.text.secondary} label="UNLOCKED" />
              <LegendDot color={colors.text.tertiary} label="LOCKED" />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Quick-start overlay on first visit */}
      {treeReady && !hasSeenIntro && <SkillTreeIntroOverlay onDismiss={markIntroSeen} />}
    </View>
  );
}

// ── Small helpers ──────────────────────────────

function StarStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontFamily: "Inter-SemiBold", fontSize: 11, color, letterSpacing: 0.5 }}>
        {value}
      </Text>
      <Text
        style={{
          fontFamily: "Inter-Regular",
          fontSize: 6,
          color,
          opacity: 0.5,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: `${color}30`,
          borderWidth: 1,
          borderColor: color,
        }}
      />
      <Text
        style={{
          fontFamily: "Inter-Regular",
          fontSize: 7,
          color,
          letterSpacing: 0.5,
          opacity: 0.7,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function EmptyState() {
  const colors = useColors();
  return (
    <View
      style={{ alignItems: "center", paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.text.tertiary,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.md,
          opacity: 0.3,
        }}
      >
        <Text style={{ fontSize: 18, color: colors.text.tertiary }}>○</Text>
      </View>
      <Text
        style={{
          fontFamily: "Inter-Regular",
          fontSize: 12,
          color: colors.text.tertiary,
          textAlign: "center",
        }}
      >
        No exercises match this filter
      </Text>
    </View>
  );
}

function LoadingSkeleton() {
  const colors = useColors();
  return (
    <View>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            marginBottom: spacing.lg,
            backgroundColor: colors.bg.elevated,
            borderRadius: 6,
            padding: spacing.sm,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colors.bg.highlight,
                marginRight: spacing.sm,
              }}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <View
                style={{
                  width: "30%",
                  height: 8,
                  backgroundColor: colors.bg.highlight,
                  borderRadius: 1,
                }}
              />
              <View
                style={{
                  width: "50%",
                  height: 6,
                  backgroundColor: colors.bg.highlight,
                  borderRadius: 1,
                }}
              />
            </View>
          </View>
          <View
            style={{ height: 1, backgroundColor: colors.border.subtle, marginBottom: spacing.sm }}
          />
          {[1, 2, 3].map((j) => (
            <View
              key={j}
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginBottom: spacing.sm,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.bg.highlight,
                }}
              />
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.bg.highlight,
                }}
              />
            </View>
          ))}
        </View>
      ))}
      <Text
        style={{
          fontFamily: "Inter-Regular",
          fontSize: 8,
          color: colors.text.tertiary,
          textAlign: "center",
          marginTop: spacing.lg,
        }}
      >
        Loading skill tree…
      </Text>
    </View>
  );
}
