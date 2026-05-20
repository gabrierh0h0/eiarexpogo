import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../contexts/AuthContext";
import { getDisplayFullName, getRoleLabel } from "../utils/profile";

const COLORS = {
  lightBlue: "#136c88",
  darkBlue: "#023048",
  white: "#ffffff",
  textMuted: "rgba(255,255,255,0.85)",
  divider: "rgba(255,255,255,0.08)",
};

type Props = {
  visible: boolean;
  onClose: () => void;
  /**
   * Si se provee, al pulsar "Cerrar sesión" el menú se cierra y se delega al
   * padre (que normalmente muestra el LogoutModal). Si no se provee, se hace
   * un logout directo (fallback heredado).
   */
  onRequestLogout?: () => void;
};
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MenuOverlay({ visible, onClose, onRequestLogout }: Props) {
  const navigation = useNavigation<Nav>();
  const slide = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width * 0.8, 320);

  const { profile, user, isAuthenticated, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-panelWidth, 0],
  });

  const displayName = useMemo(() => {
    return getDisplayFullName(profile, user?.email);
  }, [profile, user]);

  const displayRole = useMemo(() => {
    if (!isAuthenticated) return "Invitado";
    return getRoleLabel(profile?.role);
  }, [isAuthenticated, profile]);

  const items = useMemo(
    () => [
      { label: "Inicio", icon: "home-outline" as const, route: "Home" as const },
      { label: "Progreso", icon: "stats-chart-outline" as const, route: "Progreso" as const },
      { label: "Misiones", icon: "flag-outline" as const, route: "Mision" as const },
      { label: "Logros", icon: "trophy-outline" as const, route: "Logros" as const },
      { label: "Ranking", icon: "bar-chart-outline" as const, route: "Ranking" as const },
      { label: "Mapa", icon: "map-outline" as const, route: "Mapa" as const },
      { label: "Configuración", icon: "settings-outline" as const, route: "Configuracion" as const },
    ],
    []
  );

  const goToEditProfile = () => {
    onClose();
    requestAnimationFrame(() => {
      navigation.navigate("EditarPerfil");
    });
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    // Si el padre quiere mostrar su propio LogoutModal, delegamos.
    if (onRequestLogout) {
      onClose();
      requestAnimationFrame(() => onRequestLogout());
      return;
    }

    // Fallback: logout directo (comportamiento anterior).
    try {
      setLoggingOut(true);
      onClose();
      await logout();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (e) {
      console.warn(e);
      setLoggingOut(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View
          style={[
            styles.panel,
            {
              width: panelWidth,
              transform: [{ translateX }],
              backgroundColor: COLORS.darkBlue,
            },
          ]}
        >
          <Pressable
            style={[styles.header, { backgroundColor: COLORS.lightBlue }]}
            onPress={goToEditProfile}
          >
            {profile?.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={36} color={COLORS.white} />
              </View>
            )}

            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text numberOfLines={1} style={styles.name}>
                {displayName}
              </Text>
              <Text style={styles.role}>{displayRole}</Text>
            </View>
          </Pressable>

          <View style={styles.itemsWrap}>
            {items.map((it) => (
              <Pressable
                key={it.label}
                style={({ pressed }) => [
                  styles.item,
                  { opacity: pressed ? 0.5 : 1 },
                ]}
                onPress={() => {
                  onClose();
                  requestAnimationFrame(() => {
                    navigation.navigate(it.route);
                  });
                }}
              >
                <Ionicons
                  name={it.icon}
                  size={24}
                  color={COLORS.textMuted}
                  style={{ width: 28 }}
                />
                <Text style={styles.itemText}>{it.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={handleLogout}
              style={styles.item}
              disabled={loggingOut}
            >
              <Ionicons
                name="log-out-outline"
                size={24}
                color={COLORS.textMuted}
                style={{ width: 28 }}
              />
              <Text style={styles.itemText}>
                {loggingOut ? "Saliendo..." : "Cerrar sesión"}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        <Pressable style={styles.scrim} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  panel: { height: "100%", paddingBottom: 16 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 22,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  name: { color: COLORS.white, fontSize: 18, fontWeight: "800", maxWidth: 200 },
  role: { color: COLORS.white, opacity: 0.9, marginTop: 2 },
  itemsWrap: { paddingHorizontal: 20, gap: 8 },
  item: { height: 48, flexDirection: "row", alignItems: "center", gap: 10 },
  itemText: { color: COLORS.white, opacity: 0.95, fontSize: 16, fontWeight: "600" },
  footer: {
    marginTop: "auto",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopColor: COLORS.divider,
    borderTopWidth: 1,
  },
  scrim: { flex: 1 },
});