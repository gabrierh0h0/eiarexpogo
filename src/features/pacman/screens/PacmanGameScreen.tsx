import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types/navigation';
import { PacmanHUD } from '../components/PacmanHUD';
import { MazeRenderer } from '../components/MazeRenderer';
import { PacmanChar } from '../components/PacmanChar';
import { GhostChar } from '../components/GhostChar';
import { DPad } from '../components/DPad';
import { usePacmanLoop } from '../hooks/usePacmanLoop';
import { Direction } from '../engine/pacmanEngine';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PacmanGame'>;

/**
 * Pantalla principal del minijuego Pacman.
 *
 * Layout:
 *   - HUD superior con score, vidas y tiempo
 *   - Área del laberinto centrada
 *   - D-Pad inferior para controlar a Pascal-Pacman
 *   - Soporte de swipe como input alternativo
 */
export default function PacmanGameScreen() {
  const navigation = useNavigation<Nav>();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  return (
    <View
      style={styles.container}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        setSize(prev => {
          if (prev && prev.width === width && prev.height === height) return prev;
          return { width, height };
        });
      }}
    >
      {size ? <GameInner size={size} navigation={navigation} /> : null}
    </View>
  );
}

interface InnerProps {
  size: { width: number; height: number };
  navigation: Nav;
}

function GameInner({ size, navigation }: InnerProps) {
  const {
    stats,
    pacman,
    ghosts,
    dots,
    cellSize,
    boardWidth,
    boardHeight,
    changeDirection,
  } = usePacmanLoop(size.width, size.height, false);

  const navigatedRef = useRef(false);

  useEffect(() => {
    if (stats.isOver && !navigatedRef.current) {
      navigatedRef.current = true;
      navigation.replace('PacmanResult', {
        score: stats.score,
        endReason: stats.endReason ?? 'time',
      });
    }
  }, [stats.isOver, stats.score, stats.endReason, navigation]);

  // Swipe support
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          swipeRef.current = {
            x: e.nativeEvent.pageX,
            y: e.nativeEvent.pageY,
          };
        },
        onPanResponderRelease: (e: GestureResponderEvent) => {
          if (!swipeRef.current) return;
          const dx = e.nativeEvent.pageX - swipeRef.current.x;
          const dy = e.nativeEvent.pageY - swipeRef.current.y;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          if (absDx < 10 && absDy < 10) return; // tap, no swipe

          let dir: Direction;
          if (absDx > absDy) {
            dir = dx > 0 ? 'right' : 'left';
          } else {
            dir = dy > 0 ? 'down' : 'up';
          }
          changeDirection(dir);
          swipeRef.current = null;
        },
      }),
    [changeDirection],
  );

  return (
    <View style={styles.inner}>
      {/* HUD */}
      <PacmanHUD
        score={stats.score}
        lives={stats.lives}
        remainingMs={stats.remainingMs}
        dotsLeft={stats.dotsLeft}
        totalDots={stats.totalDots}
      />

      {/* Área del juego */}
      <View
        style={[styles.gameArea, { width: boardWidth, height: boardHeight }]}
        {...panResponder.panHandlers}
      >
        <MazeRenderer cellSize={cellSize} dots={dots} />

        {/* Fantasmas */}
        {ghosts.map(g => (
          <GhostChar key={g.id} ghost={g} cellSize={cellSize} />
        ))}

        {/* Pacman */}
        <PacmanChar pacman={pacman} cellSize={cellSize} />
      </View>

      {/* D-Pad */}
      <DPad onDirection={changeDirection} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C3547',
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  gameArea: {
    alignSelf: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
});
