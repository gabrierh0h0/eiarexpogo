import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";

import MenuOverlay from "../screens/MenuOverlay";
import { useAuth } from "../contexts/AuthContext";

type Nav = NativeStackNavigationProp<RootStackParamList, "Home">;

const STATUSBAR_PAD = (StatusBar.currentHeight ?? 0) + 12;
const { height, width } = Dimensions.get("window");
const HEADER_H = Math.round(height * 0.25);
const LOGO = require("../../assets/LogoPantallaInicio.png");
const BG_IMG = require("../../assets/home_bloque_a.jpg");

const capitalizeWord = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

const COLORS = {
  topbar: "#136c88",
  bg: "#023048",
  textLight: "#e8f5f7",
  overlay: "rgba(15,110,119,0.50)",
};


export default function Inicio() {
  const navigation = useNavigation<Nav>();
  const [menuVisible, setMenuVisible] = useState(false);
  const { profile, user, logout } = useAuth();

  const userName = useMemo(() => {
    const firstName = String(profile?.firstName ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)[0] ?? "";

    const firstLastName = String(profile?.lastName ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)[0] ?? "";

    const fullName = [capitalizeWord(firstName), capitalizeWord(firstLastName)]
      .filter(Boolean)
      .join(" ");

    if (fullName) return fullName;

    const fallback = user?.email?.split("@")[0] ?? "Usuario";
    return capitalizeWord(fallback);
  }, [profile, user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" as never }],
      });
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { height: HEADER_H }]}>
        <View style={styles.topRow}>
          {/* AHORA: las 3 rayitas abren el menú */}
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu-outline" size={26} color="#e8f5f7" />
          </TouchableOpacity>

          <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />

          {/* Derecha: SOLO logout (se eliminan los 3 puntitos) */}
          <View style={styles.rightIcons}>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={26} color="#e8f5f7" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerText}>
          <Text style={styles.welcome1}>Te damos la bienvenida a EIAR</Text>
          <Text style={styles.welcome2}>{userName}</Text>
        </View>
      </View>

      {/* CUERPO */}
      <View style={styles.body}>
        <Text style={styles.sectionTitle}>
          Desbloquea nuevos lugares y experiencias explorando la universidad
        </Text>

        <View style={styles.card}>
          <ImageBackground
            source={BG_IMG}
            style={styles.bg}
            resizeMode="cover"
            blurRadius={3}
          >
            <View style={styles.lockWrap}>
              <View style={styles.lockCircle}>
                <Ionicons name="lock-closed-outline" size={30} color="#1d2b2f" />
              </View>
            </View>

            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.6)"]}
              style={styles.gradient}
            />

            <View style={styles.calloutBox}>
              <Text style={styles.calloutSubtitle}>Anímate a conocer el</Text>
              <View style={styles.row}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.calloutTitle}>BLOQUE A</Text>
              </View>
            </View>
          </ImageBackground>
        </View>
      </View>

      {/* Menú lateral (solo visual) */}
      <MenuOverlay
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    backgroundColor: COLORS.topbar,
    paddingHorizontal: 16,
    paddingTop: STATUSBAR_PAD,
    justifyContent: "space-between",
  },
  topRow: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImg: { width: 120, height: 28 },
  headerText: { paddingBottom: 12 },
  welcome1: {
    color: COLORS.textLight,
    fontSize: 16,
    opacity: 0.95,
    marginBottom: 4,
  },
  welcome2: { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: 0.5 },

  body: { paddingTop: 16 },
  sectionTitle: {
    color: COLORS.textLight,
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  card: {
    width: width - 32,
    height: 460,
    marginHorizontal: 16,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#0a2f3b",
  },
  bg: { flex: 1, width: "100%", height: "100%" },

  lockWrap: {
    position: "absolute",
    top: "42%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2,
  },
  lockCircle: {
    backgroundColor: "rgba(255, 255, 255, 0)",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },

  calloutBox: {
    position: "absolute",
    left: 16,
    bottom: 16,
    backgroundColor: COLORS.overlay,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    maxWidth: "80%",
  },
  calloutSubtitle: {
    color: "#e9f3f6",
    fontSize: 14,
    marginBottom: 6,
    opacity: 0.95,
  },
  row: { flexDirection: "row", alignItems: "center" },
  calloutTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 0.6,
  },
});