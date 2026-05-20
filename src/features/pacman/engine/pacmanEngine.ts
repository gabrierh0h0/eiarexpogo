import { PACMAN_CONFIG } from '../constants/config';
import { GhostColor } from '../constants/sprites';

/* ================================================================
 *  TIPOS
 * ================================================================ */
export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';
export interface FPos { row: number; col: number; }
export type GhostMode = 'scatter' | 'chase' | 'frightened' | 'eaten' | 'house';

export interface Ghost {
  id: GhostColor;
  pos: FPos;
  dir: Direction;
  mode: GhostMode;
  prevMode: GhostMode;
  respawnTimer: number;
  exitTimer: number;
  scatterTarget: FPos;
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
  ghostModeCycle: number;
  ghostModeTimer: number;
  ghostsEatenCombo: number;
}

/* ================================================================
 *  MAPA — EXTRAÍDO PIXEL-POR-PIXEL de puntos.png + laberinto.png
 *
 *  39 filas × 26 columnas. Celda = 20 × 20 px.
 *  Origen en capa 595×1235: X₀=45, Y₀=240
 *
 *  W = pared, D = punto, P = power pellet,
 *  E = vacío transitable, G = puerta fantasmas,
 *  H = interior casa fantasmas, T = túnel
 *
 *  Los datos vienen directamente del análisis de cada celda
 *  (punto → D/P, vacío pero no-pared → E, pared → W).
 *  Se han añadido manualmente G y H en la zona de la ghost house
 *  y T en el túnel lateral.
 * ================================================================ */
type C = 'W' | 'D' | 'P' | 'E' | 'G' | 'H' | 'T';

const RAW: string[] = [
  // Pixel-extracted data – cada fila tiene exactamente 26 chars
  // 01234567890123456789012345
  'DDDDDDDDDDDDWWDDDDDDDDDDDD', //  0
  'DEWWEDEWWWEDWWDEWWWEDEWWED',   //  1
  'PWWWWDWWWWWDWWDWWWWWDWWWWD',   //  2   P=power
  'DEWWWDEWWWWDEEDEWWWWDEWWWD',   //  3
  'DDDDDDDDDDDDDDDDDDDPDDDDDD', //  4   P=power
  'DEWWEDEEDEWWWWWWEDEEDEWWED',   //  5
  'DEWWWDWWDEWWWWWWWDWWDEWWWD',   //  6
  'DDDDDDWWDDDDWWDDDDWWDDDDDD',  //  7
  'WWWWEDWWWWEEWWEEWWWWDEWWWW',   //  8
  'EEEEWDWWWWWEEWEEWWWWDWEEEE',   //  9
  'EEEEWDWWEEEEEEEEEEWWDWEEEE',   // 10
  'EEEEWDWWEEWWGGWWWEWWDWEEEE', // 11  G=ghost door (col 12-13)
  'WWWWWDWWEWHHHHHHWEWWDWWWWW', // 12  H=ghost house interior
  'TEEEEDEEEWHHHHHHWEEEDEEEET', // 13  T=tunnel, H=house
  'TEEEEDEEEWHHHHHHWEEEDEEEET', // 14  T=tunnel, H=house
  'WWWWWDWWEWHHHHHHWEWWDWWWWW', // 15
  'EEEEWPWWEWWWWWWWWEWWDWEEEE',   // 16   P=power
  'EEEEWDWWEEEEEEEEEEWWDWEEEE',   // 17
  'EEEEWDWWEEWWWWWWEEWWDWEEEE',   // 18
  'WWWWEDEWEEWWWWWWWEEWDEWWWW',   // 19
  'DDDDDDDDDDDDWWDDDDDDDDDDDD',  // 20
  'DEWWEDEWWWEDWWDEWWWEDEWWED',   // 21
  'DEWWWDEWWWWDEWDEWWWWDWWWWD',   // 22
  'DDDWWDDDDDDDDDDDDPDDDWWDDD', // 23   P=power
  'WWDWWDWWDEWWWWWWEDWWDWWDEW',   // 24
  'WWDEWDWWDEWWWWWWWDWWDEWDWW',   // 25
  'DDDDDDWWDDDDWWDDDDWWDDDDDD',  // 26
  'DEWWWWWWWWEDWWDEWWWWWWWWED',   // 27
  'DEWWWWWWWWWDEWDEWWWWWWWWWD',   // 28
  'DDDDDDDDDDDDDDDDDDDDDDDDDD',  // 29
  'DEWWWWWWWWEDEEDEWWWWWWWWED',   // 30
  'DEWWWWWWWWWDWWDEWWWWWWWWWD',   // 31
  'PDDDDDWWDDDDWWDDDDWWDDDDDD', // 32   P=power
  'WWDEEDWWDEWWWWWWEDWWDEEDEW',   // 33
  'WWDWWDEWDEWWWWWWWDEWDWWDWW',   // 34
  'DDDWWDDDDDDDDDDDDDDDDWWDDD',  // 35
  'DEWWWDEWWWEDEEDEWWWEDWWWED',   // 36
  'DEWWWDEWWWWDWWPEWWWWDEWWWD',   // 37   P=power
  'DDDDDDDDDDDDWWDDDDDDDDDDDD',  // 38
];

