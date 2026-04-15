import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import MenuOverlay from "./MenuOverlay";
import { getMyProgress } from "../services/progressService";
import api from "../config/api";
import { logro } from "../types/logros";

const { width } = Dimensions.get("window");
const STATUSBAR_PAD = (StatusBar.currentHeight ?? 0) + 12;
const RING_SIZE = 220;
const RING_STROKE = 22;
const RADIUS = (RING_SIZE - RING_STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ProgressResponse = {
  totalPoints: number;
  completedMissions: string[];
  unlockedLogros: string[];
  completedMissionsCount: number;
  unlockedLogrosCount: number;
  pendingMissionsCount: number;
  totalMissions: number;
  totalLogros: number;
  completedItems: number;
  totalItems: number;
  progressPercentage: number;
};

const truncateDescription = (text: string, max = 30) => {
  const cleanText = String(text ?? "").trim().replace(/\s+/g, " ");

  if (cleanText.length <= max) return cleanText;
  return `${cleanText.slice(0, max).trim()}...`;
};

export default function ProgressScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [unlockedLogros, setUnlockedLogros] = useState<logro[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [progressData, logrosRes] = await Promise.all([
        getMyProgress(),
        api.get("/logros"),
      ]);

      const unlocked = (logrosRes.data as logro[]).filter((item) => item.unlocked);

      setProgress(progressData);
      setUnlockedLogros(unlocked);
    } catch (e) {
      console.error("Error cargando progreso:", e);
      setError("No se pudo cargar tu progreso.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const dashOffset = useMemo(() => {
    const percentage = progress?.progressPercentage ?? 0;
    return CIRCUMFERENCE - (CIRCUMFERENCE * percentage) / 100;
  }, [progress?.progressPercentage]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6fb6dd" />
      </View>
    );
  }

  if (error || !progress) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error ?? "No hay datos de progreso."}</Text>
        <Pressable style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => setMenuVisible(true)}>
              <Ionicons name="menu-outline" size={32} color="#fff" />
            </Pressable>
            <Text style={styles.logoText}>EIAR</Text>
            <View style={{ width: 32 }} />
          </View>

          <Text style={styles.headerTitle}>PROGRESO</Text>
          <Text style={styles.headerDescription}>
            Consulta aquí cómo va tu recorrido en EIAR. Revisa tus misiones
            completadas, tus insignias desbloqueadas y tu avance general.
          </Text>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>TU PROGRESO</Text>

          <View style={styles.ringWrapper}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                stroke="#d9d9d9"
                fill="none"
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                strokeWidth={RING_STROKE}
              />
              <Circle
                stroke="#6fb6dd"
                fill="none"
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                strokeWidth={RING_STROKE}
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={styles.percentageText}>{progress.progressPercentage}%</Text>
            </View>
          </View>

          <View style={styles.cardContainer}>
            <View style={styles.pointsCard}>
              <Ionicons name="person-circle-outline" size={34} color="#dfe7eb" />
              <Text style={styles.pointsText}>
                PUNTAJE ACTUAL: {progress.totalPoints} puntos
              </Text>
            </View>

            <View style={styles.statsCard}>
              <Text style={styles.statLine}>
                - MISIONES COMPLETADAS: {progress.completedMissionsCount}
              </Text>
              <Text style={styles.statLine}>
                - INSIGNIAS DESBLOQUEADAS: {progress.unlockedLogrosCount}
              </Text>
              <Text style={styles.statLine}>
                - MISIONES PENDIENTES: {progress.pendingMissionsCount}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>RESUMEN GENERAL</Text>
              <Text style={styles.summaryText}>
                Has completado {progress.completedItems} de {progress.totalItems} elementos
                del recorrido.
              </Text>
              <Text style={styles.summaryMiniText}>
                Misiones: {progress.completedMissionsCount}/{progress.totalMissions}
              </Text>
              <Text style={styles.summaryMiniText}>
                Insignias: {progress.unlockedLogrosCount}/{progress.totalLogros}
              </Text>
            </View>

            <View style={styles.badgesSection}>
              <Text style={styles.badgesTitle}>INSIGNIAS OBTENIDAS:</Text>

              {unlockedLogros.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    Aún no tienes insignias desbloqueadas.
                  </Text>
                </View>
              ) : (
                unlockedLogros.map((item) => (
                  <View key={item.id} style={styles.badgeCard}>
                    <View style={styles.badgeIconBox}>
                      {item.url?.trim() ? (
                        <Image
                          source={{ uri: item.url.trim() }}
                          style={styles.badgeImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons name="ribbon-outline" size={28} color="#fb8700" />
                      )}
                    </View>
                    <View style={styles.badgeInfo}>
                      <Text style={styles.badgeName} numberOfLines={1}>
                        {item.nombre}
                      </Text>
                      <Text style={styles.badgeDescription} numberOfLines={2}>
                        {truncateDescription(item.descripcion, 30)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <MenuOverlay visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#023048",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerContainer: {
    backgroundColor: "#136c88",
    paddingTop: STATUSBAR_PAD,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  logoText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 6,
  },
  headerDescription: {
    color: "#e4f1f7",
    fontSize: 16,
    lineHeight: 22,
    maxWidth: width - 40,
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 18,
  },
  ringWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  percentageText: {
    color: "#6fb6dd",
    fontSize: 38,
    fontWeight: "900",
  },
  cardContainer: {
    backgroundColor: "#0b4963",
    borderRadius: 28,
    padding: 16,
    gap: 14,
  },
  pointsCard: {
    backgroundColor: "#5e98b8",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pointsText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    flexShrink: 1,
  },
  statsCard: {
    backgroundColor: "#6aa1bf",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  statLine: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
  },
  summaryCard: {
    backgroundColor: "#3d86ab",
    borderRadius: 16,
    padding: 16,
  },
  summaryTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  summaryText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 21,
    marginBottom: 8,
  },
  summaryMiniText: {
    color: "#eaf7ff",
    fontSize: 15,
    fontWeight: "700",
  },
  badgesSection: {
    backgroundColor: "#3d86ab",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  badgesTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  badgeCard: {
    backgroundColor: "#74acd0",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badgeIconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  badgeImage: {
    width: 46,
    height: 46,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 4,
  },
  badgeDescription: {
    color: "#eef8ff",
    fontSize: 13,
    lineHeight: 17,
    maxWidth: "95%",
  },
  emptyCard: {
    backgroundColor: "#74acd0",
    borderRadius: 14,
    padding: 16,
  },
  emptyText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 14,
  },
  retryButton: {
    backgroundColor: "#219ebc",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
});
