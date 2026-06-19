/**
 * SkillTreeView — 8-Branch Version
 *
 * Displays all 96 exercises organized into 8 movement pathways
 * with filterable tabs (ALL, PUSH, PULL, LEGS, CORE) and
 * mastery-progression states per node.
 */

import { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useColors, typography, spacing } from "../../tokens";
import {
  SKILL_TREE_8,
  SkillBranch,
  SkillNode as SkillNodeData,
  computeNodeStates,
} from "../../data/skillTree";
import { PARENT_FAMILIES, getPathwayByParent, ParentFamily } from "../../data/pathways";
import { SkillNode } from "./SkillNode";
import { SkillDetailSheet } from "./SkillDetailSheet";
import { useUserStore } from "../../stores/useUserStore";
import { extractCompletedIds, getUnlockSummary } from "../../utils/skillUnlocks";

type FamilyFilter = "all" | ParentFamily;

const FAMILY_FILTERS: { key: FamilyFilter; label: string; icon: string }[] = [
  { key: "all", label: "ALL", icon: "✦" },
  { key: "push", label: "PUSH", icon: "⬆" },
  { key: "pull", label: "PULL", icon: "⬇" },
  { key: "legs", label: "LEGS", icon: "⬍" },
  { key: "core", label: "CORE", icon: "◈" },
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

// ── Branch Header ──────────────────────────────

function BranchHeader({ branch }: { branch: SkillBranch }) {
  const colors = useColors();

  // Count states within this branch
  const [completedCount, masteredCount] = useMemo(() => {
    let completed = 0, mastered = 0;
    for (const node of branch.nodes) {
      if (node.exercise.id) {
        // We don't have the full state here, pass from parent
      }
    }
    return [0, 0];
  }, [branch]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[1],
        marginBottom: spacing[2],
        borderBottomWidth: 1,
        borderBottomColor: `${branch.accent}30`,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${branch.accent}15`,
          borderWidth: 1,
          borderColor: `${branch.accent}30`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: spacing[3],
        }}
      >
        <Text style={{ fontSize: 14 }}>{branch.icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}>
          <Text
            style={{
              ...typography.h3,
              color: branch.accent,
              fontSize: 12,
              letterSpacing: 1.5,
            }}
          >
            {branch.label}
          </Text>
          <View
            style={{
              backgroundColor: `${branch.accent}10`,
              borderWidth: 1,
              borderColor: `${branch.accent}20`,
              borderRadius: 1,
              paddingHorizontal: spacing[1],
            }}
          >
            <Text style={{ ...typography.bodySmall, color: branch.accent, fontSize: 7 }}>
              Lv 1–12
            </Text>
          </View>
        </View>
        <Text
          style={{
            ...typography.bodySmall,
            color: colors.text.secondary,
            fontSize: 8,
            marginTop: 1,
            opacity: 0.7,
          }}
        >
          {branch.description}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: `${branch.accent}15`,
          borderWidth: 1,
          borderColor: `${branch.accent}25`,
          borderRadius: 1,
          paddingHorizontal: spacing[2],
          paddingVertical: spacing[1],
        }}
      >
        <Text
          style={{
            ...typography.bodySmall,
            color: branch.accent,
            fontSize: 9,
            letterSpacing: 0.5,
          }}
        >
          {branch.nodes.length} MOVES
        </Text>
      </View>
    </View>
  );
}

// ── Mastery Progress Bar per branch ──────────

function BranchProgress({
  branch,
  nodeStates,
}: {
  branch: SkillBranch;
  nodeStates: Map<string, string>;
}) {
  const colors = useColors();
  const total = branch.nodes.length;
  const mastered = branch.nodes.filter(
    (n) => nodeStates.get(n.exercise.id) === "mastered",
  ).length;
  const active = branch.nodes.filter(
    (n) => nodeStates.get(n.exercise.id) === "active",
  ).length;
  const pct = total > 0 ? (mastered / total) * 100 : 0;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2], marginBottom: spacing[2] }}>
      <View
        style={{
          flex: 1,
          height: 4,
          backgroundColor: colors.bg.elevated,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${pct}%` as any,
            height: "100%",
            backgroundColor: branch.accent,
            borderRadius: 2,
          }}
        />
      </View>
      <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 7 }}>
        {mastered}/{total}
      </Text>
    </View>
  );
}

// ── Main component ─────────────────────────────

