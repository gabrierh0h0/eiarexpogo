import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { PACMAN_SPRITES } from '../constants/sprites';
import { PacmanState, Direction } from '../engine/pacmanEngine';

interface Props {
  pacman: PacmanState;
  cellSize: number;
}

function getRotation(dir: Direction): string {
  switch (dir) {
    case 'right': return '0deg';
    case 'down': return '90deg';
    case 'left': return '180deg';
    case 'up': return '270deg';
    default: return '0deg';
  }
}

/**
 * Render del personaje Pacman (Pascal) con animación boca abierta/cerrada
 * y rotación según dirección.
 */
function PacmanCharBase({ pacman, cellSize }: Props) {
  const sprite = pacman.mouthOpen ? PACMAN_SPRITES.open : PACMAN_SPRITES.closed;
  const rotation = getRotation(pacman.dir);
  const isInvulnerable = pacman.invulnerableMs > 0;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        {
          left: pacman.pos.col * cellSize,
          top: pacman.pos.row * cellSize,
          width: cellSize,
          height: cellSize,
          opacity: isInvulnerable ? (pacman.mouthOpen ? 1 : 0.4) : 1,
        },
      ]}
    >
      <Image
        source={sprite}
        style={[
          styles.image,
          { transform: [{ rotate: rotation }] },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export const PacmanChar = React.memo(PacmanCharBase);
