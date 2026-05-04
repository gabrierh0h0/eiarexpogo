import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import MenuOverlay from "./MenuOverlay";
import { useAuth } from "../contexts/AuthContext";
import {
  getPermissionSettings,
  PermissionSettings,
  updateMyProfile,
  updatePermissionSettings,
} from "../services/userService";
import { RootStackParamList } from "../types/navigation";
import { getDisplayFullName, getRoleLabel } from "../utils/profile";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const COLORS = {
  page: "#023048",
  topbar: "#136c88",
  card: "#0b5872",
  itemBg: "#4f87a7",
  itemBgSoft: "#6ca0bd",
  white: "#ffffff",
  darkText: "#073646",
  button: "#08425a",
};

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, user, refreshProfile, logout } = useAuth();

  const [menuVisible, setMenuVisible] = useState(false);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const [permissions, setPermissions] = useState<PermissionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const displayName = useMemo(() => {
    return getDisplayFullName(profile, user?.email);
  }, [profile, user]);

  const displayRole = useMemo(() => {
    return getRoleLabel(profile?.role);
  }, [profile]);

  const loadPermissions = useCallback(async () => {
    try {
      const [
        serverPermissions,
        notificationPermission,
        cameraPermission,
        galleryPermission,
      ] = await Promise.all([
        getPermissionSettings(),
        Notifications.getPermissionsAsync(),
        ImagePicker.getCameraPermissionsAsync(),
        ImagePicker.getMediaLibraryPermissionsAsync(),
      ]);

      setPermissions({
        notifications: {
          granted: notificationPermission.granted,
          enabled: Boolean(
            serverPermissions.notifications.enabled && notificationPermission.granted
          ),
        },
        camera: {
          granted: cameraPermission.granted,
          enabled: Boolean(serverPermissions.camera.enabled && cameraPermission.granted),
        },
        gallery: {
          granted: galleryPermission.granted,
          enabled: Boolean(serverPermissions.gallery.enabled && galleryPermission.granted),
        },
      });
    } catch (error) {
      console.warn(error);
      Alert.alert("Error", "No se pudieron cargar los permisos.");
      setPermissions((prev) => prev || {
        notifications: { granted: false, enabled: false },
        camera: { granted: false, enabled: false },
        gallery: { granted: false, enabled: false },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
      void loadPermissions();
    }, [refreshProfile, loadPermissions])
  );

  const updateLocalPermission = (
    key: keyof PermissionSettings,
    enabled: boolean,
    granted: boolean
  ) => {
    setPermissions((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: {
          enabled,
          granted,
        },
      };
    });
  };

  const handleNotificationToggle = async (nextValue: boolean) => {
    try {
      let granted = permissions?.notifications.granted ?? false;

      if (nextValue) {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
          });
        }

        const result = await Notifications.requestPermissionsAsync();
        granted = result.granted;
      } else {
        const result = await Notifications.getPermissionsAsync();
        granted = result.granted;
      }

      await updatePermissionSettings({
        notificationsEnabled: nextValue,
        notificationsGranted: granted,
      });

      updateLocalPermission("notifications", nextValue && granted, granted);
    } catch (error) {
      console.warn(error);
      Alert.alert("Error", "No se pudo actualizar el permiso de notificaciones.");
    }
  };

  const handleCameraToggle = async (nextValue: boolean) => {
    try {
      let granted = permissions?.camera.granted ?? false;

      if (nextValue) {
        const result = await ImagePicker.requestCameraPermissionsAsync();
        granted = result.granted;
      } else {
        const result = await ImagePicker.getCameraPermissionsAsync();
        granted = result.granted;
      }

      await updatePermissionSettings({
        cameraEnabled: nextValue,
        cameraGranted: granted,
      });

      updateLocalPermission("camera", nextValue && granted, granted);
    } catch (error) {
      console.warn(error);
      Alert.alert("Error", "No se pudo actualizar el permiso de cámara.");
    }
  };

  const handleGalleryToggle = async (nextValue: boolean) => {
    try {
      let granted = permissions?.gallery.granted ?? false;

      if (nextValue) {
        const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
        granted = result.granted;
      } else {
        const result = await ImagePicker.getMediaLibraryPermissionsAsync();
        granted = result.granted;
      }

      await updatePermissionSettings({
        galleryEnabled: nextValue,
        galleryGranted: granted,
      });

      updateLocalPermission("gallery", nextValue && granted, granted);
    } catch (error) {
      console.warn(error);
      Alert.alert("Error", "No se pudo actualizar el permiso de galería.");
    }
  };

  const changeLanguage = async (value: "es" | "en") => {
    try {
      await updateMyProfile({ language: value });
      await refreshProfile();
      setLanguageExpanded(false);
    } catch (error) {
      console.warn(error);
      Alert.alert("Error", "No se pudo actualizar el idioma.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.warn(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu-outline" size={30} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Configuración</Text>

        <TouchableOpacity onPress={() => navigation.navigate("ScanQR")}>
          <Ionicons name="qr-code-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading || !profile || !permissions ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.profileTop}>
            {profile.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={50} color="#ffffff" />
              </View>
            )}

            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userRole}>{displayRole}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("EditarPerfil")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="person-outline" size={26} color="#fff" />
              <Text style={styles.rowText}>Editar Perfil</Text>
            </View>
            <Ionicons name="chevron-forward" size={26} color="#fff" />
          </TouchableOpacity>

          <View style={[styles.row, languageExpanded && styles.expandedBlock]}>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                style={styles.rowInner}
                onPress={() => setLanguageExpanded((prev) => !prev)}
              >
                <View style={styles.rowLeft}>
                  <Ionicons name="language-outline" size={26} color="#fff" />
                  <Text style={styles.rowText}>Cambiar idioma</Text>
                </View>
                <Ionicons
                  name={languageExpanded ? "chevron-up" : "chevron-down"}
                  size={26}
                  color="#fff"
                />
              </TouchableOpacity>

              {languageExpanded && (
                <View style={styles.languageBox}>
                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      (profile.language ?? "es") === "es" && styles.languageOptionActive,
                    ]}
                    onPress={() => changeLanguage("es")}
                  >
                    <Text style={styles.languageText}>Español</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      (profile.language ?? "es") === "en" && styles.languageOptionActive,
                    ]}
                    onPress={() => changeLanguage("en")}
                  >
                    <Text style={styles.languageText}>Inglés</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <ToggleRow
            icon="notifications-outline"
            label="Notificaciones"
            value={permissions.notifications.enabled}
            onChange={handleNotificationToggle}
          />

          <ToggleRow
            icon="camera-outline"
            label="Permisos de cámara"
            value={permissions.camera.enabled}
            onChange={handleCameraToggle}
          />

          <ToggleRow
            icon="images-outline"
            label="Permisos de galería"
            value={permissions.gallery.enabled}
            onChange={handleGalleryToggle}
          />

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      )}

      <MenuOverlay visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}

type ToggleRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

function ToggleRow({ icon, label, value, onChange }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={26} color="#fff" />
        <Text style={styles.rowText}>{label}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#29576D", true: "#7bb7d2" }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    backgroundColor: COLORS.page,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  header: {
    backgroundColor: COLORS.topbar,
    paddingTop: 56,
    paddingBottom: 18,
    paddingHorizontal: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "800",
  },
  scrollContent: {
    padding: 18,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 18,
    minHeight: 700,
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  avatarFallback: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  userName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  userRole: {
    color: "#fff",
    fontSize: 16,
    marginTop: 4,
  },
  row: {
    paddingVertical: 14,
    borderRadius: 18,
  },
  rowInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  expandedBlock: {
    backgroundColor: "rgba(108,160,189,0.35)",
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    marginBottom: 6,
  },
  languageBox: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)",
    paddingTop: 10,
  },
  languageOption: {
    backgroundColor: "transparent",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  languageOptionActive: {
    backgroundColor: COLORS.itemBgSoft,
  },
  languageText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  logoutBtn: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  logoutText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});