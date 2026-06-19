import { useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, typography, spacing } from "../../src/tokens";
import { SkillTreeView } from "../../src/components/skill-tree/SkillTreeView";

export default function SkillTreeScreen() {
  const colors = useColors();
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 10,
              marginBottom: spacing[1],
            }}
          >
            PROGRESSION
          </Text>
          <Text
            style={{
              ...typography.display,
              color: colors.text.primary,
              fontSize: 28,
            }}
          >
            SKILL TREE
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Close skill tree"
          style={{
            borderWidth: 1,
            borderColor: colors.border.subtle,
            borderRadius: 4,
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[1],
          }}
        >
          <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 10 }}>
            CLOSE
          </Text>
        </TouchableOpacity>
      </View>

      {/* Skill tree content */}
      <SkillTreeView />
    </SafeAreaView>
  );
}
