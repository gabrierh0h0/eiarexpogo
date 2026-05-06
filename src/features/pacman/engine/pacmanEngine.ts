/**
 * ENGINE del minijuego Pacman con movimiento float (suave).
 */
import { PACMAN_CONFIG } from '../constants/config';
import {
  MAZE_MAP, MAZE_ROWS, MAZE_COLS, CellType,
  countTotalDots, findPacmanSpawn, findGhostSpawns,
} from '../constants/maze';
import { GhostColor } from '../constants/sprites';

export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

export interface FPos { row: number; col: number; }

export type GhostMode = 'scatter' | 'chase' | 'frightened' | 'eaten' | 'house';

export interface Ghost {
  id: GhostColor;
  pos: FPos;
  dir: Direction;
  mode: GhostMode;
  respawnTimer: number;
  exitTimer: number;
}

export interface PacmanState {
  pos: FPos;
  dir: Direction;
  nextDir: Direction;
  mouthOpen: boolean;
  mouthTimer: number;
  invulnerableMs: number;
}

export interface GameStats {
  score: number;
  lives: number;
  remainingMs: number;
  dotsLeft: number;
  totalDots: number;
  isOver: boolean;
  endReason: 'time' | 'lives' | 'win' | null;
  frightened: boolean;
}

export interface PacmanEngineState {
  stats: GameStats;
  pacman: PacmanState;
  ghosts: Ghost[];
  dots: boolean[][];
  frightenedMs: number;
  elapsedMs: number;
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
}

const GHOST_COLORS: GhostColor[] = ['red', 'pink', 'blue', 'orange'];
const EXIT_DELAYS = [0, 3000, 6000, 9000];

const DIR_DELTA: Record<Direction, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 }, down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 }, right: { dr: 0, dc: 1 },
  none: { dr: 0, dc: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down', down: 'up', left: 'right', right: 'left', none: 'none',
};

function isWall(r: number, c: number): boolean {
  if (r < 0 || r >= MAZE_ROWS) return true;
  if (c < 0 || c >= MAZE_COLS) {
    // Túneles
    if (r >= 0 && r < MAZE_ROWS && MAZE_MAP[r]?.[0] === 'T') return false;
    return true;
  }
  return MAZE_MAP[r][c] === 'W';
}

function canEnter(r: number, c: number): boolean {
  if (c < 0 || c >= MAZE_COLS) {
    if (r >= 0 && r < MAZE_ROWS && (MAZE_MAP[r]?.[0] === 'T' || MAZE_MAP[r]?.[MAZE_COLS - 1] === 'T')) return true;
    return false;
  }
  if (r < 0 || r >= MAZE_ROWS) return false;
  return MAZE_MAP[r][c] !== 'W';
}

function canMoveDir(row: number, col: number, dir: Direction): boolean {
  const d = DIR_DELTA[dir];
  return canEnter(row + d.dr, col + d.dc);
}

function wrapCol(c: number): number {
  if (c < 0) return MAZE_COLS - 1;
  if (c >= MAZE_COLS) return 0;
  return c;
}

function dist(a: FPos, b: FPos): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// ---- CREACIÓN ----
export function createPacmanEngine(screenW: number, _screenH: number): PacmanEngineState {
  const cellSize = Math.floor(screenW / MAZE_COLS);
  const spawn = findPacmanSpawn();
  const gSpawns = findGhostSpawns();
  const totalDots = countTotalDots();

  const dots: boolean[][] = [];
  for (let r = 0; r < MAZE_ROWS; r++) {
    dots[r] = [];
    for (let c = 0; c < MAZE_COLS; c++) {
      dots[r][c] = MAZE_MAP[r][c] === 'D' || MAZE_MAP[r][c] === 'P';
    }
  }

  const ghosts: Ghost[] = GHOST_COLORS.map((color, i) => {
    const gs = gSpawns[i] || gSpawns[0] || { row: 9, col: 7 };
    return {
      id: color, pos: { row: gs.row, col: gs.col },
      dir: 'none' as Direction, mode: 'house' as GhostMode,
      respawnTimer: 0, exitTimer: EXIT_DELAYS[i],
    };
  });

  return {
    stats: {
      score: 0, lives: PACMAN_CONFIG.initialLives,
      remainingMs: PACMAN_CONFIG.durationMs,
      dotsLeft: totalDots, totalDots, isOver: false, endReason: null,
      frightened: false,
    },
    pacman: {
      pos: { row: spawn.row, col: spawn.col },
      dir: 'left', nextDir: 'left', mouthOpen: true, mouthTimer: 0,
      invulnerableMs: 0,
    },
    ghosts, dots, frightenedMs: 0, elapsedMs: 0,
    cellSize, boardWidth: cellSize * MAZE_COLS, boardHeight: cellSize * MAZE_ROWS,
  };
}

