import { Stack } from "expo-router";
import { useColors } from "../../src/tokens";

export default function OnboardingLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
        animation: "slide_from_bottom",
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
