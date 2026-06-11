import { useUserStore } from "../stores/useUserStore";
import { getColors, ThemeMode, AccentKey } from "./themes";

export function useColors() {
  const themeMode = useUserStore((s) => s.themeMode);
  const accentColor = useUserStore((s) => s.accentColor);
  return getColors(themeMode, accentColor);
}

export function useThemeMode(): ThemeMode {
  return useUserStore((s) => s.themeMode);
}

export function useAccentColor(): AccentKey {
  return useUserStore((s) => s.accentColor);
}