/* Normalizar a exactamente 26 columnas */
const MAP_COLS = 26;
const MAP: C[][] = RAW.map(row => {
  const cells: C[] = [];
  for (let c = 0; c < MAP_COLS; c++) {
    const ch = c < row.length ? row[c] : 'W';
    if ('WDPEGHT'.includes(ch)) cells.push(ch as C);
    else cells.push('W');
  }
  return cells;
});

export const ROWS = MAP.length;    // 39
export const COLS = MAP[0].length; // 26

/* ================================================================
 *  COORDENADAS DE CAPA (595 × 1235)
 *
 *  Todas las imágenes de assets son capas superpuestas de 595×1235.
 *  El laberinto visual: X=[15..579], Y=[210..1034].
 *  Los puntos están en grilla 26 cols × 39 filas, celda de 20 px.
 *  Primer punto en X=45, Y=240.
 * ================================================================ */
export const LAYER_W = 595;
export const LAYER_H = 1235;
export const GRID_X0 = 45;
export const GRID_Y0 = 240;
export const CELL_PX = 20;

/** Centro de celda [r,c] en coordenadas de la capa (595×1235). */
export function cellToPixel(r: number, c: number): { px: number; py: number } {
  return {
    px: GRID_X0 + c * CELL_PX,
    py: GRID_Y0 + r * CELL_PX,
  };
}

/**
 * Posición "home" de cada sprite en su capa PNG (595×1235).
 * Extraído con análisis de píxeles no-transparentes.
 */
export const SPRITE_ORIGINS: Record<string, { px: number; py: number }> = {
  pascal: { px: 297.5, py: 582 },
  red:    { px: 297,   py: 532 },
  blue:   { px: 297,   py: 492 },
  pink:   { px: 257,   py: 492 },
  orange: { px: 337,   py: 532 },
};

/**
 * Bounding boxes de cada sprite dentro de su capa 595×1235.
 * x,y = esquina superior-izquierda;  w,h = tamaño del sprite en px.
 */
export const SPRITE_BOUNDS: Record<string, { x: number; y: number; w: number; h: number }> = {
  pascal: { x: 280, y: 565, w: 36, h: 35 },
  red:    { x: 280, y: 515, w: 35, h: 35 },
  blue:   { x: 280, y: 475, w: 35, h: 35 },
  pink:   { x: 240, y: 475, w: 35, h: 35 },
  orange: { x: 320, y: 515, w: 35, h: 35 },
};

/* ================================================================
 *  CONSTANTES DE JUEGO
 * ================================================================ */
