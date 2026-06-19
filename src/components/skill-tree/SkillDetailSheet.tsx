import { View, Text, ScrollView } from "react-native";
import { useColors, typography, spacing } from "../../tokens";
import { SkillNode } from "../../data/skillTree";
import { Button } from "../ui/Button";

interface SkillDetailSheetProps {
  node: SkillNode;
  onClose: () => void;
}

export function SkillDetailSheet({ node, onClose }: SkillDetailSheetProps) {
  const colors = useColors();

  const { exercise } = node;
  const hasCheckpoints = exercise.visualGuide?.checkpoints?.length;

  return (
    <ScrollView
      style={{
        backgroundColor: colors.bg.primary,
        borderTopWidth: 1,
        borderTopColor: node.accent,
        maxHeight: 420,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          padding: spacing[4],
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                ...typography.label,
                color: node.accent,
                fontSize: 9,
                marginBottom: spacing[1],
              }}
            >
              {node.family.toUpperCase()} · {node.difficulty.toUpperCase()}
            </Text>
            <Text
              style={{
                ...typography.h2,
                color: colors.text.primary,
                fontSize: 22,
              }}
            >
              {exercise.name.toUpperCase()}
            </Text>
          </View>
          <Button title="CLOSE" onPress={onClose} variant="secondary" size="sm" />
        </View>

        {/* Rep scheme */}
        <View style={{ flexDirection: "row", gap: spacing[3], marginTop: spacing[3] }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ ...typography.label, color: colors.accent.DEFAULT, fontSize: 9 }}>
              SETS
            </Text>
            <Text style={{ ...typography.h2, color: colors.text.primary, fontSize: 20 }}>
              {exercise.defaultSets}
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.border.subtle }} />
          <View style={{ alignItems: "center" }}>
            <Text style={{ ...typography.label, color: colors.accent.DEFAULT, fontSize: 9 }}>
              REPS
            </Text>
            <Text style={{ ...typography.h2, color: colors.text.primary, fontSize: 20 }}>
              {exercise.repRange[0]}–{exercise.repRange[1]}
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.border.subtle }} />
          <View style={{ alignItems: "center" }}>
            <Text style={{ ...typography.label, color: colors.accent.DEFAULT, fontSize: 9 }}>
              REST
            </Text>
            <Text style={{ ...typography.h2, color: colors.text.primary, fontSize: 20 }}>
              {exercise.restInterval}s
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.border.subtle }} />
          <View style={{ alignItems: "center" }}>
            <Text style={{ ...typography.label, color: colors.accent.DEFAULT, fontSize: 9 }}>
              TEMPO
            </Text>
            <Text style={{ ...typography.h2, color: colors.text.primary, fontSize: 20 }}>
              {exercise.tempo}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View
        style={{
          padding: spacing[4],
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        <Text
          style={{
            ...typography.label,
            color: colors.accent.DEFAULT,
            fontSize: 9,
            marginBottom: spacing[2],
          }}
        >
          DESCRIPTION
        </Text>
        <Text
          style={{ ...typography.body, color: colors.text.secondary, fontSize: 12, lineHeight: 20 }}
        >
          {exercise.description}
        </Text>
        {exercise.biomechanicalNotes && (
          <View
            style={{
              marginTop: spacing[2],
              backgroundColor: `${colors.accent.DEFAULT}08`,
              borderLeftWidth: 2,
              borderLeftColor: colors.accent.DEFAULT,
              padding: spacing[2],
            }}
          >
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.accent.DEFAULT,
                fontSize: 9,
                marginBottom: 2,
              }}
            >
              ANATOMY NOTE
            </Text>
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.secondary,
                fontSize: 10,
                lineHeight: 16,
              }}
            >
              {exercise.biomechanicalNotes}
            </Text>
          </View>
        )}
      </View>

      {/* Form Checkpoints */}
      {hasCheckpoints && (
        <View
          style={{
            padding: spacing[4],
            borderBottomWidth: 1,
            borderBottomColor: colors.border.subtle,
          }}
        >
          <Text
            style={{
              ...typography.label,
              color: colors.accent.DEFAULT,
              fontSize: 9,
              marginBottom: spacing[2],
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
                  marginBottom: spacing[2],
                  backgroundColor: `${phaseColor}08`,
                  borderWidth: 1,
                  borderColor: `${phaseColor}20`,
                  borderRadius: 4,
                  padding: spacing[3],
                }}
              >
                <View
                  style={{
                    width: 3,
                    backgroundColor: phaseColor,
                    borderRadius: 1,
                    marginRight: spacing[2],
                  }}
                />
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing[1],
                      marginBottom: spacing[0],
                    }}
                  >
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: phaseColor,
                        fontSize: 7,
                        letterSpacing: 1,
                      }}
                    >
                      {cp.phase}
                    </Text>
                    <Text
                      style={{
                        ...typography.bodySmall,
                        color: colors.text.secondary,
                        fontSize: 7,
                        opacity: 0.5,
                      }}
                    >
                      ·
                    </Text>
                    <Text
                      style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 7 }}
                    >
                      {cp.focusPoint}
                    </Text>
                  </View>
                  <Text
                    style={{
                      ...typography.body,
                      color: colors.text.primary,
                      fontSize: 12,
                      lineHeight: 18,
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

      {/* Progression Pathway */}
      <View style={{ padding: spacing[4] }}>
        <Text
          style={{
            ...typography.label,
            color: colors.accent.DEFAULT,
            fontSize: 9,
            marginBottom: spacing[2],
          }}
        >
          SKILL PATH
        </Text>
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing[1], alignItems: "center" }}
        >
          {node.progressionPath.map((step, idx) => (
            <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: spacing[1] }}>
              <View
                style={{
                  backgroundColor: `${node.accent}15`,
                  borderWidth: 1,
                  borderColor: `${node.accent}30`,
                  borderRadius: 4,
                  paddingHorizontal: spacing[2],
                  paddingVertical: spacing[1],
                }}
              >
                <Text
                  style={{
                    ...typography.bodySmall,
                    color: node.accent,
                    fontSize: 9,
                    letterSpacing: 0.3,
                  }}
                >
                  {step}
                </Text>
              </View>
              {idx < node.progressionPath.length - 1 && (
                <Text style={{ color: colors.text.secondary, fontSize: 10, opacity: 0.4 }}>→</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Bottom spacer */}
      <View style={{ height: spacing[6] }} />
    </ScrollView>
  );
}
