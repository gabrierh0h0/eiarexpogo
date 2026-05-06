/**
 * Configuración del minijuego Pacman.
 * Centralizada acá para que ajustar dificultad / balance no implique
 * tocar componentes ni el engine.
 */

export const PACMAN_CONFIG = {
  // ---- TIEMPO ----
  durationMs: 120_000, // 2 minutos

  // ---- PUNTAJE ----
  pointsPerDot: 10,
  pointsPerPowerDot: 50,
  pointsPerGhost: 200,
  minScore: 0,
  maxScore: 5000,

  // ---- VIDAS ----
  initialLives: 3,

  // ---- DIMENSIONES DE CELDA ----
  // El mapa es una cuadrícula; cada celda tiene este tamaño en px.
  // Se escala dinámicamente al ancho de pantalla.
  cols: 15,
  rows: 19,

  // ---- VELOCIDADES (celdas por segundo) ----
  pacmanSpeed: 4.5,
  ghostSpeed: 3.2,
  frightenedGhostSpeed: 1.8,

  // ---- POWER-UP ----
  frightenedDurationMs: 6_000, // fantasmas azules por 6s

  // ---- ANIMACIÓN ----
  mouthAnimMs: 150, // alternar boca abierta/cerrada

  // ---- RESPAWN ----
  respawnInvulnerableMs: 2_000,
  ghostRespawnMs: 5_000,
} as const;

// ---- IDENTIFICADORES DE LA MISIÓN ----
/**
 * Contenido exacto que debe tener el QR para activar el minijuego Pacman.
 */
export const PACMAN_QR_CODE = 'EIA-MISSION-PACMAN-V1';

/**
 * ID del documento en la colección `mision` de Firestore.
 */
export const PACMAN_MISSION_ID = 'pacman-campus-tour';
