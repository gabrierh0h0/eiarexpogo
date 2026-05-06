import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  createEngine,
  EngineState,
  GameDimensions,
  GameStats,
  setPascalX,
  snapshotStats,
  tickEngine,
} from '../engine/gameEngine';
import { FallingObject } from '../engine/gameEngine';

/**
 * Hook que ejecuta el loop del juego usando requestAnimationFrame.
 *
 * - Mantiene el `EngineState` en una `ref` para no re-renderizar en cada tick.
 * - Expone `stats` y `falling` como state de React para que el componente
 *   solo re-renderice cuando cambien (60 fps controlados por el rAF nativo).
 * - Pausa automáticamente cuando la app pasa a background.
 * - Limpia el rAF y el listener de AppState al desmontar.
 */
export interface UseGameLoopResult {
  stats: GameStats;
  falling: FallingObject[];
  movePascalTo: (x: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

export function useGameLoop(dims: GameDimensions, paused: boolean): UseGameLoopResult {
  const engineRef = useRef<EngineState>(createEngine(dims));
  const lastFrameRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef<boolean>(paused);

  const [stats, setStats] = useState<GameStats>(snapshotStats(engineRef.current));
  const [falling, setFalling] = useState<FallingObject[]>([]);

  // Sincronizar pausa externa
  useEffect(() => {
    pausedRef.current = paused;
    if (!paused) {
      // al despausar, resetear lastFrame para no acumular delta gigante
      lastFrameRef.current = null;
    }
  }, [paused]);

  // Pausa automática al fondo
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next !== 'active') {
        pausedRef.current = true;
      } else {
        pausedRef.current = paused;
        lastFrameRef.current = null;
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [paused]);

  // Loop principal
  useEffect(() => {
    const loop = (now: number) => {
      if (engineRef.current.stats.isOver) {
        // Igual avisamos un último estado y paramos.
        setStats(snapshotStats(engineRef.current));
        setFalling([...engineRef.current.falling]);
        return;
      }

      if (pausedRef.current) {
        lastFrameRef.current = null;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (lastFrameRef.current == null) {
        lastFrameRef.current = now;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Cap del delta para evitar saltos enormes si hubo lag (>100ms).
      const dt = Math.min(100, now - lastFrameRef.current);
      lastFrameRef.current = now;

      tickEngine(engineRef.current, dt);

      // Actualizamos los slices de state que el componente necesita.
      setStats(snapshotStats(engineRef.current));
      setFalling([...engineRef.current.falling]);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const movePascalTo = (x: number) => {
    setPascalX(engineRef.current, x);
    // Reflejar inmediatamente la posición de Pascal en la UI sin esperar
    // al siguiente tick, para que el arrastre se sienta responsivo.
    setStats(prev => ({ ...prev, pascalX: engineRef.current.stats.pascalX }));
  };

  const pause = () => {
    pausedRef.current = true;
  };

  const resume = () => {
    pausedRef.current = false;
    lastFrameRef.current = null;
  };

  const reset = () => {
    engineRef.current = createEngine(dims);
    lastFrameRef.current = null;
    setStats(snapshotStats(engineRef.current));
    setFalling([]);
  };

  return { stats, falling, movePascalTo, pause, resume, reset };
}
