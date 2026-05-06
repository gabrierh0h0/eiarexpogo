import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  createPacmanEngine, Direction, GameStats, Ghost,
  PacmanEngineState, PacmanState, setDirection,
  snapshotPacmanStats, tickPacmanEngine,
} from '../engine/pacmanEngine';

export interface UsePacmanLoopResult {
  stats: GameStats;
  pacman: PacmanState;
  ghosts: Ghost[];
  dots: boolean[][];
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
  changeDirection: (dir: Direction) => void;
}

export function usePacmanLoop(
  screenWidth: number, screenHeight: number, paused: boolean,
): UsePacmanLoopResult {
  const engineRef = useRef<PacmanEngineState>(createPacmanEngine(screenWidth, screenHeight));
  const lastRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(paused);

  const [stats, setStats] = useState<GameStats>(snapshotPacmanStats(engineRef.current));
  const [pacman, setPacman] = useState<PacmanState>({ ...engineRef.current.pacman, pos: { ...engineRef.current.pacman.pos } });
  const [ghosts, setGhosts] = useState<Ghost[]>(engineRef.current.ghosts.map(g => ({ ...g, pos: { ...g.pos } })));
  const [dots, setDots] = useState<boolean[][]>(engineRef.current.dots.map(r => [...r]));

  useEffect(() => { pausedRef.current = paused; if (!paused) lastRef.current = null; }, [paused]);

  useEffect(() => {
    const onChange = (s: AppStateStatus) => {
      if (s !== 'active') pausedRef.current = true;
      else { pausedRef.current = paused; lastRef.current = null; }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [paused]);

  useEffect(() => {
    const loop = (now: number) => {
      if (engineRef.current.stats.isOver) {
        setStats(snapshotPacmanStats(engineRef.current));
        return;
      }
      if (pausedRef.current) { lastRef.current = null; rafRef.current = requestAnimationFrame(loop); return; }
      if (lastRef.current == null) { lastRef.current = now; rafRef.current = requestAnimationFrame(loop); return; }

      const dt = Math.min(50, now - lastRef.current);
      lastRef.current = now;
      tickPacmanEngine(engineRef.current, dt);

      setStats(snapshotPacmanStats(engineRef.current));
      setPacman({ ...engineRef.current.pacman, pos: { ...engineRef.current.pacman.pos } });
      setGhosts(engineRef.current.ghosts.map(g => ({ ...g, pos: { ...g.pos } })));
      setDots(engineRef.current.dots.map(r => [...r]));

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
  }, []);

  const changeDirection = (dir: Direction) => { setDirection(engineRef.current, dir); };

  return {
    stats, pacman, ghosts, dots,
    cellSize: engineRef.current.cellSize,
    boardWidth: engineRef.current.boardWidth,
    boardHeight: engineRef.current.boardHeight,
    changeDirection,
  };
}
