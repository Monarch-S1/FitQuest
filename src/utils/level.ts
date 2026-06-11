export const LEVEL_BASE_XP = 50;

export function getLevel(totalXp: number): number {
  if (totalXp < 0) return 1;
  return Math.floor(Math.sqrt(totalXp / LEVEL_BASE_XP)) + 1;
}

export function getXpForLevel(level: number): number {
  return Math.floor(LEVEL_BASE_XP * Math.pow(level - 1, 2));
}

export function getProgressToNextLevel(totalXp: number): {
  currentXp: number;
  requiredXp: number;
  progress: number;
} {
  const level = getLevel(totalXp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const xpIntoLevel = totalXp - currentLevelXp;
  const xpRequired = nextLevelXp - currentLevelXp;
  const progress = Math.min(Math.max(xpIntoLevel / xpRequired, 0), 1);

  return {
    currentXp: xpIntoLevel,
    requiredXp: xpRequired,
    progress,
  };
}
