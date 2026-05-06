/**
 * ENGINE PURO del minijuego Pacman.
 *
 * Responsabilidades:
 *   - Mantener el estado de la partida (pacman, fantasmas, dots, score,
 *     vidas, tiempo, power-up, etc.).
 *   - Avanzar el estado en cada tick (movimiento, colisiones, AI).
 *   - Aplicar las reglas: puntos por dot/power/ghost, vidas, fin de partida.
 *
 * NO toca render, red ni animaciones directamente.
 */

import { PACMAN_CONFIG } from '../constants/config';
import {
  MAZE_MAP,
  MAZE_ROWS,
  MAZE_COLS,
  CellType,
  isWalkable,
  wrapCol,
  countTotalDots,
  findPacmanSpawn,
  findGhostSpawns,
} from '../constants/maze';
import { GhostColor } from '../constants/sprites';

// ---- TIPOS ----

export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

export interface Position {
  row: number;
  col: number;
}

export type GhostMode = 'scatter' | 'chase' | 'frightened' | 'eaten' | 'house';

export interface Ghost {
  id: GhostColor;
  pos: Position;
  dir: Direction;
  mode: GhostMode;
  respawnTimer: number; // ms restantes para respawnear si fue comido
  exitTimer: number;    // ms antes de salir de la casa
}

export interface PacmanState {
  pos: Position;
  dir: Direction;
  nextDir: Direction; // dirección deseada por el jugador (buffered input)
  mouthOpen: boolean;
  mouthTimer: number;
  invulnerableMs: number; // ms restantes de invulnerabilidad tras respawn
}

export interface GameStats {
  score: number;
  lives: number;
  remainingMs: number;
  dotsLeft: number;
  totalDots: number;
  isOver: boolean;
  endReason: 'time' | 'lives' | 'win' | null;
}

export interface PacmanEngineState {
  stats: GameStats;
  pacman: PacmanState;
  ghosts: Ghost[];
  dots: boolean[][];    // true si el dot/power sigue ahí
  maze: CellType[][];   // ref al mapa (inmutable)
  frightenedMs: number; // ms restantes de power-up global
  elapsedMs: number;
  cellSize: number;     // px por celda (calculado al crear)
  boardWidth: number;
  boardHeight: number;
}

// ---- HELPERS ----

const GHOST_COLORS: GhostColor[] = ['red', 'blue', 'orange', 'pink'];
const EXIT_DELAYS = [0, 3000, 6000, 9000]; // ms antes de que cada fantasma salga

