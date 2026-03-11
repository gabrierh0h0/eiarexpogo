import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { logro } from "../types/logros";

const LogroCard = ({ logro, onPress }: { logro: logro; onPress: () => void }) => {
  return (
    <View style={styles.card}> 
      <Text style={styles.title}>{logro.nombre}</Text>
      <View style={styles.iconContainer}>
        <Image source={{ uri: logro.url?.trim() }} style={styles.icon} />
      </View>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>Más información</Text>
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
});

export default LogroCard;