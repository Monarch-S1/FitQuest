import { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useColors, typography, spacing } from "../../tokens";
import {
  SKILL_TREE,
  SkillBranch,
  SkillNode as SkillNodeData,
  MovementFamily,
} from "../../data/skillTree";
import { SkillNode } from "./SkillNode";
import { SkillDetailSheet } from "./SkillDetailSheet";
import { useUserStore } from "../../stores/useUserStore";

type FamilyFilter = "all" | MovementFamily;

const FAMILY_FILTERS: { key: FamilyFilter; label: string }[] = [
  { key: "all", label: "ALL" },
  { key: "push", label: "PUSH" },
  { key: "pull", label: "PULL" },
  { key: "legs", label: "LEGS" },
  { key: "core", label: "CORE" },
];

interface BranchHeaderProps {
  branch: SkillBranch;
}

function BranchHeader({ branch }: BranchHeaderProps) {
  const colors = useColors();

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
      {/* Colored icon circle */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
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
        <Text
          style={{
            ...typography.h3,
            color: branch.accent,
            fontSize: 13,
            letterSpacing: 1.5,
          }}
        >
          {branch.label}
        </Text>
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

// ── Empty state ────────────────────────────────

function EmptyState({ family }: { family: string }) {
  const colors = useColors();
  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: spacing[8],
        paddingHorizontal: spacing[4],
      }}
    >
      <Text style={{ fontSize: 32, marginBottom: spacing[3], opacity: 0.3 }}>
        {family === "push" ? "⬆" : family === "pull" ? "⬇" : family === "legs" ? "⬍" : "◈"}
      </Text>
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
      <Text
        style={{
          ...typography.body,
          color: colors.text.secondary,
          fontSize: 11,
          textAlign: "center",
          marginTop: spacing[1],
          opacity: 0.6,
        }}
      >
        All exercises in this family are hidden
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

  // Derive completed exercise IDs from workout history
  const completedExercises = useMemo(() => {
    const completed = new Set<string>();
    for (const session of workoutHistory) {
      for (const ex of session.exercises || []) {
        if (ex.repsCompleted?.length) {
          completed.add(ex.exerciseId);
        }
      }
    }
    return completed;
  }, [workoutHistory]);

  // Derive attempted (unlocked) exercises — ones whose family has at least one completed exercise,
  // or exercises that share a muscle group with a completed one
  const unlockedExercises = useMemo(() => {
    const unlocked = new Set<string>();

    // All exercises in a family are unlocked if at least one in that family is completed
    for (const branch of SKILL_TREE) {
      const anyCompleted = branch.nodes.some((n) => completedExercises.has(n.exercise.id));
      if (anyCompleted) {
        for (const node of branch.nodes) {
          unlocked.add(node.exercise.id);
        }
      }
    }

    // If nothing is completed yet, unlock all beginner exercises
    if (completedExercises.size === 0) {
      for (const branch of SKILL_TREE) {
        for (const node of branch.nodes) {
          if (node.difficulty === "beginner") {
            unlocked.add(node.exercise.id);
          }
        }
      }
    }

    // Always unlock the first exercise in each family
    for (const branch of SKILL_TREE) {
      if (branch.nodes.length > 0) {
        unlocked.add(branch.nodes[0].exercise.id);
      }
    }

    return unlocked;
  }, [completedExercises]);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    if (activeFilter === "all") return SKILL_TREE;
    return SKILL_TREE.filter((b) => b.family === activeFilter);
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
    for (const branch of SKILL_TREE) {
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
            f.key === "all"
              ? colors.text.secondary
              : SKILL_TREE.find((b) => b.family === f.key)?.accent || colors.accent.DEFAULT;

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
              <Text
                style={{
                  ...typography.bodySmall,
                  color: isActive ? accentColor : colors.text.secondary,
                  fontSize: 9,
                  letterSpacing: 0.8,
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Scrollable tree */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[16] }}
        showsVerticalScrollIndicator={false}
      >
        {filteredBranches.map((branch) => (
          <View key={branch.family} style={{ marginBottom: spacing[4] }}>
            <BranchHeader branch={branch} />

            {branch.nodes.length === 0 ? (
              <EmptyState family={branch.family} />
            ) : (
              branch.nodes.map((node) => (
                <View key={node.exercise.id}>
                  {/* Connector line (except for first node) */}
                  {branch.nodes.indexOf(node) > 0 && (
                    <View style={{ alignItems: "center", paddingVertical: 2 }}>
                      <View
                        style={{
                          width: 1,
                          height: 12,
                          backgroundColor: completedExercises.has(node.exercise.id)
                            ? colors.success
                            : colors.border.subtle,
                          opacity: 0.4,
                        }}
                      />
                    </View>
                  )}

                  <SkillNode
                    node={node}
                    isCompleted={completedExercises.has(node.exercise.id)}
                    isUnlocked={unlockedExercises.has(node.exercise.id)}
                    isSelected={selectedNodeId === node.exercise.id}
                    onPress={() => handleNodePress(node)}
                  />
                </View>
              ))
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[1] }}>
            <View
              style={{ width: 10, height: 3, backgroundColor: colors.success, borderRadius: 1 }}
            />
            <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 7 }}>
              COMPLETED
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[1] }}>
            <View
              style={{
                width: 10,
                height: 3,
                backgroundColor: colors.accent.DEFAULT,
                borderRadius: 1,
              }}
            />
            <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 7 }}>
              UNLOCKED
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[1] }}>
            <View
              style={{
                width: 10,
                height: 3,
                backgroundColor: colors.border.subtle,
                borderRadius: 1,
              }}
            />
            <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 7 }}>
              LOCKED
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Detail Sheet (slides up from bottom) */}
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
          }}
        >
          <SkillDetailSheet node={selectedNode} onClose={() => setSelectedNodeId(null)} />
        </View>
      )}
    </View>
  );
}
