import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { MAZE_MAP, MAZE_ROWS, MAZE_COLS } from '../constants/maze';

interface Props {
  cellSize: number;
  dots: boolean[][];
  boardWidth: number;
  boardHeight: number;
}

/**
 * Renderiza el laberinto usando el fondo oscuro y paredes estilo pixel-art
 * con los colores exactos de los sprites del juego.
 * Dots blancos pequeños, power-dots amarillos grandes.
 */
function MazeRendererBase({ cellSize, dots, boardWidth, boardHeight }: Props) {
  const elements: React.ReactNode[] = [];

  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      const cell = MAZE_MAP[r][c];
      const x = c * cellSize;
      const y = r * cellSize;

      if (cell === 'W') {
        // Pared
        elements.push(
          <View key={`w-${r}-${c}`} style={{
            position: 'absolute', left: x, top: y,
            width: cellSize, height: cellSize,
            backgroundColor: '#0A4D68',
            borderWidth: 1,
            borderColor: '#14A3C7',
          }} />,
        );
      } else if (cell === 'O') {
        // Puerta ghost house
        elements.push(
          <View key={`o-${r}-${c}`} style={{
            position: 'absolute', left: x, top: y,
            width: cellSize, height: cellSize,
            backgroundColor: '#0B2A3C',
            borderTopWidth: 3,
            borderTopColor: '#8BD8E8',
          }} />,
        );
      }

      // Dots
      if (dots[r]?.[c]) {
        const isPower = cell === 'P';
        const dotSize = isPower ? cellSize * 0.5 : cellSize * 0.18;
        elements.push(
          <View key={`d-${r}-${c}`} style={{
            position: 'absolute',
            left: x + (cellSize - dotSize) / 2,
            top: y + (cellSize - dotSize) / 2,
            width: dotSize, height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: isPower ? '#FFD166' : '#FFFFFF',
          }} />,
        );
      }
    }
  }

  return (
    <View style={[styles.container, { width: boardWidth, height: boardHeight }]}>
      {elements}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0,
    backgroundColor: '#0B2A3C',
  },
});

export const MazeRenderer = React.memo(MazeRendererBase);
