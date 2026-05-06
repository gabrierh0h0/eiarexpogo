import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Direction } from '../engine/pacmanEngine';

interface Props {
  onDirection: (dir: Direction) => void;
}

/**
 * D-Pad virtual para controlar a Pacman con 4 botones direccionales.
 * Diseño tipo cruz, optimizado para jugar con el pulgar.
 */
function DPadBase({ onDirection }: Props) {
  return (
    <View style={styles.container}>
      {/* Fila superior - Arriba */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onDirection('up')}
          activeOpacity={0.6}
        >
          <Ionicons name="chevron-up" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Fila media - Izquierda y Derecha */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onDirection('left')}
          activeOpacity={0.6}
        >
          <Ionicons name="chevron-back" size={32} color="#fff" />
        </TouchableOpacity>

        <View style={styles.center} />

        <TouchableOpacity
          style={styles.button}
          onPress={() => onDirection('right')}
          activeOpacity={0.6}
        >
          <Ionicons name="chevron-forward" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Fila inferior - Abajo */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onDirection('down')}
          activeOpacity={0.6}
        >
          <Ionicons name="chevron-down" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const BUTTON_SIZE = 58;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    backgroundColor: 'rgba(28, 169, 201, 0.55)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 216, 232, 0.4)',
  },
  center: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    margin: 3,
  },
});

export const DPad = React.memo(DPadBase);
