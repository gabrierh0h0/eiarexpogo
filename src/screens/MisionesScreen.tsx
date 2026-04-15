import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import api from "../config/api";
import { mision } from "../types/mision";
import MisionCard from "../services/MisionCard";
import { LinearGradient } from "expo-linear-gradient";
import MenuOverlay from "./MenuOverlay";

const { height, width } = Dimensions.get("window");
const STATUSBAR_PAD = (StatusBar.currentHeight ?? 0) + 12;

export default function MisionesScreen() {
  const navigation = useNavigation();
  const [misiones, setMisiones] = useState<mision[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const fetchMisiones = async () => {
      try {
        const res = await api.get("/misiones");
        setMisiones(res.data);
      } catch (error) {
        console.error("Error cargando misiones:", error);
      }
    };

    fetchMisiones();
  }, []);

  return (
    <View style={styles.container}>
      {/* Contenido desplazable */}
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <Pressable onPress={() => setMenuVisible(true)}>
              <Ionicons name="menu-outline" size={32} color="#fff" />
            </Pressable>
            <Text style={styles.logoText}>EIAR</Text>
            <Ionicons name="log-out-outline" size={28} color="#fff" />
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.subtitle}>MISIONES</Text>
          <Text style={styles.description}>
            Completa misiones en distintos puntos del campus y descubre la EIA a
            través de experiencias interactivas.{"\n"}Escanea los códigos QR,
            sigue las instrucciones y aprende sobre tu entorno.
          </Text>
        </View>

        {/* Lista de misiones */}
        {misiones.map((mision) => (
          <MisionCard key={mision.id} mision={mision} />
        ))}
      </ScrollView>

      {/* Devanecido inferior */}
      <LinearGradient
        colors={["transparent", "rgba(1,58,75,0.95)", "#013A4B"]}
        style={styles.gradient}
        pointerEvents="none"
      />

      {/* Botón flotante Escanear QR */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("ScanQR" as never)}
      >
        <Ionicons name="qr-code-outline" size={24} color="#fff" />
        <Text style={styles.fabText}>Escanear QR</Text>
      </TouchableOpacity>

      {/* MENÚ LATERAL */}
      <MenuOverlay visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#013A4B" },
  scroll: {
    paddingVertical: 0,
    paddingBottom: 140,
  },
  headerContainer: {
    backgroundColor: "#136c88",
    width: width,
    paddingVertical: 10, // Reduced from 15 to 10 for compactness
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: STATUSBAR_PAD,
  },
  logoText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  descriptionContainer: {
    backgroundColor: "#136c88",
    width: width,
    paddingVertical: 10, // Reduced from 20 to 10 for compactness
    paddingHorizontal: 20,
  },
  subtitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4, // Reduced from 8 to 4 to bring description closer
  },
  description: {
    color: "#cce6ea",
    fontSize: 15,
    lineHeight: 18, // Reduced from 22 to 18 for tighter text

  },
  gradient: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: height * 0.25,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00B4D8",
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});