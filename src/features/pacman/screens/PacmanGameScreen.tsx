import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions, Image, PanResponder, StatusBar,
  StyleSheet, Text, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types/navigation';
import { usePacmanLoop } from '../hooks/usePacmanLoop';
import { Direction, ROWS, COLS, getMap } from '../engine/pacmanEngine';
import { PACMAN_SPRITES, GHOST_SPRITES, PACMAN_UI, GhostColor } from '../constants/sprites';
import { PACMAN_CONFIG } from '../constants/config';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PacmanGame'>;

// Imagen nativa: 595 × 1235
const IMG_W = 595;
const IMG_H = 1235;
const IMG_RATIO = IMG_H / IMG_W; // ≈ 2.076

// El laberinto en la imagen ocupa una zona interna.
// Estos offsets mapean la cuadrícula lógica (21 cols × 22 rows) a píxeles de la imagen.
// Medidos del pixel art original de 595×1235:
const SRC_GRID_LEFT = 18;
const SRC_GRID_TOP = 70;
const SRC_GRID_RIGHT = 577;
const SRC_GRID_BOTTOM = 1165;
const SRC_CELL_W = (SRC_GRID_RIGHT - SRC_GRID_LEFT) / COLS;  // ~26.6
const SRC_CELL_H = (SRC_GRID_BOTTOM - SRC_GRID_TOP) / ROWS;  // ~49.8

const STATUSBAR_H = StatusBar.currentHeight ?? 44;

