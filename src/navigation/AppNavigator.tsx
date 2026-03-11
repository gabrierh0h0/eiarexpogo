import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ScanQRScreen from "../screens/ScanQRScreen";
import MisionesScreen from "../screens/MisionesScreen";
import LogrosScreen from "../screens/LogrosScreen";
import { RootStackParamList } from "../types/navigation";
import MainTabs from "./MainTabs";
import { MenuProvider } from "../contexts/MenuContext";

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

      <Stack.Screen
        name="Home"
        options={{ headerShown: false }}
      >
        {() => (
          <MenuProvider>
            <MainTabs />
          </MenuProvider>
        )}
      </Stack.Screen>

      {/* <Stack.Screen
        name="ScanQR"
        component={ScanQRScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Mision"
        component={MisionesScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Logros"
        component={LogrosScreen}
        options={{ headerShown: false }}
      /> */}
    </Stack.Navigator>
  );
};

export default AppNavigator;
