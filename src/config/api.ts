import axios from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const getBaseURL = () => {
  // Si defines EXPO_PUBLIC_API_URL, lo usa (recomendado para celular físico)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // Defaults para dev
  if (Platform.OS === "android") return "http://10.0.2.2:3000";
  return "http://localhost:3000"; // iOS simulator / web
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("auth_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;