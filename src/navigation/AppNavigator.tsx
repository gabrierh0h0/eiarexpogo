import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import { RootStackParamList } from "../types/navigation";
import MainTabs from "./MainTabs";
import { MenuProvider } from "../contexts/MenuContext";
import SettingsScreen from "../screens/SettingsScreen";
import EditProfileScreen from "../screens/EditProfileScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#023048" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontWeight: "bold" },
        headerBackVisible: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen name="Home" options={{ headerShown: false }}>
        {() => (
          <MenuProvider>
            <MainTabs />
          </MenuProvider>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Configuracion"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="EditarPerfil"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;