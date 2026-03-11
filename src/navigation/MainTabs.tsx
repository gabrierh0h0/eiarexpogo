import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";

import HomeScreen from "../screens/HomeScreen";
import ScanQRScreen from "../screens/ScanQRScreen";
import MisionesScreen from "../screens/MisionesScreen";
import LogrosScreen from "../screens/LogrosScreen";

// Si ya creaste MenuContext como te propuse:
import { useMenu } from "../contexts/MenuContext";

const Tab = createBottomTabNavigator();

const TAB_SCREENS: Record<string, React.ComponentType<any>> = {
  Home: HomeScreen,
  ScanQR: ScanQRScreen,
  Mision: MisionesScreen,
  Logros: LogrosScreen,
};

export default function MainTabs() {
  const { menu, loading } = useMenu();

  if (loading || !menu) return null; // o un loader bonito

  const visibleTabs = menu.tabs
    .filter((t) => t.visible)
    .filter((t) => TAB_SCREENS[t.key]); // evita tabs sin pantalla

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ size, color }) => {
          const tab = menu.tabs.find((t) => t.key === route.name);
          const iconName = tab?.icon ?? "ellipse-outline";
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      {visibleTabs.map((t) => (
        <Tab.Screen
          key={t.key}
          name={t.key}
          component={TAB_SCREENS[t.key]}
          options={{ title: t.label }}
        />
      ))}
    </Tab.Navigator>
  );
}