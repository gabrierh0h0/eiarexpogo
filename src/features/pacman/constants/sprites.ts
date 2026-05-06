/**
 * Sprites del minijuego Pacman.
 * Los `require()` se evalúan al cargar el módulo (precarga Metro).
 */

// ---- PACMAN (Pascal) ----
export const PACMAN_SPRITES = {
  open: require('../../../../assets/pacman/abierto.png'),
  closed: require('../../../../assets/pacman/cerrado.png'),
  pascal: require('../../../../assets/pacman/pascal.png'),
} as const;

// ---- FANTASMAS ----
export const GHOST_SPRITES = {
  red: require('../../../../assets/pacman/fantasmaRojo.png'),
  blue: require('../../../../assets/pacman/fantasmaAzul.png'),
  orange: require('../../../../assets/pacman/fantasmaNaranja.png'),
  pink: require('../../../../assets/pacman/fantasmaRosado.png'),
} as const;

export type GhostColor = keyof typeof GHOST_SPRITES;

// ---- UI ----
export const PACMAN_UI = {
  background: require('../../../../assets/pacman/fondo.png'),
  maze: require('../../../../assets/pacman/laberinto.png'),
  dot: require('../../../../assets/pacman/puntos.png'),
  life: require('../../../../assets/pacman/vida.png'),
  door: require('../../../../assets/pacman/puertita.png'),
} as const;
