import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import { useColors, typography, spacing, fonts } from "../../src/tokens";

export default function TabLayout() {
  const colors = useColors();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg.surface,
          borderTopWidth: 1,
          borderTopColor: "#2D3139",
          height: 88,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#F59E0B",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem icon="⌂" label="HOME" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem icon="⚔" label="TRAIN" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem icon="◈" label="PROGRESS" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem icon="■" label="PROFILE" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="body-map"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem icon="◇" label="BODY" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}



function TabItem({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 64 }}>
      <View
        style={{
          width: 32,
          height: 24,
          alignItems: "center",
          justifyContent: "center",
          borderBottomWidth: focused ? 2 : 0,
          borderBottomColor: focused ? "#F59E0B" : "transparent",
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: focused ? "#F59E0B" : "#9CA3AF",
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
          color: focused ? "#F59E0B" : "#9CA3AF",
          letterSpacing: 0.3,
          marginTop: 1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
