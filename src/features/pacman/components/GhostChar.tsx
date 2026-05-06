import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { GHOST_SPRITES, GhostColor } from '../constants/sprites';
import { Ghost } from '../engine/pacmanEngine';

interface Props {
  ghost: Ghost;
  cellSize: number;
}

/**
 * Render de un fantasma con color según su id y estado visual
 * según su mode (normal, frightened=azul parpadeante, eaten=invisible).
 */
function GhostCharBase({ ghost, cellSize }: Props) {
  if (ghost.mode === 'eaten' || ghost.mode === 'house') return null;

  const isFrightened = ghost.mode === 'frightened';

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        {
          left: ghost.pos.col * cellSize,
          top: ghost.pos.row * cellSize,
          width: cellSize,
          height: cellSize,
        },
      ]}
    >
      {isFrightened ? (
        <View style={[styles.frightenedBody, { borderRadius: cellSize / 2 }]}>
          <View style={styles.frightenedEye} />
          <View style={styles.frightenedEye} />
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
  container: {
    position: 'absolute',
    zIndex: 5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  frightenedBody: {
    width: '85%',
    height: '85%',
    backgroundColor: '#2222CC',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: '7.5%',
    flexDirection: 'row',
    gap: 4,
  },
  frightenedEye: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
});

export const GhostChar = React.memo(GhostCharBase);
