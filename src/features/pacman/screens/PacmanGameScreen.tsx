import React, { useEffect, useMemo, useRef } from 'react';
import {
  Dimensions, Image, PanResponder, StatusBar,
  StyleSheet, Text, View, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types/navigation';
import { usePacmanLoop } from '../hooks/usePacmanLoop';
import {
  Direction, ROWS, COLS, getMap,
  LAYER_W, LAYER_H,
  CELL_PX, SPRITE_BOUNDS,
  cellToPixel,
} from '../engine/pacmanEngine';
import { PACMAN_SPRITES, GHOST_SPRITES, PACMAN_UI } from '../constants/sprites';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PacmanGame'>;

const STATUSBAR_H = StatusBar.currentHeight ?? 44;

function formatTime(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

/**
 * Rotación del sprite de Pascal según dirección.
 * El sprite original (pascal.png) mira hacia la izquierda.
 */
function pacmanRotation(dir: Direction): string {
  switch (dir) {
    case 'right': return '180deg';
    case 'up':    return '90deg';
    case 'down':  return '-90deg';
    case 'left':
    default:      return '0deg';
  }
}

/**
 * Renderiza un sprite recortado de su capa 595×1235.
 * En vez de mover la capa entera, se posiciona un contenedor pequeño
 * (del tamaño del sprite) exactamente en la celda del grid, y dentro
 * se coloca la imagen con offset negativo para mostrar solo el sprite.
 * Esto permite rotar el contenedor sin problemas de pivot.
 */
function CroppedSprite({
  source,
  spriteKey,
  pos,
  scale,
  boardW,
  boardH,
  rotation,
  opacity,
  tintColor,
  zIndex,
}: {
  source: any;
  spriteKey: string;
  pos: { row: number; col: number };
  scale: number;
  boardW: number;
  boardH: number;
  rotation?: string;
  opacity?: number;
  tintColor?: string;
  zIndex?: number;
}) {
  const bounds = SPRITE_BOUNDS[spriteKey];
  if (!bounds) return null;

  // Position of the grid cell center in screen coordinates
  const { px, py } = cellToPixel(pos.row, pos.col);
  const screenX = px * scale;
  const screenY = py * scale;

  // Sprite display size
  const sw = bounds.w * scale;
  const sh = bounds.h * scale;

  return (
    <View
      style={{
        position: 'absolute',
        left: screenX - sw / 2,
        top: screenY - sh / 2,
        width: sw,
        height: sh,
        overflow: 'hidden',
        zIndex: zIndex ?? 15,
        transform: rotation ? [{ rotate: rotation }] : [],
      }}
    >
      <Image
        source={source}
        style={{
          position: 'absolute',
          width: boardW,
          height: boardH,
          left: -bounds.x * scale,
          top: -bounds.y * scale,
          opacity: opacity ?? 1,
          ...(tintColor ? { tintColor } : {}),
        }}
        resizeMode="stretch"
      />
    </View>
  );
}

export default function PacmanGameScreen() {
  const navigation = useNavigation<Nav>();
  const { stats, pacman, ghosts, dots, changeDirection } = usePacmanLoop(false);
  const navigatedRef = useRef(false);

  /* ─── Dimensions ─── */
  const screen = Dimensions.get('window');
  const boardW = screen.width;
  const boardH = boardW * (LAYER_H / LAYER_W);
  const scale = boardW / LAYER_W;

  /* ─── Keyboard (web) ─── */
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'up', ArrowDown: 'down',
        ArrowLeft: 'left', ArrowRight: 'right',
      };
      const dir = map[e.key];
      if (dir) changeDirection(dir);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection]);

  /* ─── Game Over ─── */
  useEffect(() => {
    if (stats.isOver && !navigatedRef.current) {
      navigatedRef.current = true;
      navigation.replace('PacmanResult', {
        score: stats.score,
        endReason: stats.endReason ?? 'time',
      });
    }
  }, [stats.isOver]);

  /* ─── Swipe ─── */
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) =>
          Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4,
        onPanResponderGrant: (e) => {
          startRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        },
        onPanResponderMove: (e) => {
          if (!startRef.current) return;
          const dx = e.nativeEvent.pageX - startRef.current.x;
          const dy = e.nativeEvent.pageY - startRef.current.y;
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
          const dir: Direction =
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0 ? 'right' : 'left'
              : dy > 0 ? 'down' : 'up';
          changeDirection(dir);
          startRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        },
      }),
    [changeDirection],
  );

  /* ─── Dots ─── */
  const MAP = getMap();
  const dotElements: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!dots[r]?.[c]) continue;
      const isP = MAP[r][c] === 'P';
      const size = (isP ? 10 : 4) * scale;
      const { px, py } = cellToPixel(r, c);
      dotElements.push(
        <View
          key={`d${r}-${c}`}
          style={{
            position: 'absolute',
            left: px * scale - size / 2,
            top: py * scale - size / 2,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: isP ? '#FFD166' : '#FFFFFF',
            zIndex: 5,
          }}
        />,
      );
    }
  }

  /* ─── Invulnerability flash ─── */
  const pacOpacity =
    pacman.invulnerableMs > 0
      ? Math.floor(Date.now() / 150) % 2 === 0 ? 0.35 : 1
      : 1;

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      {/* HUD */}
      <View style={[styles.hud, { paddingTop: STATUSBAR_H + 10 }]}>
        <View>
          <Text style={styles.brand}>CAMPUS TOUR</Text>
          <Text style={styles.scoreText}>{stats.score}</Text>
        </View>
        <View style={styles.hudRight}>
          <View style={styles.livesRow}>
            {Array.from({ length: stats.lives }).map((_, i) => (
              <Image key={i} source={PACMAN_UI.life} style={styles.lifeIcon} />
            ))}
          </View>
          <Text style={styles.timerText}>{formatTime(stats.remainingMs)}</Text>
        </View>
      </View>

      {/* Board */}
      <View style={[styles.boardContainer, { width: boardW, height: boardH }]}>
        {/* Static background layers */}
        <Image source={PACMAN_UI.background} style={styles.fullLayer} resizeMode="stretch" />
        <Image source={PACMAN_UI.maze}       style={styles.fullLayer} resizeMode="stretch" />
        <Image source={PACMAN_UI.door}       style={styles.fullLayer} resizeMode="stretch" />

        {/* Dots */}
        {dotElements}

        {/* Pascal — cropped sprite with rotation */}
        <CroppedSprite
          source={PACMAN_SPRITES.pascal}
          spriteKey="pascal"
          pos={pacman.pos}
          scale={scale}
          boardW={boardW}
          boardH={boardH}
          rotation={pacmanRotation(pacman.dir)}
          opacity={pacOpacity}
          zIndex={20}
        />

        {/* Ghosts — cropped sprites, no rotation */}
        {ghosts.map((g) => {
          if (g.mode === 'house' || g.mode === 'eaten') return null;
          const isFright = g.mode === 'frightened';
          return (
            <CroppedSprite
              key={g.id}
              source={GHOST_SPRITES[g.id]}
              spriteKey={g.id}
              pos={g.pos}
              scale={scale}
              boardW={boardW}
              boardH={boardH}
              opacity={isFright ? 0.55 : 1}
              tintColor={isFright ? '#2222CC' : undefined}
              zIndex={15}
            />
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.hintText}>DESLIZA PARA MOVER A PASCAL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#001A26',
  },
  brand: {
    color: '#14D4F4',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scoreText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  hudRight: {
    alignItems: 'flex-end',
  },
  livesRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  lifeIcon: {
    width: 18,
    height: 18,
    marginLeft: 5,
  },
  timerText: {
    color: '#FFD166',
    fontSize: 18,
    fontWeight: '800',
  },
  boardContainer: {
    alignSelf: 'center',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  fullLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#001A26',
  },
  hintText: {
    color: '#5A8A9A',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
