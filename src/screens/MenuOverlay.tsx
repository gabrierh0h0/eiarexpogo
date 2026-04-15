// screens/MenuOverlay.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../contexts/AuthContext";

const COLORS = {
  lightBlue: "#136c88",
  darkBlue: "#023048",
  white: "#ffffff",
  textMuted: "rgba(255,255,255,0.85)",
  divider: "rgba(255,255,255,0.08)",
};

function titleCase(s: string) {
  return s
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function roleLabel(role?: string | null) {
  const r = (role || "").toLowerCase().trim();
  if (["student", "estudiante"].includes(r)) return "Estudiante";
  if (["teacher", "docente", "profesor"].includes(r)) return "Docente";
  if (["admin", "administrator", "administrador"].includes(r)) return "Administrador";
  if (r) return titleCase(r);
  return "Invitado";
}

type Props = { visible: boolean; onClose: () => void };
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MenuOverlay({ visible, onClose }: Props) {
  const navigation = useNavigation<Nav>();
  const slide = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width * 0.8, 320);

  const { profile, user, isAuthenticated, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  // Animación del panel
  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-panelWidth, 0],
  });

  // Nombre mostrado (prioriza perfil del backend)
  const displayName = useMemo(() => {
    if (profile?.firstName || profile?.lastName) {
      return `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
    }
    if (user?.email) return titleCase(user.email.split("@")[0]);
    return "Usuario";
  }, [profile, user]);

  // Rol mostrado (prioriza perfil del backend)
  const displayRole = useMemo(() => {
    // si no está autenticado, forzamos "Invitado"
    if (!isAuthenticated) return "Invitado";
    return roleLabel((profile as any)?.role ?? null);
  }, [isAuthenticated, profile]);

  const items = useMemo(
    () => [
      { label: "Inicio", icon: "home-outline" as const, route: "Home" },
      { label: "Progreso", icon: "stats-chart-outline" as const, route: "Progreso" },
      { label: "Misiones", icon: "flag-outline" as const, route: "Mision" },
      { label: "Logros", icon: "trophy-outline" as const, route: "Logros" },
      { label: "Ranking", icon: "bar-chart-outline" as const, route: "Ranking" },
      { label: "Mapa", icon: "map-outline" as const, route: "Mapa" },
      { label: "Configuración", icon: "settings-outline" as const },
    ],
    []
  );

  const handleLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      onClose();
      await logout(); // ✅ borra SecureStore y limpia AuthContext
      navigation.reset({ index: 0, routes: [{ name: "Login" as never }] });
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
        {/* Panel */}
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
          {/* Header */}
          <View style={[styles.header, { backgroundColor: COLORS.lightBlue }]}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={36} color={COLORS.white} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text numberOfLines={1} style={styles.name}>
                {displayName}
              </Text>
              <Text style={styles.role}>{displayRole}</Text>
            </View>
          </View>

          {/* Items (solo visuales) */}
          <View style={styles.itemsWrap}>
            {items.map((it) => (
              <Pressable
                key={it.label}
                style={({ pressed }) => [
                  styles.item,
                  { opacity: pressed ? 0.5 : 1 },
                ]}
                onPress={() => {
                  if (it.route) {
                    onClose();
                    requestAnimationFrame(() => {
                      navigation.navigate(it.route as never);
                    });
                  }
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

          {/* Footer: Cerrar sesión */}
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

        {/* Scrim */}
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