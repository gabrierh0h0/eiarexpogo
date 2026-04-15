import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Image,
    TouchableOpacity,
    StatusBar,
    TextInput,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MenuOverlay from "./MenuOverlay";
import api from "../config/api";
import { mision } from "../types/mision";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const STATUSBAR_PAD = (StatusBar.currentHeight ?? 0) + 12;

// The original image is portrait ~576×1024.
// We scale it so width fills the screen and height scales proportionally.
const MAP_ASPECT = 1024 / 576; // ≈ 1.78
const MAP_W = SCREEN_W;
const MAP_H = MAP_W * MAP_ASPECT;

type Pin = {
    id: string;
    title: string;
    floor: number;
    x: number; // percentage 0-100 of the IMAGE width
    y: number; // percentage 0-100 of the IMAGE height
    completed: boolean;
};

/*
 * Pin coordinates calibrated on the aerial campus image:
 *
 * The 4 blocks on the LEFT from top to bottom are A, B, C, D.
 * Looking at the image:
 *   - Bloque A (top-left block):   center ≈ x:20%  y:20%
 *   - Bloque B (2nd from top):     center ≈ x:20%  y:32%
 *   - Bloque C (3rd):              center ≈ x:22%  y:44%
 *   - Bloque D (bottom):           center ≈ x:24%  y:56%
 *   - Biblioteca (large central):  center ≈ x:38%  y:28%
 *   - Bienestar (frente Bloque A): roughly  x:35%  y:20%
 */
const MISSION_LOCATIONS: Record<string, { floor: number; x: number; y: number }> = {
    "Un Gran Desafío Digital": { floor: 0, x: 23, y: 43 },  // Bloque B, PB – Aula de sistemas
    "Ruta Del Conocimiento": { floor: 1, x: 33, y: 58 },  // Biblioteca, Piso 1
    "Aventura Del Autocuidado": { floor: 1, x: 29, y: 30 },  // Bienestar (frente Bloque A), Piso 1
    "Laboratorio Sin Fronteras": { floor: 0, x: 27, y: 25 },  // Bloque A, PB – Laboratorios
};