const GHOST_COLORS: GhostColor[] = ['red', 'pink', 'blue', 'orange'];

const DIR_D: Record<Direction, { dr: number; dc: number }> = {
  up:    { dr: -1, dc:  0 },
  down:  { dr:  1, dc:  0 },
  left:  { dr:  0, dc: -1 },
  right: { dr:  0, dc:  1 },
  none:  { dr:  0, dc:  0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down', down: 'up', left: 'right', right: 'left', none: 'none',
};

const SCATTER_TARGETS: Record<GhostColor, FPos> = {
  red:    { row: 0,        col: COLS - 3 },
  pink:   { row: 0,        col: 2 },
  blue:   { row: ROWS - 1, col: COLS - 1 },
  orange: { row: ROWS - 1, col: 0 },
};

const MODE_CYCLE: { mode: GhostMode; duration: number }[] = [
  { mode: 'scatter', duration: 7000 },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 7000 },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 5000 },
  { mode: 'chase',   duration: 20000 },
  { mode: 'scatter', duration: 5000 },
  { mode: 'chase',   duration: 999999 },
];

/* ================================================================
 *  POSICIONES INICIALES (grid coords)
 *
 *  Pascal sprite center (297.5, 582):
 *    col = (297.5 - 45) / 20 = 12.6 ≈ 13
 *    row = (582 - 240) / 20 = 17.1 ≈ 17
 *    → Pero fila 17 es zona de fantasmas, así que usamos fila 23 (corredor inferior)
 *
 *  Ghost house se ubica ~filas 12-15, cols 10-15
 * ================================================================ */
const PACMAN_START: FPos = { row: 23, col: 12 };
const GHOST_HOUSE:  FPos = { row: 13, col: 12 };
const GHOST_EXIT:   FPos = { row: 10, col: 12 };

/* ================================================================
 *  COLISIÓN
 * ================================================================ */
function isWalkable(r: number, c: number, isGhost: boolean): boolean {
  const row = Math.round(r);
  const col = Math.round(c);
  if (row < 0 || row >= ROWS) return false;

  // Túnel: filas T permiten salir por los bordes
  if (col < 0 || col >= COLS) {
    if (row >= 0 && row < ROWS) {
      return MAP[row][0] === 'T' || MAP[row][COLS - 1] === 'T';
    }
    return false;
  }

  const cell = MAP[row][col];
  if (cell === 'W') return false;
  if (cell === 'G') return isGhost;
  if (cell === 'H') return isGhost;
  return true;
}

/* ================================================================
 *  IA DE FANTASMAS
 * ================================================================ */
function distSq(a: FPos, b: FPos): number {
  return (a.row - b.row) ** 2 + (a.col - b.col) ** 2;
}

function getTarget(g: Ghost, pac: PacmanState, red?: Ghost): FPos {
  if (g.mode === 'scatter')    return g.scatterTarget;
  if (g.mode === 'eaten')      return GHOST_HOUSE;
  if (g.mode === 'frightened') return {
    row: Math.floor(Math.random() * ROWS),
    col: Math.floor(Math.random() * COLS),
  };

  // Chase mode
  switch (g.id) {
    case 'red':  return { ...pac.pos };
    case 'pink': return {
      row: pac.pos.row + DIR_D[pac.dir].dr * 4,
      col: pac.pos.col + DIR_D[pac.dir].dc * 4,
    };
    case 'blue': {
      if (red) {
        const ahead = {
          row: pac.pos.row + DIR_D[pac.dir].dr * 2,
          col: pac.pos.col + DIR_D[pac.dir].dc * 2,
        };
        return {
          row: ahead.row + (ahead.row - red.pos.row),
          col: ahead.col + (ahead.col - red.pos.col),
        };
      }
      return { ...pac.pos };
    }
    case 'orange':
      return distSq(g.pos, pac.pos) > 64 ? { ...pac.pos } : g.scatterTarget;
    default: return { ...pac.pos };
  }
}

