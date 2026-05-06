import { FOOD_DROP_CONFIG } from '../constants/config';
import { FoodItemDef, PascalState } from '../constants/items';
import { createSpawnerState, SpawnerState, tickSpawner } from './spawner';

/**
 * ENGINE PURO del minijuego Food Drop.
 *
 * Responsabilidades:
 *   - Mantener el estado de la partida (items cayendo, score, vidas, tiempo,
 *     racha de malos, estado visual de Pascal).
 *   - Avanzar el estado en cada tick (movimiento, colisiones, spawn).
 *   - Aplicar las reglas: +10 buenos, -5 malos, racha de 3 malos = -1 vida,
 *     score con clamp en 0, fin por tiempo o por vidas, máquina de Pascal.
 *
 * NO toca:
 *   - Render (eso lo hace el componente).
 *   - Red / Firestore (eso lo hace el service).
 *   - Animaciones (solo expone qué sprite mostrar).
 *
 * Esto permite testear toda la lógica sin un componente RN.
 */

export interface FallingObject {
  uid: number; // identificador único para keys de React
  def: FoodItemDef;
  x: number; // px desde la izquierda (centro del item)
  y: number; // px desde arriba (centro del item)
  vy: number; // velocidad px/s
}

export interface GameStats {
  score: number;
  lives: number;
  badStreak: number;
  remainingMs: number;
  pascalState: PascalState;
  pascalX: number; // px (centro)
  isOver: boolean;
  endReason: 'time' | 'lives' | null;
}

export interface GameDimensions {
  width: number;
  height: number;
  pascalRowY: number; // y del centro de Pascal
}

export interface EngineState {
  stats: GameStats;
  falling: FallingObject[];
  spawner: SpawnerState;
  dims: GameDimensions;
  pascalRedUntilMs: number; // timestamp ms hasta el cual el rojo debe seguir
  pascalEatUntilMs: number; // timestamp ms hasta el cual el "eat" debe seguir
  elapsedMs: number;
  nextUid: number;
}

export function createEngine(dims: GameDimensions): EngineState {
  return {
    stats: {
      score: 0,
      lives: FOOD_DROP_CONFIG.initialLives,
      badStreak: 0,
      remainingMs: FOOD_DROP_CONFIG.durationMs,
      pascalState: 'idle',
      pascalX: dims.width / 2,
      isOver: false,
      endReason: null,
    },
    falling: [],
    spawner: createSpawnerState(),
    dims,
    pascalRedUntilMs: 0,
    pascalEatUntilMs: 0,
    elapsedMs: 0,
    nextUid: 1,
  };
}

/**
 * Mueve a Pascal a una posición X (centro), respetando bordes.
 * El usuario llama esto desde gestos pan.
 */
export function setPascalX(state: EngineState, x: number): void {
  const halfW = FOOD_DROP_CONFIG.pascalWidth / 2;
  state.stats.pascalX = Math.max(halfW, Math.min(state.dims.width - halfW, x));
}

/**
 * Determina el sprite que debe mostrarse según los timers vigentes
 * y el estado lógico (badStreak, lives, etc.).
 *
 * Prioridad:
 *   1) `red` mientras esté activo el flash post-malo
 *   2) `eat` mientras esté activo el flash post-bueno
 *   3) `bad` si tiene racha de malos en curso (>0) y no acaba de comer bueno
 *   4) `idle` por defecto
 */
function deriveSprite(state: EngineState, nowMs: number): PascalState {
  if (nowMs < state.pascalRedUntilMs) return 'red';
  if (nowMs < state.pascalEatUntilMs) return 'eat';
  if (state.stats.badStreak > 0) return 'bad';
  return 'idle';
}

/**
 * Detecta colisión simple entre el item y la "boca" de Pascal.
 * Caja de Pascal centrada en (pascalX, pascalRowY).
 */
function collidesWithPascal(state: EngineState, obj: FallingObject): boolean {
  const padding = FOOD_DROP_CONFIG.collisionPadding;
  const pascalLeft = state.stats.pascalX - FOOD_DROP_CONFIG.pascalWidth / 2 + padding;
  const pascalRight = state.stats.pascalX + FOOD_DROP_CONFIG.pascalWidth / 2 - padding;
  const pascalTop = state.dims.pascalRowY - FOOD_DROP_CONFIG.pascalHeight / 2 + padding;
  const pascalBottom = state.dims.pascalRowY + FOOD_DROP_CONFIG.pascalHeight / 2 - padding;

  const half = FOOD_DROP_CONFIG.itemSize / 2;
  const itemLeft = obj.x - half;
  const itemRight = obj.x + half;
  const itemTop = obj.y - half;
  const itemBottom = obj.y + half;

  return (
    itemLeft < pascalRight &&
    itemRight > pascalLeft &&
    itemTop < pascalBottom &&
    itemBottom > pascalTop
  );
}

