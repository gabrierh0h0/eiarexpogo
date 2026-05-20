import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import MenuOverlay from "./MenuOverlay";
import LogoutModal from "../components/LogoutModal";
import { careers } from "../constants/careers";
import { useAuth } from "../contexts/AuthContext";
import {
  updateMyProfile,
  updatePermissionSettings,
  updateProfilePhoto,
} from "../services/userService";
import { RootStackParamList } from "../types/navigation";
import { getDisplayFullName, getRoleLabel } from "../utils/profile";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const COLORS = {
  page: "#023048",
  topbar: "#136c88",
  card: "#0b5872",
  inputBg: "#6ca0bd",
  button: "#08425a",
  white: "#ffffff",
};

export default function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { profile, user, refreshProfile, logout } = useAuth();

  const [menuVisible, setMenuVisible] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [careerPickerOpen, setCareerPickerOpen] = useState(false);
  const [career, setCareer] = useState("");
  const [displayNamePreference, setDisplayNamePreference] = useState<"firstName" | "middleName">("firstName");

  useEffect(() => {
    if (!profile) return;
    setCareer(profile.career ?? "");
    setDisplayNamePreference(profile.displayNamePreference ?? "firstName");
  }, [profile]);

  const fullReadonlyName = useMemo(() => {
    if (!profile) return "";
    return [
      profile.firstName,
      profile.middleName,
      profile.lastName,
    ]
      .filter(Boolean)
      .join(" ");
  }, [profile]);

  const displayName = useMemo(() => {
    return getDisplayFullName(profile, user?.email);
  }, [profile, user]);

  const displayRole = useMemo(() => {
    return getRoleLabel(profile?.role);
  }, [profile]);

  const hasMiddleName = Boolean(String(profile?.middleName ?? "").trim());

  const handleSave = async () => {
    try {
      setSaving(true);

      await updateMyProfile({
        career,
        displayNamePreference,
      });

      await refreshProfile();
      Alert.alert("Listo", "Perfil actualizado correctamente.");
      navigation.goBack();
    } catch (error: any) {
      console.warn(error);
      Alert.alert(
        "Error",
        error?.response?.data?.message ?? "No se pudo guardar el perfil."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      await updatePermissionSettings({
        galleryGranted: permission.granted,
      });

      if (!permission.granted) {
        Alert.alert("Permiso requerido", "Debes autorizar la galería para cambiar la foto.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.25,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert("Error", "No se pudo procesar la imagen.");
        return;
      }

      setUploadingPhoto(true);

      const mimeType = asset.mimeType ?? "image/jpeg";
      const photoUrl = `data:${mimeType};base64,${asset.base64}`;

      await updateProfilePhoto(photoUrl);
      await refreshProfile();
      Alert.alert("Listo", "Foto de perfil actualizada.");
    } catch (error: any) {
      console.warn(error);
      Alert.alert(
        "Error",
        error?.response?.data?.message ?? "No se pudo actualizar la foto."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      await updatePermissionSettings({
        cameraGranted: permission.granted,
      });

      if (!permission.granted) {
        Alert.alert("Permiso requerido", "Debes autorizar la cámara para tomar la foto.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.25,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert("Error", "No se pudo procesar la imagen.");
        return;
      }

      setUploadingPhoto(true);

      const mimeType = asset.mimeType ?? "image/jpeg";
      const photoUrl = `data:${mimeType};base64,${asset.base64}`;

      await updateProfilePhoto(photoUrl);
      await refreshProfile();
      Alert.alert("Listo", "Foto de perfil actualizada.");
    } catch (error: any) {
      console.warn(error);
      Alert.alert(
        "Error",
        error?.response?.data?.message ?? "No se pudo actualizar la foto."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert("Foto de perfil", "¿Qué deseas hacer?", [
      { text: "Tomar foto", onPress: () => void handleTakePhoto() },
      { text: "Elegir de galería", onPress: () => void handlePickFromGallery() },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleGoToLogin = () => {
    setLogoutVisible(false);
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu-outline" size={30} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>EIAR</Text>

        <TouchableOpacity onPress={() => navigation.navigate("ScanQR")}>
          <Ionicons name="qr-code-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {!profile ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.photoSection}>
            <View style={styles.photoWrap}>
              {profile.photoUrl ? (
                <Image source={{ uri: profile.photoUrl }} style={styles.photo} />
              ) : (
                <View style={styles.photoFallback}>
                  <Ionicons name="person" size={70} color="#ffffff" />
                </View>
              )}

              <Pressable style={styles.editPhotoBtn} onPress={handleChangePhoto}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Ionicons name="pencil-outline" size={22} color="#000" />
                )}
              </Pressable>
            </View>

            <Text style={styles.nameText}>{displayName}</Text>
            <Text style={styles.roleText}>{displayRole}</Text>
          </View>

          <SectionLabel label="Nombre" />
          <ReadonlyField value={fullReadonlyName} />

          <SectionLabel label="Email" />
          <ReadonlyField value={profile.email} />

          <SectionLabel label="Carrera" />
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setCareerPickerOpen((prev) => !prev)}
          >
            <Text style={styles.selectFieldText}>
              {career || "Selecciona una carrera"}
            </Text>
            <Ionicons
              name={careerPickerOpen ? "chevron-up" : "chevron-down"}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>

          {careerPickerOpen && (
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={career}
                onValueChange={(value) => setCareer(String(value))}
                dropdownIconColor="#ffffff"
                style={{ color: "#ffffff" }}
                itemStyle={{ color: "#ffffff", fontSize: 18 }}
              >
                <Picker.Item label="Selecciona tu carrera" value="" color="#eaf6fb" />
                {careers.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>
          )}

          <SectionLabel label="Nombre a mostrar" />

          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Primer nombre</Text>
            <Switch
              value={displayNamePreference === "firstName"}
              onValueChange={() => setDisplayNamePreference("firstName")}
              trackColor={{ false: "#29576D", true: "#7bb7d2" }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.preferenceRow}>
            <Text
              style={[
                styles.preferenceText,
                !hasMiddleName && { opacity: 0.45 },
              ]}
            >
              Segundo nombre
            </Text>
            <Switch
              value={displayNamePreference === "middleName"}
              onValueChange={() => {
                if (hasMiddleName) setDisplayNamePreference("middleName");
              }}
              disabled={!hasMiddleName}
              trackColor={{ false: "#29576D", true: "#7bb7d2" }}
              thumbColor="#ffffff"
            />
          </View>

          {!hasMiddleName && (
            <Text style={styles.helperText}>
              Este usuario no tiene segundo nombre registrado.
            </Text>
          )}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => setLogoutVisible(true)}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      )}

      <MenuOverlay
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onRequestLogout={() => setLogoutVisible(true)}
      />

      <LogoutModal
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        onLogout={handleLogout}
        onGoToLogin={handleGoToLogin}
      />
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.label}>{label}</Text>;
}

function ReadonlyField({ value }: { value: string }) {
  return (
    <View style={styles.readonlyField}>
      <Text style={styles.readonlyText}>{value}</Text>
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
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 18,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 20,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  photoWrap: {
    position: "relative",
    marginBottom: 16,
  },
  photo: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  photoFallback: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  editPhotoBtn: {
    position: "absolute",
    right: 0,
    bottom: 8,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  nameText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  roleText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 4,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 10,
  },
  readonlyField: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  readonlyText: {
    color: "#eaf6fb",
    fontSize: 16,
  },
  selectField: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectFieldText: {
    color: "#eaf6fb",
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  secondaryButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.button,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  pickerWrap: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  preferenceRow: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  preferenceText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  helperText: {
    color: "rgba(255,255,255,0.75)",
    marginBottom: 6,
  },
  saveButton: {
    alignSelf: "center",
    backgroundColor: COLORS.button,
    borderRadius: 14,
    paddingHorizontal: 26,
    paddingVertical: 14,
    marginTop: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  logoutBtn: {
    marginTop: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
  },
  logoutText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});