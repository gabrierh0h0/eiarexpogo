import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    StatusBar,
    Dimensions,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    Pressable
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../config/api";
import MenuOverlay from "./MenuOverlay";

const { width } = Dimensions.get("window");
const STATUSBAR_PAD = (StatusBar.currentHeight ?? 0) + 12;

type RankUser = {
    uid: string;
    rank: number;
    firstName: string;
    lastName: string;
    totalPoints: number;
};

export default function RankingScreen() {
    const [ranking, setRanking] = useState<RankUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);

    const fetchRanking = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get("/progress/ranking");
            setRanking(res.data);
        } catch (err) {
            setError("No se pudo cargar el ranking. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRanking();
    }, []);

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#219ebc" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchRanking}>
                    <Text style={styles.retryText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const top3 = ranking.slice(0, 3);
    // Sort them as (2, 1, 3) for the podium
    const podiumLayout = [
        top3[1] || null, // #2
        top3[0] || null, // #1
        top3[2] || null, // #3
    ];

    const rest = ranking.slice(3);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => setMenuVisible(true)}>
                    <Ionicons name="menu-outline" size={32} color="#fff" />
                </Pressable>
                <Text style={styles.logoText}>EIAR</Text>
                <Ionicons name="qr-code-outline" size={28} color="#fff" />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>CLASIFICACION</Text>

                {/* Podium Section */}
                <View style={styles.podiumContainer}>
                    {podiumLayout.map((user, idx) => {
                        if (!user) return <View key={idx} style={styles.emptyPodium} />;

                        const isFirst = user.rank === 1;
                        const posLabel = user.rank;

                        return (
                            <View key={user.uid} style={[styles.podiumUser, isFirst && styles.firstPodium]}>
                                {isFirst && <Ionicons name="ribbon" size={24} color="#fb8700" style={styles.crown} />}
                                <Text style={styles.posLabel}>{posLabel}</Text>
                                <View style={[styles.avatarContainer, isFirst && styles.largeAvatar]}>
                                    <Ionicons name="person-circle-outline" size={isFirst ? 100 : 80} color="#bbd1dc" />
                                </View>
                                <Text style={styles.pointsLabel}>{user.totalPoints}</Text>
                                <Text style={styles.nameLabel} numberOfLines={1}>{user.firstName} {user.lastName}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* List Section */}
                <View style={styles.listContainer}>
                    {rest.map((user) => (
                        <View key={user.uid} style={styles.rankCard}>
                            <View style={styles.rankBadge}>
                                <Text style={styles.rankNum}>{user.rank}</Text>
                            </View>
                                <Ionicons name="person-circle" size={40} color="#bbd1dc" style={{ marginLeft: 10 }} />
                            <View style={styles.infoCol}>
                                <Text style={styles.cardName}>{user.firstName} {user.lastName}</Text>
                                <Text style={styles.cardPoints}>{user.totalPoints} puntos</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <MenuOverlay visible={menuVisible} onClose={() => setMenuVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#023048" },
    center: { justifyContent: "center", alignItems: "center" },
    header: {
        backgroundColor: "#136c88",
        height: 90,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: STATUSBAR_PAD,
    },
    logoText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
    scroll: { paddingBottom: 40, alignItems: "center" },
    title: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "bold",
        marginVertical: 20,
        marginTop: 30
    },
    podiumContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
        width: "100%",
        paddingHorizontal: 10,
        marginBottom: 30
    },
    podiumUser: {
        alignItems: "center",
        width: width * 0.28,
    },
    firstPodium: {
        width: width * 0.35,
        marginBottom: 20
    },
    emptyPodium: { width: width * 0.28 },
    crown: { marginBottom: -5 },
    posLabel: { color: "#fb8700", fontWeight: "bold", fontSize: 16 },
    avatarContainer: {
        borderWidth: 3,
        borderColor: "#bbd1dc",
        borderRadius: 60,
        marginVertical: 10
    },
    largeAvatar: {
        borderColor: "#fb8700",
        borderRadius: 70
    },
    pointsLabel: { color: "#fff", fontWeight: "bold", fontSize: 18 },
    nameLabel: { color: "#bbd1dc", fontSize: 12, textAlign: "center" },

    errorText: { color: "#fff", textAlign: "center", padding: 20 },
    retryButton: { backgroundColor: "#219ebc", padding: 10, borderRadius: 5 },
    retryText: { color: "#fff" },

    listContainer: { width: "100%", paddingHorizontal: 15 },
    rankCard: {
        backgroundColor: "#136c88",
        borderRadius: 15,
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        marginBottom: 10,
        opacity: 0.95
    },
    rankBadge: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#bbd1dc",
        justifyContent: "center",
        alignItems: "center"
    },
    rankNum: { color: "#bbd1dc", fontWeight: "bold" },
    infoCol: { marginLeft: 12 },
    cardName: { color: "#fff", fontWeight: "bold", fontSize: 16, textTransform: "uppercase" },
    cardPoints: { color: "#bbd1dc", fontSize: 14 }
});