function clampScore(score: number): number {
  return Math.max(
    FOOD_DROP_CONFIG.minScore,
    Math.min(FOOD_DROP_CONFIG.maxScore, score),
  );
}

/**
 * Aplica el efecto de atrapar un item bueno.
 * Reglas: +10, racha de malos a 0, sprite "eat" temporal,
 * y si Pascal estaba en "bad" se cura visualmente al terminar el flash.
 */
function applyGoodCatch(state: EngineState, nowMs: number) {
  state.stats.score = clampScore(state.stats.score + FOOD_DROP_CONFIG.pointsGood);
  state.stats.badStreak = 0;
  state.pascalEatUntilMs = nowMs + FOOD_DROP_CONFIG.eatFlashMs;
  // El "rojo" cede inmediatamente si estaba activo (el bueno corta el shock).
  state.pascalRedUntilMs = 0;
}

/**
 * Aplica el efecto de atrapar un item malo.
 * Reglas: -5 (con clamp 0), racha+1, sprite "rojo" temporal.
 * Si la racha llega a 3: pierde 1 vida y se resetea la racha.
 * Si las vidas llegan a 0: fin de partida con razón 'lives'.
 */
function applyBadCatch(state: EngineState, nowMs: number) {
  state.stats.score = clampScore(state.stats.score + FOOD_DROP_CONFIG.pointsBad);
  state.stats.badStreak += 1;
  state.pascalRedUntilMs = nowMs + FOOD_DROP_CONFIG.redFlashMs;
  // Cualquier flash de "eat" pendiente se descarta.
  state.pascalEatUntilMs = 0;

  if (state.stats.badStreak >= FOOD_DROP_CONFIG.badStreakToLoseLife) {
    state.stats.lives -= 1;
    state.stats.badStreak = 0;

    if (state.stats.lives <= 0) {
      state.stats.lives = 0;
      state.stats.isOver = true;
      state.stats.endReason = 'lives';
    }
  }
}

/**
 * Avanza el estado del juego un paso de `dtMs` milisegundos.
 * Devuelve el mismo objeto mutado para evitar copias en cada frame
 * (rendimiento). El componente es responsable de leerlo y volver a renderizar.
 */
export function tickEngine(state: EngineState, dtMs: number): EngineState {
  if (state.stats.isOver) return state;

  // 1) Tiempo
  state.elapsedMs += dtMs;
  state.stats.remainingMs = Math.max(0, FOOD_DROP_CONFIG.durationMs - state.elapsedMs);

  if (state.stats.remainingMs <= 0) {
    state.stats.isOver = true;
    state.stats.endReason = 'time';
  }

  // 2) Mover items existentes
  const dtSec = dtMs / 1000;
  const survivors: FallingObject[] = [];
  for (const obj of state.falling) {
    obj.y += obj.vy * dtSec;

    // Colisión con Pascal
    if (collidesWithPascal(state, obj)) {
      const nowMs = state.elapsedMs;
      if (obj.def.kind === 'good') {
        applyGoodCatch(state, nowMs);
      } else {
        applyBadCatch(state, nowMs);
      }
      continue; // item consumido
    }

    // Si pasó del fondo, se descarta (no penaliza no atraparlo)
    if (obj.y - FOOD_DROP_CONFIG.itemSize / 2 > state.dims.height) {
      continue;
    }

    survivors.push(obj);
  }
  state.falling = survivors;

  // 3) Spawn de items nuevos
  const spawnResult = tickSpawner(state.spawner, dtMs, state.elapsedMs);
  if (spawnResult.spawn && !state.stats.isOver) {
    const half = FOOD_DROP_CONFIG.itemSize / 2;
    const x = half + Math.random() * (state.dims.width - FOOD_DROP_CONFIG.itemSize);
    state.falling.push({
      uid: state.nextUid++,
      def: spawnResult.spawn.def,
      x,
      y: -half, // empieza justo arriba de la pantalla
      vy: spawnResult.spawn.speedPxPerSec,
    });
  }

  // 4) Actualizar sprite de Pascal
  state.stats.pascalState = deriveSprite(state, state.elapsedMs);

  return state;
}

/**
 * Helper para tests / pantalla final: snapshot inmutable de las stats.
 */
export function snapshotStats(state: EngineState): GameStats {
  return { ...state.stats };
}