export function setDirection(state: PacmanEngineState, dir: Direction): void {
  state.pacman.nextDir = dir;
}

// ---- GHOST AI ----
function getGhostTarget(g: Ghost, pac: FPos, pacDir: Direction): FPos {
  switch (g.id) {
    case 'red': return pac;
    case 'pink': {
      const d = DIR_DELTA[pacDir];
      return { row: Math.max(0, Math.min(MAZE_ROWS - 1, pac.row + d.dr * 4)),
               col: Math.max(0, Math.min(MAZE_COLS - 1, pac.col + d.dc * 4)) };
    }
    case 'blue': return { row: MAZE_ROWS - 2, col: MAZE_COLS - 2 };
    case 'orange':
      return dist(g.pos, pac) > 6 ? pac : { row: MAZE_ROWS - 2, col: 1 };
    default: return pac;
  }
}

function getScatterTarget(g: Ghost): FPos {
  switch (g.id) {
    case 'red': return { row: 0, col: MAZE_COLS - 2 };
    case 'pink': return { row: 0, col: 1 };
    case 'blue': return { row: MAZE_ROWS - 1, col: MAZE_COLS - 2 };
    case 'orange': return { row: MAZE_ROWS - 1, col: 1 };
    default: return { row: 0, col: 0 };
  }
}

function chooseDir(pos: FPos, curDir: Direction, target: FPos): Direction {
  const r = Math.round(pos.row);
  const c = Math.round(pos.col);
  const dirs: Direction[] = ['up', 'down', 'left', 'right'];
  const opp = OPPOSITE[curDir];
  const avail = dirs.filter(d => d !== opp && canMoveDir(r, c, d));
  if (avail.length === 0) {
    return canMoveDir(r, c, opp) ? opp : 'none';
  }
  if (avail.length === 1) return avail[0];
  let best = avail[0]; let bestD = Infinity;
  for (const d of avail) {
    const dd = DIR_DELTA[d];
    const nr = r + dd.dr; const nc = c + dd.dc;
    const distance = Math.abs(nr - target.row) + Math.abs(nc - target.col);
    if (distance < bestD) { bestD = distance; best = d; }
  }
  return best;
}

function randomDir(pos: FPos, curDir: Direction): Direction {
  const r = Math.round(pos.row); const c = Math.round(pos.col);
  const dirs: Direction[] = ['up', 'down', 'left', 'right'];
  const opp = OPPOSITE[curDir];
  const avail = dirs.filter(d => d !== opp && canMoveDir(r, c, d));
  if (avail.length === 0) return canMoveDir(r, c, opp) ? opp : 'none';
  return avail[Math.floor(Math.random() * avail.length)];
}

const GHOST_EXIT: FPos = { row: 7, col: 7 };

// ---- MOVIMIENTO FLOAT ----
function moveEntity(pos: FPos, dir: Direction, speed: number, dtSec: number): FPos {
  if (dir === 'none') return { ...pos };
  const d = DIR_DELTA[dir];
  let nr = pos.row + d.dr * speed * dtSec;
  let nc = pos.col + d.dc * speed * dtSec;
  // Wrap tunnels
  if (nc < -0.5) nc = MAZE_COLS - 0.5;
  else if (nc >= MAZE_COLS - 0.5 + 1) nc = -0.5;
  return { row: nr, col: nc };
}

function isAtCellCenter(pos: FPos): boolean {
  const dr = Math.abs(pos.row - Math.round(pos.row));
  const dc = Math.abs(pos.col - Math.round(pos.col));
  return dr < PACMAN_CONFIG.snapThreshold && dc < PACMAN_CONFIG.snapThreshold;
}