const DIR_DELTA: Record<Direction, { dr: number; dc: number }> = {
  up:    { dr: -1, dc:  0 },
  down:  { dr:  1, dc:  0 },
  left:  { dr:  0, dc: -1 },
  right: { dr:  0, dc:  1 },
  none:  { dr:  0, dc:  0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
  none: 'none',
};

function canMove(row: number, col: number, dir: Direction): boolean {
  const d = DIR_DELTA[dir];
  let nr = row + d.dr;
  let nc = col + d.dc;

  // Túnel horizontal
  if (nc < 0 || nc >= MAZE_COLS) {
    const cell = MAZE_MAP[row]?.[col];
    if (cell === 'T') {
      nc = wrapCol(nc);
      return isWalkable(nr, nc);
    }
    return false;
  }

  return isWalkable(nr, nc);
}

function movePos(pos: Position, dir: Direction): Position {
  if (dir === 'none') return { ...pos };
  const d = DIR_DELTA[dir];
  let nr = pos.row + d.dr;
  let nc = pos.col + d.dc;

  // Túnel
  if (nc < 0 || nc >= MAZE_COLS) {
    nc = wrapCol(nc);
  }

  return { row: nr, col: nc };
}

function distance(a: Position, b: Position): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// ---- CREACIÓN DEL ENGINE ----

export function createPacmanEngine(screenWidth: number, screenHeight: number): PacmanEngineState {
  const cellSize = Math.floor(screenWidth / MAZE_COLS);
  const totalDots = countTotalDots();
  const pacmanSpawn = findPacmanSpawn();
  const ghostSpawns = findGhostSpawns();

  // Inicializar dots
  const dots: boolean[][] = [];
  for (let r = 0; r < MAZE_ROWS; r++) {
    dots[r] = [];
    for (let c = 0; c < MAZE_COLS; c++) {
      const cell = MAZE_MAP[r][c];
      dots[r][c] = cell === 'D' || cell === 'P';
    }
  }

  // Crear fantasmas
  const ghosts: Ghost[] = GHOST_COLORS.map((color, i) => {
    const spawn = ghostSpawns[i] || ghostSpawns[0] || { row: 8, col: 7 };
    return {
      id: color,
      pos: { ...spawn },
      dir: 'none' as Direction,
      mode: 'house' as GhostMode,
      respawnTimer: 0,
      exitTimer: EXIT_DELAYS[i],
    };
  });

  return {
    stats: {
      score: 0,
      lives: PACMAN_CONFIG.initialLives,
      remainingMs: PACMAN_CONFIG.durationMs,
      dotsLeft: totalDots,
      totalDots,
      isOver: false,
      endReason: null,
    },
    pacman: {
      pos: { ...pacmanSpawn },
      dir: 'none',
      nextDir: 'none',
      mouthOpen: true,
      mouthTimer: 0,
      invulnerableMs: 0,
    },
    ghosts,
    dots,
    maze: MAZE_MAP,
    frightenedMs: 0,
    elapsedMs: 0,
    cellSize,
    boardWidth: cellSize * MAZE_COLS,
    boardHeight: cellSize * MAZE_ROWS,
  };
}

// ---- INPUT ----

export function setDirection(state: PacmanEngineState, dir: Direction): void {
  state.pacman.nextDir = dir;
}

// ---- GHOST AI ----

function getAvailableDirs(pos: Position, currentDir: Direction): Direction[] {
  const dirs: Direction[] = ['up', 'down', 'left', 'right'];
  const opposite = OPPOSITE[currentDir];
  return dirs.filter(d => d !== opposite && canMove(pos.row, pos.col, d));
}

function chooseGhostDir(ghost: Ghost, target: Position): Direction {
  const available = getAvailableDirs(ghost.pos, ghost.dir);
  if (available.length === 0) {
    // Si no hay opciones, invertir
    const opp = OPPOSITE[ghost.dir];
    if (canMove(ghost.pos.row, ghost.pos.col, opp)) return opp;
    return 'none';
  }
  if (available.length === 1) return available[0];

  // Elegir la dirección que minimice la distancia al target
  let bestDir = available[0];
  let bestDist = Infinity;
  for (const d of available) {
    const next = movePos(ghost.pos, d);
    const dist = distance(next, target);
    if (dist < bestDist) {
      bestDist = dist;
      bestDir = d;
    }
  }
  return bestDir;
}

function getGhostTarget(ghost: Ghost, pacmanPos: Position, pacmanDir: Direction): Position {
  switch (ghost.id) {
    case 'red':
      // Persigue directamente a Pacman
      return pacmanPos;
    case 'pink': {
      // 4 celdas delante de Pacman
      const d = DIR_DELTA[pacmanDir];
      return {
        row: Math.max(0, Math.min(MAZE_ROWS - 1, pacmanPos.row + d.dr * 4)),
        col: Math.max(0, Math.min(MAZE_COLS - 1, pacmanPos.col + d.dc * 4)),
      };
    }
    case 'blue': {
      // Esquina inferior derecha (scatter-ish)
      return { row: MAZE_ROWS - 2, col: MAZE_COLS - 2 };
    }
    case 'orange': {
      // Si está lejos, persigue; si está cerca, huye a esquina
      if (distance(ghost.pos, pacmanPos) > 6) return pacmanPos;
      return { row: MAZE_ROWS - 2, col: 1 };
    }
    default:
      return pacmanPos;
  }
}

function getScatterTarget(ghost: Ghost): Position {
  switch (ghost.id) {
    case 'red': return { row: 0, col: MAZE_COLS - 2 };
    case 'pink': return { row: 0, col: 1 };
    case 'blue': return { row: MAZE_ROWS - 1, col: MAZE_COLS - 2 };
    case 'orange': return { row: MAZE_ROWS - 1, col: 1 };
    default: return { row: 0, col: 0 };
  }
}

function getRandomDir(pos: Position, currentDir: Direction): Direction {
  const available = getAvailableDirs(pos, currentDir);
  if (available.length === 0) return OPPOSITE[currentDir];
  return available[Math.floor(Math.random() * available.length)];
}

// ---- GHOST HOUSE EXIT ----
const GHOST_HOUSE_EXIT: Position = { row: 7, col: 7 };

function moveGhostFromHouse(ghost: Ghost): void {
  // Mueve hacia la puerta de la ghost house
  if (ghost.pos.row > GHOST_HOUSE_EXIT.row) {
    ghost.dir = 'up';
    ghost.pos = movePos(ghost.pos, 'up');
  } else if (ghost.pos.col < GHOST_HOUSE_EXIT.col) {
    ghost.dir = 'right';
    ghost.pos = movePos(ghost.pos, 'right');
  } else if (ghost.pos.col > GHOST_HOUSE_EXIT.col) {
    ghost.dir = 'left';
    ghost.pos = movePos(ghost.pos, 'left');
  } else {
    // Ya en la salida
    ghost.mode = 'chase';
    ghost.dir = 'left';
  }
}

// ---- TICK PRINCIPAL ----

// Acumuladores de movimiento para controlar velocidad
interface MoveAccumulator {
  pacmanAcc: number;
  ghostAcc: number;
  frightenedGhostAcc: number;
}

const moveAcc: MoveAccumulator = {
  pacmanAcc: 0,
  ghostAcc: 0,
  frightenedGhostAcc: 0,
};

export function tickPacmanEngine(state: PacmanEngineState, dtMs: number): PacmanEngineState {
  if (state.stats.isOver) return state;

  const dtSec = dtMs / 1000;

  // 1) Tiempo
  state.elapsedMs += dtMs;
  state.stats.remainingMs = Math.max(0, PACMAN_CONFIG.durationMs - state.elapsedMs);
  if (state.stats.remainingMs <= 0) {
    state.stats.isOver = true;
    state.stats.endReason = 'time';
    return state;
  }

  // 2) Power-up timer
  if (state.frightenedMs > 0) {
    state.frightenedMs = Math.max(0, state.frightenedMs - dtMs);
    if (state.frightenedMs <= 0) {
      // Volver los fantasmas a chase
      for (const g of state.ghosts) {
        if (g.mode === 'frightened') g.mode = 'chase';
      }
    }
  }

  // 3) Invulnerabilidad de Pacman
  if (state.pacman.invulnerableMs > 0) {
    state.pacman.invulnerableMs = Math.max(0, state.pacman.invulnerableMs - dtMs);
  }

  // 4) Animación boca
  state.pacman.mouthTimer += dtMs;
  if (state.pacman.mouthTimer >= PACMAN_CONFIG.mouthAnimMs) {
    state.pacman.mouthTimer = 0;
    state.pacman.mouthOpen = !state.pacman.mouthOpen;
  }

  // 5) Mover Pacman (basado en velocidad)
  moveAcc.pacmanAcc += PACMAN_CONFIG.pacmanSpeed * dtSec;
  while (moveAcc.pacmanAcc >= 1) {
    moveAcc.pacmanAcc -= 1;

    // Intentar dirección deseada
    if (state.pacman.nextDir !== 'none' && canMove(state.pacman.pos.row, state.pacman.pos.col, state.pacman.nextDir)) {
      state.pacman.dir = state.pacman.nextDir;
    }

    // Mover en la dirección actual
    if (state.pacman.dir !== 'none' && canMove(state.pacman.pos.row, state.pacman.pos.col, state.pacman.dir)) {
      state.pacman.pos = movePos(state.pacman.pos, state.pacman.dir);

      // Recoger dot
      const { row, col } = state.pacman.pos;
      if (row >= 0 && row < MAZE_ROWS && col >= 0 && col < MAZE_COLS && state.dots[row][col]) {
        state.dots[row][col] = false;
        const cell = MAZE_MAP[row][col];
        if (cell === 'P') {
          state.stats.score = Math.min(state.stats.score + PACMAN_CONFIG.pointsPerPowerDot, PACMAN_CONFIG.maxScore);
          // Activar power-up
          state.frightenedMs = PACMAN_CONFIG.frightenedDurationMs;
          for (const g of state.ghosts) {
            if (g.mode === 'chase' || g.mode === 'scatter') {
              g.mode = 'frightened';
              g.dir = OPPOSITE[g.dir]; // Invertir dirección
            }
          }
        } else {
          state.stats.score = Math.min(state.stats.score + PACMAN_CONFIG.pointsPerDot, PACMAN_CONFIG.maxScore);
        }
        state.stats.dotsLeft--;

        // ¿Ganó?
        if (state.stats.dotsLeft <= 0) {
          state.stats.isOver = true;
          state.stats.endReason = 'win';
          return state;
        }
      }
    }
  }

  // 6) Mover fantasmas
  const normalGhostSpeed = PACMAN_CONFIG.ghostSpeed * dtSec;
  const frightSpeed = PACMAN_CONFIG.frightenedGhostSpeed * dtSec;

  for (const ghost of state.ghosts) {
    // Respawn timer
    if (ghost.mode === 'eaten') {
      ghost.respawnTimer -= dtMs;
      if (ghost.respawnTimer <= 0) {
        // Respawnear en la casa
        const spawns = findGhostSpawns();
        const idx = GHOST_COLORS.indexOf(ghost.id);
        const spawn = spawns[idx] || spawns[0] || { row: 8, col: 7 };
        ghost.pos = { ...spawn };
        ghost.mode = 'house';
        ghost.exitTimer = 2000;
        ghost.dir = 'none';
      }
      continue;
    }

    // Ghost house exit timer
    if (ghost.mode === 'house') {
      ghost.exitTimer -= dtMs;
      if (ghost.exitTimer <= 0) {
        moveGhostFromHouse(ghost);
      }
      continue;
    }

    // Movimiento normal
    const isFrightened = ghost.mode === 'frightened';
    const speed = isFrightened ? frightSpeed : normalGhostSpeed;

    // Acumular movimiento
    const accKey = isFrightened ? 'frightenedGhostAcc' : 'ghostAcc';
    // Usamos un acumulador per-ghost simplificado
    // Para simplificar, movemos cuando el dt acumulado >= 1 celda
    const stepsThisTick = Math.floor(speed + 0.5); // ~1 step per tick at normal speed

    for (let step = 0; step < Math.max(1, stepsThisTick > 0 ? 1 : 0); step++) {
      if (speed < 0.3 && Math.random() > speed) continue; // skip si muy lento

      let target: Position;
      if (isFrightened) {
        // Movimiento aleatorio cuando asustado
        ghost.dir = getRandomDir(ghost.pos, ghost.dir);
      } else {
        // Determinar modo basado en tiempo
        const cycleMs = state.elapsedMs % 27000;
        const isScatter = cycleMs < 7000;

        if (isScatter) {
          target = getScatterTarget(ghost);
        } else {
          target = getGhostTarget(ghost, state.pacman.pos, state.pacman.dir);
        }
        ghost.dir = chooseGhostDir(ghost, target!);
      }

      if (ghost.dir !== 'none' && canMove(ghost.pos.row, ghost.pos.col, ghost.dir)) {
        ghost.pos = movePos(ghost.pos, ghost.dir);
      }
    }
  }

  // 7) Colisiones Pacman ↔ Fantasmas
  for (const ghost of state.ghosts) {
    if (ghost.mode === 'eaten' || ghost.mode === 'house') continue;
    if (ghost.pos.row === state.pacman.pos.row && ghost.pos.col === state.pacman.pos.col) {
      if (ghost.mode === 'frightened') {
        // Comerse al fantasma
        state.stats.score = Math.min(
          state.stats.score + PACMAN_CONFIG.pointsPerGhost,
          PACMAN_CONFIG.maxScore,
        );
        ghost.mode = 'eaten';
        ghost.respawnTimer = PACMAN_CONFIG.ghostRespawnMs;
      } else if (state.pacman.invulnerableMs <= 0) {
        // Pacman muere
        state.stats.lives--;
        if (state.stats.lives <= 0) {
          state.stats.lives = 0;
          state.stats.isOver = true;
          state.stats.endReason = 'lives';
          return state;
        }
        // Respawnear Pacman
        const spawn = findPacmanSpawn();
        state.pacman.pos = { ...spawn };
        state.pacman.dir = 'none';
        state.pacman.nextDir = 'none';
        state.pacman.invulnerableMs = PACMAN_CONFIG.respawnInvulnerableMs;

        // Reset acumuladores
        moveAcc.pacmanAcc = 0;
      }
    }
  }

  return state;
}

export function snapshotPacmanStats(state: PacmanEngineState): GameStats {
  return { ...state.stats };
}
