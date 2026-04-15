import React, { useEffect, useState } from "react";
import MenuOverlay from "./MenuOverlay";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Image,
  Pressable,
  StatusBar,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { validateQRData } from "../services/QrService";
import { completeMission } from "../services/progressService";

const STATUSBAR_PAD = (StatusBar.currentHeight ?? 0) + 12;

export default function ScanQRScreen({ navigation }: any) {
  // Estados principales
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanStatus, setScanStatus] = useState<
    "preview" | "scanning" | "success" | "error"
  >("preview");
  const [menuVisible, setMenuVisible] = useState(false);

  // Solicitar permisos de cámara
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Manejo de escaneo del QR
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const result = await validateQRData(data);
      if (result.success && result.data) {
        // Complete mission on backend
        await completeMission(result.data);
        setScanStatus("success");
      } else {
        setScanStatus("error");
      }
    } catch (error) {
      setScanStatus("error");
    }
  };

  // Reiniciar el escáner
  const resetScanner = () => {
    setScanned(false);
    setScanStatus("preview");
  };

  // --- VISTAS SEGÚN EL ESTADO DEL PERMISO ---
  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Solicitando permisos de cámara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>No se pudo acceder a la cámara.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- PANTALLA PRINCIPAL ---
  return (
    <ImageBackground
      source={require("../../assets/IMG_2671.png")}
      style={styles.background}
      blurRadius={6}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu-outline" size={32} color="#fff" />
        </Pressable>
        <Text style={styles.resultTitle}>Escanear QR</Text>
        <Ionicons name="qr-code-outline" size={28} color="#fff" />
      </View>

      {/* PREVIEW */}
      {scanStatus === "preview" && (
        <View style={styles.previewContainer}>
          <TouchableOpacity
            style={styles.qrTouchable}
            onPress={() => setScanStatus("scanning")}
          >
            <Image
              source={require("../../assets/QR_code.png")}
              style={styles.qrImage}
              resizeMode="contain"
            />
            <Text style={styles.instructionText}>
              Toca aquí para escanear tu código QR
            </Text>

            {/* Bordes azules */}
            <View style={[styles.qrCorner, styles.topLeft]} />
            <View style={[styles.qrCorner, styles.topRight]} />
            <View style={[styles.qrCorner, styles.bottomLeft]} />
            <View style={[styles.qrCorner, styles.bottomRight]} />
          </TouchableOpacity>
        </View>
      )}

      {/* ESCANEO */}
      {scanStatus === "scanning" && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          <View style={styles.qrFrame} />
        </View>
      )}

      {/* ÉXITO */}
      {scanStatus === "success" && (
        <View style={styles.resultContainer}>
          <Image
            source={require("../../assets/QR_code.png")}
            style={styles.resultImage}
            resizeMode="contain"
          />
          <Text style={styles.resultTitle}>ESCANEO EXITOSO</Text>
          <Text style={styles.resultText}>
            ¡Escaneo exitoso! Ya puedes explorar las actividades y materiales disponibles
          </Text>
          <TouchableOpacity
            style={styles.resultButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.resultButtonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ERROR */}
      {scanStatus === "error" && (
        <View style={styles.errorContainer}>
          <View style={styles.errorTextContainer}>
            <Text style={styles.errorTitle}>EL ESCANEO HA FALLADO</Text>
            <Text style={styles.errorSubtitle}>
              Escaneo fallido. Por favor, ajusta la cámara y asegúrate de enfocar correctamente el código
            </Text>
          </View>

          <View style={styles.qrWrapper}>
            <Image
              source={require("../../assets/QR_code.png")}
              style={styles.qrImage}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.refreshCircle} onPress={resetScanner}>
              <Ionicons name="refresh" size={60} color="white" />
            </TouchableOpacity>

            {/* Esquinas azules */}
            <View style={[styles.qrCorner, styles.topLeft]} />
            <View style={[styles.qrCorner, styles.topRight]} />
            <View style={[styles.qrCorner, styles.bottomLeft]} />
            <View style={[styles.qrCorner, styles.bottomRight]} />
          </View>
        </View>
      )}
      {/* MENÚ LATERAL */}
      <MenuOverlay visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
  },
  header: {
    backgroundColor: "#0C6D87",
    width: "100%",
    height: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: STATUSBAR_PAD,
  },
  logo: {
    width: 100,
    height: 40,
  },
  previewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  qrTouchable: {
    justifyContent: "center",
    alignItems: "center",
  },
  qrImage: {
    width: 260,
    height: 260,
  },
  instructionText: {
    color: "white",
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
  },
  qrCorner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#1CA9C9",
  },
  topLeft: {
    top: -10,
    left: -10,
    borderLeftWidth: 4,
    borderTopWidth: 4,
  },
  topRight: {
    top: -10,
    right: -10,
    borderRightWidth: 4,
    borderTopWidth: 4,
  },
  bottomLeft: {
    bottom: -10,
    left: -10,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
  },
  bottomRight: {
    bottom: -10,
    right: -10,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },
  cameraContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  qrFrame: {
    position: "absolute",
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: "#1CA9C9",
    borderRadius: 10,
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#002C40",
    paddingHorizontal: 20,
  },
  resultImage: {
    width: 260,
    height: 260,
    marginBottom: 20,
  },
  resultTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  resultText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  resultButton: {
    backgroundColor: "#1CA9C9",
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 50,
  },
  resultButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#1CA9C9",
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 40,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#002C40",
    alignItems: "center",
    justifyContent: "center",
  },
  errorTextContainer: {
    marginTop: -100,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  errorTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  errorSubtitle: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  qrWrapper: {
    marginTop: 20,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  refreshCircle: {
    position: "absolute",
    width: 100,
    height: 100,
    backgroundColor: "#1CA9C9",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});
