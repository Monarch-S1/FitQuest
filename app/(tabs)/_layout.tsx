import { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, Text } from "react-native";
import { useColors, typography, spacing, fonts } from "../../src/tokens";
import { useUserStore } from "../../src/stores/useUserStore";

export default function TabLayout() {
  const colors = useColors();
  const router = useRouter();
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, router]);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg.primary,
          borderTopWidth: 1,
          borderTopColor: colors.border.subtle,
          height: 62,
          paddingBottom: 6,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent.DEFAULT,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="⚔" label="QUEST" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="◈" label="TRAIN" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="▤" label="LOG" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="body-map"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="✦" label="BODY" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="♛" label="CHARACTER" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  const colors = useColors();
  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 64 }}>
      <View
        style={{
          width: 36,
          height: 26,
          alignItems: "center",
          justifyContent: "center",
          borderBottomWidth: focused ? 2 : 0,
          borderBottomColor: focused ? colors.accent.DEFAULT : "transparent",
        }}
      >
        <Text
          style={{
            fontSize: 18,
            color: focused ? colors.accent.DEFAULT : colors.text.secondary,
          }}
        >
          {icon}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: fonts.body.semiBold,
          fontSize: 9,
          color: focused ? colors.accent.DEFAULT : colors.text.secondary,
          letterSpacing: 0.5,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