function formatTime(ms: number): string {
  const s = Math.ceil(ms / 1000); const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function PacmanGameScreen() {
  const navigation = useNavigation<Nav>();
  const { stats, pacman, ghosts, dots, changeDirection } = usePacmanLoop(false);
  const navigatedRef = useRef(false);

  // Dimensiones de pantalla
  const screenW = Dimensions.get('window').width;
  const boardW = screenW;
  const boardH = boardW * IMG_RATIO;
  const scale = boardW / IMG_W;

  // Mapeo grid → pantalla
  const gridLeft = SRC_GRID_LEFT * scale;
  const gridTop = SRC_GRID_TOP * scale;
  const cellW = SRC_CELL_W * scale;
  const cellH = SRC_CELL_H * scale;

  useEffect(() => {
    if (stats.isOver && !navigatedRef.current) {
      navigatedRef.current = true;
      navigation.replace('PacmanResult', { score: stats.score, endReason: stats.endReason ?? 'time' });
    }
  }, [stats.isOver]);

  // Swipe
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 6 || Math.abs(gs.dy) > 6,
    onPanResponderGrant: e => { startRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }; },
    onPanResponderMove: e => {
      if (!startRef.current) return;
      const dx = e.nativeEvent.pageX - startRef.current.x;
      const dy = e.nativeEvent.pageY - startRef.current.y;
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
      const dir: Direction = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');
      changeDirection(dir);
      startRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
    },
  }), [changeDirection]);

  // Posición de una entidad en pantalla
  const posX = (col: number) => gridLeft + col * cellW;
  const posY = (row: number) => gridTop + row * cellH;

  // Render dots que AÚN NO se han comido
  const MAP = getMap();
  const dotElements: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!dots[r]?.[c]) continue;
      const cell = MAP[r][c];
      const isPower = cell === 'P';
      const size = isPower ? cellW * 0.55 : cellW * 0.22;
      dotElements.push(
        <View key={`d${r}-${c}`} style={{
          position: 'absolute',
          left: posX(c) + (cellW - size) / 2,
          top: posY(r) + (cellH - size) / 2,
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: isPower ? '#FFD166' : '#FFFFFF',
          zIndex: 2,
        }} />,
      );
    }
  }

  // Rotación de Pascal
  const rotation = pacman.dir === 'right' ? '0deg' : pacman.dir === 'down' ? '90deg'
    : pacman.dir === 'left' ? '180deg' : pacman.dir === 'up' ? '270deg' : '0deg';

  const pacSize = cellW * 1.6;
  const ghostSize = cellW * 1.5;
  const lifeSize = 22;

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      {/* HUD */}
      <View style={[styles.hud, { paddingTop: STATUSBAR_H + 4 }]}>
        <Text style={styles.brand}>EIAR</Text>
        <View style={styles.hudRight}>
          <Text style={styles.scoreText}>{stats.score}</Text>
          {Array.from({ length: PACMAN_CONFIG.initialLives }, (_, i) => (
            <Image key={i} source={PACMAN_UI.life} style={[styles.life, i >= stats.lives && { opacity: 0.2 }]} resizeMode="contain" />
          ))}
        </View>
      </View>
      <View style={styles.hudRow2}>
        <Text style={styles.hudDots}>🟡 {stats.totalDots - stats.dotsLeft}/{stats.totalDots}</Text>
        <Text style={styles.hudTimer}>{formatTime(stats.remainingMs)}</Text>
      </View>

      {/* TABLERO DE JUEGO */}
      <View style={[styles.board, { width: boardW, height: boardH }]}>
        {/* Capa 1: fondo oscuro del laberinto */}
        <Image source={PACMAN_UI.background} style={styles.layerImg} resizeMode="stretch" />
        {/* Capa 2: contornos del laberinto */}
        <Image source={PACMAN_UI.maze} style={styles.layerImg} resizeMode="stretch" />
        {/* Capa 3: puerta ghost house */}
        <Image source={PACMAN_UI.door} style={styles.layerImg} resizeMode="stretch" />

        {/* Dots */}
        {dotElements}

        {/* Fantasmas */}
        {ghosts.map(g => {
          if (g.mode === 'eaten' || g.mode === 'house') return null;
          const isFright = g.mode === 'frightened';
          return (
            <Image
              key={g.id}
              source={isFright ? PACMAN_UI.dot : GHOST_SPRITES[g.id]}
              style={{
                position: 'absolute',
                left: posX(g.pos.col) + (cellW - ghostSize) / 2,
                top: posY(g.pos.row) + (cellH - ghostSize) / 2,
                width: ghostSize, height: ghostSize,
                zIndex: 5,
                tintColor: isFright ? '#2222CC' : undefined,
              }}
              resizeMode="contain"
            />
          );
        })}

        {/* Pascal (Pacman) */}
        <Image
          source={PACMAN_SPRITES.pascal}
          style={{
            position: 'absolute',
            left: posX(pacman.pos.col) + (cellW - pacSize) / 2,
            top: posY(pacman.pos.row) + (cellH - pacSize) / 2,
            width: pacSize, height: pacSize,
            zIndex: 10,
            transform: [{ rotate: rotation }],
            opacity: pacman.invulnerableMs > 0 ? (pacman.mouthOpen ? 1 : 0.3) : 1,
          }}
          resizeMode="contain"
        />
      </View>

      {/* Hint */}
      <View style={styles.hintBar}>
        <Text style={styles.hintText}>↔ Desliza para mover a Pascal ↕</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  hud: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 6, backgroundColor: '#0A1A2A',
  },
  brand: { color: '#14D4F4', fontSize: 20, fontWeight: 'bold' },
  hudRight: { flexDirection: 'row', alignItems: 'center' },
  scoreText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginRight: 10 },
  life: { width: 22, height: 22, marginLeft: 3 },
  hudRow2: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingBottom: 4, backgroundColor: '#0A1A2A',
  },
  hudDots: { color: '#7EC8D8', fontSize: 12 },
  hudTimer: { color: '#fff', fontSize: 14, fontWeight: '600' },
  board: { alignSelf: 'center' },
  layerImg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  hintBar: { alignItems: 'center', paddingVertical: 6, backgroundColor: '#0A1A2A' },
  hintText: { color: '#4A7A8A', fontSize: 11 },
});
