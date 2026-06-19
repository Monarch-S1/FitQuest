import { View, Text, TouchableOpacity } from "react-native";
import { useColors, typography, spacing } from "../../tokens";
import { SkillNode as SkillNodeData, DifficultyTier } from "../../data/skillTree";

interface SkillNodeProps {
  node: SkillNodeData;
  isCompleted: boolean;
  isUnlocked: boolean;
  isMastered: boolean;
  isSelected: boolean;
  onPress: () => void;
}

const NODE_STATE_CONFIG = {
  mastered: { icon: "★", label: "MASTERED" },
  active: { icon: "◆", label: "ACTIVE" },
  unlocked: { icon: "▷", label: "UNLOCKED" },
  locked: { icon: "◈", label: "LOCKED" },
} as const;

const DIFFICULTY_COLORS: Record<DifficultyTier, string> = {
  beginner: "#10B981",
  intermediate: "#F59E0B",
  advanced: "#EF4444",
};

const DIFFICULTY_LABELS: Record<DifficultyTier, string> = {
  beginner: "BEGINNER",
  intermediate: "INTERMEDIATE",
  advanced: "ADVANCED",
};

export function SkillNode({ node, isCompleted, isUnlocked, isMastered, isSelected, onPress }: SkillNodeProps) {
  const colors = useColors();

  const state =
    isMastered ? "mastered" :
    isCompleted ? "active" :
    isUnlocked ? "unlocked" :
    "locked";

  const stateCfg = NODE_STATE_CONFIG[state];

  const accentColor =
    state === "mastered" ? colors.success :
    state === "active" ? node.accent :
    state === "unlocked" ? node.accent :
    colors.border.subtle;

  const diffColor = DIFFICULTY_COLORS[node.difficulty];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isSelected
          ? `${accentColor}15`
          : state === "mastered"
            ? `${colors.success}10`
            : state === "active"
              ? `${node.accent}10`
              : colors.bg.elevated,
        borderWidth: 1,
        borderColor: isSelected
          ? accentColor
          : state === "mastered"
            ? `${colors.success}40`
            : state === "active"
              ? `${node.accent}40`
              : colors.border.subtle,
        borderRadius: 4,
        paddingLeft: 0,
        paddingRight: spacing[3],
        marginBottom: spacing[2],
        overflow: "hidden",
        opacity: state === "locked" ? 0.45 : 1,
      }}
    >
      {/* Accent stripe */}
      <View
        style={{
          width: 3,
          alignSelf: "stretch",
          backgroundColor: accentColor,
          opacity: state === "mastered" || state === "active" ? 1 : 0.4,
          marginRight: spacing[2],
        }}
      />

      {/* Content */}
      <View style={{ flex: 1, paddingVertical: spacing[2] }}>
        {/* Exercise name + pathway level badge */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}>
          <Text
            style={{
              ...typography.h3,
              color: state !== "locked" ? colors.text.primary : colors.text.secondary,
              fontSize: 14,
              flex: 1,
              letterSpacing: 0.5,
            }}
            numberOfLines={1}
          >
            {node.exercise.name.toUpperCase()}
          </Text>

          {/* Level badge */}
          <View
            style={{
              backgroundColor: `${node.accent}15`,
              borderWidth: 1,
              borderColor: `${node.accent}30`,
              borderRadius: 1,
              paddingHorizontal: spacing[1],
            }}
          >
            <Text style={{ ...typography.bodySmall, color: node.accent, fontSize: 7 }}>
              Lv{node.pathwayLevel}
            </Text>
          </View>

          {/* State icon */}
          <Text style={{
            fontSize: 12,
            color:
              state === "mastered" ? colors.success :
              state === "active" ? node.accent :
              state === "unlocked" ? colors.text.secondary :
              colors.text.tertiary,
          }}>
            {state === "mastered" ? "★" :
             state === "active" ? "◇" :
             state === "unlocked" ? "▷" : "◆"}
          </Text>
        </View>

        {/* State label + difficulty + rep range */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[2],
            marginTop: spacing[1],
          }}
        >
          {/* State badge */}
          <View
            style={{
              backgroundColor: `${accentColor}20`,
              borderWidth: 1,
              borderColor: `${accentColor}40`,
              borderRadius: 1,
              paddingHorizontal: spacing[1],
              paddingVertical: 1,
            }}
          >
            <Text
              style={{
                ...typography.bodySmall,
                color: accentColor,
                fontSize: 7,
                letterSpacing: 0.8,
              }}
            >
              {stateCfg.label}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: `${diffColor}20`,
              borderWidth: 1,
              borderColor: `${diffColor}40`,
              borderRadius: 1,
              paddingHorizontal: spacing[1],
              paddingVertical: 1,
            }}
          >
            <Text
              style={{
                ...typography.bodySmall,
                color: diffColor,
                fontSize: 7,
                letterSpacing: 0.8,
              }}
            >
              {DIFFICULTY_LABELS[node.difficulty]}
            </Text>
          </View>
          <Text
            style={{
              ...typography.bodySmall,
              color: colors.text.secondary,
              fontSize: 8,
            }}
          >
            {node.exercise.repRange[0]}–{node.exercise.repRange[1]} reps
          </Text>
        </View>

        {/* Muscle targets */}
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[1], marginTop: spacing[1] }}
        >
          {node.exercise.targetMuscles.slice(0, 3).map((muscle) => (
            <View
              key={muscle}
              style={{
                backgroundColor: `${accentColor}10`,
                borderRadius: 1,
                paddingHorizontal: spacing[1],
                paddingVertical: 1,
              }}
            >
              <Text
                style={{
                  ...typography.bodySmall,
                  color: state !== "locked" ? accentColor : colors.text.secondary,
                  fontSize: 6,
                  opacity: state !== "locked" ? 0.8 : 0.4,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {muscle.replace(/_/g, " ")}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Chevron */}
      <Text
        style={{
          color: isSelected ? accentColor : colors.text.secondary,
          fontSize: 10,
          opacity: isSelected ? 1 : 0.3,
        }}
      >
        {isSelected ? "▼" : "▶"}
      </Text>
    </TouchableOpacity>
  );
}
