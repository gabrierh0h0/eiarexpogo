import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { PACMAN_SPRITES } from '../constants/sprites';
import { PacmanState, Direction } from '../engine/pacmanEngine';

interface Props {
  pacman: PacmanState;
  cellSize: number;
  frightened: boolean;
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
 * Pascal-Pacman usando los sprites reales pascal.png.
 * Parpadea cuando es invulnerable.
 */
function PacmanCharBase({ pacman, cellSize, frightened }: Props) {
  const sprite = PACMAN_SPRITES.pascal;
  const rotation = getRotation(pacman.dir);
  const isInvulnerable = pacman.invulnerableMs > 0;
  const size = cellSize * 1.4;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: pacman.pos.col * cellSize + (cellSize - size) / 2,
        top: pacman.pos.row * cellSize + (cellSize - size) / 2,
        width: size,
        height: size,
        zIndex: 10,
        opacity: isInvulnerable ? (pacman.mouthOpen ? 1 : 0.3) : 1,
      }}
    >
      <Image
        source={sprite}
        style={[styles.image, {
          transform: [
            { rotate: rotation },
            { scaleX: pacman.mouthOpen ? 1 : 0.9 },
            { scaleY: pacman.mouthOpen ? 1 : 0.9 },
          ],
        }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
});

export const PacmanChar = React.memo(PacmanCharBase);
