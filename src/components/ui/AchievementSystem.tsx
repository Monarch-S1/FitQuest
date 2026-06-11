import { View, Text } from "react-native";
import { useColors, typography, spacing } from "../../tokens";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  xpReward: number;
}

const RARITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  common: { bg: "rgba(156, 163, 175, 0.1)", border: "#9CA3AF", text: "#9CA3AF" },
  rare: { bg: "rgba(6, 182, 212, 0.1)", border: "#06B6D4", text: "#06B6D4" },
  epic: { bg: "rgba(168, 85, 247, 0.1)", border: "#A855F7", text: "#A855F7" },
  legendary: { bg: "rgba(245, 158, 11, 0.1)", border: "#F59E0B", text: "#F59E0B" },
};

const ALL_ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  { id: "first-blood", title: "FIRST BLOOD", description: "Complete your first workout", icon: "🩸", rarity: "common", xpReward: 50 },
  { id: "3-day-streak", title: "HABIT FORMED", description: "3-day workout streak", icon: "🔥", rarity: "common", xpReward: 75 },
  { id: "7-day-streak", title: "WEEK WARRIOR", description: "7-day workout streak", icon: "⚡", rarity: "rare", xpReward: 150 },
  { id: "14-day-streak", title: "UNSTOPPABLE", description: "14-day workout streak", icon: "💎", rarity: "epic", xpReward: 300 },
  { id: "30-day-streak", title: "IRON WILL", description: "30-day workout streak", icon: "👑", rarity: "legendary", xpReward: 1000 },

  // Volume achievements
  { id: "10-workouts", title: "GRINDER", description: "Complete 10 workouts", icon: "⚙️", rarity: "common", xpReward: 100 },
  { id: "50-workouts", title: "CENTURION", description: "Complete 50 workouts", icon: "🏛️", rarity: "rare", xpReward: 500 },
  { id: "100-workouts", title: "LEGEND", description: "Complete 100 workouts", icon: "🏆", rarity: "legendary", xpReward: 2000 },

  // Level achievements
  { id: "level-5", title: "RISING STAR", description: "Reach Level 5", icon: "⭐", rarity: "common", xpReward: 100 },
  { id: "level-10", title: "VETERAN", description: "Reach Level 10", icon: "🎖️", rarity: "rare", xpReward: 250 },
  { id: "level-20", title: "COMMANDER", description: "Reach Level 20", icon: "🏅", rarity: "epic", xpReward: 500 },
  { id: "level-50", title: "TITAN", description: "Reach Level 50", icon: "🌟", rarity: "legendary", xpReward: 5000 },

  // Workout-specific
  { id: "perfect-form", title: "PERFECTIONIST", description: "Complete workout with all sets", icon: "✨", rarity: "rare", xpReward: 100 },
  { id: "speed-demon", title: "SPEED DEMON", description: "Complete workout under 20 min", icon: "💨", rarity: "rare", xpReward: 150 },
  { id: "beast-mode", title: "BEAST MODE", description: "Earn 200+ XP in one workout", icon: "🦁", rarity: "epic", xpReward: 200 },

  // Muscle mastery
  { id: "chest-master", title: "CHEST MASTER", description: "Reach Level 5 in Chest", icon: "💪", rarity: "rare", xpReward: 150 },
  { id: "leg-day", title: "LEG DAY CHAMP", description: "Reach Level 5 in Quadriceps", icon: "🦵", rarity: "rare", xpReward: 150 },
  { id: "core-steel", title: "CORE OF STEEL", description: "Reach Level 5 in Core", icon: "🛡️", rarity: "rare", xpReward: 150 },
];

