import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  createPacmanEngine,
  Direction,
  GameStats,
  Ghost,
  PacmanEngineState,
  PacmanState,
  setDirection,
  snapshotPacmanStats,
  tickPacmanEngine,
} from '../engine/pacmanEngine';

/**
 * Hook que ejecuta el loop del juego Pacman usando requestAnimationFrame.
 *
 * Misma arquitectura que useGameLoop de FoodDrop:
 * - Engine en ref (no re-render por tick).
 * - Expone stats, pacman, ghosts, dots como state de React.
 * - Pausa en background.
 */
export interface UsePacmanLoopResult {
  stats: GameStats;
  pacman: PacmanState;
  ghosts: Ghost[];
  dots: boolean[][];
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
  changeDirection: (dir: Direction) => void;
  pause: () => void;
  resume: () => void;
}

export function usePacmanLoop(
  screenWidth: number,
  screenHeight: number,
  paused: boolean,
): UsePacmanLoopResult {
  const engineRef = useRef<PacmanEngineState>(
    createPacmanEngine(screenWidth, screenHeight),
  );
  const lastFrameRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef<boolean>(paused);

  const [stats, setStats] = useState<GameStats>(snapshotPacmanStats(engineRef.current));
  const [pacman, setPacman] = useState<PacmanState>({ ...engineRef.current.pacman });
  const [ghosts, setGhosts] = useState<Ghost[]>(
    engineRef.current.ghosts.map(g => ({ ...g, pos: { ...g.pos } })),
  );
  const [dots, setDots] = useState<boolean[][]>(
    engineRef.current.dots.map(row => [...row]),
  );

  // Sincronizar pausa externa
  useEffect(() => {
    pausedRef.current = paused;
    if (!paused) {
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
        setStats(snapshotPacmanStats(engineRef.current));
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

      const dt = Math.min(100, now - lastFrameRef.current);
      lastFrameRef.current = now;

      tickPacmanEngine(engineRef.current, dt);

      // Actualizar state para React
      setStats(snapshotPacmanStats(engineRef.current));
      setPacman({
        ...engineRef.current.pacman,
        pos: { ...engineRef.current.pacman.pos },
      });
      setGhosts(
        engineRef.current.ghosts.map(g => ({
          ...g,
          pos: { ...g.pos },
        })),
      );
      // Solo actualizar dots cuando cambia el conteo
      setDots(engineRef.current.dots.map(row => [...row]));

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

  const changeDirection = (dir: Direction) => {
    setDirection(engineRef.current, dir);
  };

  const pause = () => {
    pausedRef.current = true;
  };

  const resume = () => {
    pausedRef.current = false;
    lastFrameRef.current = null;
  };

  return {
    stats,
    pacman,
    ghosts,
    dots,
    cellSize: engineRef.current.cellSize,
    boardWidth: engineRef.current.boardWidth,
    boardHeight: engineRef.current.boardHeight,
    changeDirection,
    pause,
    resume,
  };
}