function snapToGrid(pos: FPos): FPos {
  return { row: Math.round(pos.row), col: Math.round(pos.col) };
}

// ---- TICK ----
export function tickPacmanEngine(state: PacmanEngineState, dtMs: number): PacmanEngineState {
  if (state.stats.isOver) return state;
  const dtSec = dtMs / 1000;

  // Tiempo
  state.elapsedMs += dtMs;
  state.stats.remainingMs = Math.max(0, PACMAN_CONFIG.durationMs - state.elapsedMs);
  if (state.stats.remainingMs <= 0) {
    state.stats.isOver = true; state.stats.endReason = 'time'; return state;
  }

  // Power-up
  if (state.frightenedMs > 0) {
    state.frightenedMs = Math.max(0, state.frightenedMs - dtMs);
    state.stats.frightened = state.frightenedMs > 0;
    if (state.frightenedMs <= 0) {
      for (const g of state.ghosts) {
        if (g.mode === 'frightened') g.mode = 'chase';
      }
    }
  }

  // Invulnerabilidad
  if (state.pacman.invulnerableMs > 0) {
    state.pacman.invulnerableMs = Math.max(0, state.pacman.invulnerableMs - dtMs);
  }

  // Boca
  state.pacman.mouthTimer += dtMs;
  if (state.pacman.mouthTimer >= PACMAN_CONFIG.mouthAnimMs) {
    state.pacman.mouthTimer = 0;
    state.pacman.mouthOpen = !state.pacman.mouthOpen;
  }

  // ---- MOVER PACMAN ----
  const pac = state.pacman;
  if (isAtCellCenter(pac.pos)) {
    const snapped = snapToGrid(pac.pos);
    pac.pos = snapped;
    const r = snapped.row; const c = snapped.col;

    // Intentar dirección deseada
    if (pac.nextDir !== 'none' && canMoveDir(r, c, pac.nextDir)) {
      pac.dir = pac.nextDir;
    }
    // Si no puede seguir en la dirección actual, parar
    if (!canMoveDir(r, c, pac.dir)) {
      pac.dir = 'none';
    }

    // Recoger dot
    const wc = c < 0 ? MAZE_COLS - 1 : c >= MAZE_COLS ? 0 : c;
    if (r >= 0 && r < MAZE_ROWS && wc >= 0 && wc < MAZE_COLS && state.dots[r][wc]) {
      state.dots[r][wc] = false;
      const cell = MAZE_MAP[r][wc];
      if (cell === 'P') {
        state.stats.score = Math.min(state.stats.score + PACMAN_CONFIG.pointsPerPowerDot, PACMAN_CONFIG.maxScore);
        state.frightenedMs = PACMAN_CONFIG.frightenedDurationMs;
        state.stats.frightened = true;
        for (const g of state.ghosts) {
          if (g.mode === 'chase' || g.mode === 'scatter') {
            g.mode = 'frightened';
            g.dir = OPPOSITE[g.dir];
          }
        }
      } else {
        state.stats.score = Math.min(state.stats.score + PACMAN_CONFIG.pointsPerDot, PACMAN_CONFIG.maxScore);
      }
      state.stats.dotsLeft--;
      if (state.stats.dotsLeft <= 0) {
        state.stats.isOver = true; state.stats.endReason = 'win'; return state;
      }
    }
  }

  // Mover pacman
  if (pac.dir !== 'none') {
    const newPos = moveEntity(pac.pos, pac.dir, PACMAN_CONFIG.pacmanSpeed, dtSec);
    // Verificar que no se pase de un muro
    const nextR = Math.round(newPos.row); const nextC = Math.round(newPos.col);
    const curR = Math.round(pac.pos.row); const curC = Math.round(pac.pos.col);
    if (nextR !== curR || nextC !== curC) {
      // Cruzando a nueva celda - verificar
      const wNextC = nextC < 0 ? MAZE_COLS - 1 : nextC >= MAZE_COLS ? 0 : nextC;
      if (canEnter(nextR, wNextC)) {
        pac.pos = newPos;
      } else {
        pac.pos = snapToGrid(pac.pos); // Quedarse en celda actual
        pac.dir = 'none';
      }
    } else {
      pac.pos = newPos;
    }
  }

  // ---- MOVER FANTASMAS ----
  for (const ghost of state.ghosts) {
    if (ghost.mode === 'eaten') {
      ghost.respawnTimer -= dtMs;
      if (ghost.respawnTimer <= 0) {
        const spawns = findGhostSpawns();
        const idx = GHOST_COLORS.indexOf(ghost.id);
        const sp = spawns[idx] || spawns[0] || { row: 9, col: 7 };
        ghost.pos = { row: sp.row, col: sp.col };
        ghost.mode = 'house'; ghost.exitTimer = 2000; ghost.dir = 'none';
      }
      continue;
    }

    if (ghost.mode === 'house') {
      ghost.exitTimer -= dtMs;
      if (ghost.exitTimer <= 0) {
        // Mover hacia salida
        if (ghost.pos.row > GHOST_EXIT.row) {
          ghost.pos.row -= PACMAN_CONFIG.ghostSpeed * dtSec;
          if (ghost.pos.row <= GHOST_EXIT.row) ghost.pos.row = GHOST_EXIT.row;
        } else if (Math.abs(ghost.pos.col - GHOST_EXIT.col) > 0.3) {
          ghost.pos.col += (ghost.pos.col < GHOST_EXIT.col ? 1 : -1) * PACMAN_CONFIG.ghostSpeed * dtSec;
        } else {
          ghost.pos = { ...GHOST_EXIT };
          ghost.mode = 'chase'; ghost.dir = 'left';
        }
      }
      continue;
    }

    // Movimiento normal
    const isFright = ghost.mode === 'frightened';
    const speed = isFright ? PACMAN_CONFIG.frightenedGhostSpeed : PACMAN_CONFIG.ghostSpeed;

    if (isAtCellCenter(ghost.pos)) {
      ghost.pos = snapToGrid(ghost.pos);
      const gr = ghost.pos.row; const gc = ghost.pos.col;

      if (isFright) {
        ghost.dir = randomDir(ghost.pos, ghost.dir);
      } else {
        const cycleMs = state.elapsedMs % 27000;
        const target = cycleMs < 7000
          ? getScatterTarget(ghost)
          : getGhostTarget(ghost, pac.pos, pac.dir);
        ghost.dir = chooseDir(ghost.pos, ghost.dir, target);
      }
    }

    if (ghost.dir !== 'none') {
      const newPos = moveEntity(ghost.pos, ghost.dir, speed, dtSec);
      const nextR = Math.round(newPos.row); const nextC = Math.round(newPos.col);
      const curR = Math.round(ghost.pos.row); const curC = Math.round(ghost.pos.col);
      if (nextR !== curR || nextC !== curC) {
        const wNextC = nextC < 0 ? MAZE_COLS - 1 : nextC >= MAZE_COLS ? 0 : nextC;
        if (canEnter(nextR, wNextC)) {
          ghost.pos = newPos;
        } else {
          ghost.pos = snapToGrid(ghost.pos);
        }
      } else {
        ghost.pos = newPos;
      }
    }
  }

  // ---- COLISIONES ----
  for (const ghost of state.ghosts) {
    if (ghost.mode === 'eaten' || ghost.mode === 'house') continue;
    const d = dist(ghost.pos, pac.pos);
    if (d < 0.7) {
      if (ghost.mode === 'frightened') {
        state.stats.score = Math.min(state.stats.score + PACMAN_CONFIG.pointsPerGhost, PACMAN_CONFIG.maxScore);
        ghost.mode = 'eaten'; ghost.respawnTimer = PACMAN_CONFIG.ghostRespawnMs;
      } else if (pac.invulnerableMs <= 0) {
        state.stats.lives--;
        if (state.stats.lives <= 0) {
          state.stats.lives = 0; state.stats.isOver = true; state.stats.endReason = 'lives'; return state;
        }
        const spawn = findPacmanSpawn();
        pac.pos = { row: spawn.row, col: spawn.col };
        pac.dir = 'left'; pac.nextDir = 'left';
        pac.invulnerableMs = PACMAN_CONFIG.respawnInvulnerableMs;
      }
    }
  }

  return state;
}

export function snapshotPacmanStats(s: PacmanEngineState): GameStats { return { ...s.stats }; }
