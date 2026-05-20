/**
 * Configuración del minijuego Pacman.
 */
export const PACMAN_CONFIG = {
  durationMs: 120_000,
  pointsPerDot: 10,
  pointsPerPowerDot: 50,
  pointsPerGhost: 200,
  minScore: 0,
  maxScore: 5000,
  initialLives: 3,
  cols: 26,
  rows: 39,
  pacmanSpeed: 6.0,
  ghostSpeed: 4.5,
  frightenedGhostSpeed: 2.5,
  frightenedDurationMs: 7_000,
  mouthAnimMs: 120,
  respawnInvulnerableMs: 2_000,
  ghostRespawnMs: 4_000,
  // Tolerancia para considerar que llegó al centro de una celda
  snapThreshold: 0.15,
} as const;

export const PACMAN_QR_CODE = 'EIA-MISSION-PACMAN-V1';
export const PACMAN_MISSION_ID = 'pacman-campus-tour';
