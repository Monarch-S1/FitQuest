import { View, Text, TouchableOpacity } from "react-native";
import { useColors, typography, spacing } from "../../tokens";
import { SkillNode as SkillNodeData, DifficultyTier } from "../../data/skillTree";

interface SkillNodeProps {
  node: SkillNodeData;
  isCompleted: boolean;
  isUnlocked: boolean;
  isSelected: boolean;
  onPress: () => void;
}

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

export function SkillNode({ node, isCompleted, isUnlocked, isSelected, onPress }: SkillNodeProps) {
  const colors = useColors();

  const accentColor = isCompleted
    ? colors.success
    : isUnlocked
      ? node.accent
      : colors.border.subtle;

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
          : isCompleted
            ? `${colors.success}10`
            : colors.bg.elevated,
        borderWidth: 1,
        borderColor: isSelected
          ? accentColor
          : isCompleted
            ? `${colors.success}40`
            : colors.border.subtle,
        borderRadius: 4,
        paddingLeft: 0,
        paddingRight: spacing[3],
        marginBottom: spacing[2],
        overflow: "hidden",
        opacity: isUnlocked ? 1 : 0.45,
      }}
    >
      {/* Accent stripe */}
      <View
        style={{
          width: 3,
          alignSelf: "stretch",
          backgroundColor: accentColor,
          opacity: isCompleted ? 1 : isUnlocked ? 0.8 : 0.2,
          marginRight: spacing[2],
        }}
      />

      {/* Content */}
      <View style={{ flex: 1, paddingVertical: spacing[2] }}>
        {/* Exercise name */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}>
          <Text
            style={{
              ...typography.h3,
              color: isUnlocked ? colors.text.primary : colors.text.secondary,
              fontSize: 14,
              flex: 1,
              letterSpacing: 0.5,
            }}
            numberOfLines={1}
          >
            {node.exercise.name.toUpperCase()}
          </Text>
          {isCompleted && <Text style={{ fontSize: 14, color: colors.success }}>✓</Text>}
          {!isUnlocked && !isCompleted && (
            <Text style={{ fontSize: 12, color: colors.text.secondary }}>🔒</Text>
          )}
        </View>

        {/* Difficulty & rep range */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[2],
            marginTop: spacing[1],
          }}
        >
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
          {node.exercise.tempo !== "isometric" && (
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.secondary,
                fontSize: 8,
                opacity: 0.6,
              }}
            >
              {node.exercise.tempo} tempo
            </Text>
          )}
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
                  color: isUnlocked ? accentColor : colors.text.secondary,
                  fontSize: 6,
                  opacity: isUnlocked ? 0.8 : 0.4,
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
