import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Image,
  Pressable,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import api from "../config/api";
import { logro } from "../types/logros";
import LogroCard from "../services/LogroCard";
import { LinearGradient } from "expo-linear-gradient";
import MenuOverlay from "./MenuOverlay";

const { height, width } = Dimensions.get("window");
const STATUSBAR_PAD = (StatusBar.currentHeight ?? 0) + 12;

export default function LogrosScreen() {
  const navigation = useNavigation();
  const [logros, setLogros] = useState<logro[]>([]);
  const [selectedLogro, setSelectedLogro] = useState<logro | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const fetchLogros = async () => {
      try {
        const res = await api.get("/logros");
        setLogros(res.data);
      } catch (error) {
        console.error("Error cargando logros:", error);
      }
    };

    fetchLogros();
  }, []);

  const handleMoreInfo = (logro: logro) => {
    setSelectedLogro(logro);
    setModalVisible(true);
  };

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
          <Text style={styles.subtitle}>TABLA DE LOGROS</Text>
          <Text style={styles.description}>
            Consulta aquí los logros que has conseguido y los que están por
            desbloquear. ¡Descubre nuevos retos y sigue sumando experiencias
            durante tu inducción en EIA!
          </Text>
        </View>

        {/* Lista de logros en cuadrícula */}
        <View style={styles.logrosGrid}>
          {logros.map((logro) => (
            <View key={logro.id} style={styles.cardWrapper}>
              <LogroCard logro={logro} onPress={() => handleMoreInfo(logro)} />
            </View>
          ))}
        </View>
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

      {/* Modal Detalle de Logro */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            {selectedLogro && (
              <>
                <Text style={styles.modalTitle}>{selectedLogro.nombre}</Text>
                {/* --- Dividir descripción automáticamente --- */}
                {(() => {
                  const partes = selectedLogro.descripcion.split(".");
                  const primeraParte = partes.length > 1 ? partes[0] + "." : selectedLogro.descripcion;
                  const segundaParte = partes.length > 1 ? partes.slice(1).join(".") : "";

                  return (
                    <>
                      <Text style={styles.modalDescriptionTop}>{primeraParte}</Text>
                      <Image
                        source={{ uri: selectedLogro.url?.trim() }}
                        style={styles.modalIcon}
                        resizeMode="contain"
                      />
                      {segundaParte !== "" && (
                        <Text style={styles.modalDescriptionBottom}>{segundaParte.trim()}</Text>
                      )}
                    </>
                  );
                })()}

                <Text style={styles.modalPoints}>Puntos: {selectedLogro.puntos}</Text>
              </>
            )}

          </View>
        </View>
      </Modal>
      {/* MENÚ LATERAL */}
      {menuVisible && (
        <MenuOverlay visible={menuVisible} onClose={() => setMenuVisible(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#013A4B" },
  scroll: {
    paddingBottom: 140,
  },
  headerContainer: {
    backgroundColor: "#136c88",
    width: width,
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingTop: STATUSBAR_PAD,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  descriptionContainer: {
    backgroundColor: "#136c88",
    width: width,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  subtitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    color: "#cce6ea",
    fontSize: 15,
    lineHeight: 18,
  },

  logrosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginTop: 10,
  },
  cardWrapper: {
    width: "47%",
    marginBottom: 15,
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#136c88",
    borderRadius: 25,
    padding: 20,
    width: width * 0.9,
    alignItems: "center",
  },
  closeButton: { alignSelf: "flex-end" },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalDescriptionTop: {
    color: "#cce6ea",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 8,
    width: "100%",
    lineHeight: 20,
  },

  modalDescriptionBottom: {
    color: "#e2f4f7",
    fontSize: 15,
    textAlign: "justify",
    width: "90%",
    lineHeight: 20,
    opacity: 0.9,
  },
  modalPoints: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalIcon: {
    width: 150,
    height: 150,
    borderRadius: 12,
    marginBottom: 2,
  },
});
