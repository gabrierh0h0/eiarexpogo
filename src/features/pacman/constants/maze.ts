/**
 * Mapa del laberinto Pacman.
 *
 * Leyenda de celdas:
 *   W = pared (Wall)
 *   D = punto normal (Dot)
 *   P = power pellet (Power dot)
 *   E = vacío / camino sin punto
 *   G = casa de fantasmas (Ghost house)
 *   O = puerta de la ghost house (Door)
 *   S = spawn de Pacman
 *   T = túnel (wrap horizontal)
 *
 * El mapa tiene 19 filas × 15 columnas, diseñado para ajustarse
 * verticalmente a la pantalla del celular.
 */

export type CellType = 'W' | 'D' | 'P' | 'E' | 'G' | 'O' | 'S' | 'T';

export const MAZE_MAP: CellType[][] = [
  // Fila 0
  ['W','W','W','W','W','W','W','W','W','W','W','W','W','W','W'],
  // Fila 1
  ['W','D','D','D','D','D','D','W','D','D','D','D','D','D','W'],
  // Fila 2
  ['W','P','W','W','D','W','D','W','D','W','D','W','W','P','W'],
  // Fila 3
  ['W','D','D','D','D','D','D','D','D','D','D','D','D','D','W'],
  // Fila 4
  ['W','D','W','W','D','W','D','W','D','W','D','W','W','D','W'],
  // Fila 5
  ['W','D','D','D','D','W','D','D','D','W','D','D','D','D','W'],
  // Fila 6
  ['W','W','W','W','D','W','W','E','W','W','D','W','W','W','W'],
  // Fila 7
  ['T','E','E','E','D','E','E','E','E','E','D','E','E','E','T'],
  // Fila 8
  ['W','W','W','W','D','W','O','G','O','W','D','W','W','W','W'],
  // Fila 9
  ['T','E','E','E','D','W','G','G','G','W','D','E','E','E','T'],
  // Fila 10
  ['W','W','W','W','D','W','W','W','W','W','D','W','W','W','W'],
  // Fila 11
  ['T','E','E','E','D','E','E','E','E','E','D','E','E','E','T'],
  // Fila 12
  ['W','W','W','W','D','W','D','W','D','W','D','W','W','W','W'],
  // Fila 13
  ['W','D','D','D','D','D','D','W','D','D','D','D','D','D','W'],
  // Fila 14
  ['W','D','W','W','D','W','D','D','D','W','D','W','W','D','W'],
  // Fila 15
  ['W','P','D','W','D','D','D','S','D','D','D','W','D','P','W'],
  // Fila 16
  ['W','W','D','W','D','W','D','W','D','W','D','W','D','W','W'],
  // Fila 17
  ['W','D','D','D','D','D','D','W','D','D','D','D','D','D','W'],
  // Fila 18
  ['W','W','W','W','W','W','W','W','W','W','W','W','W','W','W'],
];

export const MAZE_ROWS = MAZE_MAP.length;   // 19
export const MAZE_COLS = MAZE_MAP[0].length; // 15

/**
 * Verifica si una celda es caminable (no-pared).
 */
export function isWalkable(row: number, col: number): boolean {
  if (row < 0 || row >= MAZE_ROWS || col < 0 || col >= MAZE_COLS) {
    // Permitir túneles horizontales
    const r = MAZE_MAP[row];
    if (!r) return false;
    return false;
  }
  const cell = MAZE_MAP[row][col];
  return cell !== 'W';
}

/**
 * Maneja el wrap de túneles horizontales.
 * Si col sale del rango, lo envuelve al otro extremo.
 */
export function wrapCol(col: number): number {
  if (col < 0) return MAZE_COLS - 1;
  if (col >= MAZE_COLS) return 0;
  return col;
}

/**
 * Cuenta el total de puntos en el mapa (para saber cuándo ganas).
 */
export function countTotalDots(): number {
  let count = 0;
  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      const cell = MAZE_MAP[r][c];
      if (cell === 'D' || cell === 'P') count++;
    }
  }
  return count;
}

/** Posición inicial de Pacman (celda S) */
export function findPacmanSpawn(): { row: number; col: number } {
  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      if (MAZE_MAP[r][c] === 'S') return { row: r, col: c };
    }
  }
  return { row: 15, col: 7 }; // fallback
}

/** Posiciones iniciales de los fantasmas (celdas G) */
export function findGhostSpawns(): { row: number; col: number }[] {
  const spawns: { row: number; col: number }[] = [];
  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      if (MAZE_MAP[r][c] === 'G') spawns.push({ row: r, col: c });
    }
  }
  return spawns;
}