function pickDir(g: Ghost, target: FPos): Direction {
  const gr = Math.round(g.pos.row);
  const gc = Math.round(g.pos.col);
  const order: Direction[] = ['up', 'left', 'down', 'right'];

  let best: Direction | null = null;
  let bestD = Infinity;

  // First pass: try all directions except reverse
  for (const d of order) {
    if (d === OPPOSITE[g.dir]) continue;
    const nr = gr + DIR_D[d].dr;
    const nc = gc + DIR_D[d].dc;
    if (!isWalkable(nr, nc, true)) continue;
    const dd = distSq({ row: nr, col: nc }, target);
    if (dd < bestD) { bestD = dd; best = d; }
  }

  // Fallback: allow reverse if nothing else works
  if (best === null) {
    const rev = OPPOSITE[g.dir];
    if (rev !== 'none') {
      const nr = gr + DIR_D[rev].dr;
      const nc = gc + DIR_D[rev].dc;
      if (isWalkable(nr, nc, true)) return rev;
    }
    // Absolute fallback: try any walkable direction
    for (const d of order) {
      const nr = gr + DIR_D[d].dr;
      const nc = gc + DIR_D[d].dc;
      if (isWalkable(nr, nc, true)) return d;
    }
    return g.dir !== 'none' ? g.dir : 'left';
  }

  return best;
}

/* ================================================================
 *  FACTORY
 * ================================================================ */
export function createPacmanEngine(): PacmanEngineState {
  const dots: boolean[][] = [];
  let totalDots = 0;
  for (let r = 0; r < ROWS; r++) {
    dots[r] = [];
    for (let c = 0; c < COLS; c++) {
      const cell = MAP[r][c];
      dots[r][c] = cell === 'D' || cell === 'P';
      if (dots[r][c]) totalDots++;
    }
  }

  return {
    stats: {
      score: 0,
      lives: PACMAN_CONFIG.initialLives,
      remainingMs: PACMAN_CONFIG.durationMs,
      dotsLeft: totalDots,
      totalDots,
      isOver: false,
      endReason: null,
      frightened: false,
    },
    pacman: {
      pos: { ...PACMAN_START },
      dir: 'left',
      nextDir: 'left',
      mouthOpen: true,
      mouthTimer: 0,
      invulnerableMs: 2000,
    },
    ghosts: GHOST_COLORS.map((id, i) => ({
      id,
      pos: { ...GHOST_HOUSE },
      dir: 'none' as Direction,
      mode: 'house' as GhostMode,
      prevMode: 'scatter' as GhostMode,
      respawnTimer: 0,
      exitTimer: i * 3000,
      scatterTarget: SCATTER_TARGETS[id],
    })),
    dots,
    frightenedMs: 0,
    elapsedMs: 0,
    ghostModeCycle: 0,
    ghostModeTimer: MODE_CYCLE[0].duration,
    ghostsEatenCombo: 0,
  };
}

/* ================================================================
 *  TICK (dt en milisegundos)
 * ================================================================ */