export default function MapScreen() {
    const navigation = useNavigation();
    const [menuVisible, setMenuVisible] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState<number>(0);
    const [pins, setPins] = useState<Pin[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

    const floors = [
        { value: 0, label: "PB" },
        { value: 1, label: "1" },
        { value: 2, label: "2" },
        { value: 3, label: "3" },
    ];

    useEffect(() => {
        const fetchMisiones = async () => {
            try {
                const res = await api.get("/misiones");
                const fetchedMisiones: mision[] = res.data;

                const normalize = (str: string) =>
                    str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                const misionesPins: Pin[] = fetchedMisiones.map((m) => {
                    const normalizedNombre = normalize(m.nombre);
                    const matchedKey = Object.keys(MISSION_LOCATIONS).find(
                        (k) => normalize(k) === normalizedNombre
                    );
                    const loc = matchedKey
                        ? MISSION_LOCATIONS[matchedKey]
                        : { floor: 0, x: 50, y: 50 };

                    return {
                        id: m.id,
                        title: m.nombre,
                        floor: loc.floor,
                        x: loc.x,
                        y: loc.y,
                        completed: m.completed || false,
                    };
                });
                setPins(misionesPins);
            } catch (error) {
                console.error("Error al cargar misiones para mapa:", error);
            }
        };
        fetchMisiones();
    }, []);

    const visiblePins = pins.filter(
        (pin) =>
            pin.floor === selectedFloor &&
            pin.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePinPress = (pin: Pin) => {
        setSelectedPin(pin);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => setMenuVisible(true)}
                >
                    <Ionicons name="menu-outline" size={32} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.logoText}>EIAR</Text>
                <Ionicons name="map-outline" size={28} color="#fff" />
            </View>

            {/* Map area – scrollable */}
            <View style={styles.mapWrapper}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{ width: MAP_W, height: MAP_H }}
                    maximumZoomScale={3}
                    minimumZoomScale={1}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={{ width: MAP_W, height: MAP_H }}>
                        <Image
                            source={require("../../assets/mapa_eia.jpg")}
                            style={{ width: MAP_W, height: MAP_H }}
                            resizeMode="contain"
                        />

                        {/* Pins */}
                        {visiblePins.map((pin) => {
                            const pinLeft = (pin.x / 100) * MAP_W - 20;
                            const pinTop = (pin.y / 100) * MAP_H - 44;

                            return (
                                <TouchableOpacity
                                    key={pin.id}
                                    activeOpacity={0.7}
                                    onPress={() => handlePinPress(pin)}
                                    style={[styles.pinContainer, { left: pinLeft, top: pinTop }]}
                                >
                                    <Image
                                        source={require("../../assets/map_pin.png")}
                                        style={[
                                            styles.pinIcon,
                                            pin.completed && { tintColor: "#5efc82" },
                                        ]}
                                    />
                                    <View style={styles.pinLabelWrapper}>
                                        <Text style={styles.pinLabel} numberOfLines={2}>
                                            {pin.title}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Floor Selector (Floating Left) */}
                <View style={styles.floorSelector}>
                    {floors.map((floor) => (
                        <TouchableOpacity
                            key={floor.value}
                            style={[
                                styles.floorButton,
                                selectedFloor === floor.value && styles.floorButtonActive,
                            ]}
                            onPress={() => setSelectedFloor(floor.value)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.floorButtonText,
                                    selectedFloor === floor.value && styles.floorButtonTextActive,
                                ]}
                            >
                                {floor.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Selected Pin Info (floating bottom card) */}
                {selectedPin && (
                    <View style={styles.pinInfoCard}>
                        <View style={styles.pinInfoContent}>
                            <Ionicons
                                name={selectedPin.completed ? "checkmark-circle" : "location"}
                                size={28}
                                color={selectedPin.completed ? "#5efc82" : "#fb8700"}
                            />
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text style={styles.pinInfoTitle}>{selectedPin.title}</Text>
                                <Text style={styles.pinInfoFloor}>
                                    Piso: {selectedPin.floor === 0 ? "PB" : selectedPin.floor} •{" "}
                                    {selectedPin.completed ? "Completada ✓" : "Pendiente"}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.pinInfoClose}
                                onPress={() => setSelectedPin(null)}
                            >
                                <Ionicons name="close" size={20} color="#94b2c3" />
                            </TouchableOpacity>
                        </View>
                        {!selectedPin.completed && (
                            <TouchableOpacity
                                style={styles.goToScanBtn}
                                onPress={() => {
                                    setSelectedPin(null);
                                    navigation.navigate("ScanQR" as never);
                                }}
                            >
                                <Ionicons name="qr-code-outline" size={18} color="#fff" />
                                <Text style={styles.goToScanText}>Ir a escanear QR</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Search Bar (Floating Bottom) */}
                {!selectedPin && (
                    <View style={styles.searchContainer}>
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={22} color="#94b2c3" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar misiones..."
                                placeholderTextColor="#94b2c3"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>
                )}
            </View>

            <MenuOverlay
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#023048",
    },
    header: {
        backgroundColor: "#136c88",
        height: 90,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: STATUSBAR_PAD,
        zIndex: 10,
    },
    logoText: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "bold",
    },

    /* Map */
    mapWrapper: {
        flex: 1,
        position: "relative",
        overflow: "hidden",
    },
    scrollView: {
        flex: 1,
    },

    /* Pins */
    pinContainer: {
        position: "absolute",
        alignItems: "center",
        width: 80,
        zIndex: 100,
    },
    pinIcon: {
        width: 40,
        height: 44,
        resizeMode: "contain",
    },
    pinLabelWrapper: {
        backgroundColor: "rgba(2, 48, 72, 0.85)",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginTop: 2,
        maxWidth: 100,
    },
    pinLabel: {
        color: "#fff",
        fontSize: 9,
        textAlign: "center",
        fontWeight: "bold",
    },

    /* Floor selector */
    floorSelector: {
        position: "absolute",
        left: 12,
        top: 20,
        backgroundColor: "#136c88",
        borderRadius: 12,
        overflow: "hidden",
        elevation: 8,
        zIndex: 200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    floorButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        justifyContent: "center",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.1)",
    },
    floorButtonActive: {
        backgroundColor: "#fb8700",
    },
    floorButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    floorButtonTextActive: {
        color: "#fff",
    },

    /* Pin info card */
    pinInfoCard: {
        position: "absolute",
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: "#136c88",
        borderRadius: 16,
        padding: 16,
        zIndex: 300,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    pinInfoContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    pinInfoTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    pinInfoFloor: {
        color: "#bbd1dc",
        fontSize: 13,
        marginTop: 2,
    },
    pinInfoClose: {
        padding: 4,
    },
    goToScanBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fb8700",
        borderRadius: 12,
        paddingVertical: 10,
        marginTop: 12,
        gap: 8,
    },
    goToScanText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14,
    },

    /* Search */
    searchContainer: {
        position: "absolute",
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 200,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(2, 48, 72, 0.9)",
        borderRadius: 25,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: "rgba(148, 178, 195, 0.3)",
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: "#fff",
        fontSize: 15,
    },
});
