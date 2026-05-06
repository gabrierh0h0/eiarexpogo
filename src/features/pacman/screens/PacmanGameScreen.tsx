import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types/navigation';
import { PacmanHUD } from '../components/PacmanHUD';
import { MazeRenderer } from '../components/MazeRenderer';
import { PacmanChar } from '../components/PacmanChar';
import { GhostChar } from '../components/GhostChar';
import { usePacmanLoop } from '../hooks/usePacmanLoop';
import { Direction } from '../engine/pacmanEngine';
import { Ionicons } from '@expo/vector-icons';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PacmanGame'>;

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

function GameInner({ size, navigation }: { size: { width: number; height: number }; navigation: Nav }) {
  const {
    stats, pacman, ghosts, dots, cellSize, boardWidth, boardHeight, changeDirection,
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

  // ---- SWIPE CONTROLS ----
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) =>
          Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
        onPanResponderGrant: (e) => {
          swipeStartRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        },
        onPanResponderMove: (e) => {
          if (!swipeStartRef.current) return;
          const dx = e.nativeEvent.pageX - swipeStartRef.current.x;
          const dy = e.nativeEvent.pageY - swipeStartRef.current.y;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          if (absDx < 15 && absDy < 15) return;

          let dir: Direction;
          if (absDx > absDy) {
            dir = dx > 0 ? 'right' : 'left';
          } else {
            dir = dy > 0 ? 'down' : 'up';
          }
          changeDirection(dir);
          // Reset para permitir cambios de dirección continuos
          swipeStartRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        },
      }),
    [changeDirection],
  );

  // ---- D-PAD buttons como respaldo ----
  const DPadButton = ({ dir, icon }: { dir: Direction; icon: string }) => (
    <TouchableOpacity
      style={styles.dpadBtn}
      onPress={() => changeDirection(dir)}
      activeOpacity={0.5}
    >
      <Ionicons name={icon as any} size={28} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.inner}>
      <PacmanHUD
        score={stats.score}
        lives={stats.lives}
        remainingMs={stats.remainingMs}
        dotsLeft={stats.dotsLeft}
        totalDots={stats.totalDots}
      />

      {/* Área del juego con swipe */}
      <View style={styles.gameContainer} {...panResponder.panHandlers}>
        <View style={[styles.gameArea, { width: boardWidth, height: boardHeight }]}>
          <MazeRenderer cellSize={cellSize} dots={dots} boardWidth={boardWidth} boardHeight={boardHeight} />
          {ghosts.map(g => (
            <GhostChar key={g.id} ghost={g} cellSize={cellSize} />
          ))}
          <PacmanChar pacman={pacman} cellSize={cellSize} frightened={stats.frightened} />
        </View>
      </View>

      {/* D-Pad compacto abajo */}
      <View style={styles.dpadContainer}>
        <Text style={styles.swipeHint}>↔ Desliza para mover a Pascal ↕</Text>
        <View style={styles.dpadRow}>
          <View style={styles.dpadSpacer} />
          <DPadButton dir="up" icon="chevron-up" />
          <View style={styles.dpadSpacer} />
        </View>
        <View style={styles.dpadRow}>
          <DPadButton dir="left" icon="chevron-back" />
          <View style={styles.dpadCenter} />
          <DPadButton dir="right" icon="chevron-forward" />
        </View>
        <View style={styles.dpadRow}>
          <View style={styles.dpadSpacer} />
          <DPadButton dir="down" icon="chevron-down" />
          <View style={styles.dpadSpacer} />
        </View>
      </View>
    </View>
  );
}

const DPAD_SIZE = 46;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060E18' },
  inner: { flex: 1 },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameArea: {
    position: 'relative',
    overflow: 'hidden',
  },
  dpadContainer: {
    alignItems: 'center',
    paddingBottom: 12,
    paddingTop: 4,
    backgroundColor: '#0A1E2E',
    borderTopWidth: 2,
    borderTopColor: '#14A3C7',
  },
  swipeHint: {
    color: '#4A8A9A',
    fontSize: 11,
    marginBottom: 4,
  },
  dpadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dpadBtn: {
    width: DPAD_SIZE,
    height: DPAD_SIZE,
    backgroundColor: 'rgba(20, 163, 199, 0.35)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderWidth: 1,
    borderColor: 'rgba(139, 216, 232, 0.3)',
  },
  dpadCenter: {
    width: DPAD_SIZE,
    height: DPAD_SIZE,
    margin: 2,
  },
  dpadSpacer: {
    width: DPAD_SIZE,
    height: DPAD_SIZE,
    margin: 2,
  },
});
