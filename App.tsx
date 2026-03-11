import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/contexts/AuthContext";
import MenuOverlay from "./src/screens/MenuOverlay";

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />       
      </NavigationContainer>
    </AuthProvider>
  );
}