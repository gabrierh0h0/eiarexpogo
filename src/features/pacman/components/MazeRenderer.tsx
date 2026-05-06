import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  MAZE_MAP,
  MAZE_ROWS,
  MAZE_COLS,
  CellType,
} from '../constants/maze';

interface Props {
  cellSize: number;
  dots: boolean[][];
}

/**
 * Renderiza el laberinto como una cuadrícula de Views.
 * Las paredes se dibujan con color, los caminos con fondo oscuro.
 * Los dots y power-dots se renderizan como círculos sobre las celdas.
 */
function MazeRendererBase({ cellSize, dots }: Props) {
  const rows: React.ReactNode[] = [];

  for (let r = 0; r < MAZE_ROWS; r++) {
    const cells: React.ReactNode[] = [];
    for (let c = 0; c < MAZE_COLS; c++) {
      const cell = MAZE_MAP[r][c];
      const isWall = cell === 'W';
      const isDoor = cell === 'O';
      const hasDot = dots[r]?.[c] === true;
      const isPower = cell === 'P' && hasDot;
      const isNormalDot = cell === 'D' && hasDot;

      cells.push(
        <View
          key={`${r}-${c}`}
          style={[
            {
              width: cellSize,
              height: cellSize,
            },
            isWall && styles.wall,
            isDoor && styles.door,
            !isWall && !isDoor && styles.path,
          ]}
        >
          {isNormalDot && (
            <View style={[styles.dot, {
              width: cellSize * 0.2,
              height: cellSize * 0.2,
              borderRadius: cellSize * 0.1,
            }]} />
          )}
          {isPower && (
            <View style={[styles.powerDot, {
              width: cellSize * 0.45,
              height: cellSize * 0.45,
              borderRadius: cellSize * 0.225,
            }]} />
          )}
        </View>,
      );
    }
    rows.push(
      <View key={r} style={styles.row}>
        {cells}
      </View>,
    );
  }

  return <View style={styles.container}>{rows}</View>;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  row: {
    flexDirection: 'row',
  },
  wall: {
    backgroundColor: '#0A4D68',
    borderWidth: 1,
    borderColor: '#1CA9C9',
  },
  door: {
    backgroundColor: '#0C3547',
    borderTopWidth: 3,
    borderTopColor: '#8BD8E8',
  },
  path: {
    backgroundColor: '#0C3547',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    backgroundColor: '#FFFFFF',
  },
  powerDot: {
    backgroundColor: '#FFD166',
  },
});

export const MazeRenderer = React.memo(MazeRendererBase);
