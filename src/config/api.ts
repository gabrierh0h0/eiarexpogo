import axios from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const getBaseURL = () => {
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
  try {
    let token: string | null = null;

    if (Platform.OS === "web") {
      token = localStorage.getItem("auth_token");
    } else {
      token = await SecureStore.getItemAsync("auth_token");
    }

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn("Error reading auth token:", e);
  }
  return config;
});

export default api;