export function tickPacmanEngine(state: PacmanEngineState, dtMs: number): PacmanEngineState {
  if (state.stats.isOver) return state;
  const dt = dtMs / 1000;
  const p = state.pacman;

  /* — Timers — */
  state.elapsedMs += dtMs;
  state.stats.remainingMs = Math.max(0, PACMAN_CONFIG.durationMs - state.elapsedMs);
  if (state.stats.remainingMs <= 0) {
    state.stats.isOver = true;
    state.stats.endReason = 'time';
    return state;
  }
  if (p.invulnerableMs > 0) p.invulnerableMs -= dtMs;

  /* — Mouth — */
  p.mouthTimer += dtMs;
  if (p.mouthTimer >= PACMAN_CONFIG.mouthAnimMs) {
    p.mouthTimer = 0;
    p.mouthOpen = !p.mouthOpen;
  }

  /* — Frightened — */
  if (state.frightenedMs > 0) {
    state.frightenedMs -= dtMs;
    state.stats.frightened = true;
    if (state.frightenedMs <= 0) {
      state.frightenedMs = 0;
      state.stats.frightened = false;
      state.ghostsEatenCombo = 0;
      for (const g of state.ghosts) {
        if (g.mode === 'frightened') g.mode = g.prevMode;
      }
    }
  } else {
    state.stats.frightened = false;
  }

  /* — Ghost mode cycle — */
  if (state.frightenedMs <= 0) {
    state.ghostModeTimer -= dtMs;
    if (state.ghostModeTimer <= 0 && state.ghostModeCycle < MODE_CYCLE.length - 1) {
      state.ghostModeCycle++;
      state.ghostModeTimer = MODE_CYCLE[state.ghostModeCycle].duration;
      const nm = MODE_CYCLE[state.ghostModeCycle].mode;
      for (const g of state.ghosts) {
        if (g.mode !== 'house' && g.mode !== 'eaten') {
          g.pos = { row: Math.round(g.pos.row), col: Math.round(g.pos.col) };
          g.dir = OPPOSITE[g.dir];
          g.mode = nm;
          g.prevMode = nm;
        }
      }
    }
  }

  /* ─── PACMAN MOVEMENT ─── */
  if (p.nextDir === OPPOSITE[p.dir] && p.dir !== 'none') {
    p.dir = p.nextDir;
  }

  if (p.dir === 'none') {
    if (p.nextDir !== 'none') {
      const nr = Math.round(p.pos.row) + DIR_D[p.nextDir].dr;
      const nc = Math.round(p.pos.col) + DIR_D[p.nextDir].dc;
      if (isWalkable(nr, nc, false)) {
        p.pos = { row: Math.round(p.pos.row), col: Math.round(p.pos.col) };
        p.dir = p.nextDir;
      }
    }
  } else {
    const speed = PACMAN_CONFIG.pacmanSpeed;
    const { dr, dc } = DIR_D[p.dir];

    // Lock perpendicular axis perfectly
    let r = dc !== 0 ? Math.round(p.pos.row) : p.pos.row;
    let c = dr !== 0 ? Math.round(p.pos.col) : p.pos.col;

    const oldR = r;
    const oldC = c;
    const dist = speed * dt;
    r += dr * dist;
    c += dc * dist;

    // Tunnel wrap
    if (c < -0.5) { c = COLS - 0.5; r = Math.round(r); }
    if (c >= COLS - 0.5) { c = -0.5; r = Math.round(r); }

    let crossed = false;
    let cR = Math.round(r);
    let cC = Math.round(c);

    if (dc > 0) {
      const tgt = Math.floor(oldC) + 1;
      if (c >= tgt) { crossed = true; cC = tgt; }
    } else if (dc < 0) {
      const tgt = Math.ceil(oldC) - 1;
      if (c <= tgt) { crossed = true; cC = tgt; }
    } else if (dr > 0) {
      const tgt = Math.floor(oldR) + 1;
      if (r >= tgt) { crossed = true; cR = tgt; }
    } else if (dr < 0) {
      const tgt = Math.ceil(oldR) - 1;
      if (r <= tgt) { crossed = true; cR = tgt; }
    }

    if (crossed) {
      let turned = false;
      if (p.nextDir !== 'none' && p.nextDir !== p.dir) {
        const tr = cR + DIR_D[p.nextDir].dr;
        const tc = cC + DIR_D[p.nextDir].dc;
        if (isWalkable(tr, tc, false)) {
          p.pos = { row: cR, col: cC };
          p.dir = p.nextDir;
          turned = true;
        }
      }
      if (!turned) {
        const ar = cR + dr;
        const ac = cC + dc;
        if (!isWalkable(ar, ac, false)) {
          p.pos = { row: cR, col: cC };
          p.dir = 'none';
        } else {
          p.pos = { row: r, col: c };
        }
      }
    } else {
      p.pos = { row: r, col: c };
    }
  }

  /* ─── EAT DOTS ─── */
  const er = Math.round(p.pos.row);
  const ec = Math.round(p.pos.col);
  if (er >= 0 && er < ROWS && ec >= 0 && ec < COLS && state.dots[er][ec]) {
    state.dots[er][ec] = false;
    const cell = MAP[er][ec];
    if (cell === 'P') {
      state.stats.score += PACMAN_CONFIG.pointsPerPowerDot;
      state.frightenedMs = PACMAN_CONFIG.frightenedDurationMs;
      state.stats.frightened = true;
      state.ghostsEatenCombo = 0;
      for (const g of state.ghosts) {
        if (g.mode === 'chase' || g.mode === 'scatter') {
          g.prevMode = g.mode;
          g.mode = 'frightened';
          g.pos = { row: Math.round(g.pos.row), col: Math.round(g.pos.col) };
          g.dir = OPPOSITE[g.dir];
        }
      }
    } else {
      state.stats.score += PACMAN_CONFIG.pointsPerDot;
    }
    state.stats.dotsLeft--;
    if (state.stats.dotsLeft <= 0) {
      state.stats.isOver = true;
      state.stats.endReason = 'win';
      return state;
    }
  }

  /* ─── GHOST MOVEMENT ─── */
  const redG = state.ghosts.find(g => g.id === 'red');

  for (const g of state.ghosts) {
    /* Casa */
    if (g.mode === 'house') {
      g.exitTimer -= dtMs;
      if (g.exitTimer <= 0) {
        g.pos = { ...GHOST_EXIT };
        g.mode = MODE_CYCLE[state.ghostModeCycle].mode;
        g.prevMode = g.mode;
        g.dir = 'none';
      }
      continue;
    }

    /* Comido → volver a casa */
    if (g.mode === 'eaten') {
      const dh = Math.sqrt(distSq(g.pos, GHOST_HOUSE));
      if (dh < 1) {
        g.pos = { ...GHOST_EXIT };
        g.mode = g.prevMode;
        g.dir = 'none';
        continue;
      }
      const eSpd = PACMAN_CONFIG.pacmanSpeed * 2;
      const dd = Math.max(dh, 0.01);
      g.pos.row += ((GHOST_HOUSE.row - g.pos.row) / dd) * eSpd * dt;
      g.pos.col += ((GHOST_HOUSE.col - g.pos.col) / dd) * eSpd * dt;
      checkCollision(g, p, state);
      continue;
    }

    /* Pick direction when stopped */
    if (g.dir === 'none') {
      let sr = Math.round(g.pos.row);
      let sc = Math.round(g.pos.col);
      if (!isWalkable(sr, sc, true)) {
        const cands = [
          { r: Math.floor(g.pos.row), c: Math.round(g.pos.col) },
          { r: Math.ceil(g.pos.row),  c: Math.round(g.pos.col) },
          { r: Math.round(g.pos.row), c: Math.floor(g.pos.col) },
          { r: Math.round(g.pos.row), c: Math.ceil(g.pos.col) },
        ];
        for (const cd of cands) if (isWalkable(cd.r, cd.c, true)) { sr=cd.r; sc=cd.c; break; }
      }
      g.pos = { row: sr, col: sc };
      const tgt = getTarget(g, p, redG);
      g.dir = pickDir(g, tgt);
      if (g.dir === 'none') {
        for (const d of ['up','left','down','right'] as Direction[]) {
          if (isWalkable(sr + DIR_D[d].dr, sc + DIR_D[d].dc, true)) { g.dir = d; break; }
        }
      }
    }

    if (g.dir !== 'none') {
      const gSpd = g.mode === 'frightened' ? PACMAN_CONFIG.frightenedGhostSpeed : PACMAN_CONFIG.ghostSpeed;
      const { dr, dc } = DIR_D[g.dir];

      let r = dc !== 0 ? Math.round(g.pos.row) : g.pos.row;
      let c = dr !== 0 ? Math.round(g.pos.col) : g.pos.col;

      const oldR = r;
      const oldC = c;
      r += dr * gSpd * dt;
      c += dc * gSpd * dt;

      if (c < -0.5) { c = COLS - 0.5; r = Math.round(r); }
      if (c >= COLS - 0.5) { c = -0.5; r = Math.round(r); }

      let crossed = false;
      let cR = Math.round(r);
      let cC = Math.round(c);

      if (dc > 0) {
        const tgt = Math.floor(oldC) + 1;
        if (c >= tgt) { crossed = true; cC = tgt; }
      } else if (dc < 0) {
        const tgt = Math.ceil(oldC) - 1;
        if (c <= tgt) { crossed = true; cC = tgt; }
      } else if (dr > 0) {
        const tgt = Math.floor(oldR) + 1;
        if (r >= tgt) { crossed = true; cR = tgt; }
      } else if (dr < 0) {
        const tgt = Math.ceil(oldR) - 1;
        if (r <= tgt) { crossed = true; cR = tgt; }
      }

      if (crossed) {
        // Did we hit an intersection or dead end?
        let neighbors = 0;
        for (const d2 of ['up','left','down','right'] as Direction[]) {
          if (isWalkable(cR + DIR_D[d2].dr, cC + DIR_D[d2].dc, true)) neighbors++;
        }
        const aheadOk = isWalkable(cR + dr, cC + dc, true);

        if (neighbors >= 3 || !aheadOk) {
          g.pos = { row: cR, col: cC };
          const tgt = getTarget(g, p, redG);
          g.dir = pickDir(g, tgt);
          // If still can't move ahead, stop
          if (!isWalkable(cR + DIR_D[g.dir].dr, cC + DIR_D[g.dir].dc, true)) {
            g.dir = 'none';
          }
        } else {
          g.pos = { row: r, col: c };
        }
      } else {
        g.pos = { row: r, col: c };
      }
    }

    checkCollision(g, p, state);
  }

  return state;
}

