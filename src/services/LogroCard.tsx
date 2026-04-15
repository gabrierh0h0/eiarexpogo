import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import { logro } from "../types/logros";

const LogroCard = ({ logro, onPress }: { logro: logro; onPress: () => void }) => {
  const isUnlocked = logro.unlocked;

  return (
    <View style={[styles.card, !isUnlocked && styles.lockedCard]}>
      <Text style={styles.title}>{logro.nombre}</Text>
      <View style={styles.iconContainer}>
        {isUnlocked ? (
          <Image source={{ uri: logro.url?.trim() }} style={styles.icon} />
        ) : (
          <Ionicons name="lock-closed-outline" size={60} color="#fff" style={styles.lockIcon} />
        )}
      </View>
      <TouchableOpacity
        style={[styles.button, isUnlocked ? styles.unlockedButton : styles.lockedButton]}
        onPress={onPress}
        disabled={!isUnlocked} // Disable button if locked
      >
        <Text style={styles.buttonText}>
          {isUnlocked ? "Más información" : "Logro bloqueado"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#02576D",
    borderRadius: 15,
    padding: 10,
    marginVertical: 10,
    marginHorizontal: 5,
    flexDirection: "column",
    alignItems: "center",
  },
  iconContainer: {
    borderRadius: 5,
  },
  icon: {
    width: 100,
    height: 100,
    marginTop: 5,
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },
  description: {
    color: "#cce6ea",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 5,
  },
  button: {
    backgroundColor: "#00b4d83a",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  lockedCard: {
    opacity: 0.8,
  },
  lockIcon: {
    marginVertical: 20,
  },
  unlockedButton: {
    backgroundColor: "#219ebc",
  },
  lockedButton: {
    backgroundColor: "#5c707b",
  },
});

export default LogroCard;