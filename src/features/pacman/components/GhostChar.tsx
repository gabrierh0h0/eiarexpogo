import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { GHOST_SPRITES } from '../constants/sprites';
import { Ghost } from '../engine/pacmanEngine';

interface Props {
  ghost: Ghost;
  cellSize: number;
}

/**
 * Fantasma usando los sprites reales (fantasmaRojo, Azul, etc).
 * Cuando está frightened se vuelve azul oscuro.
 * Cuando eaten/house no se muestra.
 */
function GhostCharBase({ ghost, cellSize }: Props) {
  if (ghost.mode === 'eaten' || ghost.mode === 'house') return null;

  const isFrightened = ghost.mode === 'frightened';
  const size = cellSize * 1.3;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: ghost.pos.col * cellSize + (cellSize - size) / 2,
        top: ghost.pos.row * cellSize + (cellSize - size) / 2,
        width: size,
        height: size,
        zIndex: 5,
      }}
    >
      {isFrightened ? (
        <View style={[styles.frightenedBody, {
          width: size * 0.8, height: size * 0.8,
          borderRadius: size * 0.4,
          marginLeft: size * 0.1, marginTop: size * 0.1,
        }]}>
          <View style={styles.frightenedEyes}>
            <View style={styles.fEye} />
            <View style={styles.fEye} />
          </View>
        </View>
      ) : (
        <Image
          source={GHOST_SPRITES[ghost.id]}
          style={styles.image}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
  frightenedBody: {
    backgroundColor: '#1111AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frightenedEyes: {
    flexDirection: 'row',
    gap: 6,
  },
  fEye: {
    width: 5, height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
});

export const GhostChar = React.memo(GhostCharBase);