export function checkAchievements(context: {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  totalXp: number;
  lastWorkoutXp?: number;
  lastWorkoutDuration?: number;
  lastWorkoutAllComplete?: boolean;
  muscleLevels?: Record<string, number>;
}): Achievement[] {
  const newAchievements: Achievement[] = [];

  // Volume achievements
  if (context.totalWorkouts >= 1) {
    newAchievements.push(ALL_ACHIEVEMENTS.find((a) => a.id === "first-blood")!);
  }
  if (context.totalWorkouts >= 10) {
    newAchievements.push(ALL_ACHIEVEMENTS.find((a) => a.id === "10-workouts")!);
  }
  if (context.totalWorkouts >= 50) {
    newAchievements.push(ALL_ACHIEVEMENTS.find((a) => a.id === "50-workouts")!);
  }
  if (context.totalWorkouts >= 100) {
    newAchievements.push(ALL_ACHIEVEMENTS.find((a) => a.id === "100-workouts")!);
  }

  // Level achievements
  if (context.level >= 5) {
    newAchievements.push(ALL_ACHIEVEMENTS.find((a) => a.id === "level-5")!);
  }
  if (context.level >= 10) {
    newAchievements.push(ALL_ACHIEVEMENTS.find((a) => a.id === "level-10")!);
  }
  if (context.level >= 20) {
    newAchievements.push(ALL_ACHIEVEMENTS.find((a) => a.id === "level-20")!);
  }
  if (context.level >= 50) {
    newAchievements.push(ALL_ACHIEVEMENTS.find((a) => a.id === "level-50")!);
  }

  // Workout-specific
  if (context.lastWorkoutAllComplete) {
    newAchievements.push(ALL_ACHIEVEMENTS.find((a) => a.id === "perfect-form")!);
  }
  if (context.lastWorkoutDuration && context.lastWorkoutDuration < 1200) {
    newAchievements.push(ALL_ACHIEVEMENTS.find((a) => a.id === "speed-demon")!);
  }
  if (context.lastWorkoutXp && context.lastWorkoutXp >= 200) {
    newAchievements.push(ALL_ACHIEVEMENTS.find((a) => a.id === "beast-mode")!);
  }

  // Muscle mastery
  if (context.muscleLevels) {
    if ((context.muscleLevels["chest"] || 0) >= 5) {
      newAchievements.push(ALL_ACHIEVEMENTS.find((a) => a.id === "chest-master")!);
    }
    if ((context.muscleLevels["quadriceps"] || 0) >= 5) {
      newAchievements.push(ALL_ACHIEVEMENTS.find((a) => a.id === "leg-day")!);
    }
    if ((context.muscleLevels["core"] || 0) >= 5) {
      newAchievements.push(ALL_ACHIEVEMENTS.find((a) => a.id === "core-steel")!);
    }
  }

  // Deduplicate by id
  const seen = new Set<string>();
  return newAchievements.filter((a) => {
    if (!a || seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: "sm" | "md" | "lg";
}

export function AchievementBadge({ achievement, size = "md" }: AchievementBadgeProps) {
  const colors = useColors();
  const rarity = RARITY_COLORS[achievement.rarity];

  const sizes = {
    sm: { container: 60, icon: 20, title: 7, desc: 6 },
    md: { container: 80, icon: 28, title: 8, desc: 7 },
    lg: { container: 100, icon: 36, title: 10, desc: 8 },
  };
  const s = sizes[size];

  return (
    <View style={{ alignItems: "center", width: s.container }}>
      <View
        style={{
          width: s.container,
          height: s.container,
          backgroundColor: rarity.bg,
          borderWidth: 1.5,
          borderColor: rarity.border,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing[1],
        }}
      >
        <Text style={{ fontSize: s.icon }}>{achievement.icon}</Text>
      </View>
      <Text
        style={{
          ...typography.label,
          color: rarity.text,
          fontSize: s.title,
          textAlign: "center",
        }}
      >
        {achievement.title}
      </Text>
      {size !== "sm" && (
        <Text
          style={{
            ...typography.bodySmall,
            color: colors.text.secondary,
            fontSize: s.desc,
            textAlign: "center",
            marginTop: 1,
          }}
          numberOfLines={2}
        >
          {achievement.description}
        </Text>
      )}
    </View>
  );
}

interface AchievementUnlockToastProps {
  achievement: Achievement;
}

export function AchievementUnlockToast({ achievement }: AchievementUnlockToastProps) {
  const colors = useColors();
  const rarity = RARITY_COLORS[achievement.rarity];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: rarity.bg,
        borderWidth: 1,
        borderColor: rarity.border,
        borderRadius: 4,
        padding: spacing[3],
        gap: spacing[3],
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          backgroundColor: `${rarity.border}20`,
          borderWidth: 1,
          borderColor: rarity.border,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 24 }}>{achievement.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.label, color: rarity.text, fontSize: 8 }}>
          ACHIEVEMENT UNLOCKED
        </Text>
        <Text style={{ ...typography.h4, color: colors.text.primary, fontSize: 14, marginTop: 2 }}>
          {achievement.title}
        </Text>
        <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 10 }}>
          {achievement.description}
        </Text>
      </View>
      <View style={{ alignItems: "center" }}>
        <Text style={{ ...typography.label, color: colors.accent.DEFAULT, fontSize: 8 }}>
          +{achievement.xpReward}
        </Text>
        <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 7 }}>
          XP
        </Text>
      </View>
    </View>
  );
}
