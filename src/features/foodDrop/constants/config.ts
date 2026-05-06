/**
 * Configuración del minijuego Food Drop.
 * Centralizada acá para que ajustar dificultad / balance no implique
 * tocar componentes ni el engine.
 */

export const FOOD_DROP_CONFIG = {
  // ---- TIEMPO ----
  durationMs: 90_000, // 1 min 30 s

  // ---- PUNTAJE ----
  pointsGood: 10,
  pointsBad: -5,
  minScore: 0, // clamp: nunca negativo
  maxScore: 1000, // cap defensivo (debe coincidir con backend DTO)

  // ---- VIDAS ----
  initialLives: 2,
  badStreakToLoseLife: 3, // 3 malos seguidos pierde 1 vida

  // ---- DIMENSIONES PASCAL ----
  pascalWidth: 110,
  pascalHeight: 110,
  pascalBottomOffset: 30, // separación inferior

  // ---- ITEMS QUE CAEN ----
  itemSize: 64,
  itemMinSpeed: 180, // px/s
  itemMaxSpeed: 320, // px/s

  // ---- SPAWNER ----
  spawnIntervalMsStart: 900, // ms entre spawns al inicio
  spawnIntervalMsEnd: 450, // ms entre spawns al final (más difícil)
  badProbability: 0.4, // 40% de los items son malos

  // ---- ANIMACIÓN PASCAL ----
  eatFlashMs: 250, // duración del sprite "eat"
  redFlashMs: 500, // duración del rojo tras comer malo

  // ---- COLISIONES ----
  collisionPadding: 8, // padding interior para que la caja sea más generosa visualmente
} as const;

// ---- IDENTIFICADORES DE LA MISIÓN ----
/**
 * Contenido exacto que debe tener el QR de la Tienda de la Confianza
 * para activar el minijuego. Se valida en el frontend tras pasar la
 * validación genérica del backend (que solo exige que contenga "EIA").
 */
export const FOOD_DROP_QR_CODE = 'EIA-MISSION-FOOD-DROP-V1';

/**
 * ID del documento en la colección `mision` de Firestore.
 * Debe existir creado por el equipo (ya creado: food-drop-tienda-confianza).
 */
export const FOOD_DROP_MISSION_ID = 'food-drop-tienda-confianza';
