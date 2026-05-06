import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import { RootStackParamList } from "../types/navigation";
import SettingsScreen from "../screens/SettingsScreen";
import EditProfileScreen from "../screens/EditProfileScreen";

import HomeScreen from "../screens/HomeScreen";
import ScanQRScreen from "../screens/ScanQRScreen";
import MisionesScreen from "../screens/MisionesScreen";
import LogrosScreen from "../screens/LogrosScreen";
import RankingScreen from "../screens/RankingScreen";
import MapScreen from "../screens/MapScreen";
import ProgressScreen from "../screens/ProgressScreen";

// ---- Minijuego Food Drop ----
import FoodDropGameScreen from "../features/foodDrop/screens/FoodDropGameScreen";
import FoodDropResultScreen from "../features/foodDrop/screens/FoodDropResultScreen";
import FoodDropAlreadyPlayedScreen from "../features/foodDrop/screens/FoodDropAlreadyPlayedScreen";

// ---- Minijuego Pacman ----
import PacmanGameScreen from "../features/pacman/screens/PacmanGameScreen";
import PacmanResultScreen from "../features/pacman/screens/PacmanResultScreen";
import PacmanAlreadyPlayedScreen from "../features/pacman/screens/PacmanAlreadyPlayedScreen";

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
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
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
      />
      <Stack.Screen
        name="Ranking"
        component={RankingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Mapa"
        component={MapScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Progreso"
        component={ProgressScreen}
        options={{ headerShown: false }}
      />
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

      {/* ---- Minijuego Food Drop (Tienda de la Confianza) ---- */}
      <Stack.Screen
        name="FoodDropGame"
        component={FoodDropGameScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="FoodDropResult"
        component={FoodDropResultScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="FoodDropAlreadyPlayed"
        component={FoodDropAlreadyPlayedScreen}
        options={{ headerShown: false }}
      />

      {/* ---- Minijuego Pacman (Recorrido Campus) ---- */}
      <Stack.Screen
        name="PacmanGame"
        component={PacmanGameScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="PacmanResult"
        component={PacmanResultScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="PacmanAlreadyPlayed"
        component={PacmanAlreadyPlayedScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;