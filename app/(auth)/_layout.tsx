import { Stack } from "expo-router";
import { useColors } from "../../src/tokens";

export default function AuthLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
        animation: "fade",
        gestureEnabled: false, // Prevent back navigation from auth screens
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