function checkCollision(g: Ghost, p: PacmanState, state: PacmanEngineState) {
  const d = Math.sqrt(distSq(g.pos, p.pos));
  if (d >= 0.8 || p.invulnerableMs > 0) return;

  if (g.mode === 'frightened') {
    state.ghostsEatenCombo++;
    state.stats.score += PACMAN_CONFIG.pointsPerGhost * state.ghostsEatenCombo;
    g.mode = 'eaten';
    g.respawnTimer = PACMAN_CONFIG.ghostRespawnMs;
  } else if (g.mode !== 'eaten') {
    state.stats.lives--;
    if (state.stats.lives <= 0) {
      state.stats.isOver = true;
      state.stats.endReason = 'lives';
    } else {
      p.pos = { ...PACMAN_START };
      p.dir = 'left';
      p.nextDir = 'left';
      p.invulnerableMs = PACMAN_CONFIG.respawnInvulnerableMs;
      for (let i = 0; i < state.ghosts.length; i++) {
        const sg = state.ghosts[i];
        sg.pos = { ...GHOST_HOUSE };
        sg.mode = 'house';
        sg.dir = 'none';
        sg.exitTimer = i * 3000;
      }
      state.frightenedMs = 0;
      state.stats.frightened = false;
    }
  }
}

/* ================================================================
 *  API PÚBLICA
 * ================================================================ */
export function setDirection(state: PacmanEngineState, dir: Direction) {
  state.pacman.nextDir = dir;
}

export function snapshotStats(s: PacmanEngineState): GameStats {
  return { ...s.stats };
}

export function getMap(): C[][] {
  return MAP;
}
