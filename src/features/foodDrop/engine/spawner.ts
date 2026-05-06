import { ALL_ITEMS, BAD_ITEMS, FoodItemDef, GOOD_ITEMS } from '../constants/items';
import { FOOD_DROP_CONFIG } from '../constants/config';

/**
 * Estado interno del spawner. Se mantiene fuera del componente para
 * que el engine sea puro y testeable.
 */
export interface SpawnerState {
  msSinceLastSpawn: number;
}

export function createSpawnerState(): SpawnerState {
  return { msSinceLastSpawn: 0 };
}

/**
 * Calcula el intervalo de spawn actual interpolando linealmente entre
 * el inicio (más lento) y el final (más rápido) según el % de partida
 * transcurrida. Aumenta dificultad gradualmente.
 */
function currentSpawnInterval(elapsedMs: number): number {
  const t = Math.min(1, elapsedMs / FOOD_DROP_CONFIG.durationMs);
  const start = FOOD_DROP_CONFIG.spawnIntervalMsStart;
  const end = FOOD_DROP_CONFIG.spawnIntervalMsEnd;
  return start + (end - start) * t;
}

/**
 * Selecciona un item aleatorio según la probabilidad de basura.
 */
function pickRandomItem(): FoodItemDef {
  if (Math.random() < FOOD_DROP_CONFIG.badProbability) {
    return BAD_ITEMS[Math.floor(Math.random() * BAD_ITEMS.length)];
  }
  return GOOD_ITEMS[Math.floor(Math.random() * GOOD_ITEMS.length)];
}

/**
 * Avanza el spawner; devuelve un nuevo item si toca crearlo en este tick.
 */
export interface SpawnResult {
  spawn: {
    def: FoodItemDef;
    speedPxPerSec: number;
  } | null;
}

export function tickSpawner(
  state: SpawnerState,
  dtMs: number,
  elapsedMs: number,
): SpawnResult {
  state.msSinceLastSpawn += dtMs;
  const interval = currentSpawnInterval(elapsedMs);

  if (state.msSinceLastSpawn < interval) {
    return { spawn: null };
  }

  state.msSinceLastSpawn = 0;
  const def = pickRandomItem();
  const speed =
    FOOD_DROP_CONFIG.itemMinSpeed +
    Math.random() * (FOOD_DROP_CONFIG.itemMaxSpeed - FOOD_DROP_CONFIG.itemMinSpeed);

  return { spawn: { def, speedPxPerSec: speed } };
}

// Re-export para conveniencia
export { ALL_ITEMS };