export function SkillTreeView() {
  const colors = useColors();
  const [activeFilter, setActiveFilter] = useState<FamilyFilter>("all");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const workoutHistory = useUserStore((state) => state.workoutHistory);
  const masteredIds = useUserStore((state) =>
    new Set(state.masteredExerciseIds ?? []),
  );

  // Derive completed exercise IDs from workout history
  const completedExercises = useMemo(
    () => extractCompletedIds(workoutHistory),
    [workoutHistory],
  );

  // Compute node states using full 8-branch logic
  const nodeStates = useMemo(
    () => computeNodeStates(completedExercises, masteredIds),
    [completedExercises, masteredIds],
  );

  // Unlock summary
  const summary = useMemo(
    () => getUnlockSummary(completedExercises, masteredIds),
    [completedExercises, masteredIds],
  );

  // Filter branches
  const filteredBranches = useMemo(() => {
    if (activeFilter === "all") return SKILL_TREE_8;
    return SKILL_TREE_8.filter((b) => b.parentFamily === activeFilter);
  }, [activeFilter]);

  const handleNodePress = (node: SkillNodeData) => {
    if (selectedNodeId === node.exercise.id) {
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(node.exercise.id);
    }
  };

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    for (const branch of SKILL_TREE_8) {
      const found = branch.nodes.find((n) => n.exercise.id === selectedNodeId);
      if (found) return found;
    }
    return null;
  }, [selectedNodeId]);

  return (
    <View style={{ flex: 1 }}>
      {/* Filter tabs */}
      <View
        style={{
          flexDirection: "row",
          gap: spacing[1],
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[2],
          backgroundColor: colors.bg.primary,
        }}
      >
        {FAMILY_FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          const accentColor =
            f.key === "all" ? colors.text.secondary : getFamilyAccent(f.key);

          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => {
                setActiveFilter(f.key);
                setSelectedNodeId(null);
              }}
              activeOpacity={0.7}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: spacing[2],
                backgroundColor: isActive ? `${accentColor}15` : "transparent",
                borderWidth: 1,
                borderColor: isActive ? `${accentColor}40` : colors.border.subtle,
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: 10, marginBottom: 2 }}>
                {f.icon}
              </Text>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: isActive ? accentColor : colors.text.secondary,
                  fontSize: 8,
                  letterSpacing: 0.8,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Mastery summary bar */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: spacing[3],
          paddingVertical: spacing[2],
          paddingHorizontal: spacing[4],
          backgroundColor: colors.bg.elevated,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        <Stat label="TOTAL" value={summary.total.toString()} color={colors.text.secondary} />
        <Stat label="MASTERED" value={summary.mastered.toString()} color={colors.success} />
        <Stat label="ACTIVE" value={summary.active.toString()} color={colors.accent.DEFAULT} />
        <Stat label="LOCKED" value={summary.locked.toString()} color={colors.text.tertiary} />
      </View>

      {/* Scrollable tree */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[16] }}
        showsVerticalScrollIndicator={false}
      >
        {filteredBranches.map((branch) => (
          <View key={branch.id} style={{ marginBottom: spacing[4] }}>
            <BranchHeader branch={branch} />
            <BranchProgress branch={branch} nodeStates={nodeStates} />

            {branch.nodes.length === 0 ? (
              <EmptyState />
            ) : (
              branch.nodes.map((node) => {
                const state = nodeStates.get(node.exercise.id) ?? "locked";
                const isCompleted =
                  state === "active" || state === "mastered";
                const isUnlocked =
                  state === "unlocked" || state === "active" || state === "mastered";
                const isMastered = state === "mastered";

                return (
                  <View key={node.exercise.id}>
                    {/* Connector line */}
                    {branch.nodes.indexOf(node) > 0 && (
                      <View style={{ alignItems: "center", paddingVertical: 2 }}>
                        <View
                          style={{
                            width: 1,
                            height: 12,
                            backgroundColor: isCompleted
                              ? colors.success
                              : colors.border.subtle,
                            opacity: 0.4,
                          }}
                        />
                      </View>
                    )}

                    <SkillNode
                      node={node}
                      isCompleted={isCompleted}
                      isUnlocked={isUnlocked}
                      isMastered={isMastered}
                      isSelected={selectedNodeId === node.exercise.id}
                      onPress={() => handleNodePress(node)}
                    />
                  </View>
                );
              })
            )}
          </View>
        ))}

        {/* Legend */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: spacing[4],
            paddingVertical: spacing[4],
            borderTopWidth: 1,
            borderTopColor: colors.border.subtle,
            marginTop: spacing[2],
          }}
        >
          <LegendItem color={colors.success} label="MASTERED" />
          <LegendItem color={colors.accent.DEFAULT} label="ACTIVE" />
          <LegendItem color={colors.text.secondary} label="UNLOCKED" />
          <LegendItem color={colors.border.subtle} label="LOCKED" />
        </View>
      </ScrollView>

      {/* Detail Sheet */}
      {selectedNode && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.bg.primary,
            borderTopWidth: 1,
            borderTopColor: selectedNode.accent,
            maxHeight: "60%",
          }}
        >
          <SkillDetailSheet
            node={selectedNode}
            nodeState={nodeStates.get(selectedNode.exercise.id) ?? "locked"}
            onClose={() => setSelectedNodeId(null)}
          />
        </View>
      )}
    </View>
  );
}

// ── Small helpers ──────────────────────────────

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ ...typography.label, color, fontSize: 10 }}>{value}</Text>
      <Text style={{ ...typography.bodySmall, color, fontSize: 6, opacity: 0.6 }}>
        {label}
      </Text>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View style={{ width: 10, height: 3, backgroundColor: color, borderRadius: 1 }} />
      <Text style={{ ...typography.bodySmall, color, fontSize: 7 }}>{label}</Text>
    </View>
  );
}

function EmptyState() {
  const colors = useColors();
  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: spacing[8],
        paddingHorizontal: spacing[4],
      }}
    >
      <Text style={{ fontSize: 32, marginBottom: spacing[3], opacity: 0.3 }}>◇</Text>
      <Text
        style={{
          ...typography.h3,
          color: colors.text.secondary,
          fontSize: 16,
          textAlign: "center",
        }}
      >
        No exercises match this filter
      </Text>
    </View>
  );
}
