import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { mision } from "../types/mision";

interface Props {
  mision: mision;
}

const MisionCard: React.FC<Props> = ({ mision }) => {
  return (
    <View
      style={[
        styles.card,
        mision.completed && { opacity: 0.6, borderColor: "#5efc82" },
      ]}
    >
      <Image source={{ uri: mision.url }} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{mision.nombre}</Text>
        <Text style={styles.description}>{mision.descripcion}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#02576D",
    borderRadius: 20,
    padding: 15,
    marginTop: 12,
    marginHorizontal: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  icon: {
    width: 100,
    height: 100,
    marginRight: 2,
    marginLeft: -10,
  },
  textContainer: { flex: 1 },
  title: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  description: {
    color: "#bde0ea",
    fontSize: 14,
    lineHeight: 20,
  },
});

export default MisionCard;
